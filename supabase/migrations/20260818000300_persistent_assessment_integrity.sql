-- ByteCraft V1 Milestone 2: persistent learner state integrity.
-- This migration is additive and keeps earlier migration history intact.

alter table public.assessment_sessions
  add column if not exists onboarding_version text not null default 'v1';
alter table public.assessment_items
  add column if not exists problem_metadata jsonb not null default '{}'::jsonb;
alter table public.learner_observations
  add column if not exists response_id uuid references public.assessment_responses(id) on delete set null,
  add column if not exists source text not null default 'diagnostic_response',
  add column if not exists rule text;
alter table public.learner_hypotheses
  add column if not exists supporting_observation_ids uuid[] not null default '{}';
alter table public.learning_paths
  add column if not exists assessment_session_id uuid references public.assessment_sessions(id) on delete set null,
  add column if not exists version text not null default 'v1';

create unique index if not exists assessment_sessions_one_active_per_user
  on public.assessment_sessions(user_id)
  where status = 'in_progress';
create unique index if not exists assessment_items_session_sequence_unique
  on public.assessment_items(session_id, sequence);
create unique index if not exists learner_observations_response_rule_unique
  on public.learner_observations(response_id, rule)
  where response_id is not null and rule is not null;
create unique index if not exists learning_paths_user_assessment_unique
  on public.learning_paths(user_id, assessment_session_id)
  where assessment_session_id is not null;
create index if not exists assessment_sessions_user_status_idx
  on public.assessment_sessions(user_id, status, started_at desc);
create index if not exists learner_observations_user_skill_created_idx
  on public.learner_observations(user_id, skill, created_at desc);
create index if not exists learning_path_items_path_position_idx
  on public.learning_path_items(path_id, position);
create unique index if not exists learning_path_items_path_position_unique
  on public.learning_path_items(path_id, position);
