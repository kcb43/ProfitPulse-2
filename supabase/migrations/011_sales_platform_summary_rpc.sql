-- Dashboard: Platform performance aggregation via SQL (fast + accurate; avoids downloading all sales)
-- Safe to run multiple times.

create or replace function public.po_sales_platform_summary(p_user_id uuid)
returns table (
  platform text,
  sales_count bigint,
  total_revenue numeric,
  total_profit numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(platform, 'other') as platform,
    count(*)::bigint as sales_count,
    coalesce(sum(coalesce(selling_price, sale_price, 0)), 0) as total_revenue,
    coalesce(sum(coalesce(profit, 0)), 0) as total_profit
  from public.sales
  where user_id = p_user_id
    and deleted_at is null
  group by coalesce(platform, 'other')
  order by total_profit desc;
$$;


