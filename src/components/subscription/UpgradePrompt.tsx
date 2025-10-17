import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Crown, Check } from "lucide-react";
import { useSubscription, SUBSCRIPTION_TIERS } from "@/hooks/use-subscription";
import { useState } from "react";

interface UpgradePromptProps {
  limitType: "clients" | "staff" | "managers";
  currentTier: string;
}

export const UpgradePrompt = ({ limitType, currentTier }: UpgradePromptProps) => {
  const { createCheckout } = useSubscription();
  const [open, setOpen] = useState(false);
  
  const limitLabels = {
    clients: "clients",
    staff: "staff members",
    managers: "managers",
  };

  const handleUpgrade = (priceId: string) => {
    createCheckout(priceId);
    setOpen(false);
  };

  const plans = [
    {
      name: "Basic",
      price: "$29",
      priceId: SUBSCRIPTION_TIERS.basic.priceId,
      features: ["25 clients", "10 staff members", "3 managers", "Priority support"],
    },
    {
      name: "Professional",
      price: "$99",
      priceId: SUBSCRIPTION_TIERS.premium.priceId,
      features: ["100 clients", "50 staff members", "10 managers", "Advanced analytics", "API access"],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$249",
      priceId: SUBSCRIPTION_TIERS.enterprise.priceId,
      features: ["Unlimited clients", "Unlimited staff", "Unlimited managers", "Dedicated support", "Custom integrations"],
    },
  ];

  return (
    <>
      <Alert className="border-warning">
        <AlertCircle className="h-4 w-4 text-warning" />
        <AlertTitle className="flex items-center gap-2">
          Upgrade Required
        </AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            You've reached the maximum number of {limitLabels[limitType]} for your{" "}
            <span className="font-semibold capitalize">{currentTier}</span> plan.
          </p>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" variant="default">
                <Crown className="mr-2 h-4 w-4" />
                View Upgrade Options
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Upgrade Your Plan</DialogTitle>
              </DialogHeader>
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                {plans.map((plan) => (
                  <Card key={plan.name} className={plan.popular ? "border-primary" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{plan.name}</CardTitle>
                        {plan.popular && <Badge>Popular</Badge>}
                      </div>
                      <CardDescription>
                        <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full" 
                        onClick={() => handleUpgrade(plan.priceId!)}
                        variant={plan.popular ? "default" : "outline"}
                      >
                        Upgrade to {plan.name}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </AlertDescription>
      </Alert>
    </>
  );
};
