create table if not exists public."ConsultationRequests" (
  "Id" uuid primary key default gen_random_uuid(),
  "PetOwnerId" bigint not null references public."Users"("UserId") on delete cascade,
  "VetId" uuid not null references public."Veterinarians"("Id") on delete cascade,
  "PetId" uuid not null references public."Pets"("Id") on delete cascade,
  "Status" text not null default 'pending'
    check ("Status" in ('pending', 'accepted', 'in_progress', 'declined', 'completed')),
  "Fee" numeric,
  "StartedAt" timestamptz,
  "EndedAt" timestamptz,
  "CreatedAt" timestamptz not null default now(),
  "UpdatedAt" timestamptz not null default now()
);

create index if not exists "ConsultationRequests_PetOwnerId_idx"
  on public."ConsultationRequests" ("PetOwnerId");

create index if not exists "ConsultationRequests_VetId_idx"
  on public."ConsultationRequests" ("VetId");

create index if not exists "ConsultationRequests_PetId_idx"
  on public."ConsultationRequests" ("PetId");

alter table public."ConsultationRequests" enable row level security;

drop policy if exists "consultations service role full access" on public."ConsultationRequests";
create policy "consultations service role full access"
on public."ConsultationRequests"
for all
to service_role
using (true)
with check (true);
