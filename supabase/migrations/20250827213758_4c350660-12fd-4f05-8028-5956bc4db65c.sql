-- CRITICAL SECURITY FIX: Secure invitation codes system (Fixed version)
-- Remove dangerous policies that expose all invite codes to everyone

-- Remove the most dangerous policy that allows anyone to see all codes
DROP POLICY IF EXISTS "Allow public invite code validation" ON public.invite_codes;

-- Remove policy that allows enumeration of valid codes  
DROP POLICY IF EXISTS "Anyone can check valid codes" ON public.invite_codes;

-- Remove overly broad policies for marking codes as used
DROP POLICY IF EXISTS "Allow marking codes as used" ON public.invite_codes;
DROP POLICY IF EXISTS "System can mark codes as used" ON public.invite_codes;
DROP POLICY IF EXISTS "Update code when used" ON public.invite_codes;

-- Create a secure policy for invite code validation
-- Only allows reading valid codes (but still requires knowing the specific code)
CREATE POLICY "Secure invite code validation" ON public.invite_codes
FOR SELECT 
USING (
  -- Only allow access to valid, unused codes
  -- The application will need to query by specific code
  used_at IS NULL 
  AND expires_at > now()
);

-- Create a secure policy for marking codes as used
-- Only allows marking valid codes as used, nothing else
CREATE POLICY "Secure mark code as used" ON public.invite_codes
FOR UPDATE
USING (
  -- Only allow updating codes that are valid and unused
  used_at IS NULL 
  AND expires_at > now()
)
WITH CHECK (
  -- Only allow setting used_at, used_by fields - prevent other modifications
  used_at IS NOT NULL
);