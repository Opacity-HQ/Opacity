create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists classrooms_teacher_id_idx on public.classrooms (teacher_id);

alter table public.classrooms enable row level security;

create policy "classrooms_teacher_all"
  on public.classrooms
  for all
  to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- A parent explicitly enrolls a child they own into a classroom; a teacher
-- can never add a child unilaterally (insert requires owns_child(child_id),
-- checked once the helper exists in the next migration).
create table if not exists public.classroom_members (
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (classroom_id, child_id)
);

create index if not exists classroom_members_child_id_idx on public.classroom_members (child_id);

alter table public.classroom_members enable row level security;

-- Teacher can see and remove members of their own classroom.
create policy "classroom_members_teacher_read"
  on public.classroom_members
  for select
  to authenticated
  using (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_id = auth.uid()
    )
  );

create policy "classroom_members_teacher_delete"
  on public.classroom_members
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.classrooms c
      where c.id = classroom_id and c.teacher_id = auth.uid()
    )
  );

-- Parent inserts/reads/removes only rows for children they own.
create policy "classroom_members_parent_insert"
  on public.classroom_members
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.children ch
      where ch.id = child_id and ch.owner_id = auth.uid()
    )
  );

create policy "classroom_members_parent_read"
  on public.classroom_members
  for select
  to authenticated
  using (
    exists (
      select 1 from public.children ch
      where ch.id = child_id and ch.owner_id = auth.uid()
    )
  );

create policy "classroom_members_parent_delete"
  on public.classroom_members
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.children ch
      where ch.id = child_id and ch.owner_id = auth.uid()
    )
  );
