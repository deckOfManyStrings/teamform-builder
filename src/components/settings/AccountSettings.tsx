import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Shield, Building, Crown, Sparkles, Users as UsersIcon, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useSubscriptionLimits } from "@/hooks/use-subscription-limits";
import { useSubscription } from "@/hooks/use-subscription";
import { PricingDialog } from "@/components/subscription/PricingDialog";

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  business_id: string | null;
}

interface BusinessData {
  name: string;
  email: string | null;
  phone: string | null;
}

export default function AccountSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: limits } = useSubscriptionLimits();
  const { tier, subscribed, openCustomerPortal } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*, business:businesses(name, email, phone)")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;

      setProfile(userData);
      setFirstName(userData.first_name || "");
      setLastName(userData.last_name || "");
      
      if (userData.business) {
        setBusiness(userData.business as any);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          first_name: firstName,
          last_name: lastName,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (current: number, max: number) => {
    return (current / max) * 100;
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground">
          Manage your account information and preferences
        </p>
      </div>

      {/* Subscription & Usage */}
      {limits && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Subscription & Usage
                </CardTitle>
                <CardDescription>
                  Your current plan and resource usage
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize text-base px-4 py-1">
                  {limits.subscription_tier}
                </Badge>
                {subscribed ? (
                  <Button variant="outline" size="sm" onClick={openCustomerPortal}>
                    <Shield className="h-4 w-4 mr-2" />
                    Manage
                  </Button>
                ) : (
                  <PricingDialog>
                    <Button variant="default" size="sm">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Upgrade
                    </Button>
                  </PricingDialog>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Clients Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Clients</span>
                </div>
                <span className="text-muted-foreground">
                  {limits.current_clients} / {limits.max_clients}
                </span>
              </div>
              <Progress 
                value={getPercentage(limits.current_clients, limits.max_clients)} 
                className={
                  getPercentage(limits.current_clients, limits.max_clients) >= 100 
                    ? "bg-destructive/20" 
                    : getPercentage(limits.current_clients, limits.max_clients) >= 80 
                    ? "bg-warning/20" 
                    : ""
                }
              />
            </div>

            {/* Staff Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Staff</span>
                </div>
                <span className="text-muted-foreground">
                  {limits.current_staff} / {limits.max_staff}
                </span>
              </div>
              <Progress 
                value={getPercentage(limits.current_staff, limits.max_staff)} 
                className={
                  getPercentage(limits.current_staff, limits.max_staff) >= 100 
                    ? "bg-destructive/20" 
                    : getPercentage(limits.current_staff, limits.max_staff) >= 80 
                    ? "bg-warning/20" 
                    : ""
                }
              />
            </div>

            {/* Managers Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Managers</span>
                </div>
                <span className="text-muted-foreground">
                  {limits.current_managers} / {limits.max_managers}
                </span>
              </div>
              <Progress 
                value={getPercentage(limits.current_managers, limits.max_managers)} 
                className={
                  getPercentage(limits.current_managers, limits.max_managers) >= 100 
                    ? "bg-destructive/20" 
                    : getPercentage(limits.current_managers, limits.max_managers) >= 80 
                    ? "bg-warning/20" 
                    : ""
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
              />
            </div>
          </div>
          <Button onClick={handleUpdateProfile} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Account Details
          </CardTitle>
          <CardDescription>
            Your account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <div className="flex items-center gap-2">
              <Input value={profile.email} disabled />
              <Badge variant="secondary">Verified</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Contact support to change your email address
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Role & Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organization & Role
          </CardTitle>
          <CardDescription>
            Your role and organization details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Organization</Label>
            <Input value={business?.name || "No organization"} disabled />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="capitalize">
                {profile.role?.replace("_", " ") || "No role assigned"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
