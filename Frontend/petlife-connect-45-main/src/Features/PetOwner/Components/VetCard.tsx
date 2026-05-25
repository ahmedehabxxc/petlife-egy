import type { Veterinarian } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, ShieldCheck, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RequestConsultationDialog from "@/Features/PetOwner/Components/RequestConsultationDialog";

interface VetCardProps {
  vet: Veterinarian;
}

const VetCard = ({ vet }: VetCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/30">
      <CardContent className="p-0">
        {/* Top section — clickable profile area */}
        <div
          className="p-5 pb-4 cursor-pointer"
          onClick={() => navigate(`/vets/${vet.id}`)}
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="h-[72px] w-[72px] rounded-2xl bg-muted overflow-hidden ring-2 ring-border/50 group-hover:ring-primary/30 transition-all">
                {vet.avatar ? (
                  <img src={vet.avatar} alt={vet.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <span className="font-heading font-bold text-2xl text-primary/60">
                      {vet.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              {vet.isVerified && (
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-secondary flex items-center justify-center ring-2 ring-card">
                  <ShieldCheck className="h-3.5 w-3.5 text-secondary-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-bold text-[15px] leading-tight truncate group-hover:text-primary transition-colors">
                {vet.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">{vet.specialty}</p>

              <div className="flex items-center gap-3 mt-2.5">
                <span className="inline-flex items-center gap-1 text-xs font-medium">
                  <Star className="h-3.5 w-3.5 text-accent fill-accent" />
                  <span className="text-foreground">{vet.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({vet.reviewCount})</span>
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{vet.clinicName}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="px-5 pb-4 pt-0 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-primary">{vet.consultationFee}</span>
            <span className="text-xs text-muted-foreground font-medium">EGP</span>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <RequestConsultationDialog
              vet={vet}
              trigger={
                <Button size="sm" className="rounded-full gap-1.5 px-4 text-xs font-semibold shadow-sm">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Request Consultation
                </Button>
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VetCard;
