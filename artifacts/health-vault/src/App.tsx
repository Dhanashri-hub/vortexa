import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Records from "@/pages/records";
import RecordDetail from "@/pages/record-detail";
import Prescriptions from "@/pages/prescriptions";
import PrescriptionDetail from "@/pages/prescription-detail";
import AccessGrants from "@/pages/access-grants";
import AuditTrail from "@/pages/audit-trail";
import Alerts from "@/pages/alerts";
import Settings from "@/pages/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/records" component={Records} />
        <Route path="/records/:id" component={RecordDetail} />
        <Route path="/prescriptions" component={Prescriptions} />
        <Route path="/prescriptions/:id" component={PrescriptionDetail} />
        <Route path="/access-grants" component={AccessGrants} />
        <Route path="/access-grants/:id/audit" component={AuditTrail} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
