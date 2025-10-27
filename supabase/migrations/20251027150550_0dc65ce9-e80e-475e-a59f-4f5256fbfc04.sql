-- Fix invite_codes table - remove all existing policies and create secure ones
DROP POLICY IF EXISTS "Anyone can view valid invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Allow marking invite codes as used during signup" ON invite_codes;
DROP POLICY IF EXISTS "Owners and managers can create invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Owners and managers can update invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Owners and managers can delete invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Public can read valid unused invite codes" ON invite_codes;

-- Create secure policies for invite_codes
CREATE POLICY "Users can view their business invite codes"
ON invite_codes FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Allow invite code validation during signup"
ON invite_codes FOR SELECT
USING (expires_at > now() AND used_at IS NULL);

CREATE POLICY "Owners and managers can create invite codes"
ON invite_codes FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT business_id FROM users 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager')
  )
);

CREATE POLICY "Owners and managers can update invite codes"
ON invite_codes FOR UPDATE
USING (
  business_id IN (
    SELECT business_id FROM users 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager')
  )
);

CREATE POLICY "Allow marking invite codes as used during signup"
ON invite_codes FOR UPDATE
USING (used_at IS NULL AND expires_at > now())
WITH CHECK (used_at IS NOT NULL AND used_by IS NOT NULL);

CREATE POLICY "Owners and managers can delete invite codes"
ON invite_codes FOR DELETE
USING (
  business_id IN (
    SELECT business_id FROM users 
    WHERE id = auth.uid() 
    AND role IN ('owner', 'manager')
  )
);

-- Fix form_templates table
DROP POLICY IF EXISTS "Only system can modify form templates" ON form_templates;
DROP POLICY IF EXISTS "Only system can update form templates" ON form_templates;
DROP POLICY IF EXISTS "Only system can delete form templates" ON form_templates;

CREATE POLICY "Prevent insert form templates"
ON form_templates FOR INSERT
WITH CHECK (false);

CREATE POLICY "Prevent update form templates"
ON form_templates FOR UPDATE
USING (false);

CREATE POLICY "Prevent delete form templates"
ON form_templates FOR DELETE
USING (false);

-- Fix businesses table
DROP POLICY IF EXISTS "Allow public read for recently created businesses" ON businesses;
DROP POLICY IF EXISTS "Users can view business during creation" ON businesses;

-- Users can see their business during onboarding (when they don't have business_id yet)
-- This is safer than allowing public access
CREATE POLICY "Allow business view during onboarding"
ON businesses FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND business_id IS NOT NULL) AND
  created_at > now() - interval '5 minutes'
);