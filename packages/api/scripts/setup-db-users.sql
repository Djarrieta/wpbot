-- Create readonly user for assistant/external access
-- Run this as the wpbot user or postgres superuser

-- Create the readonly user
CREATE USER wpbot_readonly WITH PASSWORD 'wpbot_readonly';

-- Grant connection to the database
GRANT CONNECT ON DATABASE wpbot TO wpbot_readonly;

-- Grant usage on the public schema
GRANT USAGE ON SCHEMA public TO wpbot_readonly;

-- Grant SELECT on all existing tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO wpbot_readonly;

-- Grant SELECT on all future tables (so new tables are automatically accessible)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT
SELECT ON TABLES TO wpbot_readonly;

-- Verify the setup
-- \du wpbot_readonly
-- \dp