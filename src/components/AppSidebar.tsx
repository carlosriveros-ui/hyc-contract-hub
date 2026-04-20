import { useAuth } from "@/context/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";
import { Avatar } from "@/components/Avatar";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FileText, ClipboardCheck, Package, HardHat,
  Wallet, Clock, Coins, FileBarChart, Settings, LogOut, Building2,
} from "lucide-react";
import type { Role } from "@/types";

interface NavItem { to: string; label: string; icon: React.ComponentType<{ className?: string }>; }

const navByRole: Record<Role, NavItem[]> = {
  admin: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/contratos", label: "Contratos & Sedes", icon: FileText },
    { to: "/actividades", label: "Actividades", icon: ClipboardCheck },
    { to: "/materiales", label: "Materiales & Bodega", icon: Package },
    { to: "/contratistas", label: "Contratistas", icon: HardHat },
    { to: "/costos", label: "Control de Costos", icon: Wallet },
    { to: "/asistencia", label: "Asistencia", icon: Clock },
    { to: "/caja-menor", label: "Caja Menor", icon: Coins },
    { to: "/reportes", label: "Reportes", icon: FileBarChart },
  ],
  coordinador: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/contratos", label: "Contratos & Sedes", icon: FileText },
    { to: "/actividades", label: "Actividades", icon: ClipboardCheck },
    { to: "/materiales", label: "Materiales", icon: Package },
    { to: "/contratistas", label: "Contratistas", icon: HardHat },
    { to: "/costos", label: "Costos", icon: Wallet },
    { to: "/asistencia", label: "Asistencia", icon: Clock },
    { to: "/caja-menor", label: "Caja Menor", icon: Coins },
  ],
  tecnico: [
    { to: "/", label: "Mi día", icon: LayoutDashboard },
    { to: "/caja-menor", label: "Mis gastos", icon: Coins },
  ],
  conductor: [
    { to: "/", label: "Despachos", icon: Package },
    { to: "/materiales", label: "Bodega", icon: Building2 },
  ],
  cliente: [
    { to: "/", label: "Mis sedes", icon: Building2 },
    { to: "/actividades", label: "Solicitudes", icon: ClipboardCheck },
  ],
};

const roleLabels: Record<Role, string> = {
  admin: "Administrador",
  coordinador: "Coordinador",
  tecnico: "Técnico",
  conductor: "Conductor",
  cliente: "Cliente",
};

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  if (!user) return null;
  const items = navByRole[user.role];

  return (
    <aside className="w-60 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col h-full">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <BrandLogo variant="light" />
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <NavLink
          to="/configuracion"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
              isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"
            )
          }
        >
          <Settings className="w-4 h-4" />
          <span>Configuración</span>
        </NavLink>
        <div className="flex items-center gap-3 px-2 py-2 rounded-md bg-sidebar-accent/40">
          <Avatar name={user.name} className="w-9 h-9 text-sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/70 truncate">{roleLabels[user.role]}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
