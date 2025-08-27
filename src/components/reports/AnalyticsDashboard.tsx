import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, TrendingUp, Users, FileText, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

interface AnalyticsData {
  totalSubmissions: number;
  pendingReview: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  draftSubmissions: number;
  totalForms: number;
  activeForms: number;
  totalClients: number;
  submissionsByForm: Array<{
    form_title: string;
    count: number;
  }>;
  submissionsByStatus: Array<{
    status: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    form_title: string;
    client_name: string | null;
    user_name: string;
    created_at: string;
  }>;
}

interface AnalyticsDashboardProps {
  businessId: string;
  userRole: string;
}

export default function AnalyticsDashboard({ businessId, userRole }: AnalyticsDashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    fetchAnalytics();
  }, [businessId, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      // Get all forms for this business
      const { data: forms, error: formsError } = await supabase
        .from('forms')
        .select('id, title, status')
        .eq('business_id', businessId);

      if (formsError) throw formsError;

      if (!forms || forms.length === 0) {
        setAnalytics({
          totalSubmissions: 0,
          pendingReview: 0,
          approvedSubmissions: 0,
          rejectedSubmissions: 0,
          draftSubmissions: 0,
          totalForms: 0,
          activeForms: 0,
          totalClients: 0,
          submissionsByForm: [],
          submissionsByStatus: [],
          recentActivity: [],
        });
        setLoading(false);
        return;
      }

      const formIds = forms.map(f => f.id);

      // Get submissions data
      const { data: submissions, error: submissionsError } = await supabase
        .from('form_submissions')
        .select('*')
        .in('form_id', formIds)
        .gte('created_at', startDate.toISOString());

      if (submissionsError) throw submissionsError;

      // Get clients count
      const { count: clientsCount, error: clientsError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('is_active', true);

      if (clientsError) throw clientsError;

      // Get users for recent activity
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('business_id', businessId);

      if (usersError) throw usersError;

      // Get clients for recent activity
      const { data: clients, error: clientsDetailError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('business_id', businessId);

      if (clientsDetailError) throw clientsDetailError;

      // Process analytics data
      const submissionsData = submissions || [];
      
      const totalSubmissions = submissionsData.length;
      const pendingReview = submissionsData.filter(s => s.status === 'submitted').length;
      const approvedSubmissions = submissionsData.filter(s => s.status === 'approved').length;
      const rejectedSubmissions = submissionsData.filter(s => s.status === 'rejected').length;
      const draftSubmissions = submissionsData.filter(s => s.status === 'draft').length;

      // Submissions by form
      const submissionsByForm = forms.map(form => ({
        form_title: form.title,
        count: submissionsData.filter(s => s.form_id === form.id).length
      })).filter(item => item.count > 0);

      // Submissions by status
      const statusCounts = submissionsData.reduce((acc, submission) => {
        acc[submission.status] = (acc[submission.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const submissionsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count
      }));

      // Recent activity (last 10 submissions)
      const recentActivity = submissionsData
        .slice(0, 10)
        .map(submission => {
          const form = forms.find(f => f.id === submission.form_id);
          const client = clients?.find(c => c.id === submission.client_id);
          const user = users?.find(u => u.id === submission.submitted_by);
          
          return {
            id: submission.id,
            action: `Form ${submission.status}`,
            form_title: form?.title || 'Unknown Form',
            client_name: client?.name || null,
            user_name: user ? `${user.first_name} ${user.last_name}`.trim() : 'Unknown User',
            created_at: submission.updated_at
          };
        });

      setAnalytics({
        totalSubmissions,
        pendingReview,
        approvedSubmissions,
        rejectedSubmissions,
        draftSubmissions,
        totalForms: forms.length,
        activeForms: forms.filter(f => f.status === 'active').length,
        totalClients: clientsCount || 0,
        submissionsByForm,
        submissionsByStatus,
        recentActivity,
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'draft':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No analytics data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            View key metrics and insights for your healthcare forms platform.
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pendingReview}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.approvedSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Approved submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Forms</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeForms}</div>
            <p className="text-xs text-muted-foreground">
              Out of {analytics.totalForms} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Submissions by Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submissions by Form</CardTitle>
            <CardDescription>
              Number of submissions per form (last {timeRange} days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.submissionsByForm.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No submissions found</p>
              ) : (
                analytics.submissionsByForm.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{item.form_title}</span>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submissions by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Submissions by Status</CardTitle>
            <CardDescription>
              Distribution of submission statuses (last {timeRange} days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.submissionsByStatus.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No submissions found</p>
              ) : (
                analytics.submissionsByStatus.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="text-sm font-medium">{item.status}</span>
                    </div>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest submission activities in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              analytics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(activity.action)}
                    <div>
                      <p className="text-sm font-medium">
                        {activity.action} - {activity.form_title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.client_name && `Client: ${activity.client_name} • `}
                        By: {activity.user_name}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(activity.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}