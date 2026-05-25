-- ============================================================
-- PetLife Egypt — run this entire script in Supabase SQL Editor
-- ============================================================

-- Veterinarians: profile, credentials, fees, availability
ALTER TABLE public."Veterinarians"
  ADD COLUMN IF NOT EXISTS "University" text,
  ADD COLUMN IF NOT EXISTS "YearsOfExperience" integer,
  ADD COLUMN IF NOT EXISTS "Bio" text,
  ADD COLUMN IF NOT EXISTS "ConsultationFee" numeric,
  ADD COLUMN IF NOT EXISTS "AvatarUrl" text,
  ADD COLUMN IF NOT EXISTS "ProfilePhotoUrl" text,
  ADD COLUMN IF NOT EXISTS "ProfilePhoto" bytea,
  ADD COLUMN IF NOT EXISTS "ClinicAddress" text,
  ADD COLUMN IF NOT EXISTS "AvailableHours" text,
  ADD COLUMN IF NOT EXISTS "CredentialsFile" bytea,
  ADD COLUMN IF NOT EXISTS "CredentialsFileName" text,
  ADD COLUMN IF NOT EXISTS "CredentialsContentType" text,
  ADD COLUMN IF NOT EXISTS "IsOnline" boolean DEFAULT false;

-- Users: mobile phone (shown on vet public profile)
-- Phone column usually already exists; safe to add if missing
ALTER TABLE public."Users"
  ADD COLUMN IF NOT EXISTS "Phone" text,
  ADD COLUMN IF NOT EXISTS "AvatarUrl" text,
  ADD COLUMN IF NOT EXISTS "ProfilePhotoUrl" text;

-- Vet reviews (patient reviews on vet profile)
CREATE TABLE IF NOT EXISTS public."VetReviews" (
  "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "VetId" uuid NOT NULL,
  "UserId" bigint NOT NULL,
  "Rating" integer NOT NULL CHECK ("Rating" >= 1 AND "Rating" <= 5),
  "Comment" text,
  "CreatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "UpdatedAt" timestamp with time zone,
  CONSTRAINT "VetReviews_pkey" PRIMARY KEY ("Id"),
  CONSTRAINT "VetReviews_VetId_fkey" FOREIGN KEY ("VetId") REFERENCES public."Veterinarians"("Id"),
  CONSTRAINT "VetReviews_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES public."Users"("UserId")
);

-- Optional: disable RLS for service-role API access (if inserts still fail)
-- ALTER TABLE public."Veterinarians" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public."Users" DISABLE ROW LEVEL SECURITY;
