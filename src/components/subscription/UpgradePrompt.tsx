import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Crown } from "lucide-react";

interface UpgradePromptProps {
  limitType: "clients" | "staff" | "managers";
  currentTier: string;
}

export const UpgradePrompt = ({ limitType, currentTier }: UpgradePromptProps) => {
  const limitLabels = {
    clients: "clients",
    staff: "staff members",
    managers: "managers",
  };

  const tierLimits = {
    free: {
      clients: 5,
      staff: 2,
      managers: 0,
    },
    basic: {
      clients: 25,
      staff: 10,
      managers: 3,
    },
    professional: {
      clients: 100,
      staff: 50,
      managers: 10,
    },
  };

  return (
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
        
        {currentTier === "free" && (
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Available Plans:</p>
            <ul className="space-y-1 ml-4">
              <li>• <span className="font-medium">Basic:</span> Up to 25 clients, 10 staff, 3 managers</li>
              <li>• <span className="font-medium">Professional:</span> Up to 100 clients, 50 staff, 10 managers</li>
              <li>• <span className="font-medium">Enterprise:</span> Unlimited</li>
            </ul>
          </div>
        )}

        <Button className="w-full" variant="default">
          <Crown className="mr-2 h-4 w-4" />
          Upgrade Plan
        </Button>
      </AlertDescription>
    </Alert>
  );
};
