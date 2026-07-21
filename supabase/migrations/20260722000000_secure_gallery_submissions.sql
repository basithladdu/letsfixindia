-- Public clients must not be able to bypass the server-side submission guard.
DROP POLICY IF EXISTS "public can submit" ON letsfixindia_submissions;
DROP POLICY IF EXISTS "Allow public inserts" ON letsfixindia_submissions;
DROP POLICY IF EXISTS "anon insert" ON letsfixindia_submissions;

REVOKE INSERT ON letsfixindia_submissions FROM anon;
REVOKE INSERT ON letsfixindia_submissions FROM authenticated;
REVOKE USAGE ON SEQUENCE letsfixindia_submissions_id_seq FROM anon;
REVOKE USAGE ON SEQUENCE letsfixindia_submissions_id_seq FROM authenticated;
GRANT ALL ON letsfixindia_submissions TO service_role;

CREATE INDEX IF NOT EXISTS letsfixindia_submissions_reference_idx
  ON letsfixindia_submissions ((data ->> 'reference'));

CREATE INDEX IF NOT EXISTS letsfixindia_submissions_abuse_window_idx
  ON letsfixindia_submissions (((data -> 'abuse') ->> 'ipHash'), created_at DESC);
