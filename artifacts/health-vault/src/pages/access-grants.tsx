import { useState } from "react";
import { Link } from "wouter";
import {
  useListAccessGrants,
  useRevokeAccessGrant,
  getListAccessGrantsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Key, Plus, ClipboardList, ShieldOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AccessGrantFormDialog from "@/components/access-grant-form-dialog";

export default function AccessGrants() {
  const [revokeId, setRevokeId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: grants = [], isLoading } = useListAccessGrants({
    query: { queryKey: getListAccessGrantsQueryKey() },
  });
  const revokeGrant = useRevokeAccessGrant();

  function handleRevoke(id: number) {
    revokeGrant.mutate(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListAccessGrantsQueryKey() });
          toast({ title: "Access grant revoked" });
          setRevokeId(null);
        },
        onError: () => {
          toast({ title: "Failed to revoke grant", variant: "destructive" });
          setRevokeId(null);
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Access Grants</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Control which providers can access your records
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Grant
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : grants.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-lg border-dashed">
          No active access grants. Grant a provider access to your records.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {grants.map((g) => (
            <Card key={g.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Key className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{g.providerName}</CardTitle>
                      <p className="text-xs text-muted-foreground">{g.providerType}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scope</span>
                  <span className="text-right max-w-[60%]">{g.recordScope}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Access Count</span>
                  <span>{g.accessCount}</span>
                </div>
                {g.expiresAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires</span>
                    <span>{g.expiresAt}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Signature</span>
                  <span className="font-mono text-xs text-muted-foreground truncate max-w-[50%]">
                    {g.signatureHash}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 pt-0">
                <Link href={`/access-grants/${g.id}/audit`} className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">
                    <ClipboardList className="w-3 h-3 mr-2" />
                    Audit Trail
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setRevokeId(g.id)}
                >
                  <ShieldOff className="w-3 h-3 mr-2" />
                  Revoke
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AccessGrantFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: getListAccessGrantsQueryKey() });
          setShowForm(false);
        }}
      />

      <AlertDialog open={revokeId !== null} onOpenChange={() => setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately prevent this provider from accessing your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => revokeId !== null && handleRevoke(revokeId)}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
