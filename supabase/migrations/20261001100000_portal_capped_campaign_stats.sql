-- Portal Overview stats capped to each person's funded window.
-- New function only. get_campaign_stats, get_org_stats and
-- get_stats_for_campaigns are not modified, so token dashboards are unchanged.
--
-- Window per claim: nhs_claims.claimed_at to nhs_claims.expires_at
-- (no end if expires_at is null), using Europe/London calendar days.
-- Minutes are stored per week, so any week that overlaps the window counts in full.
-- Sessions count only on days inside the window.
-- Assessment baseline: latest assessment on or before activation, otherwise the
-- first one inside the window. Comparison: latest later assessment inside the window.

create or replace function public.get_portal_campaign_stats(p_campaign_id text)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
with cam as (
  select id, trust_name, service_name, seat_limit, seats_used
  from nhs_campaigns where id = p_campaign_id
),
claims as (
  select c.user_id,
    c.claimed_at,
    coalesce(c.expires_at, 'infinity'::timestamptz) as ends_at,
    (c.claimed_at at time zone 'Europe/London')::date as start_day,
    case when c.expires_at is null then 'infinity'::date
      else (c.expires_at at time zone 'Europe/London')::date end as end_day
  from nhs_claims c where c.campaign_id = p_campaign_id
),
weeks as (
  select cl.user_id, w.minutes
  from claims cl
  join user_data ud on ud.user_id = cl.user_id
  cross join lateral (
    select
      case
        when e.k ~ '^\d{4}-\d{2}$' then to_date(e.k, 'IYYY-IW')
        when e.k ~ '^\d{4}-\d{2}-\d{2}' then date_trunc('week', left(e.k, 10)::date)::date
      end as week_start,
      case when e.v ~ '^-?\d+$' then e.v::int else 0 end as minutes
    from jsonb_each_text(coalesce(ud.weekly_minutes, '{}'::jsonb)) e(k, v)
  ) w
  where w.week_start is not null
    and w.week_start <= cl.end_day
    and w.week_start + 6 >= cl.start_day
),
sessions as (
  select cl.user_id, d::date as session_day
  from claims cl
  join user_data ud on ud.user_id = cl.user_id
  cross join lateral unnest(ud.exercise_dates) d
  where d::date between cl.start_day and cl.end_day
),
runs as (
  select user_id, count(*) as run
  from (
    select user_id, session_day,
      session_day - (row_number() over (partition by user_id order by session_day))::int as grp
    from (select distinct user_id, session_day from sessions) s
  ) g
  group by user_id, grp
),
pu as (
  select cl.user_id,
    coalesce((select sum(w.minutes) from weeks w where w.user_id = cl.user_id), 0) as total_minutes,
    coalesce((select count(*) from weeks w where w.user_id = cl.user_id and w.minutes > 0), 0) as minutes_weeks,
    coalesce((select max(w.minutes) from weeks w where w.user_id = cl.user_id), 0) as max_week_minutes,
    coalesce((select count(*) from sessions s where s.user_id = cl.user_id), 0) as session_days,
    coalesce((select count(distinct to_char(s.session_day, 'IYYY-IW')) from sessions s where s.user_id = cl.user_id), 0) as active_weeks,
    coalesce((select max(r.run) from runs r where r.user_id = cl.user_id), 0) as longest_streak,
    (select max(s.session_day) from sessions s where s.user_id = cl.user_id) as last_exercise
  from claims cl
),
kpi as (
  select
    (select count(*) from claims) as enrolled,
    count(*) filter (where total_minutes>0) as active_users,
    count(*) filter (where last_exercise >= current_date - 30) as active_last_7d,
    coalesce(sum(total_minutes),0) as total_minutes,
    coalesce(sum(session_days),0) as total_workouts,
    coalesce(max(longest_streak),0) as best_streak,
    coalesce(max(total_minutes),0) as top_member_minutes,
    coalesce(max(max_week_minutes),0) as highest_weekly_minutes,
    coalesce(round(avg(total_minutes) filter (where total_minutes>0),0),0) as avg_active_member_minutes,
    coalesce(round(avg(total_minutes::numeric/nullif(minutes_weeks,0)) filter (where session_days>=3),0),0) as avg_minutes_per_active_week,
    coalesce(round(avg(session_days::numeric/nullif(active_weeks,0)) filter (where session_days>=3),0),0) as avg_sessions_per_active_week
  from pu
),
paired as (
  select cl.user_id,
    i.sit_to_stand_count as i_sts, i.balance_score as i_bal, i.confidence_score as i_conf, i.fall_count as i_fall,
    r.sit_to_stand_count as r_sts, r.balance_score as r_bal, r.confidence_score as r_conf, r.fall_count as r_fall
  from claims cl
  join lateral (
    select b.* from (
      (select a.created_at, a.sit_to_stand_count, a.balance_score, a.confidence_score, a.fall_count, 0 as pref
        from assessments a
        where a.user_id = cl.user_id and a.created_at <= cl.claimed_at
        order by a.created_at desc limit 1)
      union all
      (select a.created_at, a.sit_to_stand_count, a.balance_score, a.confidence_score, a.fall_count, 1 as pref
        from assessments a
        where a.user_id = cl.user_id and a.created_at > cl.claimed_at and a.created_at <= cl.ends_at
        order by a.created_at asc limit 1)
    ) b
    order by b.pref limit 1
  ) i on true
  join lateral (
    select a.sit_to_stand_count, a.balance_score, a.confidence_score, a.fall_count
    from assessments a
    where a.user_id = cl.user_id
      and a.created_at > cl.claimed_at
      and a.created_at <= cl.ends_at
      and a.created_at > i.created_at
    order by a.created_at desc limit 1
  ) r on true
),
outcomes as (
  select
    count(*) as paired_members,
    round(100.0*count(*) filter (where r_sts >= i_sts)/nullif(count(*),0)) as sts_maintained,
    round(100.0*count(*) filter (where r_bal >= i_bal)/nullif(count(*),0)) as bal_maintained,
    round(100.0*count(*) filter (where r_conf >= i_conf)/nullif(count(*),0)) as conf_maintained,
    case when count(*) filter (where i_fall is not null and r_fall is not null) < 5 or coalesce(sum(i_fall + r_fall) filter (where i_fall is not null and r_fall is not null),0) = 0 then null else round(100.0*count(*) filter (where i_fall is not null and r_fall is not null and r_fall <= i_fall)/nullif(count(*) filter (where i_fall is not null and r_fall is not null),0)) end as falls_reduced,
    round((avg(r_sts)-avg(i_sts))/nullif(avg(i_sts),0)*100) as sts_uplift,
    ceil(100.0*count(*) filter (where r_bal > i_bal)/nullif(count(*),0))::int as bal_uplift,
    round((avg(r_conf)-avg(i_conf))/nullif(avg(i_conf),0)*100) as conf_uplift,
    case when count(*) filter (where i_fall is not null and r_fall is not null) < 5 or coalesce(sum(i_fall) filter (where i_fall is not null and r_fall is not null),0) = 0 then null else round((avg(r_fall) filter (where i_fall is not null and r_fall is not null)-avg(i_fall) filter (where i_fall is not null and r_fall is not null))/nullif(avg(i_fall) filter (where i_fall is not null and r_fall is not null),0)*100) end as falls_change
  from paired
),
banded as (
  select
    case
      when um.age_range ilike 'under%' then 'Under 50'
      when um.age_range ilike 'over%' then '75+'
      when nullif(substring(um.age_range from '^[0-9]+'),'') is null then 'Unknown'
      when (substring(um.age_range from '^[0-9]+'))::int < 50 then 'Under 50'
      when (substring(um.age_range from '^[0-9]+'))::int < 65 then '50-64'
      when (substring(um.age_range from '^[0-9]+'))::int < 75 then '65-74'
      else '75+' end as age_band,
    coalesce(nullif(trim(um.gender),''),'Unknown') as sex
  from claims c left join user_meta um on um.user_id = c.user_id
),
age_agg as (
  select coalesce(jsonb_agg(jsonb_build_object('label',age_band,'n',n,'pct',pct) order by n desc),'[]'::jsonb) as j
  from (select age_band, count(*) n, round(100.0*count(*)/sum(count(*)) over(),0) pct from banded group by age_band) a
),
sex_agg as (
  select coalesce(jsonb_agg(jsonb_build_object('label',sex,'n',n,'pct',pct) order by n desc),'[]'::jsonb) as j
  from (select sex, count(*) n, round(100.0*count(*)/sum(count(*)) over(),0) pct from banded group by sex) s
),
outcomes_json as (
  select case when (select paired_members from outcomes) < 5 then
      jsonb_build_object('paired_members', (select paired_members from outcomes), 'suppressed', true)
    else
      jsonb_build_object(
        'paired_members', (select paired_members from outcomes),
        'suppressed', false,
        'sit_to_stand', jsonb_build_object('uplift_pct', (select sts_uplift from outcomes), 'maintained_pct', (select sts_maintained from outcomes)),
        'balance', jsonb_build_object('uplift_pct', (select bal_uplift from outcomes), 'maintained_pct', (select bal_maintained from outcomes)),
        'confidence', jsonb_build_object('uplift_pct', (select conf_uplift from outcomes), 'maintained_pct', (select conf_maintained from outcomes)),
        'falls', jsonb_build_object('change_pct', (select falls_change from outcomes), 'reduced_pct', (select falls_reduced from outcomes))
      )
  end as j
)
select case
  when not exists (select 1 from cam) then
    jsonb_build_object('campaign_id', p_campaign_id, 'found', false)
  when (select enrolled from kpi) < 5 then
    jsonb_build_object(
      'campaign_id', p_campaign_id, 'found', true, 'suppressed', true,
      'trust_name', (select trust_name from cam),
      'service_name', (select service_name from cam),
      'enrolled', (select enrolled from kpi)
    )
  else
    jsonb_build_object(
      'campaign_id', p_campaign_id, 'found', true, 'suppressed', false,
      'trust_name', (select trust_name from cam),
      'service_name', (select service_name from cam),
      'enrolled', (select enrolled from kpi),
      'seat_limit', (select seat_limit from cam),
      'seats_remaining', (select seat_limit - seats_used from cam),
      'active_users', (select active_users from kpi),
      'engagement_rate_pct', round(100.0*(select active_users from kpi)/nullif((select enrolled from kpi),0),0),
      'active_last_7d', (select active_last_7d from kpi),
      'total_minutes', (select total_minutes from kpi),
      'total_workouts', (select total_workouts from kpi),
      'best_streak', (select best_streak from kpi),
      'top_member_minutes', (select top_member_minutes from kpi),
      'highest_weekly_minutes', (select highest_weekly_minutes from kpi),
      'avg_active_member_minutes', (select avg_active_member_minutes from kpi),
      'avg_minutes_per_active_week', (select avg_minutes_per_active_week from kpi),
      'avg_sessions_per_active_week', (select avg_sessions_per_active_week from kpi),
      'age', (select j from age_agg),
      'sex', (select j from sex_agg),
      'outcomes', (select j from outcomes_json)
    )
end;
$function$;

revoke all on function public.get_portal_campaign_stats(text) from public, anon, authenticated;
grant execute on function public.get_portal_campaign_stats(text) to service_role;

comment on function public.get_portal_campaign_stats(text) is
  'Portal Overview stats capped to each claim window. Executable by service_role only.';
