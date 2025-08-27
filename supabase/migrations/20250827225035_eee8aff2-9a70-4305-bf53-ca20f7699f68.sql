-- Allow anonymous users to read business names for invite validation
CREATE POLICY "Allow public to read business names for invites" 
ON public.businesses 
FOR SELECT 
TO anon, authenticated
USING (true);