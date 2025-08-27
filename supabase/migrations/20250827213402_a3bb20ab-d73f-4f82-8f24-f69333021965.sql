-- Fix function search path security warnings by setting secure search_path
-- This prevents SQL injection via search_path manipulation

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Fix get_user_business_id function
CREATE OR REPLACE FUNCTION public.get_user_business_id(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN (SELECT business_id FROM users WHERE id = user_id);
END;
$function$;

-- Fix user_has_role function
CREATE OR REPLACE FUNCTION public.user_has_role(user_id uuid, required_role user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND role = required_role 
    AND is_active = true
  );
END;
$function$;

-- Fix user_has_min_role function
CREATE OR REPLACE FUNCTION public.user_has_min_role(user_id uuid, min_role user_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_role_level INTEGER;
  min_role_level INTEGER;
BEGIN
  -- Define role hierarchy: owner=3, manager=2, staff=1
  SELECT CASE 
    WHEN role = 'owner' THEN 3
    WHEN role = 'manager' THEN 2
    WHEN role = 'staff' THEN 1
    ELSE 0
  END INTO user_role_level
  FROM users WHERE id = user_id AND is_active = true;

  SELECT CASE 
    WHEN min_role = 'owner' THEN 3
    WHEN min_role = 'manager' THEN 2
    WHEN min_role = 'staff' THEN 1
    ELSE 0
  END INTO min_role_level;

  RETURN COALESCE(user_role_level, 0) >= min_role_level;
END;
$function$;

-- Fix audit_trigger_function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  user_business_id UUID;
  current_user_id UUID;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Only log if we have a valid user
  IF current_user_id IS NOT NULL THEN
    -- Get the business_id for the current user (if exists)
    SELECT business_id INTO user_business_id 
    FROM users 
    WHERE id = current_user_id;
    
    -- If this is a business insert and user doesn't have business_id yet,
    -- use the business being created
    IF TG_TABLE_NAME = 'businesses' AND TG_OP = 'INSERT' AND user_business_id IS NULL THEN
      user_business_id := NEW.id;
    END IF;
    
    -- Insert audit log only if user exists in users table or if this is a business creation
    IF EXISTS (SELECT 1 FROM users WHERE id = current_user_id) OR TG_TABLE_NAME = 'businesses' THEN
      INSERT INTO audit_logs (
        business_id,
        user_id,
        table_name,
        record_id,
        action,
        old_values,
        new_values
      ) VALUES (
        user_business_id,
        current_user_id,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    -- If audit logging fails, don't break the main operation
    RETURN COALESCE(NEW, OLD);
END;
$function$;