-- The public browser must never have database-level access to submitted material.
-- Approved submissions are written by the Supabase Edge Function using service-role credentials.
ALTER TABLE public.letsfixindia_submissions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.letsfixindia_submissions FROM anon;
REVOKE ALL ON TABLE public.letsfixindia_submissions FROM authenticated;

DROP POLICY IF EXISTS "Allow public inserts" ON public.letsfixindia_submissions;
DROP POLICY IF EXISTS "anon insert" ON public.letsfixindia_submissions;

-- Add moderation state without exposing it to public clients.
ALTER TABLE public.letsfixindia_submissions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected', 'spam'));

ALTER TABLE public.letsfixindia_submissions
  ADD COLUMN IF NOT EXISTS request_hash text;

CREATE INDEX IF NOT EXISTS letsfixindia_submissions_request_hash_created_at_idx
  ON public.letsfixindia_submissions (request_hash, created_at DESC);
