-- Lets the site tell a player what they were given. Apply once, after 0009.
--   card_ids  the cards of the gift
--   seen      the receiver has closed the notice
alter table public.gifts
  add column card_ids text[] not null default '{}',
  add column seen boolean not null default false;

-- Gifts made before this migration have no card list: nothing useful to announce.
update public.gifts set seen = true;

create index gifts_unseen_idx on public.gifts (to_id) where not seen;
