-- Activate Row-Level Security enforcement for Social Forge.
--
-- The app currently connects as the Postgres owner/superuser, which BYPASSES
-- RLS (the tenant policies are dormant). Running this makes RLS a real second
-- line of defence behind the application-level TenantScoped mixin.
--
-- 1. Create a dedicated, non-superuser role the app connects as.
-- 2. Grant it DML on the app tables (NOT superuser, NOT BYPASSRLS).
-- 3. Point DB_USER/DB_PASSWORD at this role and redeploy.
--
-- Run as a superuser:  psql -d socialforge -f deploy/rls/setup-app-role.sql
-- Then verify:         node ace rls:check

BEGIN;

-- 1. Dedicated app role (change the password!).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'socialforge_app') THEN
    CREATE ROLE socialforge_app LOGIN PASSWORD 'CHANGE_ME' NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END $$;

-- 2. Schema + table privileges (no ownership → RLS is enforced for this role).
GRANT USAGE ON SCHEMA public TO socialforge_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO socialforge_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO socialforge_app;

-- Future tables/sequences (migrations) inherit the same grants.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO socialforge_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO socialforge_app;

-- 3. Force RLS even for table owners is NOT needed here because the app role is
--    not the owner. Confirm no BYPASSRLS is set.
ALTER ROLE socialforge_app NOBYPASSRLS;

COMMIT;

-- NOTE: the TenantScoped mixin sets the tenant via the app layer (AsyncLocalStorage).
-- The RLS policies created in the migrations use the `app.current_tenant` GUC as
-- the backstop; ensure the app sets it per request/connection when running as
-- this role (see docs — enabling this is a deliberate hardening step).
