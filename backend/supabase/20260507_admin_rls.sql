-- ZIPPO Supabase RLS: Admin-only access policies
-- Apply after zippo_supabase_schema.sql

BEGIN;

CREATE OR REPLACE FUNCTION zippo.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    (auth.jwt()->'app_metadata'->>'role' = 'admin')
    OR (auth.jwt()->'user_metadata'->>'role' = 'admin')
    OR (COALESCE(LOWER(auth.jwt()->'app_metadata'->>'is_admin'), '') = 'true')
    OR (COALESCE(LOWER(auth.jwt()->'user_metadata'->>'is_admin'), '') = 'true');
$$;

-- Drop existing permissive policies
DROP POLICY IF EXISTS vendors_read ON zippo.vendors;
DROP POLICY IF EXISTS vendors_insert ON zippo.vendors;
DROP POLICY IF EXISTS vendors_update ON zippo.vendors;
DROP POLICY IF EXISTS vendors_delete ON zippo.vendors;

DROP POLICY IF EXISTS users_read ON zippo.users;
DROP POLICY IF EXISTS users_insert ON zippo.users;
DROP POLICY IF EXISTS users_update ON zippo.users;
DROP POLICY IF EXISTS users_delete ON zippo.users;

DROP POLICY IF EXISTS products_read ON zippo.products;
DROP POLICY IF EXISTS products_insert ON zippo.products;
DROP POLICY IF EXISTS products_update ON zippo.products;
DROP POLICY IF EXISTS products_delete ON zippo.products;

DROP POLICY IF EXISTS orders_read ON zippo.orders;
DROP POLICY IF EXISTS orders_insert ON zippo.orders;
DROP POLICY IF EXISTS orders_update ON zippo.orders;
DROP POLICY IF EXISTS orders_delete ON zippo.orders;

DROP POLICY IF EXISTS riders_read ON zippo.riders;
DROP POLICY IF EXISTS riders_insert ON zippo.riders;
DROP POLICY IF EXISTS riders_update ON zippo.riders;
DROP POLICY IF EXISTS riders_delete ON zippo.riders;

DROP POLICY IF EXISTS deliveries_read ON zippo.deliveries;
DROP POLICY IF EXISTS deliveries_insert ON zippo.deliveries;
DROP POLICY IF EXISTS deliveries_update ON zippo.deliveries;
DROP POLICY IF EXISTS deliveries_delete ON zippo.deliveries;

DROP POLICY IF EXISTS gift_filter_runs_read ON zippo.gift_filter_runs;
DROP POLICY IF EXISTS gift_filter_runs_insert ON zippo.gift_filter_runs;
DROP POLICY IF EXISTS gift_filter_runs_update ON zippo.gift_filter_runs;
DROP POLICY IF EXISTS gift_filter_runs_delete ON zippo.gift_filter_runs;

DROP POLICY IF EXISTS gift_filter_results_read ON zippo.gift_filter_results;
DROP POLICY IF EXISTS gift_filter_results_insert ON zippo.gift_filter_results;
DROP POLICY IF EXISTS gift_filter_results_update ON zippo.gift_filter_results;
DROP POLICY IF EXISTS gift_filter_results_delete ON zippo.gift_filter_results;

DROP POLICY IF EXISTS product_cbf_profiles_read ON zippo.product_cbf_profiles;
DROP POLICY IF EXISTS product_cbf_profiles_insert ON zippo.product_cbf_profiles;
DROP POLICY IF EXISTS product_cbf_profiles_update ON zippo.product_cbf_profiles;
DROP POLICY IF EXISTS product_cbf_profiles_delete ON zippo.product_cbf_profiles;

DROP POLICY IF EXISTS recommendation_runs_read ON zippo.recommendation_runs;
DROP POLICY IF EXISTS recommendation_runs_insert ON zippo.recommendation_runs;
DROP POLICY IF EXISTS recommendation_runs_update ON zippo.recommendation_runs;
DROP POLICY IF EXISTS recommendation_runs_delete ON zippo.recommendation_runs;

