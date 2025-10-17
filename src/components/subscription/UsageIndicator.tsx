import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Building2, Shield, Crown, Settings, Sparkles } from "lucide-react";
import { SubscriptionLimits } from "@/hooks/use-subscription-limits";
import { useSubscription } from "@/hooks/use-subscription";
import { PricingDialog } from "./PricingDialog";

interface UsageIndicatorProps {
  limits: SubscriptionLimits;
}

export const UsageIndicator = ({ limits }: UsageIndicatorProps) => {
  const { openCustomerPortal, subscribed } = useSubscription();
  
  const getPercentage = (current: number, max: number) => {
    return (current / max) * 100;
  };

  const items = [
    {
      icon: Building2,
      label: "Clients",
      current: limits.current_clients,
      max: limits.max_clients,
    },
    {
      icon: Users,
      label: "Staff",
      current: limits.current_staff,
      max: limits.max_staff,
    },
    {
      icon: Shield,
      label: "Managers",
      current: limits.current_managers,
      max: limits.max_managers,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subscription Usage</CardTitle>
            <CardDescription>Current plan limits and usage</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {limits.subscription_tier}
            </Badge>
            {subscribed ? (
              <Button variant="outline" size="sm" onClick={openCustomerPortal}>
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            ) : (
              <PricingDialog>
                <Button variant="default" size="sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upgrade
                </Button>
              </PricingDialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.map((item) => {
          const percentage = getPercentage(item.current, item.max);
          const Icon = item.icon;
          
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <span className="text-muted-foreground">
                  {item.current} / {item.max}
                </span>
              </div>
              <Progress 
                value={percentage} 
                className={percentage >= 100 ? "bg-destructive/20" : percentage >= 80 ? "bg-warning/20" : ""}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
