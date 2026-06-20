import { useState } from "react";
import { useCreateAccessGrant } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PROVIDER_TYPES = [
  "Primary Care",
  "Specialist",
  "Hospital",
  "Pharmacy",
  "Insurance",
  "Emergency",
  "Research",
  "Other",
];

const SCOPES = [
  "All Records",
  "Lab Results",
  "Imaging",
  "Prescriptions",
  "Mental Health",
  "Surgical Records",
  "Vaccination Records",
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}

export default function AccessGrantFormDialog({ open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast();
  const createGrant = useCreateAccessGrant();
  const [form, setForm] = useState({
    providerName: "",
    providerType: "Primary Care",
    providerEmail: "",
    recordScope: "All Records",
    expiresAt: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createGrant.mutate(
      { data: form },
      {
        onSuccess: () => {
          toast({ title: "Access grant created" });
          setForm({
            providerName: "",
            providerType: "Primary Care",
            providerEmail: "",
            recordScope: "All Records",
            expiresAt: "",
          });
          onSuccess();
        },
        onError: () => toast({ title: "Failed to create grant", variant: "destructive" }),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Access Grant</DialogTitle>
          <DialogDescription>
            Grant a provider cryptographically signed access to your records.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="providerName">Provider Name</Label>
            <Input
              id="providerName"
              placeholder="Dr. Jane Smith or City Hospital"
              value={form.providerName}
              onChange={(e) => setForm({ ...form, providerName: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Provider Type</Label>
              <Select value={form.providerType} onValueChange={(v) => setForm({ ...form, providerType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Record Scope</Label>
              <Select value={form.recordScope} onValueChange={(v) => setForm({ ...form, recordScope: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="providerEmail">Provider Email</Label>
            <Input
              id="providerEmail"
              type="email"
              placeholder="provider@clinic.com"
              value={form.providerEmail}
              onChange={(e) => setForm({ ...form, providerEmail: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expiry Date (optional)</Label>
            <Input
              id="expiresAt"
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createGrant.isPending}>
              {createGrant.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Grant
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
