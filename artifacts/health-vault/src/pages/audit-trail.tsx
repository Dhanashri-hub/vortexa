import { useRoute, Link } from "wouter";
import {
  useGetAccessGrantAudit,
  useListAccessGrants,
  getGetAccessGrantAuditQueryKey,
  getListAccessGrantsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Shield } from "lucide-react";

export default function AuditTrail() {
  const [, params] = useRoute("/access-grants/:id/audit");
  const id = Number(params?.id);

  const { data: entries = [], isLoading } = useGetAccessGrantAudit(id, {
    query: { enabled: !!id, queryKey: getGetAccessGrantAuditQueryKey(id) },
  });
  const { data: grants = [] } = useListAccessGrants({
    query: { queryKey: getListAccessGrantsQueryKey() },
  });
  const grant = grants.find((g) => g.id === id);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/access-grants">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Trail</h1>
          {grant && (
            <p className="text-muted-foreground text-sm">
              {grant.providerName} — {grant.providerType}
            </p>
          )}
        </div>
      </div>

      {grant && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Grant Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Provider</p>
              <p className="font-medium">{grant.providerName}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Scope</p>
              <p className="font-medium">{grant.recordScope}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Total Accesses</p>
              <p className="font-medium">{grant.accessCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Signature</p>
              <p className="font-mono text-xs truncate">{grant.signatureHash}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-lg border-dashed">
          No audit entries recorded yet.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.action}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {e.ipAddress ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(e.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
