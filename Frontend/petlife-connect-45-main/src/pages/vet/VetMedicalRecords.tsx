import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Plus, Edit, Stethoscope, Search } from "lucide-react";
import { toast } from "sonner";
import type { MedicalRecord } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/stores/authStore";
import api from "@/services/api";

interface PetOption {
  id: string;
  name: string;
  species: string;
}

const VetMedicalRecords = () => {
  const { user } = useAuthStore();
  const resolvedUserId = user?.userId ?? (Number.isFinite(Number(user?.id)) ? Number(user?.id) : null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<MedicalRecord | null>(null);
  const [pets, setPets] = useState<PetOption[]>([]);

  const [selectedPetId, setSelectedPetId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const loadRecords = async () => {
      if (!resolvedUserId) return;
      try {
        const response = await api.get("/MedicalRecords/for-vet", {
          params: { userId: resolvedUserId },
        });
        const rows = Array.isArray(response.data) ? response.data : [];
        const mapped = rows.map((r: any) => ({
          id: String(r.id ?? r.Id ?? ""),
          petId: String(r.petId ?? r.PetId ?? ""),
          vetId: String(r.vetId ?? r.VetId ?? ""),
          vetName: r.vetName ?? r.VetName ?? "Vet",
          date: r.date ?? r.Date ?? new Date().toISOString().split("T")[0],
          diagnosis: r.diagnosis ?? r.Diagnosis ?? "",
          treatment: r.treatment ?? r.Treatment ?? "",
          notes: r.notes ?? r.Notes ?? undefined,
        }));
        setRecords(mapped);
      } catch (error: any) {
        const message = error.response?.data?.message || "Failed to load medical records";
        toast.error(message);
      }
    };

    void loadRecords();
  }, [resolvedUserId]);

  useEffect(() => {
    const loadPets = async () => {
      if (!resolvedUserId) return;
      try {
        const response = await api.get("/Consultations/for-vet", {
          params: { userId: resolvedUserId },
        });
        const rows = Array.isArray(response.data) ? response.data : [];
        const unique = new Map<string, PetOption>();
        rows.forEach((r: any) => {
          const id = String(r.petId ?? r.PetId ?? "");
          if (!id) return;
          if (!unique.has(id)) {
            unique.set(id, {
              id,
              name: r.petName ?? r.PetName ?? "Pet",
              species: r.petSpecies ?? r.PetSpecies ?? "Unknown",
            });
          }
        });
        setPets(Array.from(unique.values()));
      } catch {
        // ignore
      }
    };

    void loadPets();
  }, [resolvedUserId]);

  const filtered = useMemo(() => (
    records.filter((r) =>
      r.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
      r.treatment.toLowerCase().includes(search.toLowerCase())
    )
  ), [records, search]);

  const openNew = () => {
    setEditRecord(null);
    setSelectedPetId("");
    setDiagnosis("");
    setTreatment("");
    setNotes("");
    setDialogOpen(true);
  };

  const openEdit = (r: MedicalRecord) => {
    setEditRecord(r);
    setSelectedPetId(r.petId);
    setDiagnosis(r.diagnosis);
    setTreatment(r.treatment);
    setNotes(r.notes || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!diagnosis || !treatment) {
      toast.error("Diagnosis and treatment are required");
      return;
    }
    if (!selectedPetId) {
      toast.error("Please select a pet");
      return;
    }

    try {
      if (editRecord) {
        await api.put(`/MedicalRecords/${editRecord.id}`, {
          diagnosis,
          treatment,
          notes: notes || null,
        });
        setRecords(records.map((r) => r.id === editRecord.id ? { ...r, diagnosis, treatment, notes } : r));
        toast.success("Record updated");
      } else {
        const response = await api.post("/MedicalRecords", {
          petId: selectedPetId,
          diagnosis,
          treatment,
          notes: notes || null,
        });
        const newRec: MedicalRecord = {
          id: String(response.data?.id ?? `r${Date.now()}`),
          petId: selectedPetId,
          vetId: "",
          vetName: "Vet",
          date: new Date().toISOString().split("T")[0],
          diagnosis,
          treatment,
          notes,
        };
        setRecords([newRec, ...records]);
        toast.success("Record added");
      }
      setDialogOpen(false);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to save record";
      toast.error(message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Medical Records</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> New Record</Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search records…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No medical records found.</div>
        ) : (
          filtered.map((rec) => (
            <Card key={rec.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Stethoscope className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{rec.diagnosis}</p>
                      <p className="text-sm text-foreground/80 mt-1">{rec.treatment}</p>
                      {rec.notes && <p className="text-xs text-muted-foreground mt-1">Note: {rec.notes}</p>}
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {rec.date}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => openEdit(rec)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRecord ? "Edit Record" : "New Medical Record"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Pet</Label>
              <Select value={selectedPetId} onValueChange={setSelectedPetId}>
                <SelectTrigger><SelectValue placeholder="Select a pet" /></SelectTrigger>
                <SelectContent>
                  {pets.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Annual checkup — healthy" />
            </div>
            <div className="space-y-2">
              <Label>Treatment</Label>
              <Textarea value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder="Describe the treatment…" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes…" rows={2} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editRecord ? "Update" : "Add Record"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VetMedicalRecords;
