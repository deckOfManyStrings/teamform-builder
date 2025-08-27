-- Drop the conflicting policy and create a proper public access policy
DROP POLICY IF EXISTS "Allow public to validate invite codes for signup" ON public.invite_codes;

-- Create a policy that allows anonymous users to read valid invite codes
CREATE POLICY "Allow public to read valid invite codes" 
ON public.invite_codes 
FOR SELECT 
TO anon, authenticated
USING (
  expires_at > now() 
  AND used_at IS NULL
);