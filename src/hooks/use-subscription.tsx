import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionContextType {
  tier: string;
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  createCheckout: (priceId: string) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({} as SubscriptionContextType);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: "$0",
    priceId: null,
    productId: null,
  },
  basic: {
    name: "Basic",
    price: "$29",
    priceId: "price_1SJ4t0JgSEOpes3tO8mqwV2K",
    productId: "prod_TFa3TFVucgXtys",
  },
  premium: {
    name: "Professional",
    price: "$99",
    priceId: "price_1SJ4tEJgSEOpes3t4oj3iV3U",
    productId: "prod_TFa3HGDqNkonEJ",
  },
  enterprise: {
    name: "Enterprise",
    price: "$249",
    priceId: "price_1SJ4tRJgSEOpes3th3gsKUKn",
    productId: "prod_TFa3X2aOVPsQlZ",
  },
} as const;

export const SubscriptionProvider = ({ children }: SubscriptionProviderProps) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [tier, setTier] = useState<string>("free");
  const [subscribed, setSubscribed] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user) {
      setTier("free");
      setSubscribed(false);
      setProductId(null);
      setSubscriptionEnd(null);
      setLoading(false);
      return;
    }

    try {
      console.log("Checking subscription status...");
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      console.log("Subscription data:", data);
      setTier(data.tier || "free");
      setSubscribed(data.subscribed || false);
      setProductId(data.product_id || null);
      setSubscriptionEnd(data.subscription_end || null);
      
      // Update business tier in database
      if (data.tier && data.tier !== "free") {
        await supabase
          .from("users")
          .select("business_id")
          .eq("id", user.id)
          .single()
          .then(async ({ data: userData }) => {
            if (userData?.business_id) {
              await supabase
                .from("businesses")
                .update({ subscription_tier: data.tier })
                .eq("id", userData.business_id);
            }
          });
      }
    } catch (error: any) {
      console.error('Error checking subscription:', error);
      toast({
        title: "Error",
        description: "Failed to check subscription status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async (priceId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to subscribe",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Creating checkout session for price:", priceId);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
        
        // Check subscription after a delay
        setTimeout(() => {
          checkSubscription();
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive",
      });
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Opening customer portal...");
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open customer portal. Make sure you have an active subscription.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    checkSubscription();
    
    // Check subscription periodically
    const interval = setInterval(checkSubscription, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [user, session]);

  const value = {
    tier,
    subscribed,
    productId,
    subscriptionEnd,
    loading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};
