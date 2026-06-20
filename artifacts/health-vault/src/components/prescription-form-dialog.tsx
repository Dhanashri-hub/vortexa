import { useState } from "react";
import { useCreatePrescription } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}

export default function PrescriptionFormDialog({ open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast();
  const createPrescription = useCreatePrescription();
  const [form, setForm] = useState({
    medicationName: "",
    dosage: "",
    frequency: "",
    prescribedBy: "",
    prescribedAt: new Date().toISOString().split("T")[0],
    expiresAt: "",
    refillsRemaining: "",
    instructions: "",
    pharmacyName: "",
    npiNumber: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createPrescription.mutate(
      {
        data: {
          ...form,
          refillsRemaining: form.refillsRemaining ? Number(form.refillsRemaining) : undefined,
          status: "active",
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Prescription recorded" });
          setForm({
            medicationName: "",
            dosage: "",
            frequency: "",
            prescribedBy: "",
            prescribedAt: new Date().toISOString().split("T")[0],
            expiresAt: "",
            refillsRemaining: "",
            instructions: "",
            pharmacyName: "",
            npiNumber: "",
          });
          onSuccess();
        },
        onError: () => toast({ title: "Failed to add prescription", variant: "destructive" }),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Prescription</DialogTitle>
          <DialogDescription>
            Prescription will be cryptographically signed on creation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="med">Medication Name</Label>
              <Input
                id="med"
                placeholder="e.g. Lisinopril"
                value={form.medicationName}
                onChange={(e) => setForm({ ...form, medicationName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                placeholder="e.g. 10mg"
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="freq">Frequency</Label>
              <Input
                id="freq"
                placeholder="e.g. Once daily"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refills">Refills Remaining</Label>
              <Input
                id="refills"
                type="number"
                min={0}
                value={form.refillsRemaining}
                onChange={(e) => setForm({ ...form, refillsRemaining: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prescribedBy">Prescribed By</Label>
            <Input
              id="prescribedBy"
              placeholder="Dr. Name, Specialty"
              value={form.prescribedBy}
              onChange={(e) => setForm({ ...form, prescribedBy: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prescribedAt">Prescribed Date</Label>
              <Input
                id="prescribedAt"
                type="date"
                value={form.prescribedAt}
                onChange={(e) => setForm({ ...form, prescribedAt: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expires</Label>
              <Input
                id="expiresAt"
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pharmacy">Pharmacy</Label>
              <Input
                id="pharmacy"
                placeholder="CVS Pharmacy"
                value={form.pharmacyName}
                onChange={(e) => setForm({ ...form, pharmacyName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="npi">NPI Number</Label>
              <Input
                id="npi"
                placeholder="10-digit NPI"
                value={form.npiNumber}
                onChange={(e) => setForm({ ...form, npiNumber: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Take with food, avoid alcohol..."
              rows={2}
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPrescription.isPending}>
              {createPrescription.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Record Prescription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
