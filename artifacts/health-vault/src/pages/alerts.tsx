import { useState } from "react";
import {
  useListAlerts,
  useDismissAlert,
  useAnalyzePatientSafety,
  useAnalyzePatientFraud,
  useExplainAlert,
  getListAlertsQueryKey,
  getExplainAlertQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldAlert, Activity, X, Lightbulb, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const severityColor: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const typeIcon: Record<string, React.ReactNode> = {
  safety: <ShieldAlert className="w-4 h-4" />,
  fraud: <Activity className="w-4 h-4" />,
};

function ExplainDialog({ alertId, open, onClose }: { alertId: number; open: boolean; onClose: () => void }) {
  const { data, isLoading } = useExplainAlert(alertId, {
    query: { enabled: open && !!alertId, queryKey: getExplainAlertQueryKey(alertId) },
  });
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            AI Explanation
          </DialogTitle>
          <DialogDescription>Plain-English explanation of this alert</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{data?.explanation}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Alerts() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [explainId, setExplainId] = useState<number | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const params: Record<string, string> = {};
  if (typeFilter !== "all") params.type = typeFilter;
  if (severityFilter !== "all") params.severity = severityFilter;

  const { data: alerts = [], isLoading } = useListAlerts(params, {
    query: { queryKey: getListAlertsQueryKey(params) },
  });
  const dismissAlert = useDismissAlert();
  const analyzeSafety = useAnalyzePatientSafety();
  const analyzeFraud = useAnalyzePatientFraud();

  const undismissed = alerts.filter((a) => !a.isDismissed);
  const dismissed = alerts.filter((a) => a.isDismissed);

  function handleDismiss(id: number) {
    dismissAlert.mutate(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListAlertsQueryKey() });
          toast({ title: "Alert dismissed" });
        },
        onError: () => toast({ title: "Failed to dismiss alert", variant: "destructive" }),
      }
    );
  }

  function handleAnalyzeSafety() {
    analyzeSafety.mutate(undefined, {
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: getListAlertsQueryKey() });
        const d = data as { alertsCreated?: number; hasConcerns?: boolean };
        toast({
          title: d.hasConcerns
            ? `Found ${d.alertsCreated} safety concern(s)`
            : "No safety concerns detected",
        });
      },
      onError: () => toast({ title: "Analysis failed", variant: "destructive" }),
    });
  }

  function handleAnalyzeFraud() {
    analyzeFraud.mutate(undefined, {
      onSuccess: (data) => {
        qc.invalidateQueries({ queryKey: getListAlertsQueryKey() });
        const d = data as { alertsCreated?: number; hasConcerns?: boolean };
        toast({
          title: d.hasConcerns
            ? `Found ${d.alertsCreated} fraud concern(s)`
            : "No fraud patterns detected",
        });
      },
      onError: () => toast({ title: "Analysis failed", variant: "destructive" }),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Alerts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI-generated drug interaction and fraud detection alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyzeSafety}
            disabled={analyzeSafety.isPending}
          >
            {analyzeSafety.isPending ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <ShieldAlert className="w-3 h-3 mr-2" />}
            Run Safety Check
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyzeFraud}
            disabled={analyzeFraud.isPending}
          >
            {analyzeFraud.isPending ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Activity className="w-3 h-3 mr-2" />}
            Run Fraud Check
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="safety">Safety</SelectItem>
            <SelectItem value="fraud">Fraud</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {undismissed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Active ({undismissed.length})
              </h2>
              {undismissed.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onDismiss={() => handleDismiss(alert.id)}
                  onExplain={() => setExplainId(alert.id)}
                />
              ))}
            </section>
          )}

          {dismissed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Dismissed ({dismissed.length})
              </h2>
              {dismissed.map((alert) => (
                <AlertCard key={alert.id} alert={alert} dismissed />
              ))}
            </section>
          )}

          {alerts.length === 0 && (
            <div className="text-center py-16 text-muted-foreground border rounded-lg border-dashed">
              No alerts. Run a safety or fraud check to analyze your records.
            </div>
          )}
        </div>
      )}

      {explainId !== null && (
        <ExplainDialog
          alertId={explainId}
          open={explainId !== null}
          onClose={() => setExplainId(null)}
        />
      )}
    </div>
  );
}

function AlertCard({
  alert,
  onDismiss,
  onExplain,
  dismissed = false,
}: {
  alert: { id: number; type: string; severity: string; title: string; description: string; relatedIds: string[] };
  onDismiss?: () => void;
  onExplain?: () => void;
  dismissed?: boolean;
}) {
  return (
    <Card className={dismissed ? "opacity-50" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{typeIcon[alert.type]}</span>
            <CardTitle className="text-base">{alert.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className={severityColor[alert.severity] ?? ""}>
              {alert.severity}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {alert.type}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{alert.description}</p>
      </CardContent>
      {!dismissed && (
        <CardFooter className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onExplain}>
            <Lightbulb className="w-3 h-3 mr-2" />
            Explain
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onDismiss}>
            <X className="w-3 h-3 mr-2" />
            Dismiss
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
