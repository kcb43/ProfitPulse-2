-- Optimize RLS policies by preventing per-row re-evaluation of auth.* calls.
-- Supabase recommends wrapping auth.uid() / current_setting(...) in a SELECT.
-- Safe to run multiple times (handles missing policies).

do $$
begin
  -- inventory_items
  begin
    execute format('alter policy %I on public.inventory_items using ((select auth.uid()) = user_id);', 'Users can view their own inventory items');
  exception when undefined_object then null;
  end;
  begin
    execute format('alter policy %I on public.inventory_items with check ((select auth.uid()) = user_id);', 'Users can insert their own inventory items');
  exception when undefined_object then null;
  end;
  begin
    execute format('alter policy %I on public.inventory_items using ((select auth.uid()) = user_id);', 'Users can update their own inventory items');
  exception when undefined_object then null;
  end;
  begin
    execute format('alter policy %I on public.inventory_items using ((select auth.uid()) = user_id);', 'Users can delete their own inventory items');
  exception when undefined_object then null;
  end;

  -- sales
  begin
    execute format('alter policy %I on public.sales using ((select auth.uid()) = user_id);', 'Users can view their own sales');
  exception when undefined_object then null;
  end;
  begin
    execute format('alter policy %I on public.sales with check ((select auth.uid()) = user_id);', 'Users can insert their own sales');
  exception when undefined_object then null;
  end;
  begin
    execute format('alter policy %I on public.sales using ((select auth.uid()) = user_id);', 'Users can update their own sales');
  exception when undefined_object then null;
  end;
  begin
    execute format('alter policy %I on public.sales using ((select auth.uid()) = user_id);', 'Users can delete their own sales');
  exception when undefined_object then null;
  end;

  -- image_editor_templates
  begin
    execute format('alter policy %I on public.image_editor_templates using ((select auth.uid()) = user_id);', 'Users can view their own templates');
  exception when undefined_object then null;
  end;
  begin
    execute format('alter policy %I on public.image_editor_templates with check ((select auth.uid()) = user_id);', 'Users can insert their own templates');
  exception when undefined_object then null;
  end;
  begin
    execute format('alter policy %I on public.image_editor_templates using ((select auth.uid()) = user_id);', 'Users can update their own templates');
  exception when undefined_object then null;
  end;
  begin
    execute format('alter policy %I on public.image_editor_templates using ((select auth.uid()) = user_id);', 'Users can delete their own templates');
  exception when undefined_object then null;
  end;

  -- crosslistings
  begin
    execute format('alter policy %I on public.crosslistings using ((select auth.uid()) = user_id);', 'Users can view their own crosslistings');
  exception when undefined_object then null;
  end;
  begin
    execute format('alter policy %I on public.crosslistings with check ((select auth.uid()) = user_id);', 'Users can insert their own crosslistings');
  exception when undefined_object then null;
  end;
  begin
    execute format('alter policy %I on public.crosslistings using ((select auth.uid()) = user_id);', 'Users can update their own crosslistings');
  exception when undefined_object then null;
  end;
  begin
    execute format('alter policy %I on public.crosslistings using ((select auth.uid()) = user_id);', 'Users can delete their own crosslistings');
  exception when undefined_object then null;
  end;
end $$;


