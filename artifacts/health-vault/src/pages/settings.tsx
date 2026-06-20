import { useState, useEffect } from "react";
import {
  useGetPatient,
  useUpdatePatient,
  getGetPatientQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"];

export default function Settings() {
  const { data: patient, isLoading } = useGetPatient({
    query: { queryKey: getGetPatientQueryKey() },
  });
  const updatePatient = useUpdatePatient();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    bloodType: "Unknown",
    allergies: "",
    emergencyContact: "",
  });

  useEffect(() => {
    if (patient) {
      setForm({
        name: patient.name ?? "",
        email: patient.email ?? "",
        dateOfBirth: patient.dateOfBirth ?? "",
        bloodType: patient.bloodType ?? "Unknown",
        allergies: patient.allergies ?? "",
        emergencyContact: patient.emergencyContact ?? "",
      });
    }
  }, [patient]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updatePatient.mutate(
      { data: form },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetPatientQueryKey() });
          toast({ title: "Profile updated" });
        },
        onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse max-w-2xl">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your patient profile and encryption keys</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Patient Profile</CardTitle>
            <CardDescription>Personal information stored in your encrypted vault</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodType">Blood Type</Label>
                <Select value={form.bloodType} onValueChange={(v) => setForm({ ...form, bloodType: v })}>
                  <SelectTrigger id="bloodType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_TYPES.map((bt) => (
                      <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allergies">Known Allergies</Label>
              <Textarea
                id="allergies"
                placeholder="List any known allergies, separated by commas"
                value={form.allergies}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency">Emergency Contact</Label>
              <Input
                id="emergency"
                placeholder="Name: +1-555-0000"
                value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {patient && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Encryption
              </CardTitle>
              <CardDescription>Your cryptographic identity in the vault</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Key Fingerprint</p>
                <p className="font-mono text-xs bg-muted rounded px-3 py-2 break-all">
                  {patient.encryptionKeyFingerprint}
                </p>
              </div>
              {patient.publicKey && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Public Key</p>
                  <p className="font-mono text-xs bg-muted rounded px-3 py-2 break-all">
                    {patient.publicKey}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Button type="submit" disabled={updatePatient.isPending}>
          {updatePatient.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </form>
    </div>
  );
}
