import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Pet, PetSpecies } from "@/types";
import api from "@/services/api";
import { useAuthStore } from "@/stores/authStore";

const RegisterPet = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<PetSpecies>("dog");
  const [breed, setBreed] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [gender, setGender] = useState<Pet["gender"]>("male");
  const [imageUrl, setImageUrl] = useState("");
  const [isAvailableForAdoption, setIsAvailableForAdoption] = useState(false);
  const [isLookingForMatch, setIsLookingForMatch] = useState(false);
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!user?.id) {
        toast.error("Please log in to register a pet.");
        return;
      }

      const ownerId = user.userId ?? Number(user.id);
      if (!Number.isFinite(ownerId)) {
        toast.error("Invalid user id. Please log in again.");
        return;
      }

      await api.post("/Pets", {
        ownerId,
        name,
        type: species,
        breed,
        ageMonths: ageMonths ? Number(ageMonths) : null,
        gender,
        imageUrl: imageUrl || null,
        isAvailableForAdoption,
        isLookingForMatch,
      });

      toast.success(`${name} has been registered!`);
      navigate("/pets");
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to register pet";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-heading text-2xl font-bold mb-6">Register a Pet</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pet Details</CardTitle>
          <CardDescription>Tell us about your furry friend</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Pet Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Buddy" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Species</Label>
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
              <div className="space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Input id="breed" value={breed} onChange={(e) => setBreed(e.target.value)} required placeholder="e.g. Labrador" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ageMonths">Age (months)</Label>
                <Input id="ageMonths" type="number" min="0" value={ageMonths} onChange={(e) => setAgeMonths(e.target.value)} placeholder="e.g. 18" />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as Pet["gender"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <Switch checked={isAvailableForAdoption} onCheckedChange={setIsAvailableForAdoption} />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label className="text-sm">Looking for a match</Label>
                <p className="text-xs text-muted-foreground">Include this pet in matching.</p>
              </div>
              <Switch checked={isLookingForMatch} onCheckedChange={setIsLookingForMatch} />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Registering…" : "Register Pet"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/pets")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPet;
