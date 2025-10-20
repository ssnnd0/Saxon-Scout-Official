-- Schema for FRC scouting Postgres database

create table if not exists users (
  id serial primary key,
  name text unique not null,
  email text unique,
  role text not null default 'scouter',
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Backwards-compatible schema evolution (safe no-op if already exists)
alter table users add column if not exists email text;
alter table users add column if not exists role text not null default 'scouter';
alter table users add column if not exists active boolean not null default true;
do $$ begin
  if not exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'idx_users_email') then
    create unique index idx_users_email on users (email);
  end if;
end $$;

create table if not exists logins (
  id serial primary key,
  user_id int not null references users(id),
  session_id text not null,
  user_agent text,
  created_at timestamptz default now()
);

create table if not exists files_created (
  id serial primary key,
  user_id int not null references users(id),
  filename text not null,
  filepath text not null,
  created_at timestamptz default now()
);

-- Optional index table for scouting data
create table if not exists match_index (
  id uuid primary key default gen_random_uuid(),
  team int not null,
  game int not null,
  alliance text check (alliance in ('red','blue')),
  time timestamptz not null,
  scouter text,
  filename text not null
);
create index if not exists match_index_team_idx on match_index(team);
create index if not exists match_index_game_idx on match_index(game);