import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Plus, Edit, Stethoscope, Search, Syringe } from "lucide-react";
import { toast } from "sonner";
import type { MedicalRecord, VaccinationLog } from "@/types";
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
  const [vaccinations, setVaccinations] = useState<VaccinationLog[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vaccinationDialogOpen, setVaccinationDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<MedicalRecord | null>(null);
  const [pets, setPets] = useState<PetOption[]>([]);

  const [selectedPetId, setSelectedPetId] = useState("");
  const [recordType, setRecordType] = useState("consultation");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");
  const [prescription, setPrescription] = useState("");

  const [vaccineName, setVaccineName] = useState("");
  const [vaccineDate, setVaccineDate] = useState(new Date().toISOString().split("T")[0]);
  const [nextDueDate, setNextDueDate] = useState("");

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
          recordType: r.recordType ?? r.RecordType ?? "consultation",
          diagnosis: r.diagnosis ?? r.Diagnosis ?? "",
          treatment: r.treatment ?? r.Treatment ?? "",
          notes: r.notes ?? r.Notes ?? undefined,
          prescription: r.prescription ?? r.Prescription ?? undefined,
          consultationId: r.consultationId ?? r.ConsultationId ?? undefined,
          vaccineName: r.vaccineName ?? r.VaccineName ?? undefined,
          nextDueDate: r.nextDueDate ?? r.NextDueDate ?? undefined,
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

  useEffect(() => {
    const loadVaccinations = async () => {
      if (!resolvedUserId || pets.length === 0) return;
      try {
        const responses = await Promise.all(
          pets.map((pet) =>
            api.get(`/MedicalRecords/vaccinations/${pet.id}`, {
              params: { userId: resolvedUserId },
            })
          )
        );

        const mapped = responses.flatMap((response) => {
          const rows = Array.isArray(response.data) ? response.data : [];
          return rows.map((row: any) => ({
            id: String(row.id ?? row.Id ?? ""),
            petId: String(row.petId ?? row.PetId ?? ""),
            vaccineName: row.vaccineName ?? row.VaccineName ?? "Vaccination",
            date: row.date ?? row.Date ?? new Date().toISOString().split("T")[0],
            nextDueDate: row.nextDueDate ?? row.NextDueDate ?? undefined,
            notes: row.notes ?? row.Notes ?? undefined,
          }));
        });

        setVaccinations(mapped);
      } catch {
        // ignore
      }
    };

    void loadVaccinations();
  }, [pets, resolvedUserId]);

  const filtered = useMemo(
    () =>
      records.filter((r) =>
        (r.recordType ?? "").toLowerCase().includes(search.toLowerCase()) ||
        r.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
        r.treatment.toLowerCase().includes(search.toLowerCase()) ||
        (r.vaccineName ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [records, search]
  );

  const openNew = () => {
    setEditRecord(null);
    setSelectedPetId("");
    setRecordType("consultation");
    setDiagnosis("");
    setTreatment("");
    setNotes("");
    setPrescription("");
    setDialogOpen(true);
  };

  const openEdit = (r: MedicalRecord) => {
    setEditRecord(r);
    setSelectedPetId(r.petId);
    setRecordType(r.recordType || "consultation");
    setDiagnosis(r.diagnosis);
    setTreatment(r.treatment);
    setNotes(r.notes || "");
    setPrescription(r.prescription || "");
    setDialogOpen(true);
  };

  const openVaccination = () => {
    setSelectedPetId("");
    setVaccineName("");
    setVaccineDate(new Date().toISOString().split("T")[0]);
    setNextDueDate("");
    setNotes("");
    setVaccinationDialogOpen(true);
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
          recordType,
          diagnosis,
          treatment,
          notes: notes || null,
          prescription: prescription || null,
        });
        setRecords(records.map((r) => (r.id === editRecord.id ? { ...r, recordType, diagnosis, treatment, notes, prescription } : r)));
        toast.success("Record updated");
      } else {
        const response = await api.post("/MedicalRecords", {
          petId: selectedPetId,
          recordType,
          diagnosis,
          treatment,
          notes: notes || null,
          prescription: prescription || null,
        });
        const newRec: MedicalRecord = {
          id: String(response.data?.id ?? `r${Date.now()}`),
          petId: selectedPetId,
          vetId: "",
          vetName: "Vet",
          date: new Date().toISOString().split("T")[0],
          recordType,
          diagnosis,
          treatment,
          notes,
          prescription,
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

  const handleVaccinationSave = async () => {
    if (!selectedPetId || !vaccineName) {
      toast.error("Please select a pet and enter vaccine name");
      return;
    }

    try {
      const response = await api.post("/MedicalRecords/vaccinations", {
        petId: selectedPetId,
        vaccineName,
        date: vaccineDate ? new Date(vaccineDate).toISOString() : null,
        nextDueDate: nextDueDate ? new Date(nextDueDate).toISOString() : null,
        notes: notes || null,
      });

      const newVaccination: VaccinationLog = {
        id: String(response.data?.id ?? `v${Date.now()}`),
        petId: selectedPetId,
        vaccineName,
        date: vaccineDate,
        nextDueDate: nextDueDate || undefined,
        notes: notes || undefined,
      };

      setVaccinations((prev) => [newVaccination, ...prev]);
      setRecords((prev) => [
        {
          id: newVaccination.id,
          petId: selectedPetId,
          vetId: "",
          vetName: "Vet",
          date: vaccineDate,
          recordType: "vaccination",
          diagnosis: vaccineName,
          treatment: "",
          notes: notes || undefined,
          vaccineName,
          nextDueDate: nextDueDate || undefined,
        },
        ...prev,
      ]);
      setVaccinationDialogOpen(false);
      toast.success("Vaccination log added");
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to save vaccination";
      toast.error(message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Medical Records</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openVaccination}>
            <Syringe className="mr-2 h-4 w-4" /> Add Vaccination
          </Button>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> New Record
          </Button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search records..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{rec.diagnosis}</p>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {rec.recordType ?? "consultation"}
                        </span>
                      </div>
                      {rec.treatment && <p className="text-sm text-foreground/80 mt-1">{rec.treatment}</p>}
                      {rec.prescription && <p className="text-xs text-foreground/80 mt-1">Prescription: {rec.prescription}</p>}
                      {rec.vaccineName && <p className="text-xs text-foreground/80 mt-1">Vaccine: {rec.vaccineName}</p>}
                      {rec.nextDueDate && <p className="text-xs text-muted-foreground mt-1">Next due: {rec.nextDueDate}</p>}
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
              <Label>Record Type</Label>
              <Select value={recordType} onValueChange={setRecordType}>
                <SelectTrigger><SelectValue placeholder="Select record type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Annual checkup - healthy" />
            </div>
            <div className="space-y-2">
              <Label>Treatment</Label>
              <Textarea value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder="Describe the treatment..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Prescription (optional)</Label>
              <Textarea value={prescription} onChange={(e) => setPrescription(e.target.value)} placeholder="Prescription details..." rows={2} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editRecord ? "Update" : "Add Record"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={vaccinationDialogOpen} onOpenChange={setVaccinationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vaccination Log</DialogTitle>
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
              <Label>Vaccine Name</Label>
              <Input value={vaccineName} onChange={(e) => setVaccineName(e.target.value)} placeholder="e.g. Rabies" />
            </div>
            <div className="space-y-2">
              <Label>Date Given</Label>
              <Input type="date" value={vaccineDate} onChange={(e) => setVaccineDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Next Due Date (optional)</Label>
              <Input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Vaccination notes..." rows={2} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setVaccinationDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleVaccinationSave}>Save Vaccination</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VetMedicalRecords;