DROP POLICY IF EXISTS recommendation_results_read ON zippo.recommendation_results;
DROP POLICY IF EXISTS recommendation_results_insert ON zippo.recommendation_results;
DROP POLICY IF EXISTS recommendation_results_update ON zippo.recommendation_results;
DROP POLICY IF EXISTS recommendation_results_delete ON zippo.recommendation_results;

DROP POLICY IF EXISTS delivery_optimizer_runs_read ON zippo.delivery_optimizer_runs;
DROP POLICY IF EXISTS delivery_optimizer_runs_insert ON zippo.delivery_optimizer_runs;
DROP POLICY IF EXISTS delivery_optimizer_runs_update ON zippo.delivery_optimizer_runs;
DROP POLICY IF EXISTS delivery_optimizer_runs_delete ON zippo.delivery_optimizer_runs;

DROP POLICY IF EXISTS delivery_assignments_read ON zippo.delivery_assignments;
DROP POLICY IF EXISTS delivery_assignments_insert ON zippo.delivery_assignments;
DROP POLICY IF EXISTS delivery_assignments_update ON zippo.delivery_assignments;
DROP POLICY IF EXISTS delivery_assignments_delete ON zippo.delivery_assignments;

DROP POLICY IF EXISTS delivery_assignment_stops_read ON zippo.delivery_assignment_stops;
DROP POLICY IF EXISTS delivery_assignment_stops_insert ON zippo.delivery_assignment_stops;
DROP POLICY IF EXISTS delivery_assignment_stops_update ON zippo.delivery_assignment_stops;
DROP POLICY IF EXISTS delivery_assignment_stops_delete ON zippo.delivery_assignment_stops;

DROP POLICY IF EXISTS delivery_unassigned_orders_read ON zippo.delivery_unassigned_orders;
DROP POLICY IF EXISTS delivery_unassigned_orders_insert ON zippo.delivery_unassigned_orders;
DROP POLICY IF EXISTS delivery_unassigned_orders_update ON zippo.delivery_unassigned_orders;
DROP POLICY IF EXISTS delivery_unassigned_orders_delete ON zippo.delivery_unassigned_orders;

DROP POLICY IF EXISTS baseline_runs_read ON zippo.baseline_runs;
DROP POLICY IF EXISTS baseline_runs_insert ON zippo.baseline_runs;
DROP POLICY IF EXISTS baseline_runs_update ON zippo.baseline_runs;
DROP POLICY IF EXISTS baseline_runs_delete ON zippo.baseline_runs;

DROP POLICY IF EXISTS baseline_gift_results_read ON zippo.baseline_gift_results;
DROP POLICY IF EXISTS baseline_gift_results_insert ON zippo.baseline_gift_results;
DROP POLICY IF EXISTS baseline_gift_results_update ON zippo.baseline_gift_results;
DROP POLICY IF EXISTS baseline_gift_results_delete ON zippo.baseline_gift_results;

DROP POLICY IF EXISTS baseline_delivery_results_read ON zippo.baseline_delivery_results;
DROP POLICY IF EXISTS baseline_delivery_results_insert ON zippo.baseline_delivery_results;
DROP POLICY IF EXISTS baseline_delivery_results_update ON zippo.baseline_delivery_results;
DROP POLICY IF EXISTS baseline_delivery_results_delete ON zippo.baseline_delivery_results;

DROP POLICY IF EXISTS model_run_comparisons_read ON zippo.model_run_comparisons;
DROP POLICY IF EXISTS model_run_comparisons_insert ON zippo.model_run_comparisons;
DROP POLICY IF EXISTS model_run_comparisons_update ON zippo.model_run_comparisons;
DROP POLICY IF EXISTS model_run_comparisons_delete ON zippo.model_run_comparisons;

-- Admin-only policies
CREATE POLICY admin_only_select ON zippo.vendors
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.vendors
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.vendors
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.vendors
  FOR DELETE TO authenticated USING (zippo.is_admin());

CREATE POLICY admin_only_select ON zippo.users
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.users
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.users
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.users
  FOR DELETE TO authenticated USING (zippo.is_admin());

