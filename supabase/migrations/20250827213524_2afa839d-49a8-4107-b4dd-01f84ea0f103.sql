-- CRITICAL SECURITY FIX: Remove overly permissive business access policy
-- This policy allowed ANY authenticated user to access ALL business data
-- which creates a major security vulnerability for business contact harvesting

DROP POLICY IF EXISTS "enable_businesses_for_users" ON public.businesses;

-- The remaining policies provide proper security:
-- 1. "Users can view their own business" - users can only see their own business
-- 2. "Business owners can update their business" - only owners can update their business  
-- 3. "Authenticated users can create business during onboarding" - allows business creation

-- Let's verify the remaining policies are sufficient by checking them:
-- (This is just a comment for documentation - the specific policies already exist)