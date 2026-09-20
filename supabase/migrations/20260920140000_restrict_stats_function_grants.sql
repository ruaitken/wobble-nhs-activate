-- Restrict reporting RPCs to the server service_role.
-- Do not alter function bodies or signatures.
-- Applied first to the local practice database only.

revoke all on function public.get_campaign_stats(text) from public, anon, authenticated;
revoke all on function public.get_org_stats(text) from public, anon, authenticated;
revoke all on function public.get_stats_for_campaigns(text[], text, text) from public, anon, authenticated;

grant execute on function public.get_campaign_stats(text) to service_role;
grant execute on function public.get_org_stats(text) to service_role;
grant execute on function public.get_stats_for_campaigns(text[], text, text) to service_role;

comment on function public.get_campaign_stats(text) is
  'Cohort stats for one campaign. Executable by service_role only.';
comment on function public.get_org_stats(text) is
  'Cohort stats for one organisation. Executable by service_role only.';
comment on function public.get_stats_for_campaigns(text[], text, text) is
  'Cohort stats for a campaign set. Executable by service_role only.';
