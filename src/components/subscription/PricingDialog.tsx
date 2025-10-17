import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Building2 } from "lucide-react";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/use-subscription";
import { useState } from "react";

interface PricingDialogProps {
  children: React.ReactNode;
}

const TIERS = [
  {
    id: "free",
    name: SUBSCRIPTION_TIERS.free.name,
    price: SUBSCRIPTION_TIERS.free.price,
    period: "/month",
    description: "Perfect for trying out Trakilfy",
    icon: Zap,
    features: [
      "5 clients",
      "2 staff members",
      "1 admin",
      "Basic form builder",
      "Email support",
    ],
    priceId: SUBSCRIPTION_TIERS.free.priceId,
  },
  {
    id: "basic",
    name: SUBSCRIPTION_TIERS.basic.name,
    price: SUBSCRIPTION_TIERS.basic.price,
    period: "/month",
    description: "For small practices",
    icon: Building2,
    features: [
      "25 clients",
      "10 staff members",
      "3 managers",
      "Advanced form builder",
      "Priority support",
      "Export reports",
    ],
    priceId: SUBSCRIPTION_TIERS.basic.priceId,
  },
  {
    id: "professional",
    name: SUBSCRIPTION_TIERS.professional.name,
    price: SUBSCRIPTION_TIERS.professional.price,
    period: "/month",
    description: "For growing practices",
    icon: Crown,
    popular: true,
    features: [
      "100 clients",
      "50 staff members",
      "10 managers",
      "Everything in Basic",
      "Advanced analytics",
      "API access",
      "Audit trails",
    ],
    priceId: SUBSCRIPTION_TIERS.professional.priceId,
  },
  {
    id: "enterprise",
    name: SUBSCRIPTION_TIERS.enterprise.name,
    price: SUBSCRIPTION_TIERS.enterprise.price,
    period: "/month",
    description: "For large organizations",
    icon: Building2,
    features: [
      "Unlimited clients",
      "Unlimited staff",
      "Unlimited managers",
      "Everything in Professional",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
    ],
    priceId: SUBSCRIPTION_TIERS.enterprise.priceId,
  },
];

export const PricingDialog = ({ children }: PricingDialogProps) => {
  const { tier, createCheckout } = useSubscription();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (priceId: string, tierName: string) => {
    if (!priceId) return;
    
    setLoading(priceId);
    try {
      await createCheckout(priceId);
      // The createCheckout function handles opening the URL and errors internally
      setOpen(false);
    } catch (error) {
      // Error handling is done in the createCheckout function
      console.error('Upgrade error:', error);
    } finally {
      setLoading(null);
    }
  };

  const isCurrentTier = (tierId: string) => {
    return tier === tierId;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl">Choose Your Plan</DialogTitle>
          <DialogDescription>
            Select the plan that best fits your needs. You can change or cancel anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 py-6">
          {TIERS.map((tierOption) => {
            const Icon = tierOption.icon;
            const isCurrent = isCurrentTier(tierOption.id);
            
            return (
              <Card 
                key={tierOption.id}
                className={`relative ${tierOption.popular ? 'border-primary shadow-lg' : ''} ${isCurrent ? 'ring-2 ring-primary' : ''}`}
              >
                {tierOption.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-8 w-8 text-primary" />
                    {isCurrent && (
                      <Badge variant="secondary">Current Plan</Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{tierOption.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{tierOption.price}</span>
                    <span className="text-muted-foreground">{tierOption.period}</span>
                  </div>
                  <CardDescription className="mt-2">{tierOption.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {tierOption.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {isCurrent ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : tierOption.id === "free" ? (
                    <Button className="w-full" variant="outline" disabled>
                      Free Forever
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(tierOption.priceId!, tierOption.name)}
                      disabled={loading === tierOption.priceId}
                    >
                      {loading === tierOption.priceId ? "Processing..." : "Upgrade Now"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground border-t pt-4">
          <p>All plans include 14-day money-back guarantee • Cancel anytime</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
