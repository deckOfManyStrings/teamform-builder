-- Create invite_codes table for team invitations
CREATE TABLE public.invite_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create users table for user profiles  
CREATE TABLE public.users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  business_id UUID REFERENCES public.businesses(id),
  role TEXT CHECK (role IN ('owner', 'manager', 'staff')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for invite_codes
CREATE POLICY "Allow public to read valid invite codes" 
ON public.invite_codes 
FOR SELECT 
USING (expires_at > now() AND used_at IS NULL);

CREATE POLICY "Business members can create invites" 
ON public.invite_codes 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.business_id = invite_codes.business_id 
    AND users.role IN ('owner', 'manager')
  )
);

CREATE POLICY "Business members can view their invites" 
ON public.invite_codes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.business_id = invite_codes.business_id
  )
);

CREATE POLICY "Creators can update their invites" 
ON public.invite_codes 
FOR UPDATE 
USING (created_by = auth.uid());

-- Create policies for users
CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
ON public.users 
FOR INSERT 
WITH CHECK (id = auth.uid());

CREATE POLICY "Business members can view team members" 
ON public.users 
FOR SELECT 
USING (
  business_id IN (
    SELECT business_id FROM public.users WHERE id = auth.uid()
  )
);

-- Create function to generate unique invite codes
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
BEGIN
  RETURN lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 20));
END;
$$ LANGUAGE plpgsql;

-- Create function to validate and use invite codes
CREATE OR REPLACE FUNCTION public.validate_invite_code(invite_code TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  business_id UUID,
  business_name TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ic.id,
    ic.email,
    ic.role,
    ic.business_id,
    b.name as business_name,
    ic.expires_at,
    ic.used_at
  FROM public.invite_codes ic
  JOIN public.businesses b ON ic.business_id = b.id
  WHERE ic.code = invite_code
    AND ic.expires_at > now()
    AND ic.used_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to use invite code
CREATE OR REPLACE FUNCTION public.use_invite_code(invite_code TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Get the invite details
  SELECT * INTO invite_record 
  FROM public.invite_codes 
  WHERE code = invite_code
    AND expires_at > now()
    AND used_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Mark invite as used
  UPDATE public.invite_codes 
  SET used_at = now(), used_by = user_id 
  WHERE id = invite_record.id;
  
  -- Create or update user profile
  INSERT INTO public.users (id, email, business_id, role)
  VALUES (
    user_id, 
    COALESCE(invite_record.email, (SELECT email FROM auth.users WHERE id = user_id)),
    invite_record.business_id, 
    invite_record.role
  )
  ON CONFLICT (id) 
  DO UPDATE SET 
    business_id = invite_record.business_id,
    role = invite_record.role,
    updated_at = now();
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invite_codes_updated_at
  BEFORE UPDATE ON public.invite_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX idx_invite_codes_business_id ON public.invite_codes(business_id);
CREATE INDEX idx_invite_codes_expires_at ON public.invite_codes(expires_at);
CREATE INDEX idx_users_business_id ON public.users(business_id);
CREATE INDEX idx_users_email ON public.users(email);