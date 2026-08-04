-- Recipe model v2: one grouping system (collections), faceted tags, complete
-- import metadata, and first-party image storage.

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  constraint collections_name_not_blank check (btrim(name) <> ''),
  constraint collections_name_trimmed check (name = btrim(name)),
  constraint collections_name_length check (char_length(name) <= 80)
);

create unique index collections_user_name_idx
  on public.collections (user_id, lower(name));

create index collections_user_position_idx
  on public.collections (user_id, position, created_at);

create table public.recipe_collections (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  primary key (recipe_id, collection_id)
);

create index recipe_collections_collection_recipe_idx
  on public.recipe_collections (collection_id, recipe_id);

alter table public.collections enable row level security;
alter table public.recipe_collections enable row level security;

create policy "users can read own collections"
on public.collections
for select
to authenticated
using (auth.uid() = user_id);

create policy "users can insert own collections"
on public.collections
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users can update own collections"
on public.collections
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can delete own collections"
on public.collections
for delete
to authenticated
using (auth.uid() = user_id);

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

-- Move legacy categories into the new many-to-many model before removing the
-- duplicate classification field.
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
on conflict do nothing;

alter table public.recipes
  drop constraint if exists recipes_category_check;

create function public.are_valid_recipe_tags(value text[])
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

alter table public.recipes
  add column total_time text,
  add column servings text,
  add column tags text[] not null default '{}'::text[];

alter table public.recipes
  add constraint recipes_image_url_storage check (
    image_url is null
    or (
      char_length(image_url) <= 2048
      and image_url ~* (
        '^https://[^/]+/storage/v1/object/public/recipe-images/'
        || user_id::text
        || '/[a-f0-9]{64}\.webp$'
      )
    )
  ),
  add constraint recipes_total_time_length check (
    total_time is null or char_length(total_time) <= 80
  ),
  add constraint recipes_servings_length check (
    servings is null or char_length(servings) <= 80
  ),
  add constraint recipes_tags_length check (cardinality(tags) <= 50),
  add constraint recipes_tag_values check (public.are_valid_recipe_tags(tags));

create unique index recipes_user_source_url_idx
  on public.recipes (user_id, source_url)
  where source_url is not null;

alter table public.recipes drop column category;

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

create policy "public can read recipe images"
on storage.objects
for select
to public
using (bucket_id = 'recipe-images');

create policy "users can upload own recipe images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

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

create policy "users can delete own recipe images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
