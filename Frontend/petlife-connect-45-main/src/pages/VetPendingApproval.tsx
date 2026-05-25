import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface VetPendingApprovalProps {
  email?: string;
  name?: string;
  /** When shown on /login after a failed vet sign-in, reset parent state instead of navigating to the same route */
  onBackToLogin?: () => void;
}

const VetPendingApproval = ({ email, name, onBackToLogin }: VetPendingApprovalProps) => {
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    if (onBackToLogin) {
      onBackToLogin();
    } else {
      navigate("/login", { replace: true });
    }
  };

  return (
  <div className="min-h-[70vh] flex items-center justify-center p-6">
    <Card className="w-full max-w-md border-0 shadow-xl">
      <CardContent className="p-8 text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center">
          <Clock className="h-8 w-8 text-warning" />
        </div>
        <h2 className="font-heading text-xl font-bold">Account Pending Approval</h2>
        <p className="text-sm text-muted-foreground">
          {name ? (
            <>
              Hello <span className="font-medium text-foreground">{name}</span>, your veterinarian account is
            </>
          ) : (
            "Your veterinarian account is"
          )}{" "}
          waiting for admin verification.
        </p>
        {email && (
          <p className="text-xs text-muted-foreground">
            Registered as <span className="font-medium">{email}</span>
          </p>
        )}
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-left space-y-2">
          <p className="text-sm font-medium text-warning">What happens next?</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Our admin team is reviewing your credentials</li>
            <li>You will be able to sign in once approved</li>
            <li>After approval, complete your profile (photo, fee, hours, phone)</li>
          </ul>
        </div>
        <Button variant="outline" className="w-full" type="button" onClick={handleBackToLogin}>
          Back to Login
        </Button>
      </CardContent>
    </Card>
  </div>
  );
};

export default VetPendingApproval;
