import { Link, useLocation } from "wouter";
import { Activity, ShieldAlert, FileText, Pill, Key, Settings, User, LogOut } from "lucide-react";
import { useGetPatient } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: patient } = useGetPatient();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Activity },
    { href: "/records", label: "Health Records", icon: FileText },
    { href: "/prescriptions", label: "Prescriptions", icon: Pill },
    { href: "/access-grants", label: "Access Grants", icon: Key },
    { href: "/alerts", label: "Security Alerts", icon: ShieldAlert },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border gap-3">
          <div className="w-8 h-8 rounded-md bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bold">
            MV
          </div>
          <span className="font-bold text-lg tracking-tight">MediVault</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground'}`} data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              <User className="w-4 h-4 text-sidebar-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{patient?.name || 'Loading...'}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{patient?.encryptionKeyFingerprint?.substring(0, 12)}...</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
          <h1 className="text-xl font-semibold capitalize">
            {location === "/" ? "Dashboard" : location.split("/")[1].replace("-", " ")}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Vault Locked
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
