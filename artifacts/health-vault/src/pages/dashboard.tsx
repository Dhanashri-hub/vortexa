import { useGetDashboardSummary, useListAlerts } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Pill, Key, ShieldAlert, Activity, AlertTriangle, Brain, Zap, Eye } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { useState, useEffect } from "react";

function AIAgentOrb({ unresolvedAlerts }: { unresolvedAlerts: number }) {
  const [tick, setTick] = useState(0);
  const [status, setStatus] = useState("Monitoring vault...");

  const statuses = [
    "Monitoring vault...",
    "Scanning prescriptions...",
    "Verifying signatures...",
    "Checking access logs...",
    "Analyzing drug interactions...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      setStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const hasAlerts = unresolvedAlerts > 0;

  return (
    <Card className="flex flex-col items-center justify-center py-8 gap-4 relative overflow-hidden">
      <div className="relative flex items-center justify-center">
        <span className={`absolute w-32 h-32 rounded-full ${hasAlerts ? 'bg-orange-500/10 animate-ping' : 'bg-primary/10 animate-ping'}`} style={{ animationDuration: '2.5s' }} />
        <span className={`absolute w-24 h-24 rounded-full ${hasAlerts ? 'bg-orange-500/15' : 'bg-primary/15'} animate-pulse`} style={{ animationDuration: '2s' }} />
        <div className={`relative w-20 h-20 rounded-full flex items-center justify-center border-2 ${hasAlerts ? 'bg-orange-500/10 border-orange-500/40' : 'bg-primary/10 border-primary/40'} shadow-lg`}>
          <Brain className={`w-8 h-8 ${hasAlerts ? 'text-orange-400' : 'text-primary'}`} />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="font-semibold text-sm">AI Safety Agent</p>
        <p className="text-xs text-muted-foreground">{status}</p>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          Active
        </span>
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          GPT-4o-mini
        </span>
        {hasAlerts && (
          <Link href="/alerts" className="flex items-center gap-1 text-orange-400 font-medium">
            <ShieldAlert className="w-3 h-3" />
            {unresolvedAlerts} alert{unresolvedAlerts !== 1 ? 's' : ''}
          </Link>
        )}
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: alerts, isLoading: isAlertsLoading } = useListAlerts({ severity: 'critical' });

  const criticalAlerts = alerts?.filter(a => !a.isDismissed && a.severity === 'critical') || [];

  if (isSummaryLoading || isAlertsLoading) {
    return <div className="space-y-4 animate-pulse">
      <div className="h-24 bg-muted rounded-xl"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {criticalAlerts.length > 0 && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 text-destructive-foreground">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="font-semibold text-lg">Critical Security Alerts</AlertTitle>
          <AlertDescription className="mt-2 text-sm opacity-90 flex items-center justify-between">
            <span>You have {criticalAlerts.length} unresolved critical alert(s) regarding your data access.</span>
            <Link href="/alerts" className="underline font-medium hover:text-white">Review Alerts</Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Health Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.totalRecords || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{summary?.verifiedRecords || 0} cryptographically verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Prescriptions</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.totalPrescriptions || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Access Grants</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.activeGrants || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Providers with current access</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Security Alerts</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.unresolvedAlerts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Requiring your attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" /> Recent Vault Activity
            </CardTitle>
            <CardDescription>Latest interactions with your encrypted data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {summary?.recentActivity?.length ? (
                <div className="relative border-l-2 border-muted ml-3 space-y-6">
                  {summary.recentActivity.map((activity) => (
                    <div key={activity.id} className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1 border-2 border-card"></div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                        <p className="text-sm font-medium leading-none">{activity.description}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {format(new Date(activity.timestamp), "MMM d, yyyy HH:mm")}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">{activity.type.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No recent activity in your vault.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <AIAgentOrb unresolvedAlerts={summary?.unresolvedAlerts ?? 0} />
      </div>
    </div>
  );
}
