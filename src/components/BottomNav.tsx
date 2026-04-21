import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Coins, Package, Building2 } from "lucide-react";
import type { Role } from "@/types";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navByRole: Partial<Record<Role, NavItem[]>> = {
  tecnico: [
    { to: "/", label: "Mi día", icon: LayoutDashboard },
    { to: "/caja-menor", label: "Mis gastos", icon: Coins },
  ],
  conductor: [
    { to: "/", label: "Despachos", icon: Package },
    { to: "/materiales", label: "Bodega", icon: Building2 },
  ],
};

export function BottomNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  
  if (!user || (user.role !== "tecnico" && user.role !== "conductor")) {
    return null;
  }

  const items = navByRole[user.role] || [];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-surface border-t border-border z-50 lg:hidden pb-safe">
      <ul className="flex items-center justify-around px-2 h-16">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === "/"}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center h-full gap-1 transition-colors relative",
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                  <span className="text-[10px] leading-tight">{item.label}</span>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-md" />
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
