-- Create a function to get subscription tier limits
CREATE OR REPLACE FUNCTION public.get_tier_limits(tier subscription_tier)
RETURNS TABLE(
  max_clients INTEGER,
  max_staff INTEGER,
  max_managers INTEGER,
  max_owners INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Create a function to check if a business can add more clients
CREATE OR REPLACE FUNCTION public.can_add_client(business_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  tier_limit INTEGER;
  business_tier subscription_tier;
BEGIN
  -- Get business tier
  SELECT subscription_tier INTO business_tier
  FROM businesses
  WHERE id = business_uuid;
  
  -- Get current active client count
  SELECT COUNT(*) INTO current_count
  FROM clients
  WHERE business_id = business_uuid AND is_active = true;
  
  -- Get tier limit
  SELECT max_clients INTO tier_limit
  FROM get_tier_limits(business_tier);
  
  RETURN current_count < tier_limit;
END;
$$;

-- Create a function to check if a business can add more users of a specific role
CREATE OR REPLACE FUNCTION public.can_add_user(business_uuid uuid, user_role user_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  tier_limit INTEGER;
  business_tier subscription_tier;
BEGIN
  -- Get business tier
  SELECT subscription_tier INTO business_tier
  FROM businesses
  WHERE id = business_uuid;
  
  -- Get current user count for the role
  SELECT COUNT(*) INTO current_count
  FROM users
  WHERE business_id = business_uuid 
    AND role = user_role 
    AND is_active = true;
  
  -- Get tier limit based on role
  IF user_role = 'staff' THEN
    SELECT max_staff INTO tier_limit FROM get_tier_limits(business_tier);
  ELSIF user_role = 'manager' THEN
    SELECT max_managers INTO tier_limit FROM get_tier_limits(business_tier);
  ELSIF user_role = 'owner' THEN
    SELECT max_owners INTO tier_limit FROM get_tier_limits(business_tier);
  ELSE
    RETURN false;
  END IF;
  
  RETURN current_count < tier_limit;
END;
$$;

-- Create a function to get business usage stats (instead of a view)
CREATE OR REPLACE FUNCTION public.get_business_usage_stats(business_uuid uuid)
RETURNS TABLE(
  business_id uuid,
  subscription_tier subscription_tier,
  current_clients bigint,
  current_staff bigint,
  current_managers bigint,
  current_owners bigint,
  max_clients integer,
  max_staff integer,
  max_managers integer,
  max_owners integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as business_id,
    b.subscription_tier,
    COUNT(DISTINCT CASE WHEN c.is_active THEN c.id END) as current_clients,
    COUNT(DISTINCT CASE WHEN u.is_active AND u.role = 'staff' THEN u.id END) as current_staff,
    COUNT(DISTINCT CASE WHEN u.is_active AND u.role = 'manager' THEN u.id END) as current_managers,
    COUNT(DISTINCT CASE WHEN u.is_active AND u.role = 'owner' THEN u.id END) as current_owners,
    l.max_clients,
    l.max_staff,
    l.max_managers,
    l.max_owners
  FROM businesses b
  LEFT JOIN clients c ON c.business_id = b.id
  LEFT JOIN users u ON u.business_id = b.id
  CROSS JOIN LATERAL get_tier_limits(b.subscription_tier) l
  WHERE b.id = business_uuid
  GROUP BY b.id, b.subscription_tier, l.max_clients, l.max_staff, l.max_managers, l.max_owners;
END;
$$;