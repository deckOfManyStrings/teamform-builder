-- Enable Row Level Security on all tables that have policies but RLS disabled
-- This is critical for security - policies cannot protect data without RLS enabled

-- Enable RLS on audit_logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on businesses table  
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Enable RLS on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Enable RLS on form_submissions table
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on form_templates table
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

-- Enable RLS on forms table
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- Enable RLS on users table (this is especially critical for user data)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;