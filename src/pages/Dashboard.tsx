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
      <header className="border-b bg-gradient-card sticky top-0 z-40 backdrop-blur-md">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          {/* Mobile Header Layout */}
          <div className="flex items-center justify-between lg:hidden">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <Building className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <h1 className="text-lg sm:text-xl font-jakarta font-bold truncate">Healthcare Forms</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground font-medium">
                  {getInitials(profile?.first_name, profile?.last_name)}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="px-2 hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Desktop Header Layout */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-primary p-3 rounded-xl shadow-glow">
                <Building className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-jakarta font-bold">Healthcare Forms</h1>
                <p className="text-sm text-muted-foreground">Professional Form Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-card border border-border rounded-lg px-4 py-2">
                <Avatar className="border-2 border-primary/20">
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground font-medium">
                    {getInitials(profile?.first_name, profile?.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium font-jakarta">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-muted-foreground capitalize">
                    {profile?.role || 'Staff'}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
          
          {/* Mobile User Info */}
          <div className="lg:hidden mt-2 flex items-center justify-between text-sm">
            <div>
              <p className="font-medium font-jakarta truncate">
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
          <div className="max-w-2xl mx-auto px-4 animate-fade-in">
            <BusinessSetup onBusinessCreated={handleBusinessCreated} />
          </div>
        ) : (
          // Business exists, show dashboard
          <div className="space-y-4 sm:space-y-8 animate-fade-in">
            {/* Welcome Section - Hidden on mobile, shown in header instead */}
            <div className="hidden lg:block">
              <div className="bg-gradient-card p-6 rounded-2xl border border-border/50 shadow-soft">
                <h2 className="text-3xl font-jakarta font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Welcome back, {profile?.first_name || 'User'}!
                </h2>
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm font-medium">
                    {business?.name}
                  </span>
                  • {profile?.role?.charAt(0).toUpperCase()}{profile?.role?.slice(1)}
                </p>
              </div>
            </div>

            {/* Tabbed Interface */}
            <Tabs defaultValue="overview" className="space-y-4">
              {/* Mobile Scrollable Tabs - Fixed horizontal scroll */}
              <div className="lg:hidden -mx-2 px-2">
                <div className="overflow-x-auto scrollbar-hide">
                  <TabsList className="inline-flex h-10 items-center justify-start rounded-xl bg-muted/50 backdrop-blur-sm p-1 text-muted-foreground min-w-max border border-border/50">
                    <TabsTrigger value="overview" className="whitespace-nowrap px-4 py-1.5 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium transition-all duration-200">Overview</TabsTrigger>
                    <TabsTrigger value="clients" className="whitespace-nowrap px-4 py-1.5 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium transition-all duration-200">Clients</TabsTrigger>
                    <TabsTrigger value="forms" className="whitespace-nowrap px-4 py-1.5 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium transition-all duration-200">Forms</TabsTrigger>
                    <TabsTrigger value="submissions" className="whitespace-nowrap px-4 py-1.5 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium transition-all duration-200">Submissions</TabsTrigger>
                    <TabsTrigger value="team" className="whitespace-nowrap px-4 py-1.5 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium transition-all duration-200">Team</TabsTrigger>
                    <TabsTrigger value="reports" className="whitespace-nowrap px-4 py-1.5 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium transition-all duration-200">Reports</TabsTrigger>
                  </TabsList>
                </div>
              </div>
              
              {/* Desktop Tabs */}
              <div className="hidden lg:block">
                <TabsList className="grid w-full grid-cols-6 bg-muted/50 backdrop-blur-sm rounded-xl p-1 border border-border/50">
                  <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium transition-all duration-200">Overview</TabsTrigger>
                  <TabsTrigger value="clients" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium transition-all duration-200">Clients</TabsTrigger>
                  <TabsTrigger value="forms" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium transition-all duration-200">Forms</TabsTrigger>
                  <TabsTrigger value="submissions" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium transition-all duration-200">Submissions</TabsTrigger>
                  <TabsTrigger value="team" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium transition-all duration-200">Team</TabsTrigger>
                  <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium transition-all duration-200">Reports</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-6 animate-slide-up">
                {/* Quick Stats */}
                <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-5">
                  <Card className="card-enhanced group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Clients</CardTitle>
                      <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                        <UserCheck className="h-4 w-4 text-accent" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-jakarta">{teamStats.clientCount}</div>
                      <p className="text-xs text-muted-foreground">
                        {teamStats.clientCount === 0 ? 'No clients yet' : 'active clients'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="card-enhanced group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-jakarta">{teamStats.memberCount}</div>
                      <p className="text-xs text-muted-foreground">
                        {teamStats.memberCount === 1 ? 'Just you so far' : 'active team members'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="card-enhanced group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Active Forms</CardTitle>
                      <div className="p-2 bg-info/10 rounded-lg group-hover:bg-info/20 transition-colors">
                        <FileText className="h-4 w-4 text-info" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-jakarta">{teamStats.formCount}</div>
                      <p className="text-xs text-muted-foreground">
                        {teamStats.formCount === 0 ? 'No active forms yet' : 'forms ready to use'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="card-enhanced group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Submissions</CardTitle>
                      <div className="p-2 bg-success/10 rounded-lg group-hover:bg-success/20 transition-colors">
                        <BarChart3 className="h-4 w-4 text-success" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-jakarta">{teamStats.submissionCount}</div>
                      <p className="text-xs text-muted-foreground">
                        {teamStats.submissionCount === 0 ? 'No submissions yet' : 'total submissions'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="card-enhanced group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
                      <div className="p-2 bg-warning/10 rounded-lg group-hover:bg-warning/20 transition-colors">
                        <BarChart3 className="h-4 w-4 text-warning" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold font-jakarta">{teamStats.pendingReview}</div>
                      <p className="text-xs text-muted-foreground">
                        submissions awaiting review
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card className="card-enhanced">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Latest updates from your healthcare forms platform.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {teamStats.submissionCount > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-accent/5 rounded-lg border border-accent/20">
                            <div className="p-1 bg-accent/20 rounded-full">
                              <FileText className="h-3 w-3 text-accent" />
                            </div>
                            <span className="text-sm">✓ {teamStats.submissionCount} total form submissions</span>
                          </div>
                          {teamStats.pendingReview > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-warning/5 rounded-lg border border-warning/20">
                              <div className="p-1 bg-warning/20 rounded-full animate-pulse-soft">
                                <BarChart3 className="h-3 w-3 text-warning" />
                              </div>
                              <span className="text-sm text-warning">⏳ {teamStats.pendingReview} submissions pending review</span>
                            </div>
                          )}
                          {teamStats.clientCount > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                              <div className="p-1 bg-primary/20 rounded-full">
                                <Users className="h-3 w-3 text-primary" />
                              </div>
                              <span className="text-sm">👥 {teamStats.clientCount} active clients</span>
                            </div>
                          )}
                          {teamStats.formCount > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-info/5 rounded-lg border border-info/20">
                              <div className="p-1 bg-info/20 rounded-full">
                                <FileText className="h-3 w-3 text-info" />
                              </div>
                              <span className="text-sm">📋 {teamStats.formCount} active forms</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="p-4 bg-muted/50 rounded-xl border-2 border-dashed border-border inline-block">
                            <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground font-medium">No activity yet</p>
                            <p className="text-sm text-muted-foreground">Start by creating a form and adding clients!</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="clients" className="space-y-4 animate-slide-up">
                <ClientList businessId={profile.business_id} userRole={profile.role || 'staff'} />
              </TabsContent>

              <TabsContent value="submissions" className="space-y-4 animate-slide-up">
                <SubmissionList businessId={profile.business_id} userRole={profile.role || 'staff'} />
              </TabsContent>

              <TabsContent value="team" className="space-y-4 animate-slide-up">
                <TeamManagement businessId={profile.business_id} userRole={profile.role || 'staff'} />
              </TabsContent>

              <TabsContent value="forms" className="space-y-4 animate-slide-up">
                <FormList businessId={profile.business_id} userRole={profile.role || 'staff'} />
              </TabsContent>

              <TabsContent value="reports" className="space-y-4 animate-slide-up">
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