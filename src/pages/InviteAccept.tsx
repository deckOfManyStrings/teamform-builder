import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building, UserPlus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InviteDetails {
  id: string;
  email: string | null;
  role: string;
  business_id: string;
  business_name: string;
  expires_at: string;
  used_at: string | null;
}

export default function InviteAccept() {
  const { code } = useParams<{ code: string }>();
  const { user, signUp, signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  useEffect(() => {
    if (code) {
      validateInviteCode();
    }
  }, [code]);

  useEffect(() => {
    // If user is already logged in, try to accept the invite
    if (user && inviteDetails) {
      acceptInvite();
    }
  }, [user, inviteDetails]);

  const validateInviteCode = async () => {
    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select(`
          id,
          email,
          role,
          business_id,
          expires_at,
          used_at,
          businesses!inner(name)
        `)
        .eq('code', code)
        .single();

      if (error || !data) {
        setError('Invalid or expired invite code.');
        return;
      }

      if (data.used_at) {
        setError('This invite has already been used.');
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('This invite has expired.');
        return;
      }

      setInviteDetails({
        ...data,
        business_name: (data.businesses as any).name,
      });

      // Pre-fill email if specified in invite
      if (data.email) {
        setFormData(prev => ({ ...prev, email: data.email! }));
      }
    } catch (error) {
      console.error('Error validating invite:', error);
      setError('Failed to validate invite code.');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async () => {
    if (!user || !inviteDetails) return;

    try {
      // Check if user already has a business
      const { data: existingUser } = await supabase
        .from('users')
        .select('business_id')
        .eq('id', user.id)
        .single();

      if (existingUser?.business_id) {
        setError('You are already a member of an organization.');
        return;
      }

      // Update user profile with business and role
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email || '',
          business_id: inviteDetails.business_id,
          role: inviteDetails.role as 'owner' | 'manager' | 'staff',
          first_name: user.user_metadata?.first_name || formData.firstName,
          last_name: user.user_metadata?.last_name || formData.lastName,
        });

      if (userError) throw userError;

      // Mark invite as used
      const { error: inviteError } = await supabase
        .from('invite_codes')
        .update({
          used_at: new Date().toISOString(),
          used_by: user.id,
        })
        .eq('id', inviteDetails.id);

      if (inviteError) throw inviteError;

      toast({
        title: "Welcome!",
        description: `You've successfully joined ${inviteDetails.business_name}`,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast({
        title: "Error",
        description: "Failed to accept invite. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      const { error } = await signUp(formData.email, formData.password, formData.firstName, formData.lastName);
      if (!error) {
        toast({
          title: "Account Created",
          description: "Please check your email to verify your account, then return to complete the invite process.",
        });
      }
    } else {
      const { error } = await signIn(formData.email, formData.password);
      // If sign in successful, useEffect will handle accepting the invite
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Validating invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteDetails) {
    return null;
  }

  // If user is already logged in, show accepting state
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Accepting invite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Building className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Join Organization</CardTitle>
          <CardDescription>
            You've been invited to join <strong>{inviteDetails.business_name}</strong> as a{' '}
            <span className="capitalize">{inviteDetails.role}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inviteDetails.email && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invite is specifically for {inviteDetails.email}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled={!!inviteDetails.email}
              />
            </div>

            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full">
              {isSignUp ? 'Create Account & Join' : 'Sign In & Join'}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp 
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}