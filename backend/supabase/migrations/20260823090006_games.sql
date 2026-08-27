-- Reference table: the five fixed games. Public-read, no client writes.
create table if not exists public.games (
  id text primary key,
  name text not null,
  skill_domain text not null
);

alter table public.games enable row level security;

create policy "games_read_all"
  on public.games
  for select
  to authenticated
  using (true);
