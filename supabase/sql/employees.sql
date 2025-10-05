-- employees.sql — Supabase schema + seed for authless quick login
create extension if not exists "pgcrypto";


let { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@villa-sun.world',
  password: 'Admin123!'
})

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text not null,
  role text not null check (role in ('admin','staff')),
  language text default 'de',
  active boolean default true,
  created_at timestamptz default now()
);

-- RLS intentionally disabled for initial go-live (like tasks)
alter table public.employees disable row level security;

-- Seed users for quick login
insert into public.employees (email, display_name, role, language) values
  ('admin@villa-sun.world','Admin User','admin','de'),
  ('maria@villa-sun.world','Maria Schmidt','staff','de'),
  ('john@villa-sun.world','John Miller','staff','en'),
  ('anna@villa-sun.world','Anna Example','staff','de')
on conflict (email) do nothing;

create index if not exists employees_active_idx on public.employees (active);
create index if not exists employees_role_idx on public.employees (role);
