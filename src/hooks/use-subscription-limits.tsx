import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface SubscriptionLimits {
  business_id: string;
  subscription_tier: string;
  current_clients: number;
  current_staff: number;
  current_managers: number;
  current_owners: number;
  max_clients: number;
  max_staff: number;
  max_managers: number;
  max_owners: number;
}

export const useSubscriptionLimits = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscription-limits", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get user's business_id
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (userError || !userData?.business_id) {
        throw userError || new Error("No business found");
      }

      // Call the function to get usage stats
      const { data, error } = await supabase.rpc("get_business_usage_stats", {
        business_uuid: userData.business_id,
      });

      if (error) throw error;
      
      return data?.[0] as SubscriptionLimits | null;
    },
    enabled: !!user,
  });
};

export const useCanAddClient = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["can-add-client", user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data: userData } = await supabase
        .from("users")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!userData?.business_id) return false;

      const { data, error } = await supabase.rpc("can_add_client", {
        business_uuid: userData.business_id,
      });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCanAddUser = (role: "staff" | "manager" | "owner") => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["can-add-user", user?.id, role],
    queryFn: async () => {
      if (!user) return false;

      const { data: userData } = await supabase
        .from("users")
        .select("business_id")
        .eq("id", user.id)
        .single();

      if (!userData?.business_id) return false;

      const { data, error } = await supabase.rpc("can_add_user", {
        business_uuid: userData.business_id,
        user_role: role,
      });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};
