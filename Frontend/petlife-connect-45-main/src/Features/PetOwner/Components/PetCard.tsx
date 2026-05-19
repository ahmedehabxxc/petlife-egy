import type { Pet } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PawPrint } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PetCardProps {
  pet: Pet;
}

const PetCard = ({ pet }: PetCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
      onClick={() => navigate(`/pets/${pet.id}`)}
    >
      <div className="aspect-square bg-muted relative overflow-hidden">
        {pet.photo ? (
          <img
            src={pet.photo}
            alt={pet.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PawPrint className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
        {pet.isAdoption && (
          <Badge className="absolute top-2 right-2 bg-secondary text-secondary-foreground">
            Adoption
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-heading font-bold text-base">{pet.name}</h3>
        <p className="text-sm text-muted-foreground capitalize">
          {pet.breed} · {pet.species}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {pet.age} {pet.age === 1 ? "year" : "years"} old · {pet.gender}
        </p>
      </CardContent>
    </Card>
  );
};

export default PetCard;
