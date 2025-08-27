import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Form {
  id: string;
  title: string;
  status: string;
}

interface Client {
  id: string;
  name: string;
}

interface NewSubmissionDialogProps {
  businessId: string;
  onSubmissionCreated: () => void;
  onCancel: () => void;
}

export default function NewSubmissionDialog({ businessId, onSubmissionCreated, onCancel }: NewSubmissionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedForm, setSelectedForm] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([fetchForms(), fetchClients()]);
  }, [businessId]);

  const fetchForms = async () => {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('id, title, status')
        .eq('business_id', businessId)
        .eq('status', 'active')
        .order('title', { ascending: true });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const createSubmission = async () => {
    if (!user || !selectedForm) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('form_submissions')
        .insert({
          form_id: selectedForm,
          client_id: selectedClient || null,
          submitted_by: user.id,
          status: 'draft',
          submission_data: {},
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Submission created! You can now fill out the form.",
      });

      onSubmissionCreated();
      
      // Could navigate to edit submission in future
      // navigate(`/submissions/${data.id}/edit`);
    } catch (error) {
      console.error('Error creating submission:', error);
      toast({
        title: "Error",
        description: "Failed to create submission.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="form">Select Form *</Label>
        <Select value={selectedForm} onValueChange={setSelectedForm}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a form to fill out" />
          </SelectTrigger>
          <SelectContent>
            {forms.map((form) => (
              <SelectItem key={form.id} value={form.id}>
                {form.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {forms.length === 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            No active forms available. Create a form first.
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="client">Select Client (Optional)</Label>
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a client (optional)" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={createSubmission} 
          disabled={loading || !selectedForm}
        >
          {loading ? "Creating..." : "Create & Fill Form"}
        </Button>
      </div>
    </div>
  );
}