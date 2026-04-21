import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import PetCard from "@/Features/PetOwner/Components/PetCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import type { Pet, PetSpecies } from "@/types";
import api from "@/services/api";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

const BrowsePets = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState<string>("all");
  const [adoptionFilter, setAdoptionFilter] = useState<string>("all");
  const location = useLocation();
  const { user } = useAuthStore();
  const resolvedUserId = user?.userId ?? (Number.isFinite(Number(user?.id)) ? Number(user?.id) : null);

  const adoptionOnly = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("adoption") === "true";
  }, [location.search]);

  useEffect(() => {
    if (adoptionOnly) {
      setAdoptionFilter("adoption");
    } else {
      setAdoptionFilter("all");
    }
  }, [adoptionOnly]);

  useEffect(() => {
    const loadPets = async () => {
      setLoading(true);
      try {
        const response = await api.get("/Pets/browse");
        const rows = Array.isArray(response.data) ? response.data : [];
        const mapped = rows.map((pet: any) => ({
          id: String(pet.id ?? pet.Id ?? ""),
          ownerId: String(pet.ownerId ?? pet.OwnerId ?? ""),
          name: pet.name ?? pet.Name ?? "",
          species: (pet.type ?? pet.Type ?? "dog") as PetSpecies,
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
  }, []);

  const filtered = pets.filter((pet) => {
    const isOwnPet = resolvedUserId ? String(pet.ownerId) === String(resolvedUserId) : false;
    const matchesSearch =
      pet.name.toLowerCase().includes(search.toLowerCase()) ||
      pet.breed.toLowerCase().includes(search.toLowerCase());
    const matchesSpecies = speciesFilter === "all" || pet.species === speciesFilter;
    const matchesAdoption =
      adoptionFilter === "all" ||
      (adoptionFilter === "adoption" && pet.isAdoption) ||
      (adoptionFilter === "not_adoption" && !pet.isAdoption);
    return !isOwnPet && matchesSearch && matchesSpecies && matchesAdoption;
  });

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">{adoptionOnly ? "Adoption" : "Browse Pets"}</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or breed…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Species" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Species</SelectItem>
            <SelectItem value="dog">Dogs</SelectItem>
            <SelectItem value="cat">Cats</SelectItem>
            <SelectItem value="bird">Birds</SelectItem>
            <SelectItem value="rabbit">Rabbits</SelectItem>
            <SelectItem value="fish">Fish</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {!adoptionOnly && (
          <Select value={adoptionFilter} onValueChange={setAdoptionFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="adoption">Up for Adoption</SelectItem>
              <SelectItem value="not_adoption">Not for Adoption</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading pets...¦</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {adoptionOnly ? "No pets available for adoption." : "No pets found matching your filters."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowsePets;
