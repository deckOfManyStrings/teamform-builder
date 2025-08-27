-- Fix critical security issues before publishing

-- 1. Fix users table policy - users should only see their own data and colleagues in same business
DROP POLICY IF EXISTS "enable_read_users" ON users;

CREATE POLICY "Users can view their own profile" 
ON users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can view colleagues in same business" 
ON users FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND business_id IS NOT NULL 
  AND business_id = (SELECT business_id FROM users WHERE id = auth.uid())
);

-- 2. Fix invite_codes table - only allow managers/owners to view codes for their business
DROP POLICY IF EXISTS "Secure invite code validation" ON invite_codes;

CREATE POLICY "Managers can view invitations for their business" 
ON invite_codes FOR SELECT 
USING (
  business_id = (SELECT business_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager')
    AND is_active = true
  )
);

CREATE POLICY "Public access for invitation acceptance" 
ON invite_codes FOR SELECT 
USING (used_at IS NULL AND expires_at > NOW());

-- 3. Restrict form_templates to business-specific access
DROP POLICY IF EXISTS "Enable read access for all users" ON form_templates;

CREATE POLICY "Users can view their business form templates" 
ON form_templates FOR SELECT 
USING (
  business_id = (SELECT business_id FROM users WHERE id = auth.uid())
);

-- Add policy for system-wide templates (if needed)
CREATE POLICY "Users can view system templates" 
ON form_templates FOR SELECT 
USING (business_id IS NULL AND is_system_template = true);