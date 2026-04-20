import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-black text-primary">404</p>
        <h1 className="mt-4 text-2xl font-bold">Página no encontrada</h1>
        <p className="mt-2 text-muted-foreground">La ruta que buscas no existe en MantHYC.</p>
        <Button variant="default" className="mt-6 gap-2" onClick={() => navigate("/")}>
          <Home className="w-4 h-4" /> Volver al inicio
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
