import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus, Edit, Stethoscope, Search } from "lucide-react";
import { toast } from "sonner";
import type { MedicalRecord } from "@/types";

const mockRecords: MedicalRecord[] = [
  { id: "r1", petId: "1", vetId: "v1", vetName: "Dr. Ahmed Hassan", date: "2025-01-05", diagnosis: "Skin irritation — mild dermatitis", treatment: "Prescribed topical cream, oatmeal shampoo", notes: "Follow-up in 2 weeks" },
  { id: "r2", petId: "1", vetId: "v1", vetName: "Dr. Ahmed Hassan", date: "2024-12-15", diagnosis: "Annual checkup — healthy", treatment: "FVRCP booster vaccination", notes: "Next checkup in 12 months" },
  { id: "r3", petId: "2", vetId: "v1", vetName: "Dr. Ahmed Hassan", date: "2024-12-10", diagnosis: "Minor paw laceration", treatment: "Cleaned wound, antibiotics 7 days", notes: "Healing well" },
  { id: "r4", petId: "3", vetId: "v1", vetName: "Dr. Ahmed Hassan", date: "2024-11-20", diagnosis: "Gastrointestinal upset", treatment: "Bland diet, probiotics prescribed" },
];

const VetMedicalRecords = () => {
  const [records, setRecords] = useState(mockRecords);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<MedicalRecord | null>(null);

  // Form state
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");

  const filtered = records.filter((r) =>
    r.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
    r.treatment.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditRecord(null);
    setDiagnosis("");
    setTreatment("");
    setNotes("");
    setDialogOpen(true);
  };

  const openEdit = (r: MedicalRecord) => {
    setEditRecord(r);
    setDiagnosis(r.diagnosis);
    setTreatment(r.treatment);
    setNotes(r.notes || "");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!diagnosis || !treatment) {
      toast.error("Diagnosis and treatment are required");
      return;
    }
    if (editRecord) {
      setRecords(records.map((r) => r.id === editRecord.id ? { ...r, diagnosis, treatment, notes } : r));
      toast.success("Record updated");
    } else {
      const newRec: MedicalRecord = {
        id: `r${Date.now()}`, petId: "1", vetId: "v1", vetName: "Dr. Ahmed Hassan",
        date: new Date().toISOString().split("T")[0], diagnosis, treatment, notes,
      };
      setRecords([newRec, ...records]);
      toast.success("Record added");
    }
    setDialogOpen(false);
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
        {filtered.map((rec) => (
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
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRecord ? "Edit Record" : "New Medical Record"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
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
