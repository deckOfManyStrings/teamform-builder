import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut, Users, FileText, Building, UserCheck, BarChart3 } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import BusinessSetup from "@/components/team/BusinessSetup";
import TeamManagement from "@/components/team/TeamManagement";
import ClientList from "@/components/clients/ClientList";
import FormList from "@/components/forms/FormList";
import SubmissionList from "@/components/submissions/SubmissionList";
import AnalyticsDashboard from "@/components/reports/AnalyticsDashboard";
import AuditTrail from "@/components/reports/AuditTrail";
import AccountSettings from "@/components/settings/AccountSettings";
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
  const {
    user,
    signOut
  } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
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
      const {
        data: userData,
        error: userError
      } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      // If no profile exists, create one
      if (!userData) {
        const {
          data: newUser,
          error: createError
        } = await supabase.from('users').insert({
          id: user.id,
          email: user.email || '',
          first_name: user.user_metadata?.first_name || null,
          last_name: user.user_metadata?.last_name || null
        }).select().single();
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
      const {
        data,
        error
      } = await supabase.from('businesses').select('*').eq('id', businessId).single();
      if (error) throw error;
      setBusiness(data);
    } catch (error) {
      console.error('Error fetching business:', error);
    }
  };
  const fetchTeamStats = async (businessId: string) => {
    try {
      // Get member count
      const {
        count: memberCount
      } = await supabase.from('users').select('*', {
        count: 'exact',
        head: true
      }).eq('business_id', businessId).eq('is_active', true);

      // Get client count
      const {
        count: clientCount
      } = await supabase.from('clients').select('*', {
        count: 'exact',
        head: true
      }).eq('business_id', businessId).eq('is_active', true);

      // Get form count
      const {
        count: formCount
      } = await supabase.from('forms').select('*', {
        count: 'exact',
        head: true
      }).eq('business_id', businessId);

      // Get submission count
      const formIds = (await supabase.from('forms').select('id').eq('business_id', businessId)).data?.map(f => f.id) || [];
      const {
        count: submissionCount
      } = await supabase.from('form_submissions').select('form_id', {
        count: 'exact',
        head: true
      }).in('form_id', formIds);

      // Get pending review count
      const {
        count: pendingReview
      } = await supabase.from('form_submissions').select('form_id', {
        count: 'exact',
        head: true
      }).in('form_id', formIds).eq('status', 'submitted');
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
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>;
  }
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {profile?.business_id && <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />}
        
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Navigation Tab Trigger */}
          {profile?.business_id && (
            <div className="md:hidden fixed top-4 left-0 z-50">
              <SidebarTrigger className="bg-sidebar text-sidebar-foreground shadow-lg border border-l-0 rounded-tr-lg rounded-br-lg px-2 py-6 hover:bg-sidebar-accent transition-colors" />
            </div>
          )}
          
          {/* Main Content */}
          <main className="bg-slate-50 min-h-screen flex-1">
            <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
              {!profile?.business_id ?
            // No business setup yet
            <div className="max-w-2xl mx-auto animate-fade-in">
                  <BusinessSetup onBusinessCreated={handleBusinessCreated} />
                </div> :
            // Business exists, show dashboard
            <div className="space-y-3 sm:space-y-4 animate-fade-in">
                  {/* Content based on active tab */}
                  {activeTab === "overview" && <div className="space-y-3 sm:space-y-4 animate-fade-in">
                      {/* Welcome Section */}
                      <div className="bg-white p-4 sm:p-5 md:p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex flex-col gap-3 sm:gap-4">
                          <div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
                              Welcome back, {profile?.first_name || 'User'}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                              <span className="bg-blue-50 text-blue-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                                {business?.name}
                              </span>
                              <span className="text-slate-400 hidden sm:inline">•</span>
                              <span className="text-slate-600 capitalize text-xs sm:text-sm">
                                {profile?.role?.replace('_', ' ') || 'staff member'}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs sm:text-sm text-slate-500">
                            {new Date().toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                          </div>
                        </div>
                      </div>
                      {/* Enterprise KPI Cards */}
                      <div className="grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">Active Clients</CardTitle>
                            <div className="p-1.5 sm:p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                              <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xl sm:text-2xl font-semibold text-slate-900">{teamStats.clientCount}</div>
                            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                              {teamStats.clientCount === 0 ? 'No clients registered' : 'registered clients'}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">Team Size</CardTitle>
                            <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xl sm:text-2xl font-semibold text-slate-900">{teamStats.memberCount}</div>
                            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                              {teamStats.memberCount === 1 ? 'Only you' : 'active members'}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">Active Forms</CardTitle>
                            <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xl sm:text-2xl font-semibold text-slate-900">{teamStats.formCount}</div>
                            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                              {teamStats.formCount === 0 ? 'No forms created' : 'published forms'}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">Total Submissions</CardTitle>
                            <div className="p-1.5 sm:p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xl sm:text-2xl font-semibold text-slate-900">{teamStats.submissionCount}</div>
                            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                              {teamStats.submissionCount === 0 ? 'No submissions' : 'completed forms'}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">Pending Review</CardTitle>
                            <div className={`p-1.5 sm:p-2 rounded-lg transition-colors ${teamStats.pendingReview > 0 ? 'bg-amber-50 group-hover:bg-amber-100' : 'bg-slate-50 group-hover:bg-slate-100'}`}>
                              <BarChart3 className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${teamStats.pendingReview > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xl sm:text-2xl font-semibold text-slate-900">{teamStats.pendingReview}</div>
                            <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                              awaiting review
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* System Overview */}
                      <Card className="bg-white border border-slate-200 shadow-sm">
                        <CardHeader className="border-b border-slate-100">
                          <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
                            <div className="p-1.5 sm:p-2 bg-slate-100 rounded-lg">
                              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
                            </div>
                            System Overview
                          </CardTitle>
                        <CardDescription className="text-slate-500 text-xs sm:text-sm">
                          Current status of your management system
                        </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 sm:pt-6">
                          <div className="space-y-3 sm:space-y-4">
                            {teamStats.submissionCount > 0 ? <div className="space-y-2 sm:space-y-3">
                                <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="p-1.5 sm:p-2 bg-green-100 rounded-full">
                                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-green-700" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-medium text-green-800">
                                      Total form submissions processed
                                    </span>
                                  </div>
                                  <span className="text-base sm:text-lg font-semibold text-green-900">{teamStats.submissionCount}</span>
                                </div>
                                
                                {teamStats.pendingReview > 0 && <div className="flex items-center justify-between p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                      <div className="p-1.5 sm:p-2 bg-amber-100 rounded-full">
                                        <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-amber-700" />
                                      </div>
                                      <span className="text-xs sm:text-sm font-medium text-amber-800">
                                        Submissions requiring review
                                      </span>
                                    </div>
                                    <span className="text-base sm:text-lg font-semibold text-amber-900">{teamStats.pendingReview}</span>
                                  </div>}
                                
                                <div className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="p-1.5 sm:p-2 bg-blue-100 rounded-full">
                                      <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-700" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-medium text-blue-800">
                                      Active client registrations
                                    </span>
                                  </div>
                                  <span className="text-base sm:text-lg font-semibold text-blue-900">{teamStats.clientCount}</span>
                                </div>
                                
                                <div className="flex items-center justify-between p-3 sm:p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="p-1.5 sm:p-2 bg-purple-100 rounded-full">
                                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-purple-700" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-medium text-purple-800">
                                      Published form templates
                                    </span>
                                  </div>
                                  <span className="text-base sm:text-lg font-semibold text-purple-900">{teamStats.formCount}</span>
                                </div>
                              </div> : <div className="text-center py-8 sm:py-12">
                                <div className="p-4 sm:p-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 inline-block">
                                  <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
                                  <p className="text-slate-600 font-medium mb-2 text-sm sm:text-base">Getting Started</p>
                                  <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto px-4">
                                    Begin by creating form templates and registering clients to start collecting client data.
                                  </p>
                                </div>
                              </div>}
                          </div>
                        </CardContent>
                      </Card>
                    </div>}

                  {activeTab === "clients" && <div className="animate-fade-in">
                      <ClientList businessId={profile.business_id} userRole={profile.role || 'staff'} />
                    </div>}

                  {activeTab === "forms" && <div className="animate-fade-in">
                      <FormList businessId={profile.business_id} userRole={profile.role || 'staff'} />
                    </div>}

                  {activeTab === "submissions" && <div className="animate-fade-in">
                      <SubmissionList businessId={profile.business_id} userRole={profile.role || 'staff'} />
                    </div>}

                  {activeTab === "team" && <div className="animate-fade-in">
                      <TeamManagement businessId={profile.business_id} userRole={profile.role || 'staff'} />
                    </div>}

                  {activeTab === "reports" && <div className="space-y-6 animate-fade-in">
                      <AnalyticsDashboard businessId={profile.business_id} userRole={profile.role || 'staff'} />
                      <AuditTrail businessId={profile.business_id} userRole={profile.role || 'staff'} />
                    </div>}

                  {activeTab === "accounts" && <div className="animate-fade-in">
                      <AccountSettings />
                    </div>}
                </div>}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>;
}