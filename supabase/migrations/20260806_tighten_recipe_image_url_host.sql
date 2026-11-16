-- Narrow the stored recipe image constraint.
--
-- The previous pattern accepted any host (`https://[^/]+/...`), so the database
-- layer did not actually guarantee that a recipe image points at this project's
-- Supabase Storage — only the application code and the CSP did. It also rejected
-- every image saved against a local Supabase stack, because those public URLs
-- are served over http on 127.0.0.1.

alter table public.recipes
  drop constraint if exists recipes_image_url_storage;

alter table public.recipes
  add constraint recipes_image_url_storage check (
    image_url is null
    or (
      char_length(image_url) <= 2048
      and (
        image_url ~* (
          '^https://[a-z0-9][a-z0-9-]*\.supabase\.(?:co|in)/storage/v1/object/public/recipe-images/'
          || user_id::text
          || '/[a-f0-9]{64}\.webp$'
        )
        or image_url ~* (
          '^http://(?:127\.0\.0\.1|localhost)(?::[0-9]{1,5})?/storage/v1/object/public/recipe-images/'
          || user_id::text
          || '/[a-f0-9]{64}\.webp$'
        )
      )
    )
  );
