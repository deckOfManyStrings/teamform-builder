import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit, CheckCircle, XCircle, FileText, User, Calendar } from "lucide-react";

interface FormField {
  id: string;
  type: string;
  label: string;
  options?: string[];
}

interface Form {
  id: string;
  title: string;
  description: string | null;
  fields_schema: {
    fields: FormField[];
  };
}

interface Submission {
  id: string;
  form_id: string;
  client_id: string | null;
  status: string;
  submission_data: any;
  submitted_by: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  form?: Form;
  client?: { name: string };
  submitted_by_name?: string;
  reviewed_by_name?: string;
}

interface SubmissionDetailProps {
  submission: Submission;
  canReview: boolean;
  onStatusUpdate: (status: 'approved' | 'rejected', notes?: string) => void;
  onEdit: () => void;
  onClose: () => void;
}

export default function SubmissionDetail({ 
  submission, 
  canReview, 
  onStatusUpdate, 
  onEdit, 
  onClose 
}: SubmissionDetailProps) {
  const [reviewNotes, setReviewNotes] = useState(submission.notes || '');
  const [isReviewing, setIsReviewing] = useState(false);

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
    return new Date(dateString).toLocaleString();
  };

  const renderFieldValue = (field: FormField, value: any) => {
    if (!value && value !== 0) return <span className="text-muted-foreground">Not provided</span>;

    switch (field.type) {
      case 'checkbox':
        if (Array.isArray(value) && value.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((item, index) => (
                <Badge key={index} variant="outline">{item}</Badge>
              ))}
            </div>
          );
        }
        return <span className="text-muted-foreground">None selected</span>;
      
      case 'select':
      case 'radio':
        return <Badge variant="outline">{value}</Badge>;
      
      case 'date':
        return new Date(value).toLocaleDateString();
      
      case 'textarea':
        return (
          <div className="bg-muted/50 rounded-lg p-3 max-w-full break-words">
            <pre className="whitespace-pre-wrap font-sans text-sm">{value}</pre>
          </div>
        );
      
      default:
        return <span className="break-words">{value}</span>;
    }
  };

  const handleStatusUpdate = (status: 'approved' | 'rejected') => {
    onStatusUpdate(status, reviewNotes);
    setIsReviewing(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(submission.status)} border capitalize`}>
              {submission.status}
            </Badge>
            {submission.client && (
              <Badge variant="outline">
                <User className="h-3 w-3 mr-1" />
                {submission.client.name}
              </Badge>
            )}
          </div>
          <h2 className="text-2xl font-bold">{submission.form?.title || 'Unknown Form'}</h2>
          {submission.form?.description && (
            <p className="text-muted-foreground">{submission.form.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {(submission.status === 'draft' || submission.status === 'submitted') && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Submission Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Submission Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Submitted by</p>
              <p className="font-medium">{submission.submitted_by_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(submission.created_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-medium">{formatDate(submission.updated_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Submitted</p>
              <p className="font-medium">{formatDate(submission.submitted_at)}</p>
            </div>
            {submission.reviewed_by_name && (
              <>
                <div>
                  <p className="text-muted-foreground">Reviewed by</p>
                  <p className="font-medium">{submission.reviewed_by_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reviewed</p>
                  <p className="font-medium">{formatDate(submission.reviewed_at)}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Form Data
          </CardTitle>
          <CardDescription>
            The data submitted in this form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {submission.form?.fields_schema?.fields?.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label className="text-sm font-medium">
                  {field.label}
                </Label>
                <div className="pl-3">
                  {renderFieldValue(field, submission.submission_data[field.id])}
                </div>
              </div>
            )) || (
              <p className="text-muted-foreground">No form structure available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Section */}
      {canReview && submission.status === 'submitted' && (
        <Card>
          <CardHeader>
            <CardTitle>Review Submission</CardTitle>
            <CardDescription>
              Add review notes and approve or reject this submission.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes about this submission..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleStatusUpdate('approved')}
                className="bg-green-600 hover:bg-green-700"
                disabled={isReviewing}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleStatusUpdate('rejected')}
                disabled={isReviewing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Notes Display */}
      {submission.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Review Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="whitespace-pre-wrap">{submission.notes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}