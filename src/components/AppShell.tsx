import { ReactNode, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/Avatar";
import { BrandLogo } from "@/components/BrandLogo";

export function AppShell({ children, title, subtitle, actions }: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 lg:h-16 border-b border-border bg-surface flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden p-2 -ml-2 rounded-md hover:bg-accent" aria-label="Abrir menú">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-60 bg-sidebar border-sidebar-border">
                <AppSidebar onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="lg:hidden">
              <BrandLogo variant="dark" size="sm" />
            </div>
            <div className="hidden lg:block min-w-0">
              {title && <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>}
              {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            {actions}
            <button className="relative p-2 rounded-md hover:bg-accent" aria-label="Notificaciones">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            </button>
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                <Avatar name={user.name} className="w-8 h-8 text-xs" />
              </div>
            )}
          </div>
        </header>

        {/* Mobile title */}
        {(title || subtitle) && (
          <div className="lg:hidden px-4 py-3 bg-surface border-b border-border">
            {title && <h1 className="text-lg font-bold text-foreground">{title}</h1>}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
