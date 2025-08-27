-- Fix critical invitation code security vulnerability
-- Remove the overly permissive public policy that allows enumeration of all invite codes

DROP POLICY IF EXISTS "Public invite code validation for signup" ON invite_codes;

-- Create a secure function for invite code validation that doesn't expose all codes
CREATE OR REPLACE FUNCTION public.validate_invite_code(
  invitation_code TEXT,
  user_email TEXT DEFAULT NULL
) 
RETURNS TABLE(
  id UUID,
  business_id UUID,
  role user_role,
  email TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate the specific invite code without exposing all codes
  RETURN QUERY
  SELECT 
    ic.id,
    ic.business_id,
    ic.role,
    ic.email,
    ic.expires_at
  FROM invite_codes ic
  WHERE ic.code = invitation_code
    AND ic.used_at IS NULL 
    AND ic.expires_at > NOW()
    AND (user_email IS NULL OR ic.email = user_email OR ic.email IS NULL);
END;
$$;

-- Create a secure function to mark invite code as used
CREATE OR REPLACE FUNCTION public.use_invite_code(
  invitation_code TEXT,
  user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_exists BOOLEAN;
BEGIN
  -- Check if code exists and is valid
  SELECT EXISTS(
    SELECT 1 FROM invite_codes 
    WHERE code = invitation_code 
      AND used_at IS NULL 
      AND expires_at > NOW()
  ) INTO code_exists;
  
  IF NOT code_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Mark code as used
  UPDATE invite_codes 
  SET used_at = NOW(), used_by = user_id
  WHERE code = invitation_code 
    AND used_at IS NULL 
    AND expires_at > NOW();
    
  RETURN FOUND;
END;
$$;

-- Remove the old update policy that was too broad
DROP POLICY IF EXISTS "Secure mark code as used" ON invite_codes;

-- Create a more restrictive policy for updates (only allow marking as used)
CREATE POLICY "Allow marking invite codes as used during signup" 
ON invite_codes FOR UPDATE 
USING (used_at IS NULL AND expires_at > NOW())
WITH CHECK (used_at IS NOT NULL AND used_by IS NOT NULL);

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION public.validate_invite_code TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.use_invite_code TO anon, authenticated;