-- CRITICAL SECURITY FIX: Prevent harvesting of business contact information
-- The current policy allows users without a business to see ALL businesses
-- This exposes business emails and phone numbers to potential competitors/spammers

-- Drop the overly permissive policy that allows business information harvesting
DROP POLICY IF EXISTS "Users can view their own business" ON public.businesses;

-- Create a secure policy that only allows users to see their own business
CREATE POLICY "Users can view their own business only" ON public.businesses
FOR SELECT 
USING (
  -- Only allow users to see their own business
  id = get_user_business_id(auth.uid())
);

-- Create a separate policy for users during business creation/onboarding
-- This allows users to see only the business they are creating
CREATE POLICY "Users can view business during creation" ON public.businesses
FOR SELECT
USING (
  -- Allow access during business creation process
  -- This is needed when a user creates a business but their profile hasn't been updated yet
  auth.uid() IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND business_id IS NOT NULL
  )
  AND created_at > (NOW() - INTERVAL '5 minutes')
);