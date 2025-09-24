import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date_of_birth: z.date(),
  medical_record_number: z.string().min(1, "UCI number is required"),
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
    control,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || "",
      date_of_birth: client?.date_of_birth ? new Date(client.date_of_birth) : undefined,
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
        date_of_birth: data.date_of_birth ? format(data.date_of_birth, 'yyyy-MM-dd') : null,
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
          <Controller
            name="date_of_birth"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? (
                      format(field.value, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 max-w-[90vw] overflow-auto" 
                  align="center" 
                  side="bottom"
                  sideOffset={4}
                >
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    defaultMonth={field.value || new Date(2000, 0)}
                    captionLayout="dropdown-buttons"
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                    initialFocus
                    className="p-1 pointer-events-auto text-sm"
                    components={{
                      IconLeft: () => null,
                      IconRight: () => null,
                    }}
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.date_of_birth && (
            <p className="text-sm text-destructive mt-1">{errors.date_of_birth.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="medical_record_number">UCI Number *</Label>
          <Input
            id="medical_record_number"
            {...register("medical_record_number")}
            placeholder="Enter UCI number"
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