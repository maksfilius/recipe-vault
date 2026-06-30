alter table public.recipes
  add constraint recipes_title_not_blank check (btrim(title) <> ''),
  add constraint recipes_title_length check (char_length(title) <= 160),
  add constraint recipes_description_length check (description is null or char_length(description) <= 5000),
  add constraint recipes_source_url_http check (
    source_url is null
    or (
      char_length(source_url) <= 2048
      and source_url ~* '^https?://'
    )
  ),
  add constraint recipes_ingredients_is_array check (jsonb_typeof(ingredients) = 'array'),
  add constraint recipes_steps_is_array check (jsonb_typeof(steps) = 'array'),
  add constraint recipes_ingredients_length check (jsonb_array_length(ingredients) <= 100),
  add constraint recipes_steps_length check (jsonb_array_length(steps) <= 100);
