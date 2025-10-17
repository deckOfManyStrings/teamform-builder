-- Revert tier limits to original advertised values
CREATE OR REPLACE FUNCTION public.get_tier_limits(tier subscription_tier)
RETURNS TABLE(max_clients integer, max_staff integer, max_managers integer, max_owners integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    CASE tier
      WHEN 'free' THEN 5
      WHEN 'basic' THEN 25
      WHEN 'professional' THEN 100
      WHEN 'enterprise' THEN 999999
    END as max_clients,
    CASE tier
      WHEN 'free' THEN 2
      WHEN 'basic' THEN 10
      WHEN 'professional' THEN 50
      WHEN 'enterprise' THEN 999999
    END as max_staff,
    CASE tier
      WHEN 'free' THEN 0
      WHEN 'basic' THEN 3
      WHEN 'professional' THEN 10
      WHEN 'enterprise' THEN 999999
    END as max_managers,
    CASE tier
      WHEN 'free' THEN 1
      WHEN 'basic' THEN 1
      WHEN 'professional' THEN 3
      WHEN 'enterprise' THEN 999999
    END as max_owners;
END;
$function$;