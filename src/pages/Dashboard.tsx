import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users, FileText, Building, UserCheck, BarChart3 } from "lucide-react";
import BusinessSetup from "@/components/team/BusinessSetup";
import TeamManagement from "@/components/team/TeamManagement";
import ClientList from "@/components/clients/ClientList";
import FormList from "@/components/forms/FormList";
import SubmissionList from "@/components/submissions/SubmissionList";
import AnalyticsDashboard from "@/components/reports/AnalyticsDashboard";
import AuditTrail from "@/components/reports/AuditTrail";

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  business_id: string | null;
  role: string | null;
  is_active: boolean;
}

interface BusinessData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamStats, setTeamStats] = useState({ 
    memberCount: 0, 
    formCount: 0, 
    submissionCount: 0, 
    clientCount: 0, 
    pendingReview: 0 
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      // Try to get user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      // If no profile exists, create one
      if (!userData) {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email || '',
            first_name: user.user_metadata?.first_name || null,
            last_name: user.user_metadata?.last_name || null,
          })
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newUser);
      } else {
        setProfile(userData);

        // If user has a business, fetch business data and stats
        if (userData.business_id) {
          await fetchBusinessData(userData.business_id);
          await fetchTeamStats(userData.business_id);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessData = async (businessId: string) => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

      if (error) throw error;
      setBusiness(data);
    } catch (error) {
      console.error('Error fetching business:', error);
    }
  };

  const fetchTeamStats = async (businessId: string) => {
    try {
      // Get member count
      const { count: memberCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('is_active', true);

      // Get client count
      const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('is_active', true);

      // Get form count
      const { count: formCount } = await supabase
        .from('forms')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId);

      // Get submission count
      const formIds = (await supabase
        .from('forms')
        .select('id')
        .eq('business_id', businessId)
      ).data?.map(f => f.id) || [];

      const { count: submissionCount } = await supabase
        .from('form_submissions')
        .select('form_id', { count: 'exact', head: true })
        .in('form_id', formIds);

      // Get pending review count
      const { count: pendingReview } = await supabase
        .from('form_submissions')
        .select('form_id', { count: 'exact', head: true })
        .in('form_id', formIds)
        .eq('status', 'submitted');

      setTeamStats({
        memberCount: memberCount || 0,
        clientCount: clientCount || 0,
        formCount: formCount || 0,
        submissionCount: submissionCount || 0,
        pendingReview: pendingReview || 0
      });
    } catch (error) {
      console.error('Error fetching team stats:', error);
    }
  };

  const handleBusinessCreated = () => {
    fetchProfile(); // Refresh to get the new business association
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          {/* Mobile Header Layout */}
          <div className="flex items-center justify-between lg:hidden">
            <div className="flex items-center space-x-2">
              <Building className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-lg sm:text-xl font-bold truncate">Healthcare Forms</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(profile?.first_name, profile?.last_name)}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="px-2">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Desktop Header Layout */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Building className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Healthcare Forms</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarFallback>
                    {getInitials(profile?.first_name, profile?.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-muted-foreground capitalize">
                    {profile?.role || 'Staff'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
          
          {/* Mobile User Info */}
          <div className="lg:hidden mt-2 flex items-center justify-between text-sm">
            <div>
              <p className="font-medium truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-muted-foreground text-xs">
                {business?.name} • {profile?.role?.charAt(0).toUpperCase()}{profile?.role?.slice(1)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {!profile?.business_id ? (
          // No business setup yet
          <div className="max-w-2xl mx-auto px-4">
            <BusinessSetup onBusinessCreated={handleBusinessCreated} />
          </div>
        ) : (
          // Business exists, show dashboard
          <div className="space-y-4 sm:space-y-8">
            {/* Welcome Section - Hidden on mobile, shown in header instead */}
            <div className="hidden lg:block">
              <h2 className="text-2xl sm:text-3xl font-bold">
                Welcome back, {profile?.first_name || 'User'}!
              </h2>
              <p className="text-muted-foreground">
                {business?.name} • {profile?.role?.charAt(0).toUpperCase()}{profile?.role?.slice(1)}
              </p>
            </div>

            {/* Tabbed Interface */}
            <Tabs defaultValue="overview" className="space-y-4">
              {/* Mobile Scrollable Tabs - Fixed horizontal scroll */}
              <div className="lg:hidden -mx-2 px-2">
                <div className="overflow-x-auto scrollbar-hide">
                  <TabsList className="inline-flex h-9 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground min-w-max">
                    <TabsTrigger value="overview" className="whitespace-nowrap px-3 py-1.5 text-sm">Overview</TabsTrigger>
                    <TabsTrigger value="clients" className="whitespace-nowrap px-3 py-1.5 text-sm">Clients</TabsTrigger>
                    <TabsTrigger value="forms" className="whitespace-nowrap px-3 py-1.5 text-sm">Forms</TabsTrigger>
                    <TabsTrigger value="submissions" className="whitespace-nowrap px-3 py-1.5 text-sm">Submissions</TabsTrigger>
                    <TabsTrigger value="team" className="whitespace-nowrap px-3 py-1.5 text-sm">Team</TabsTrigger>
                    <TabsTrigger value="reports" className="whitespace-nowrap px-3 py-1.5 text-sm">Reports</TabsTrigger>
                  </TabsList>
                </div>
              </div>
              
              {/* Desktop Tabs */}
              <div className="hidden lg:block">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="clients">Clients</TabsTrigger>
                  <TabsTrigger value="forms">Forms</TabsTrigger>
                  <TabsTrigger value="submissions">Submissions</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-4">
                {/* Quick Stats */}
                <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Clients</CardTitle>
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{teamStats.clientCount}</div>
                      <p className="text-xs text-muted-foreground">
                        {teamStats.clientCount === 0 ? 'No clients yet' : 'active clients'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{teamStats.memberCount}</div>
                      <p className="text-xs text-muted-foreground">
                        {teamStats.memberCount === 1 ? 'Just you so far' : 'active team members'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Forms</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{teamStats.formCount}</div>
                      <p className="text-xs text-muted-foreground">
                        {teamStats.formCount === 0 ? 'No active forms yet' : 'forms ready to use'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Submissions</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{teamStats.submissionCount}</div>
                      <p className="text-xs text-muted-foreground">
                        {teamStats.submissionCount === 0 ? 'No submissions yet' : 'total submissions'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{teamStats.pendingReview}</div>
                      <p className="text-xs text-muted-foreground">
                        submissions awaiting review
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Latest updates from your healthcare forms platform.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {teamStats.submissionCount > 0 ? (
                        <div className="text-sm text-muted-foreground">
                          <p>✓ {teamStats.submissionCount} total form submissions</p>
                          {teamStats.pendingReview > 0 && (
                            <p className="text-orange-600">⏳ {teamStats.pendingReview} submissions pending review</p>
                          )}
                          {teamStats.clientCount > 0 && (
                            <p>👥 {teamStats.clientCount} active clients</p>
                          )}
                          {teamStats.formCount > 0 && (
                            <p>📋 {teamStats.formCount} active forms</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <p>No activity yet. Start by creating a form and adding clients!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="clients" className="space-y-4">
                <ClientList businessId={profile.business_id} userRole={profile.role || 'staff'} />
              </TabsContent>

              <TabsContent value="submissions" className="space-y-4">
                <SubmissionList businessId={profile.business_id} userRole={profile.role || 'staff'} />
              </TabsContent>

              <TabsContent value="team" className="space-y-4">
                <TeamManagement businessId={profile.business_id} userRole={profile.role || 'staff'} />
              </TabsContent>

              <TabsContent value="forms" className="space-y-4">
                <FormList businessId={profile.business_id} userRole={profile.role || 'staff'} />
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <div className="space-y-6">
                  <AnalyticsDashboard businessId={profile.business_id} userRole={profile.role || 'staff'} />
                  <AuditTrail businessId={profile.business_id} userRole={profile.role || 'staff'} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}