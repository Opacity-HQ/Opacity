-- Memory Quest grades sequence/position responses as order, item or location.
-- Preserve that task-specific taxonomy instead of rejecting incorrect answers.
begin;

alter table public.game_trials
  drop constraint if exists game_trials_error_type_check;

alter table public.game_trials
  add constraint game_trials_error_type_check check (
    error_type is null
    or error_type in (
      'mirror', 'rotation', 'visual_similar', 'phonological', 'omission', 'timeout',
      'order', 'item', 'location'
    )
  );

commit;
