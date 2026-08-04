-- Converge the original production schema and the newer staging schema on the
-- recipe model used by the application. Production predates the tracked
-- migrations and contains additional legacy columns, so this migration is
-- intentionally idempotent and preserves those columns.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_recipes_updated_at on public.recipes;

create trigger set_recipes_updated_at
before update on public.recipes
for each row
execute function public.set_updated_at();

-- Production historically stored servings as an integer. Preserve existing
-- values while moving to the text representation required for imported values
-- such as "8 slices" or "4–6 servings".
do $$
declare
  servings_type text;
begin
  select columns.data_type
  into servings_type
  from information_schema.columns
  where columns.table_schema = 'public'
    and columns.table_name = 'recipes'
    and columns.column_name = 'servings';

  if servings_type is not null and servings_type <> 'text' then
    alter table public.recipes alter column servings drop default;
    alter table public.recipes
      alter column servings type text
      using servings::text;
  end if;
end;
$$;

alter table public.recipes
  add column if not exists total_time text,
  add column if not exists servings text,
  add column if not exists tags text[] not null default '{}'::text[];

-- Keep useful legacy cook-time values when converging an older production
-- database. The legacy column itself remains available for rollback safety.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'recipes'
      and column_name = 'cook_time'
  ) then
    update public.recipes
    set total_time = cook_time::text || ' min'
    where total_time is null
      and cook_time is not null;
  end if;
end;
$$;

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint collections_name_not_blank check (btrim(name) <> ''),
  constraint collections_name_trimmed check (name = btrim(name)),
  constraint collections_name_length check (char_length(name) <= 80)
);

create unique index if not exists collections_user_name_idx
  on public.collections (user_id, lower(name));

create index if not exists collections_user_position_idx
  on public.collections (user_id, position, created_at);

create table if not exists public.recipe_collections (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  primary key (recipe_id, collection_id)
);

create index if not exists recipe_collections_collection_recipe_idx
  on public.recipe_collections (collection_id, recipe_id);

alter table public.collections enable row level security;
alter table public.recipe_collections enable row level security;

grant select, insert, update, delete on public.collections to authenticated;
grant select, insert, delete on public.recipe_collections to authenticated;

drop policy if exists "users can read own collections" on public.collections;
create policy "users can read own collections"
on public.collections
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can insert own collections" on public.collections;
create policy "users can insert own collections"
on public.collections
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users can update own collections" on public.collections;
create policy "users can update own collections"
on public.collections
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "users can delete own collections" on public.collections;
create policy "users can delete own collections"
on public.collections
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can read own recipe collections" on public.recipe_collections;
create policy "users can read own recipe collections"
on public.recipe_collections
for select
to authenticated
using (
  exists (
    select 1
    from public.recipes
    where recipes.id = recipe_collections.recipe_id
      and recipes.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.collections
    where collections.id = recipe_collections.collection_id
      and collections.user_id = auth.uid()
  )
);

drop policy if exists "users can insert own recipe collections" on public.recipe_collections;
create policy "users can insert own recipe collections"
on public.recipe_collections
for insert
to authenticated
with check (
  exists (
    select 1
    from public.recipes
    where recipes.id = recipe_collections.recipe_id
      and recipes.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.collections
    where collections.id = recipe_collections.collection_id
      and collections.user_id = auth.uid()
  )
);

drop policy if exists "users can delete own recipe collections" on public.recipe_collections;
create policy "users can delete own recipe collections"
on public.recipe_collections
for delete
to authenticated
using (
  exists (
    select 1
    from public.recipes
    where recipes.id = recipe_collections.recipe_id
      and recipes.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.collections
    where collections.id = recipe_collections.collection_id
      and collections.user_id = auth.uid()
  )
);

create or replace function public.create_default_recipe_collections()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.collections (user_id, name, position)
  values
    (new.id, 'Breakfast', 0),
    (new.id, 'Lunch', 1),
    (new.id, 'Dinner', 2),
    (new.id, 'Snacks', 3)
  on conflict do nothing;

  return new;
end;
$$;