CREATE POLICY admin_only_select ON zippo.products
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.products
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.products
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.products
  FOR DELETE TO authenticated USING (zippo.is_admin());

CREATE POLICY admin_only_select ON zippo.orders
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.orders
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.orders
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.orders
  FOR DELETE TO authenticated USING (zippo.is_admin());

CREATE POLICY admin_only_select ON zippo.riders
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.riders
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.riders
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.riders
  FOR DELETE TO authenticated USING (zippo.is_admin());

CREATE POLICY admin_only_select ON zippo.deliveries
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.deliveries
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.deliveries
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.deliveries
  FOR DELETE TO authenticated USING (zippo.is_admin());

CREATE POLICY admin_only_select ON zippo.gift_filter_runs
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.gift_filter_runs
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.gift_filter_runs
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.gift_filter_runs
  FOR DELETE TO authenticated USING (zippo.is_admin());

CREATE POLICY admin_only_select ON zippo.gift_filter_results
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.gift_filter_results
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.gift_filter_results
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.gift_filter_results
  FOR DELETE TO authenticated USING (zippo.is_admin());

CREATE POLICY admin_only_select ON zippo.product_cbf_profiles
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.product_cbf_profiles
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.product_cbf_profiles
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.product_cbf_profiles
  FOR DELETE TO authenticated USING (zippo.is_admin());

CREATE POLICY admin_only_select ON zippo.recommendation_runs
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.recommendation_runs
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.recommendation_runs
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.recommendation_runs
  FOR DELETE TO authenticated USING (zippo.is_admin());

CREATE POLICY admin_only_select ON zippo.recommendation_results
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.recommendation_results
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.recommendation_results
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.recommendation_results
  FOR DELETE TO authenticated USING (zippo.is_admin());

CREATE POLICY admin_only_select ON zippo.delivery_optimizer_runs
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.delivery_optimizer_runs
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.delivery_optimizer_runs
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.delivery_optimizer_runs
  FOR DELETE TO authenticated USING (zippo.is_admin());

CREATE POLICY admin_only_select ON zippo.delivery_assignments
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.delivery_assignments
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.delivery_assignments
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.delivery_assignments
  FOR DELETE TO authenticated USING (zippo.is_admin());

CREATE POLICY admin_only_select ON zippo.delivery_assignment_stops
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.delivery_assignment_stops
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.delivery_assignment_stops
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.delivery_assignment_stops
  FOR DELETE TO authenticated USING (zippo.is_admin());

CREATE POLICY admin_only_select ON zippo.delivery_unassigned_orders
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.delivery_unassigned_orders
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.delivery_unassigned_orders
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.delivery_unassigned_orders
  FOR DELETE TO authenticated USING (zippo.is_admin());

CREATE POLICY admin_only_select ON zippo.baseline_runs
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.baseline_runs
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.baseline_runs
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.baseline_runs
  FOR DELETE TO authenticated USING (zippo.is_admin());

CREATE POLICY admin_only_select ON zippo.baseline_gift_results
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.baseline_gift_results
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.baseline_gift_results
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.baseline_gift_results
  FOR DELETE TO authenticated USING (zippo.is_admin());

CREATE POLICY admin_only_select ON zippo.baseline_delivery_results
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.baseline_delivery_results
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.baseline_delivery_results
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.baseline_delivery_results
  FOR DELETE TO authenticated USING (zippo.is_admin());

CREATE POLICY admin_only_select ON zippo.model_run_comparisons
  FOR SELECT TO authenticated USING (zippo.is_admin());
CREATE POLICY admin_only_insert ON zippo.model_run_comparisons
  FOR INSERT TO authenticated WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_update ON zippo.model_run_comparisons
  FOR UPDATE TO authenticated USING (zippo.is_admin()) WITH CHECK (zippo.is_admin());
CREATE POLICY admin_only_delete ON zippo.model_run_comparisons
  FOR DELETE TO authenticated USING (zippo.is_admin());

COMMIT;
