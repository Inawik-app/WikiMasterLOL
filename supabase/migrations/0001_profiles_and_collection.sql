-- Accounts and collections. Apply once in the Supabase SQL editor.
-- A migration that has been applied is never edited: add a new file instead.

-- One profile per player, created automatically when they first sign in.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (char_length(username) between 1 and 40),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- One row per card a player owns. card_id is the id of the card in src/data/cards.json.
create table public.collection (
  user_id uuid not null references public.profiles (id) on delete cascade,
  card_id text not null,
  copies integer not null default 1 check (copies >= 1),
  first_obtained_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

-- Row level security: signed-in players read everything, nobody writes from the browser.
-- With no insert/update/delete policy, only the server (service role key) can write.
alter table public.profiles enable row level security;
alter table public.collection enable row level security;

create policy "Signed-in players read every profile"
  on public.profiles for select to authenticated using (true);

create policy "Signed-in players read every collection"
  on public.collection for select to authenticated using (true);

-- Creates the profile from what Discord sends: display name and avatar.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    left(
      coalesce(
        nullif(new.raw_user_meta_data -> 'custom_claims' ->> 'global_name', ''),
        nullif(new.raw_user_meta_data ->> 'full_name', ''),
        nullif(new.raw_user_meta_data ->> 'name', ''),
        'Invocateur'
      ),
      40
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