revoke all on function public.create_default_recipe_collections() from public;
revoke all on function public.create_default_recipe_collections() from anon;
revoke all on function public.create_default_recipe_collections() from authenticated;
revoke all on function public.create_default_recipe_collections() from service_role;

drop trigger if exists create_default_recipe_collections on auth.users;

create trigger create_default_recipe_collections
after insert on auth.users
for each row
execute function public.create_default_recipe_collections();

insert into public.collections (user_id, name, position)
select users.id, defaults.name, defaults.position
from auth.users as users
cross join (
  values
    ('Breakfast'::text, 0),
    ('Lunch'::text, 1),
    ('Dinner'::text, 2),
    ('Snacks'::text, 3)
) as defaults(name, position)
on conflict do nothing;

-- The staging model already removed category, while production still has it.
-- Dynamic SQL keeps this migration valid in both states.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'recipes'
      and column_name = 'category'
  ) then
    execute $backfill$
      insert into public.recipe_collections (recipe_id, collection_id)
      select recipes.id, collections.id
      from public.recipes as recipes
      join public.collections as collections
        on collections.user_id = recipes.user_id
        and lower(collections.name) = case recipes.category
          when 'breakfast' then 'breakfast'
          when 'lunch' then 'lunch'
          when 'dinner' then 'dinner'
          when 'snack' then 'snacks'
        end
      on conflict do nothing
    $backfill$;
  end if;
end;
$$;

alter table public.recipes
  drop constraint if exists recipes_category_check;

create or replace function public.are_valid_recipe_tags(value text[])
returns boolean
language sql
immutable
strict
as $$
  select coalesce(
    bool_and(
      tag is not null
      and tag = btrim(tag)
      and btrim(tag) <> ''
      and char_length(tag) <= 60
    ),
    true
  )
  and count(*) = count(distinct lower(tag))
  from unnest(value) as tag;
$$;

revoke all on function public.are_valid_recipe_tags(text[]) from public;
revoke all on function public.are_valid_recipe_tags(text[]) from anon;
grant execute on function public.are_valid_recipe_tags(text[]) to authenticated;
grant execute on function public.are_valid_recipe_tags(text[]) to service_role;

-- PostgreSQL does not support ADD CONSTRAINT IF NOT EXISTS, so each legacy and
-- v2 constraint is installed conditionally by name.
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.recipes'::regclass and conname = 'recipes_title_not_blank') then
    alter table public.recipes add constraint recipes_title_not_blank check (btrim(title) <> '');
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.recipes'::regclass and conname = 'recipes_title_length') then
    alter table public.recipes add constraint recipes_title_length check (char_length(title) <= 160);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.recipes'::regclass and conname = 'recipes_description_length') then
    alter table public.recipes add constraint recipes_description_length check (description is null or char_length(description) <= 5000);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.recipes'::regclass and conname = 'recipes_source_url_http') then
    alter table public.recipes add constraint recipes_source_url_http check (
      source_url is null
      or (char_length(source_url) <= 2048 and source_url ~* '^https?://')
    );
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.recipes'::regclass and conname = 'recipes_ingredients_is_array') then
    alter table public.recipes add constraint recipes_ingredients_is_array check (jsonb_typeof(ingredients) = 'array');
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.recipes'::regclass and conname = 'recipes_steps_is_array') then
    alter table public.recipes add constraint recipes_steps_is_array check (jsonb_typeof(steps) = 'array');
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.recipes'::regclass and conname = 'recipes_ingredients_length') then
    alter table public.recipes add constraint recipes_ingredients_length check (jsonb_array_length(ingredients) <= 100);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.recipes'::regclass and conname = 'recipes_steps_length') then
    alter table public.recipes add constraint recipes_steps_length check (jsonb_array_length(steps) <= 100);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.recipes'::regclass and conname = 'recipes_image_url_storage') then
    alter table public.recipes add constraint recipes_image_url_storage check (
      image_url is null
      or (
        char_length(image_url) <= 2048
        and image_url ~* (
          '^https://[^/]+/storage/v1/object/public/recipe-images/'
          || user_id::text
          || '/[a-f0-9]{64}\.webp$'
        )
      )
    );
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.recipes'::regclass and conname = 'recipes_total_time_length') then
    alter table public.recipes add constraint recipes_total_time_length check (
      total_time is null or char_length(total_time) <= 80
    );
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.recipes'::regclass and conname = 'recipes_servings_length') then
    alter table public.recipes add constraint recipes_servings_length check (
      servings is null or char_length(servings) <= 80
    );
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.recipes'::regclass and conname = 'recipes_tags_length') then
    alter table public.recipes add constraint recipes_tags_length check (cardinality(tags) <= 50);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.recipes'::regclass and conname = 'recipes_tag_values') then
    alter table public.recipes add constraint recipes_tag_values check (public.are_valid_recipe_tags(tags));
  end if;
