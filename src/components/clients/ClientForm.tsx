import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  medical_record_number: z.string().min(1, "UCID number is required"),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface Client {
  id: string;
  name: string;
  date_of_birth: string | null;
  contact_info: any;
  medical_record_number: string | null;
  notes: string | null;
}

interface ClientFormProps {
  businessId: string;
  client?: Client;
  onSaved: () => void;
  onCancel: () => void;
}

export default function ClientForm({ businessId, client, onSaved, onCancel }: ClientFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || "",
      date_of_birth: client?.date_of_birth ? 
        new Date(client.date_of_birth).toISOString().split('T')[0] : "",
      medical_record_number: client?.medical_record_number || "",
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const clientData = {
        business_id: businessId,
        name: data.name,
        date_of_birth: data.date_of_birth || null,
        medical_record_number: data.medical_record_number || null,
        contact_info: null,
        notes: null,
        created_by: user.id,
      };

      let error;
      if (client) {
        // Update existing client
        const { error: updateError } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', client.id);
        error = updateError;
      } else {
        // Create new client
        const { error: insertError } = await supabase
          .from('clients')
          .insert(clientData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Client ${client ? 'updated' : 'created'} successfully!`,
      });

      onSaved();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: "Error",
        description: `Failed to ${client ? 'update' : 'create'} client.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Enter client's full name"
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="date_of_birth">Date of Birth *</Label>
          <Input
            id="date_of_birth"
            type="date"
            {...register("date_of_birth")}
          />
          {errors.date_of_birth && (
            <p className="text-sm text-destructive mt-1">{errors.date_of_birth.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="medical_record_number">UCID Number *</Label>
          <Input
            id="medical_record_number"
            {...register("medical_record_number")}
            placeholder="Enter UCID number"
          />
          {errors.medical_record_number && (
            <p className="text-sm text-destructive mt-1">{errors.medical_record_number.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : (client ? "Update Client" : "Add Client")}
        </Button>
      </div>
    </form>
  );
}