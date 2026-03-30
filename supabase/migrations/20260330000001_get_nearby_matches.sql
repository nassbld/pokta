create or replace function get_nearby_matches(
  lat          double precision,
  lng          double precision,
  radius_m     int default 10000
)
returns table (
  id              uuid,
  creator_id      uuid,
  venue_id        uuid,
  scheduled_at    timestamptz,
  duration_min    int,
  format          format_match,
  max_players     int,
  level           niveau_joueur,
  status          statut_match,
  description     text,
  prix_par_joueur numeric,
  distance_m      double precision,
  players_count   bigint
)
language sql stable security definer
set search_path = public
as $$
  select
    m.id,
    m.creator_id,
    m.venue_id,
    m.scheduled_at,
    m.duration_min,
    m.format,
    m.max_players,
    m.level,
    m.status,
    m.description,
    m.prix_par_joueur,
    ST_Distance(m.location, ST_MakePoint(lng, lat)::geography) as distance_m,
    count(p.id) filter (where p.statut = 'confirme') as players_count
  from matches m
  left join participations p on p.match_id = m.id
  where
    m.status = 'ouvert'
    and m.scheduled_at > now()
    and ST_DWithin(m.location, ST_MakePoint(lng, lat)::geography, radius_m)
  group by m.id
  order by distance_m asc;
$$;
