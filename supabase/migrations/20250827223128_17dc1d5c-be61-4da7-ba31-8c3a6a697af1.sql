-- Create public policy for validating invite codes during signup
CREATE POLICY "Allow public to validate invite codes for signup" 
ON public.invite_codes 
FOR SELECT 
TO public
USING (
  expires_at > now() 
  AND used_at IS NULL
);