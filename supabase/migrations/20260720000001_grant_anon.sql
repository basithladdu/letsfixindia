-- Lock submissions down to public INSERT-only.
-- The public web form needs to INSERT; nothing else. Reading, updating, and
-- deleting stay restricted to the service role (dashboard / server side).
-- The publishable ("anon") key shipped in the browser can therefore only add
-- rows, never read or destroy them.

REVOKE ALL ON letsfixindia_submissions FROM anon;
REVOKE ALL ON letsfixindia_submissions FROM authenticated;
GRANT INSERT ON letsfixindia_submissions TO anon;
GRANT USAGE ON SEQUENCE letsfixindia_submissions_id_seq TO anon;
REVOKE SELECT ON SEQUENCE letsfixindia_submissions_id_seq FROM anon;
GRANT ALL ON letsfixindia_submissions TO service_role;

-- Row Level Security stays ON, with a single INSERT policy for the public.
ALTER TABLE letsfixindia_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon insert" ON letsfixindia_submissions;
DROP POLICY IF EXISTS "Allow public inserts" ON letsfixindia_submissions;
CREATE POLICY "public can submit" ON letsfixindia_submissions
    FOR INSERT TO anon WITH CHECK (true);
