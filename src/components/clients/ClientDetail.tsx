import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, User, Calendar, FileText } from "lucide-react";

interface Client {
  id: string;
  name: string;
  date_of_birth: string | null;
  medical_record_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ClientDetailProps {
  client: Client;
  onEdit: () => void;
  onClose: () => void;
}

export default function ClientDetail({ client, onEdit, onClose }: ClientDetailProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
        <Button onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>

      <Separator />

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-medium text-lg">Basic Information</h3>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Date of Birth</p>
            <p className="font-medium">{formatDate(client.date_of_birth)}</p>
          </div>
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