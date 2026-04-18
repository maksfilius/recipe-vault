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

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null check (category in ('breakfast', 'lunch', 'dinner', 'snack')),
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  image_url text,
  source_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists recipes_user_id_created_at_idx
  on public.recipes (user_id, created_at desc);

drop trigger if exists set_recipes_updated_at on public.recipes;

create trigger set_recipes_updated_at
before update on public.recipes
for each row
execute function public.set_updated_at();

create table if not exists public.favorite_recipes (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, recipe_id)
);

create index if not exists favorite_recipes_user_id_created_at_idx
  on public.favorite_recipes (user_id, created_at desc);

alter table public.recipes enable row level security;
alter table public.favorite_recipes enable row level security;

create policy "users can read own recipes"
on public.recipes
for select
to authenticated
using (auth.uid() = user_id);

create policy "users can insert own recipes"
on public.recipes
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users can update own recipes"
on public.recipes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can delete own recipes"
on public.recipes
for delete
to authenticated
using (auth.uid() = user_id);

create policy "users can read own favorites"
on public.favorite_recipes
for select
to authenticated
using (auth.uid() = user_id);

create policy "users can insert own favorites"
on public.favorite_recipes
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.recipes
    where recipes.id = recipe_id
      and recipes.user_id = auth.uid()
  )
);

create policy "users can delete own favorites"
on public.favorite_recipes
for delete
to authenticated
using (auth.uid() = user_id);
