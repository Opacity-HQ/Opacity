create table if not exists public.ld_letter_pairs (
  id uuid primary key default gen_random_uuid(),
  letter_a text not null,
  letter_b text not null,
  confusion_type text not null check (confusion_type in ('mirror', 'rotation', 'visual', 'sequence')),
  difficulty_tier integer not null default 1
);

alter table public.ld_letter_pairs enable row level security;

create policy "ld_letter_pairs_read_all"
  on public.ld_letter_pairs
  for select
  to authenticated
  using (true);

create table if not exists public.ld_word_items (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  target_letter text not null,
  position text not null check (position in ('initial', 'medial', 'final')),
  difficulty_tier integer not null default 1
);

alter table public.ld_word_items enable row level security;

create policy "ld_word_items_read_all"
  on public.ld_word_items
  for select
  to authenticated
  using (true);
