import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PawPrint, Calendar, Stethoscope } from "lucide-react";
import type { MedicalRecord, Pet, PetSpecies } from "@/types";
import api from "@/services/api";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

const PetProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [pet, setPet] = useState<Pet | null>(null);
  const [records] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState<PetSpecies>("dog");
  const [breed, setBreed] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [gender, setGender] = useState<Pet["gender"]>("unknown");
  const [imageUrl, setImageUrl] = useState("");
  const [adoption, setAdoption] = useState(false);
  const [match, setMatch] = useState(false);
  const resolvedUserId = user?.userId ?? (Number.isFinite(Number(user?.id)) ? Number(user?.id) : null);
  const isOwner = pet && resolvedUserId ? String(pet.ownerId) === String(resolvedUserId) : false;

  useEffect(() => {
    const loadPet = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await api.get(`/Pets/${id}`);
        const data = response.data || {};
        const mapped: Pet = {
          id: String(data.id ?? data.Id ?? id),
          ownerId: String(data.ownerId ?? data.OwnerId ?? ""),
          name: data.name ?? data.Name ?? "",
          species: (data.type ?? data.Type ?? "dog") as PetSpecies,
          breed: data.breed ?? data.Breed ?? "",
          age: Math.round(Number(data.ageMonths ?? data.AgeMonths ?? 0) / 12),
          gender: (data.gender ?? data.Gender ?? "unknown") as Pet["gender"],
          photo: data.imageUrl ?? data.ImageUrl ?? undefined,
          description: undefined,
          isAdoption: Boolean(data.isAvailableForAdoption ?? data.IsAvailableForAdoption ?? false),
          createdAt: data.createdAt ?? data.CreatedAt ?? new Date().toISOString(),
        };

        setPet(mapped);
        setName(mapped.name);
        setSpecies(mapped.species);
        setBreed(mapped.breed);
        setAgeMonths(String(Number(data.ageMonths ?? data.AgeMonths ?? 0)));
        setGender(mapped.gender);
        setImageUrl(mapped.photo || "");
        setAdoption(mapped.isAdoption);
        setMatch(Boolean(data.isLookingForMatch ?? data.IsLookingForMatch ?? false));
      } catch (error: any) {
        const message = error.response?.data?.message || "Failed to load pet";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadPet();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    if (!isOwner) {
      toast.error("You cannot edit this pet.");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/Pets/${id}`, {
        name,
        type: species,
        breed,
        ageMonths: ageMonths ? Number(ageMonths) : null,
        gender,
        imageUrl: imageUrl || null,
        isAvailableForAdoption: adoption,
        isLookingForMatch: match,
      });
      toast.success("Pet updated!");
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to update pet";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!isOwner) {
      toast.error("You cannot delete this pet.");
      return;
    }
    if (!window.confirm("Delete this pet? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.delete(`/Pets/${id}`);
      toast.success("Pet deleted.");
      navigate("/pets");
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to delete pet";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !pet) {
    return <div className="text-sm text-muted-foreground">Loading pet…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="overflow-hidden">
        <div className="aspect-video bg-muted relative">
          {pet.photo ? (
            <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PawPrint className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold">{pet.name}</h1>
              <p className="text-muted-foreground capitalize">
                {pet.breed || "Unknown breed"} · {pet.species}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {pet.age} {pet.age === 1 ? "year" : "years"} old
              </p>
            </div>
            {isOwner && (
              <div className="flex items-center gap-2">
                <Label htmlFor="adoption" className="text-sm">List for Adoption</Label>
                <Switch id="adoption" checked={adoption} onCheckedChange={setAdoption} />
              </div>
            )}
          </div>
          {adoption && (
            <Badge className="mt-3 bg-secondary text-secondary-foreground">Available for Adoption</Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isOwner ? "Edit Pet Details" : "Pet Details"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOwner ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={species} onValueChange={(v) => setSpecies(v as PetSpecies)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="bird">Bird</SelectItem>
                      <SelectItem value="rabbit">Rabbit</SelectItem>
                      <SelectItem value="fish">Fish</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="breed">Breed</Label>
                  <Input id="breed" value={breed} onChange={(e) => setBreed(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ageMonths">Age (months)</Label>
                  <Input id="ageMonths" type="number" min="0" value={ageMonths} onChange={(e) => setAgeMonths(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as Pet["gender"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="text-sm">Available for adoption</Label>
                  <p className="text-xs text-muted-foreground">Show this pet in adoption listings.</p>
                </div>
                <Switch checked={adoption} onCheckedChange={setAdoption} />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="text-sm">Looking for a match</Label>
                  <p className="text-xs text-muted-foreground">Include this pet in matching.</p>
                </div>
                <Switch checked={match} onCheckedChange={setMatch} />
              </div>
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs uppercase text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{pet.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase text-muted-foreground">Type</p>
                <p className="text-sm font-medium capitalize">{pet.species}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase text-muted-foreground">Breed</p>
                <p className="text-sm font-medium">{pet.breed || "Unknown breed"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase text-muted-foreground">Age</p>
                <p className="text-sm font-medium">
                  {Number(ageMonths || 0) > 0 ? `${ageMonths} months` : "Unknown"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase text-muted-foreground">Gender</p>
                <p className="text-sm font-medium capitalize">{gender || "unknown"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase text-muted-foreground">Status</p>
                <p className="text-sm font-medium">{adoption ? "Available for adoption" : "Not for adoption"}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {isOwner ? (
              <>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting…" : "Delete Pet"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={async () => {
                    if (!user?.id || !pet) return;
                    try {
                      if (resolvedUserId && String(pet.ownerId) === String(resolvedUserId)) {
                        toast.error("You cannot send a match request to your own pet.");
                        return;
                      }
                      await api.post("/MatchRequests", { petId: pet.id });
                      toast.success("Match request sent!");
                    } catch (error: any) {
                      const message = error.response?.data?.message || "Failed to send request";
                      toast.error(message);
                    }
                  }}
                >
                  Send Match Request
                </Button>
                {adoption && (
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      if (!user?.id || !pet) return;
                      try {
                        const senderUserId = user.userId ?? Number(user.id);
                        const receiverUserId = Number(pet.ownerId);
                        if (!Number.isFinite(senderUserId) || senderUserId <= 0) {
                          toast.error("Please log out and log in again.");
                          return;
                        }
                        if (!Number.isFinite(receiverUserId) || receiverUserId <= 0) {
                          toast.error("Invalid pet owner.");
                          return;
                        }
                        await api.post("/Notifications/adoption-request", {
                          senderUserId,
                          receiverUserId,
                          petId: pet.id,
                        });
                        toast.success("Adoption request sent!");
                      } catch (error: any) {
                        const message = error.response?.data?.message || "Failed to send adoption request";
                        toast.error(message);
                      }
                    }}
                  >
                    Request Adoption
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Medical History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No medical records yet.</p>
          ) : (
            records.map((rec, i) => (
              <div key={rec.id}>
                {i > 0 && <Separator className="my-4" />}
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{rec.diagnosis}</p>
                    <p className="text-xs text-muted-foreground">
                      {rec.date} · {rec.vetName}
                    </p>
                    <p className="text-sm mt-1">{rec.treatment}</p>
                    {rec.notes && (
                      <p className="text-xs text-muted-foreground mt-1">Note: {rec.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PetProfile;
