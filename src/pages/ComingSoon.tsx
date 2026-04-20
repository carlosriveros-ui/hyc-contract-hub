import { AppShell } from "@/components/AppShell";
import { Construction } from "lucide-react";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <AppShell title={title}>
      <div className="bg-surface border border-border rounded-lg shadow-card p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/10 text-warning mb-4">
          <Construction className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Este módulo está en construcción. Próximamente estará disponible con todas sus funciones.
        </p>
      </div>
    </AppShell>
  );
}
