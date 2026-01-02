-- Performance indexes for common dashboard queries
-- Safe to run multiple times.

create index if not exists inventory_items_user_deleted_at_idx
  on public.inventory_items (user_id, deleted_at);

create index if not exists sales_user_deleted_at_idx
  on public.sales (user_id, deleted_at);

create index if not exists sales_user_sale_date_idx
  on public.sales (user_id, sale_date desc);


