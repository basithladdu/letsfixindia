GRANT ALL ON letsfixindia_submissions TO anon;
GRANT ALL ON letsfixindia_submissions TO authenticated;
GRANT ALL ON letsfixindia_submissions TO service_role;
CREATE POLICY "anon insert" ON letsfixindia_submissions FOR INSERT TO anon WITH CHECK (true);
