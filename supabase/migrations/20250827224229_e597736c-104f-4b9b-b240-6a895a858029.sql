-- Drop all existing SELECT policies and create a simple one for anonymous access
DROP POLICY IF EXISTS "Allow public to read valid invite codes" ON public.invite_codes;
DROP POLICY IF EXISTS "Users can view business invite codes" ON public.invite_codes;
DROP POLICY IF EXISTS "Users can view invite codes for their business" ON public.invite_codes;

-- Create a simple policy that allows anyone (including anonymous users) to read valid invite codes
CREATE POLICY "Public can read valid unused invite codes" 
ON public.invite_codes 
FOR SELECT 
USING (
  expires_at > now() 
  AND used_at IS NULL
);