end;
$$;

create unique index if not exists recipes_user_source_url_idx
  on public.recipes (user_id, source_url)
  where source_url is not null;

alter table public.recipes drop column if exists category;

create or replace function public.save_recipe(
  p_recipe_id uuid,
  p_title text,
  p_description text,
  p_ingredients jsonb,
  p_steps jsonb,
  p_image_url text default null,
  p_source_url text default null,
  p_total_time text default null,
  p_servings text default null,
  p_tags text[] default '{}'::text[],
  p_collection_ids uuid[] default '{}'::uuid[]
)
returns public.recipes
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved_recipe public.recipes%rowtype;
  normalized_collection_ids uuid[];
  valid_collection_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct requested_id), '{}'::uuid[])
  into normalized_collection_ids
  from unnest(coalesce(p_collection_ids, '{}'::uuid[])) as requested_id;

  if cardinality(normalized_collection_ids) > 50 then
    raise exception 'Too many collections' using errcode = '22023';
  end if;

  select count(*)
  into valid_collection_count
  from public.collections
  where user_id = auth.uid()
    and id = any(normalized_collection_ids);

  if valid_collection_count <> cardinality(normalized_collection_ids) then
    raise exception 'One or more collections are invalid' using errcode = '22023';
  end if;

  insert into public.recipes (
    id,
    user_id,
    title,
    description,
    ingredients,
    steps,
    image_url,
    source_url,
    total_time,
    servings,
    tags
  )
  values (
    p_recipe_id,
    auth.uid(),
    p_title,
    p_description,
    p_ingredients,
    p_steps,
    p_image_url,
    p_source_url,
    p_total_time,
    p_servings,
    coalesce(p_tags, '{}'::text[])
  )
  on conflict (id) do update
  set
    title = excluded.title,
    description = excluded.description,
    ingredients = excluded.ingredients,
    steps = excluded.steps,
    image_url = excluded.image_url,
    source_url = excluded.source_url,
    total_time = excluded.total_time,
    servings = excluded.servings,
    tags = excluded.tags
  where recipes.user_id = auth.uid()
  returning * into saved_recipe;

  if saved_recipe.id is null then
    raise exception 'Recipe not found' using errcode = 'P0002';
  end if;

  delete from public.recipe_collections
  where recipe_id = saved_recipe.id;

  insert into public.recipe_collections (recipe_id, collection_id)
  select saved_recipe.id, collection_id
  from unnest(normalized_collection_ids) as collection_id;

  return saved_recipe;
end;
$$;

revoke all on function public.save_recipe(
  uuid,
  text,
  text,
  jsonb,
  jsonb,
  text,
  text,
  text,
  text,
  text[],
  uuid[]
) from public;

revoke all on function public.save_recipe(
  uuid,
  text,
  text,
  jsonb,
  jsonb,
  text,
  text,
  text,
  text,
  text[],
  uuid[]
) from anon;

grant execute on function public.save_recipe(
  uuid,
  text,
  text,
  jsonb,
  jsonb,
  text,
  text,
  text,
  text,
  text[],
  uuid[]
) to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'recipe-images',
  'recipe-images',
  true,
  2097152,
  array['image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public can read recipe images" on storage.objects;
create policy "public can read recipe images"
on storage.objects
for select
to public
using (bucket_id = 'recipe-images');

drop policy if exists "users can upload own recipe images" on storage.objects;
create policy "users can upload own recipe images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users can update own recipe images" on storage.objects;
create policy "users can update own recipe images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users can delete own recipe images" on storage.objects;
create policy "users can delete own recipe images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
