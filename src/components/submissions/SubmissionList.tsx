import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Search, Eye, Edit, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SubmissionForm from "./SubmissionForm";
import SubmissionDetail from "./SubmissionDetail";
import NewSubmissionDialog from "./NewSubmissionDialog";

interface Submission {
  id: string;
  form_id: string;
  client_id: string | null;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';
  submission_data: any;
  submitted_by: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Form {
  id: string;
  title: string;
  status: string;
  description?: string | null;
}

interface Client {
  id: string;
  name: string;
}

interface SubmissionWithDetails extends Submission {
  form?: Form;
  client?: Client;
  submitted_by_name?: string;
  reviewed_by_name?: string;
}

interface SubmissionListProps {
  businessId: string;
  userRole: string;
}

export default function SubmissionList({ businessId, userRole }: SubmissionListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [newSubmissionOpen, setNewSubmissionOpen] = useState(false);
  const [editSubmission, setEditSubmission] = useState<SubmissionWithDetails | null>(null);
  const [viewSubmission, setViewSubmission] = useState<SubmissionWithDetails | null>(null);

  const canReviewSubmissions = userRole === 'owner' || userRole === 'manager';

  useEffect(() => {
    fetchSubmissions();
  }, [businessId]);

  useEffect(() => {
    // Filter submissions based on search term and status
    let filtered = submissions;
    
    if (searchTerm) {
      filtered = filtered.filter(submission =>
        submission.form?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.submitted_by_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(submission => submission.status === statusFilter);
    }
    
    setFilteredSubmissions(filtered);
  }, [submissions, searchTerm, statusFilter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      // Get all forms for this business first
      const { data: forms, error: formsError } = await supabase
        .from('forms')
        .select('id, title, status')
        .eq('business_id', businessId);

      if (formsError) throw formsError;

      if (!forms || forms.length === 0) {
        setSubmissions([]);
        setLoading(false);
        return;
      }

      const formIds = forms.map(f => f.id);

      // Get submissions for these forms
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('form_submissions')
        .select('*')
        .in('form_id', formIds)
        .order('updated_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Get clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('business_id', businessId);

      if (clientsError) throw clientsError;

      // Get users for submitted_by and reviewed_by names
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('business_id', businessId);

      if (usersError) throw usersError;

      // Combine the data
      const submissionsWithDetails: SubmissionWithDetails[] = (submissionsData || []).map(submission => {
        const form = forms.find(f => f.id === submission.form_id);
        const client = clients?.find(c => c.id === submission.client_id);
        const submittedByUser = users?.find(u => u.id === submission.submitted_by);
        const reviewedByUser = users?.find(u => u.id === submission.reviewed_by);

        return {
          ...submission,
          form,
          client,
          submitted_by_name: submittedByUser 
            ? `${submittedByUser.first_name} ${submittedByUser.last_name}`.trim()
            : 'Unknown User',
          reviewed_by_name: reviewedByUser 
            ? `${reviewedByUser.first_name} ${reviewedByUser.last_name}`.trim()
            : undefined,
        };
      });

      setSubmissions(submissionsWithDetails);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load submissions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionSaved = () => {
    fetchSubmissions();
    setNewSubmissionOpen(false);
    setEditSubmission(null);
  };

  const updateSubmissionStatus = async (submissionId: string, status: 'approved' | 'rejected', notes?: string) => {
    if (!canReviewSubmissions) return;

    try {
      const { error } = await supabase
        .from('form_submissions')
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Submission ${status} successfully!`,
      });

      fetchSubmissions();
    } catch (error) {
      console.error('Error updating submission status:', error);
      toast({
        title: "Error",
        description: "Failed to update submission status.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'submitted':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'reviewed':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Form Submissions ({submissions.length})
            </CardTitle>
            <CardDescription>
              Manage form submissions and review submitted data.
            </CardDescription>
          </div>
          <Dialog open={newSubmissionOpen} onOpenChange={setNewSubmissionOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Submission
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Submission</DialogTitle>
                <DialogDescription>
                  Select a form and client to create a new submission.
                </DialogDescription>
              </DialogHeader>
              <NewSubmissionDialog
                businessId={businessId}
                onSubmissionCreated={handleSubmissionSaved}
                onCancel={() => setNewSubmissionOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by form, client, or submitter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submission List */}
          <div className="space-y-3">
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || statusFilter !== "all" 
                  ? 'No submissions found matching your filters.' 
                  : 'No submissions created yet.'
                }
              </div>
            ) : (
              filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{submission.form?.title || 'Unknown Form'}</h3>
                      <Badge className={`${getStatusColor(submission.status)} border capitalize`}>
                        {submission.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Client: {submission.client?.name || 'No client assigned'}</p>
                      <p>Submitted by: {submission.submitted_by_name}</p>
                      <p>Last updated: {formatDate(submission.updated_at)}</p>
                      {submission.reviewed_by_name && (
                        <p>Reviewed by: {submission.reviewed_by_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewSubmission(submission)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    {(submission.status === 'draft' || submission.submitted_by === user?.id) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditSubmission(submission)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    {canReviewSubmissions && submission.status === 'submitted' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateSubmissionStatus(submission.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateSubmissionStatus(submission.id, 'rejected')}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Submission Dialog */}
      {editSubmission && (
        <Dialog open={!!editSubmission} onOpenChange={() => setEditSubmission(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Submission</DialogTitle>
              <DialogDescription>
                Update the submission data.
              </DialogDescription>
            </DialogHeader>
            <SubmissionForm
              submission={editSubmission as any}
              onSaved={handleSubmissionSaved}
              onCancel={() => setEditSubmission(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* View Submission Dialog */}
      {viewSubmission && (
        <Dialog open={!!viewSubmission} onOpenChange={() => setViewSubmission(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submission Details</DialogTitle>
            </DialogHeader>
            <SubmissionDetail
              submission={viewSubmission as any}
              canReview={canReviewSubmissions}
              onStatusUpdate={(status, notes) => updateSubmissionStatus(viewSubmission.id, status, notes)}
              onEdit={() => {
                setEditSubmission(viewSubmission);
                setViewSubmission(null);
              }}
              onClose={() => setViewSubmission(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}