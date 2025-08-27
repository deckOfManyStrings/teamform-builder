import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, User, Calendar, Phone, Mail, MapPin, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV, flattenFormSubmissionData } from "@/lib/exportUtils";

interface Client {
  id: string;
  name: string;
  date_of_birth: string | null;
  contact_info: any;
  medical_record_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ClientDetailProps {
  client: Client;
  onEdit: () => void;
  onClose: () => void;
  businessId: string;
}

export default function ClientDetail({ client, onEdit, onClose, businessId }: ClientDetailProps) {
  const { toast } = useToast();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const exportClientSubmissions = async () => {
    try {
      // Get all submissions for this specific client
      const { data: submissions, error: submissionsError } = await supabase
        .from('form_submissions')
        .select(`
          *,
          forms!inner(title, description),
          users!form_submissions_submitted_by_fkey(first_name, last_name, email)
        `)
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      if (!submissions || submissions.length === 0) {
        toast({
          title: "No Data",
          description: `No form submissions found for ${client.name}.`,
          variant: "destructive",
        });
        return;
      }

      // Flatten and format the data for export
      const exportData = submissions.map((submission: any) => {
        const flattened = flattenFormSubmissionData(submission);
        
        // Add client and form data
        flattened.client_name = client.name;
        flattened.client_medical_record = client.medical_record_number || '';
        flattened.client_date_of_birth = client.date_of_birth || '';
        
        // Add contact info if available
        if (client.contact_info) {
          flattened.client_email = client.contact_info.email || '';
          flattened.client_phone = client.contact_info.phone || '';
          flattened.client_address = client.contact_info.address || '';
        }
        
        flattened.form_title = submission.forms?.title || 'Unknown Form';
        flattened.form_description = submission.forms?.description || '';
        flattened.submitted_by_name = submission.users 
          ? `${submission.users.first_name || ''} ${submission.users.last_name || ''}`.trim()
          : 'Unknown User';
        flattened.submitted_by_email = submission.users?.email || '';

        // Remove nested objects
        delete flattened.forms;
        delete flattened.users;

        return flattened;
      });

      const filename = `patient_${client.name.replace(/[^a-z0-9]/gi, '_')}_forms_${new Date().toISOString().split('T')[0]}`;
      exportToCSV(exportData, filename);

      toast({
        title: "Export Successful",
        description: `Exported ${exportData.length} form submissions for ${client.name}.`,
      });

    } catch (error) {
      console.error('Error exporting client submissions:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export patient forms. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{client.name}</h2>
            {client.medical_record_number && (
              <Badge variant="outline" className="mt-1">
                MRN: {client.medical_record_number}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            onClick={exportClientSubmissions}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export Forms
          </Button>
        </div>
      </div>

      <Separator />

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Basic Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-medium">{formatDate(client.date_of_birth)}</p>
            </div>
          </div>

          {client.contact_info?.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{client.contact_info.email}</p>
              </div>
            </div>
          )}

          {client.contact_info?.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{client.contact_info.phone}</p>
              </div>
            </div>
          )}

          {client.contact_info?.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{client.contact_info.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {client.notes && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Notes</h3>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="whitespace-pre-wrap">{client.notes}</p>
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Metadata */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm text-muted-foreground">Record Information</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Created: {formatDateTime(client.created_at)}</p>
          <p>Last Updated: {formatDateTime(client.updated_at)}</p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}