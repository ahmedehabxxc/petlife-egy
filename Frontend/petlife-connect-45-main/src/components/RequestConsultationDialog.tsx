import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useConsultationStore } from "@/stores/consultationStore";
import type { Veterinarian } from "@/types";

interface RequestConsultationDialogProps {
  vet: Veterinarian;
  trigger?: React.ReactNode;
}

// Mock pets for demo
const mockUserPets = [
  { id: "p1", name: "Luna", species: "Cat" },
  { id: "p2", name: "Max", species: "Dog" },
  { id: "p3", name: "Cleo", species: "Cat" },
];

const RequestConsultationDialog = ({ vet, trigger }: RequestConsultationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState("");
  const { user } = useAuthStore();
  const { addRequest } = useConsultationStore();

  const handleSubmit = () => {
    if (!selectedPet) {
      toast.error("Please select a pet");
      return;
    }

    const pet = mockUserPets.find((p) => p.id === selectedPet);
    if (!pet) return;

    addRequest({
      id: `cr-${Date.now()}`,
      petOwnerId: user?.id || "demo-owner",
      petOwnerName: user?.name || "Demo User",
      petOwnerAvatar: user?.avatar,
      vetId: vet.id,
      vetName: vet.name,
      vetAvatar: vet.avatar,
      petId: pet.id,
      petName: pet.name,
      petSpecies: pet.species,
      fee: vet.consultationFee,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    toast.success(`Consultation request sent to ${vet.name}!`);
    setOpen(false);
    setSelectedPet("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <MessageCircle className="mr-2 h-4 w-4" /> Request Consultation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Request Consultation</DialogTitle>
          <DialogDescription>
            Send a consultation request to {vet.name}. The vet will review and accept your request to start chatting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Vet info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0 overflow-hidden">
              {vet.avatar ? (
                <img src={vet.avatar} alt={vet.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-heading font-bold text-sm text-muted-foreground">
                  {vet.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{vet.name}</p>
              <p className="text-xs text-muted-foreground">{vet.specialty}</p>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">
              <DollarSign className="h-3 w-3 mr-0.5" />
              {vet.consultationFee} EGP
            </Badge>
          </div>

          {/* Pet selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select your pet</label>
            <Select value={selectedPet} onValueChange={setSelectedPet}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a pet…" />
              </SelectTrigger>
              <SelectContent>
                {mockUserPets.map((pet) => (
                  <SelectItem key={pet.id} value={pet.id}>
                    {pet.name} ({pet.species})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fee notice */}
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
            <p className="text-xs text-warning font-medium">
              Consultation fee: {vet.consultationFee} EGP
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Payment will be processed once the vet accepts your request.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!selectedPet}>
            Send Request — {vet.consultationFee} EGP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestConsultationDialog;
