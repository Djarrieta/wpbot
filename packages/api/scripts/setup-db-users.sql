-- Create assistant user for AI assistant/external access
-- Run this as the wpbot user or postgres superuser

-- Create the assistant user (skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'wpbot_assistant') THEN
    CREATE USER wpbot_assistant WITH PASSWORD 'wpbot_assistant';
  END IF;
END
$$;

-- Grant connection to the database
GRANT CONNECT ON DATABASE wpbot TO wpbot_assistant;

-- Grant usage on the public schema
GRANT USAGE ON SCHEMA public TO wpbot_assistant;

-- Grant SELECT on all existing tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO wpbot_assistant;

-- Grant SELECT on all future tables (so new tables are automatically accessible)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT
SELECT ON TABLES TO wpbot_assistant;

-- Grant INSERT, UPDATE, DELETE on orders table (run after API creates the table)
-- The assistant can fully manage orders but only read other tables
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
    EXECUTE 'GRANT INSERT, UPDATE, DELETE ON TABLE orders TO wpbot_assistant';
    EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE orders_id_seq TO wpbot_assistant';
  ELSE
    RAISE NOTICE 'orders table does not exist yet. Run this script again after starting the API to grant orders permissions.';
  END IF;
END
$$;

-- Verify the setup
-- \du wpbot_assistant
-- \dp