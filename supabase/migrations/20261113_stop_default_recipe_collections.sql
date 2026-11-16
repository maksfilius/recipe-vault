-- New accounts start with an empty library. Existing collections stay untouched.
create or replace function public.create_default_recipe_collections()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  return new;
end;
$$;
