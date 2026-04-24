import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PetCard from "@/components/PetCard";
import EmptyState from "@/components/EmptyState";
import { Plus, PawPrint } from "lucide-react";
import type { Pet } from "@/types";
import api from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

const MyPets = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const loadPets = async () => {
      if (!user?.id) {
        setPets([]);
        return;
      }

      const ownerId = user.userId ?? Number(user.id);
      if (!Number.isFinite(ownerId)) {
        setPets([]);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get("/Pets", { params: { ownerId } });
        const rows = Array.isArray(response.data) ? response.data : [];
        const mapped = rows.map((pet: any) => ({
          id: String(pet.id ?? pet.Id ?? ""),
          ownerId: String(pet.ownerId ?? pet.OwnerId ?? ownerId),
          name: pet.name ?? pet.Name ?? "",
          species: (pet.type ?? pet.Type ?? "dog") as Pet["species"],
          breed: pet.breed ?? pet.Breed ?? "",
          age: Math.round(Number(pet.ageMonths ?? pet.AgeMonths ?? 0) / 12),
          gender: (pet.gender ?? pet.Gender ?? "unknown") as Pet["gender"],
          photo: pet.imageUrl ?? pet.ImageUrl ?? undefined,
          description: undefined,
          isAdoption: Boolean(pet.isAvailableForAdoption ?? pet.IsAvailableForAdoption ?? false),
          createdAt: pet.createdAt ?? pet.CreatedAt ?? new Date().toISOString(),
        }));
        setPets(mapped);
      } catch (error: any) {
        const message = error.response?.data?.message || "Failed to load pets";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadPets();
  }, [user?.id]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">My Pets</h1>
        <Link to="/pets/register">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Pet
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading pets…</div>
      ) : pets.length === 0 ? (
        <EmptyState
          title="No pets yet"
          description="Register your first pet to get started."
          icon={<PawPrint className="h-8 w-8 text-muted-foreground" />}
          action={
            <Link to="/pets/register">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Pet
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPets;
