-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists postgis;


-- ============================================================
-- Enums
-- ============================================================
create type position_joueur as enum ('gardien', 'defenseur', 'milieu', 'attaquant');
create type niveau_joueur as enum ('debutant', 'intermediaire', 'avance');
create type format_match as enum ('5v5', '7v7', '11v11');
create type statut_match as enum ('ouvert', 'complet', 'annule', 'termine');
create type statut_participation as enum ('confirme', 'liste_attente', 'annule');


-- ============================================================
-- Tables
-- ============================================================

-- Profiles (extension de auth.users)
create table profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  username       text unique not null,
  avatar_url     text,
  position       position_joueur,
  level          niveau_joueur,
  created_at     timestamptz default now()
);

-- Terrains
create table venues (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  address        text,
  location       geography(point, 4326) not null,
  created_by     uuid references profiles(id) on delete set null,
  created_at     timestamptz default now()
);
create index venues_location_idx on venues using gist(location);

-- Matchs
create table matches (
  id             uuid primary key default gen_random_uuid(),
  creator_id     uuid not null references profiles(id) on delete cascade,
  venue_id       uuid references venues(id) on delete set null,
  location       geography(point, 4326) not null,
  scheduled_at   timestamptz not null,
  duration_min   int default 90,
  format         format_match not null,
  max_players    int not null,
  level          niveau_joueur,
  status         statut_match default 'ouvert',
  description    text,
  prix_par_joueur numeric(6,2),
  created_at     timestamptz default now()
);
create index matches_location_idx on matches using gist(location);
create index matches_scheduled_at_idx on matches(scheduled_at);
create index matches_status_idx on matches(status);

-- Participations
create table participations (
  id             uuid primary key default gen_random_uuid(),
  match_id       uuid not null references matches(id) on delete cascade,
  user_id        uuid not null references profiles(id) on delete cascade,
  statut         statut_participation default 'confirme',
  joined_at      timestamptz default now(),
  unique(match_id, user_id)
);
create index participations_match_idx on participations(match_id);


-- ============================================================
-- RLS
-- ============================================================
alter table profiles      enable row level security;
alter table venues        enable row level security;
alter table matches       enable row level security;
alter table participations enable row level security;

-- profiles
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- venues
create policy "venues_select" on venues for select using (true);
create policy "venues_insert" on venues for insert with check (auth.uid() is not null);

-- matches
create policy "matches_select" on matches for select using (auth.uid() is not null);
create policy "matches_insert" on matches for insert with check (auth.uid() = creator_id);
create policy "matches_update" on matches for update using (auth.uid() = creator_id);

-- participations
create policy "participations_select" on participations for select using (auth.uid() is not null);
create policy "participations_insert" on participations for insert with check (auth.uid() = user_id);
create policy "participations_update" on participations for update using (auth.uid() = user_id);


-- ============================================================
-- Triggers
-- ============================================================

-- 1. Crée le profil automatiquement à l'inscription
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- 2. Passe le match en "complet" quand max_players est atteint
create or replace function handle_participation_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_count     int;
  v_max       int;
begin
  select count(*) into v_count
  from participations
  where match_id = new.match_id and statut = 'confirme';

  select max_players into v_max
  from matches where id = new.match_id;

  if v_count >= v_max then
    update matches set status = 'complet' where id = new.match_id;
  end if;

  return new;
end;
$$;

create trigger on_participation_change
  after insert or update on participations
  for each row execute procedure handle_participation_change();


-- 3. Rouvre le match + promeut le 1er en liste d'attente quand une participation est annulée
create or replace function handle_participation_cancelled()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_next_id   uuid;
begin
  if new.statut = 'annule' and old.statut = 'confirme' then
    -- Rouvrir le match
    update matches set status = 'ouvert' where id = new.match_id and status = 'complet';

    -- Promouvoir le premier en liste d'attente
    select id into v_next_id
    from participations
    where match_id = new.match_id and statut = 'liste_attente'
    order by joined_at asc
    limit 1;

    if v_next_id is not null then
      update participations set statut = 'confirme' where id = v_next_id;
    end if;
  end if;

  return new;
end;
$$;

create trigger on_participation_cancelled
  after update on participations
  for each row execute procedure handle_participation_cancelled();
