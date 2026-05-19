import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, PawPrint, CheckCircle2, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

interface AdoptionListing {
  id: string;
  petName: string;
  species: string;
  breed: string;
  ownerName: string;
  photo?: string;
  status: "pending" | "approved" | "rejected";
  listedAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const AdminAdoptions = () => {
  const [listings, setListings] = useState<AdoptionListing[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadListings = async () => {
      try {
        const response = await api.get("/Admin/adoptions");
        const data = response.data || [];
        const mapped = data.map((l: any) => ({
          id: String(l.id ?? l.Id),
          petName: l.petName ?? l.PetName ?? "Pet",
          species: l.species ?? l.Species ?? "Unknown",
          breed: l.breed ?? l.Breed ?? "",
          ownerName: l.ownerName ?? l.OwnerName ?? "Owner",
          photo: l.photo ?? l.Photo,
          status: (l.status ?? l.Status ?? "pending") as AdoptionListing["status"],
          listedAt: l.listedAt ? new Date(l.listedAt).toLocaleDateString() : "—",
        }));
        setListings(mapped);
      } catch {
        toast.error("Failed to load adoption requests");
      }
    };

    void loadListings();
  }, []);

  const filtered = listings.filter((l) =>
    l.petName.toLowerCase().includes(search.toLowerCase()) || l.ownerName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    try {
      if (action === "approved") {
        await api.post(`/Admin/adoptions/${id}/approve`);
      } else {
        await api.post(`/Admin/adoptions/${id}/reject`);
      }
      setListings(listings.map((l) => (l.id === id ? { ...l, status: action } : l)));
      toast.success(`Listing ${action}`);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update listing";
      toast.error(message);
    }
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Adoption Listings</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by pet or owner…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((listing) => (
          <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex gap-4">
              <div className="h-20 w-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                {listing.photo ? (
                  <img src={listing.photo} alt={listing.petName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><PawPrint className="h-8 w-8 text-muted-foreground/40" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-heading font-bold text-sm">{listing.petName}</span>
                  <Badge variant="outline" className={statusColors[listing.status]}>{listing.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{listing.breed} · {listing.species}</p>
                <p className="text-xs text-muted-foreground">Owner: {listing.ownerName}</p>
                <p className="text-xs text-muted-foreground mt-1">Listed: {listing.listedAt}</p>
                {listing.status === "pending" && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs bg-success/10 text-success border-success/20 hover:bg-success/20" onClick={() => handleAction(listing.id, "approved")}>
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleAction(listing.id, "rejected")}>
                      <XCircle className="mr-1 h-3 w-3" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminAdoptions;
