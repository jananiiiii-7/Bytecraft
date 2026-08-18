-- Store authenticated onboarding drafts outside assessment local state.
alter table public.profiles
  add column if not exists onboarding jsonb;
