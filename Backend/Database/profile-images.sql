-- ============================================================
-- PetLife Egypt — profile photos for veterinarians (and users)
-- Run in Supabase → SQL Editor
-- ============================================================

-- Veterinarians: public profile photo URL (served from API /uploads/vets/…)
ALTER TABLE public."Veterinarians"
  ADD COLUMN IF NOT EXISTS "AvatarUrl" text;

-- Optional alias column (same purpose as AvatarUrl)
ALTER TABLE public."Veterinarians"
  ADD COLUMN IF NOT EXISTS "ProfilePhotoUrl" text;

-- Optional: store small image bytes in Postgres (use only for thumbnails; prefer AvatarUrl + file storage)
ALTER TABLE public."Veterinarians"
  ADD COLUMN IF NOT EXISTS "ProfilePhoto" bytea;

-- Pet owners / all users: profile picture on Users table
ALTER TABLE public."Users"
  ADD COLUMN IF NOT EXISTS "AvatarUrl" text;

ALTER TABLE public."Users"
  ADD COLUMN IF NOT EXISTS "ProfilePhotoUrl" text;

-- Example: set a photo URL manually after upload
-- UPDATE public."Veterinarians"
-- SET "AvatarUrl" = '/uploads/vets/your-vet-id.jpg',
--     "ProfilePhotoUrl" = '/uploads/vets/your-vet-id.jpg',
--     "UpdatedAt" = now()
-- WHERE "Id" = '00000000-0000-0000-0000-000000000000';
