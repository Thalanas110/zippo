-- Ensure API roles can access custom zippo schema through Supabase Data API.
-- Date: 2026-05-08

BEGIN;

CREATE SCHEMA IF NOT EXISTS zippo;

GRANT USAGE ON SCHEMA zippo TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA zippo TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA zippo TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA zippo TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA zippo
GRANT ALL PRIVILEGES ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA zippo
GRANT ALL PRIVILEGES ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA zippo
GRANT ALL PRIVILEGES ON ROUTINES TO anon, authenticated, service_role;

COMMIT;
