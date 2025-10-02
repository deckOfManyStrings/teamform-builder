-- Drop the overly permissive policy that exposes all business data publicly
DROP POLICY IF EXISTS "Allow public to read business names for invites" ON public.businesses;

-- The invite system already uses the get_invitation_by_token() function
-- which has SECURITY DEFINER, so it can access business names without
-- needing a public RLS policy. All other business data access is properly
-- restricted to authenticated users who belong to that business.