import { useEffect, useMemo, useState } from "react";
import VetCard from "@/Features/PetOwner/Components/VetCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Stethoscope, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import type { Veterinarian } from "@/types";
import api from "@/services/api";
import { toast } from "sonner";

const specialties = ["All", "General Practice", "Surgery", "Dermatology", "Dentistry", "Internal Medicine"];

type SortOption = "rating" | "price_low" | "price_high" | "reviews";

const sortLabels: Record<SortOption, string> = {
  rating: "Highest Rated",
  price_low: "Price: Low → High",
  price_high: "Price: High → Low",
  reviews: "Most Reviews",
};

const VetSearch = () => {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All");
  const [sort, setSort] = useState<SortOption>("rating");
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadVets = async () => {
      setLoading(true);
      try {
        const response = await api.get("/Veterinarians");
        const rows = Array.isArray(response.data) ? response.data : [];
        const mapped = rows.map((v: any) => ({
          id: String(v.id ?? v.Id ?? ""),
          userId: String(v.userId ?? v.UserId ?? ""),
          name: v.name ?? v.Name ?? "Veterinarian",
          avatar: v.avatar ?? v.Avatar ?? undefined,
          specialty: v.specialty ?? v.Specialty ?? "General Practice",
          clinicName: v.clinicName ?? v.ClinicName ?? "Clinic",
          clinicAddress: v.clinicAddress ?? v.ClinicAddress ?? "",
          phone: v.phone ?? v.Phone ?? "",
          rating: Number(v.rating ?? v.Rating ?? 0),
          reviewCount: Number(v.reviewCount ?? v.ReviewCount ?? 0),
          isVerified: Boolean(v.isVerified ?? v.IsVerified ?? false),
          consultationFee: Number(v.consultationFee ?? v.ConsultationFee ?? 150),
          lat: v.lat ?? v.Lat ?? undefined,
          lng: v.lng ?? v.Lng ?? undefined,
        }));
        setVets(mapped);
      } catch (error: any) {
        const message = error.response?.data?.message || "Failed to load veterinarians";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadVets();
  }, []);

  const filtered = useMemo(() => {
    const list = vets.filter((vet) => {
      const matchesSearch = vet.name.toLowerCase().includes(search.toLowerCase()) ||
        vet.clinicName.toLowerCase().includes(search.toLowerCase());
      const matchesSpecialty = specialty === "All" || vet.specialty === specialty;
      return matchesSearch && matchesSpecialty;
    });

    return [...list].sort((a, b) => {
      switch (sort) {
        case "rating": return b.rating - a.rating;
        case "price_low": return a.consultationFee - b.consultationFee;
        case "price_high": return b.consultationFee - a.consultationFee;
        case "reviews": return b.reviewCount - a.reviewCount;
        default: return 0;
      }
    });
  }, [search, specialty, sort]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">Find a Veterinarian</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} veterinarian{filtered.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded-xl border bg-card p-3 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or clinic…"
              className="pl-9 border-0 bg-muted/50 focus-visible:ring-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger className="w-full sm:w-[200px] border-0 bg-muted/50">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {specialties.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-[200px] border-0 bg-muted/50">
              <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(sortLabels) as [SortOption, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active filter chips */}
        {(specialty !== "All" || search) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Filters:</span>
            {specialty !== "All" && (
              <Badge
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => setSpecialty("All")}
              >
                {specialty} ✕
              </Badge>
            )}
            {search && (
              <Badge
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => setSearch("")}
              >
                "{search}" ✕
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading veterinariansâ€¦</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
            <Stethoscope className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">No veterinarians found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your search or filters</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearch(""); setSpecialty("All"); }}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((vet) => (
            <VetCard key={vet.id} vet={vet} />
          ))}
        </div>
      )}
    </div>
  );
};

export default VetSearch;
