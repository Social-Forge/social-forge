BEGIN;

DROP FUNCTION IF EXISTS refresh_messages_search_view();
DROP MATERIALIZED VIEW IF EXISTS messages_search_view;

COMMIT;