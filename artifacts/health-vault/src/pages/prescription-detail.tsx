import { useRoute, Link } from "wouter";
import {
  useGetPrescription,
  getGetPrescriptionQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

const statusColor: Record<string, string> = {
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  expired: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function PrescriptionDetail() {
  const [, params] = useRoute("/prescriptions/:id");
  const id = Number(params?.id);

  const { data: prescription, isLoading } = useGetPrescription(id, {
    query: { enabled: !!id, queryKey: getGetPrescriptionQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-64" />
        <div className="h-48 bg-muted rounded" />
      </div>
    );
  }
  if (!prescription) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Prescription not found.</p>
        <Link href="/prescriptions">
          <Button variant="outline" className="mt-4">Back to Prescriptions</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/prescriptions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{prescription.medicationName}</h1>
          <p className="text-muted-foreground text-sm">{prescription.dosage} — {prescription.frequency}</p>
        </div>
        <Badge variant="outline" className={statusColor[prescription.status] ?? statusColor.expired}>
          {prescription.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Prescription Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Medication" value={prescription.medicationName} />
            <Row label="Dosage" value={prescription.dosage} />
            <Row label="Frequency" value={prescription.frequency} />
            <Row label="Prescribed By" value={prescription.prescribedBy} />
            <Row label="Prescribed Date" value={prescription.prescribedAt} />
            <Row label="Expires" value={prescription.expiresAt ?? "N/A"} />
            <Row label="Refills Remaining" value={String(prescription.refillsRemaining ?? 0)} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Pharmacy</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Pharmacy" value={prescription.pharmacyName ?? "N/A"} />
              <Row label="NPI Number" value={prescription.npiNumber ?? "N/A"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Cryptographic Signature</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs font-mono text-muted-foreground break-all">
                {prescription.signatureHash}
              </p>
            </CardContent>
          </Card>

          {prescription.instructions && (
            <Card>
              <CardHeader><CardTitle className="text-base">Instructions</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{prescription.instructions}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right max-w-[60%]">{value}</span>
    </div>
  );
}
