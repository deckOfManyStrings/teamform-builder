-- Fix critical security issues before publishing

-- 1. Fix users table policy - remove overly permissive policy
DROP POLICY IF EXISTS "enable_read_users" ON users;

-- Keep the other user policies that are properly restrictive
-- The remaining policies already properly restrict access

-- 2. For invite_codes table - the existing policies are mostly good
-- Just need to ensure the "Secure invite code validation" policy is properly restrictive
DROP POLICY IF EXISTS "Secure invite code validation" ON invite_codes;

-- Create a more secure policy for invite code validation during signup
CREATE POLICY "Public invite code validation for signup" 
ON invite_codes FOR SELECT 
USING (used_at IS NULL AND expires_at > NOW());

-- 3. For form_templates - restrict access (no business_id column exists)
DROP POLICY IF EXISTS "Users can view form templates" ON form_templates;

-- Create a more restrictive policy - only show system templates to all users
CREATE POLICY "Users can view system templates only" 
ON form_templates FOR SELECT 
USING (is_system_template = true);