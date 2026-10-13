-- Favourite cards. Apply once in the Supabase SQL editor, after 0005.
alter table public.collection add column favorite boolean not null default false;
