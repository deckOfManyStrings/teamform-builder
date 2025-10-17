import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCanAddClient } from "@/hooks/use-subscription-limits";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  birth_day: z.string().min(1, "Day is required"),
  birth_month: z.string().min(1, "Month is required"),
  birth_year: z.string().min(1, "Year is required"),
  medical_record_number: z.string().min(1, "UCI number is required"),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface Client {
  id: string;
  name: string;
  date_of_birth: string | null;
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
  const { data: canAddClient, isLoading: checkingLimit } = useCanAddClient();
  const [currentTier, setCurrentTier] = useState("free");

  useEffect(() => {
    const fetchTier = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("users")
        .select("business:businesses(subscription_tier)")
        .eq("id", user.id)
        .single();
      
      if (data?.business) {
        setCurrentTier((data.business as any).subscription_tier);
      }
    };
    fetchTier();
  }, [user]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || "",
      birth_day: client?.date_of_birth ? new Date(client.date_of_birth).getDate().toString() : "",
      birth_month: client?.date_of_birth ? (new Date(client.date_of_birth).getMonth() + 1).toString() : "",
      birth_year: client?.date_of_birth ? new Date(client.date_of_birth).getFullYear().toString() : "",
      medical_record_number: client?.medical_record_number || "",
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    if (!user) return;
    
    // Check limit for new clients - explicitly check for false (not undefined during loading)
    if (!client && canAddClient === false) {
      toast({
        title: "Limit Reached",
        description: "You've reached your plan's client limit. Please upgrade to add more clients.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      // Construct date from separate fields
      const dateOfBirth = `${data.birth_year}-${data.birth_month.padStart(2, '0')}-${data.birth_day.padStart(2, '0')}`;
      
      const clientData = {
        business_id: businessId,
        name: data.name,
        date_of_birth: dateOfBirth,
        medical_record_number: data.medical_record_number || null,
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

  // Show upgrade prompt if adding new client and limit reached
  if (!client && canAddClient === false && !checkingLimit) {
    return <UpgradePrompt limitType="clients" currentTier={currentTier} />;
  }

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

        <div className="col-span-2">
          <Label>Date of Birth *</Label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Controller
                name="birth_month"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-lg z-50">
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = i + 1;
                        const monthName = new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'long' });
                        return (
                          <SelectItem key={month} value={month.toString()}>
                            {monthName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Controller
                name="birth_day"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-lg z-50">
                      {Array.from({ length: 31 }, (_, i) => {
                        const day = i + 1;
                        return (
                          <SelectItem key={day} value={day.toString()}>
                            {day}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Controller
                name="birth_year"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-lg z-50 max-h-60">
                      {Array.from({ length: 100 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          {(errors.birth_day || errors.birth_month || errors.birth_year) && (
            <p className="text-sm text-destructive mt-1">Please select a complete date of birth</p>
          )}
        </div>

        <div className="col-span-2">
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
        <Button type="submit" disabled={loading || checkingLimit}>
          {loading ? "Saving..." : (client ? "Update Client" : "Add Client")}
        </Button>
      </div>
    </form>
  );
}