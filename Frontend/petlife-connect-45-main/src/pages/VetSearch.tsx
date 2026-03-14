import { useState, useMemo } from "react";
import VetCard from "@/components/VetCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Stethoscope, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import type { Veterinarian } from "@/types";

const mockVets: Veterinarian[] = [
  {
    id: "v1", userId: "u1", name: "Dr. Ahmed Hassan", avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop",
    specialty: "General Practice", clinicName: "Cairo Pet Care", clinicAddress: "Zamalek, Cairo",
    phone: "+20 100 123 4567", rating: 4.8, reviewCount: 124, isVerified: true, consultationFee: 150, lat: 30.0561, lng: 31.2243,
  },
  {
    id: "v2", userId: "u2", name: "Dr. Sara El-Masry", avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop",
    specialty: "Surgery", clinicName: "Giza Vet Clinic", clinicAddress: "Dokki, Giza",
    phone: "+20 100 234 5678", rating: 4.9, reviewCount: 89, isVerified: true, consultationFee: 200, lat: 30.0384, lng: 31.2120,
  },
  {
    id: "v3", userId: "u3", name: "Dr. Mohamed Ali", avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop",
    specialty: "Dermatology", clinicName: "Pet Skin Center", clinicAddress: "Nasr City, Cairo",
    phone: "+20 100 345 6789", rating: 4.6, reviewCount: 56, isVerified: true, consultationFee: 180, lat: 30.0626, lng: 31.3376,
  },
  {
    id: "v4", userId: "u4", name: "Dr. Layla Nour", avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=200&h=200&fit=crop",
    specialty: "Dentistry", clinicName: "Smile Paws Clinic", clinicAddress: "Heliopolis, Cairo",
    phone: "+20 100 456 7890", rating: 4.7, reviewCount: 42, isVerified: false, consultationFee: 120, lat: 30.0870, lng: 31.3230,
  },
  {
    id: "v5", userId: "u5", name: "Dr. Omar Farouk",
    specialty: "Internal Medicine", clinicName: "PetVet Alex", clinicAddress: "Smouha, Alexandria",
    phone: "+20 100 567 8901", rating: 4.5, reviewCount: 78, isVerified: true, consultationFee: 160, lat: 31.2156, lng: 29.9553,
  },
];

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

  const filtered = useMemo(() => {
    const list = mockVets.filter((vet) => {
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
      {filtered.length === 0 ? (
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
