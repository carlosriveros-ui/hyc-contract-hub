import { useState } from "react";
import { useNavigate } from "react-router-dom";
import loginBg from "@/assets/login-bg.jpg";
import logo from "@/assets/manthyc-logo.png";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Role } from "@/types";
import { Mail, Lock, ChevronRight } from "lucide-react";

const roleOptions: { value: Role; label: string; desc: string }[] = [
  { value: "admin",       label: "Carlos Riveros — Administrador", desc: "Acceso total" },
  { value: "coordinador", label: "Andrea Méndez — Coordinador",    desc: "Gestión operativa" },
  { value: "tecnico",     label: "Alexander Espinosa — Técnico",   desc: "Vista móvil" },
  { value: "conductor",   label: "Jorge Ramírez — Conductor",      desc: "Despacho de bodega" },
  { value: "cliente",     label: "Conjunto Virrey Solís — Cliente", desc: "Portal cliente" },
];

export default function Login() {
  const navigate = useNavigate();
  const { loginAs } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demoRole, setDemoRole] = useState<Role | "">("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo mode: if a role was selected, use it; else default to admin
    const role = (demoRole as Role) || "admin";
    loginAs(role);
    navigate("/");
  };

  const handleDemoEnter = (role: Role) => {
    loginAs(role);
    navigate("/");
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative bg-secondary"
      style={{
        backgroundImage: `linear-gradient(rgba(10,10,20,0.78), rgba(10,10,20,0.85)), url(${loginBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-md animate-fade-in">
        {/* Brand on top of card */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src={loginBg ? logo : ""} alt="HYC" width={48} height={48} className="h-12 w-12" />
          <span className="text-3xl font-bold text-white tracking-tight">
            Mant<span className="text-primary">HYC</span>
          </span>
        </div>

        <div className="bg-surface rounded-xl shadow-elevated p-6 sm:p-8 border border-border/50">
          <h1 className="text-xl font-bold text-foreground">Bienvenido</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ingresa a la plataforma de gestión de mantenimiento
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@hyc.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-11"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="rounded border-border" />
                Recordarme
              </label>
              <a href="#" className="text-primary hover:text-primary-hover font-medium">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <Button type="submit" variant="brand" size="lg" className="w-full">
              Ingresar
            </Button>
          </form>

          {/* Demo selector */}
          <div className="mt-6 pt-6 border-t border-border">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              Demo · Entrar como
            </Label>
            <Select value={demoRole} onValueChange={(v) => { setDemoRole(v as Role); handleDemoEnter(v as Role); }}>
              <SelectTrigger className="mt-2 h-11">
                <SelectValue placeholder="Selecciona un rol para previsualizar" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {roleOptions.slice(0, 4).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleDemoEnter(opt.value)}
                  className="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md border border-border hover:border-primary hover:text-primary transition-colors"
                >
                  <span className="capitalize">{opt.value}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-white/60 mt-6">
          HYC Proyectos de Ingeniería S.A.S. © 2026
        </p>
      </div>
    </div>
  );
}
