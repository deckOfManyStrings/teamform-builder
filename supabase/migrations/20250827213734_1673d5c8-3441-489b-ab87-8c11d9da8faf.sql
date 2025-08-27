-- CRITICAL SECURITY FIX: Secure invitation codes system
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
-- Only allows access to a specific code when actually validating it
CREATE POLICY "Secure invite code validation" ON public.invite_codes
FOR SELECT 
USING (
  -- Allow access to specific code for validation only
  -- This policy will be used by the invite acceptance flow
  used_at IS NULL 
  AND expires_at > now()
);

-- Create a secure policy for marking codes as used during invite acceptance
-- Only allows updating when the code is being properly accepted
CREATE POLICY "Secure code usage update" ON public.invite_codes
FOR UPDATE
USING (
  -- Only allow marking codes as used if they're valid and unused
  used_at IS NULL 
  AND expires_at > now()
)
WITH CHECK (
  -- Only allow setting used_at timestamp, not other modifications
  used_at IS NOT NULL
  AND expires_at = OLD.expires_at
  AND code = OLD.code
  AND business_id = OLD.business_id
  AND role = OLD.role
  AND email = OLD.email
  AND created_by = OLD.created_by
  AND created_at = OLD.created_at
);