import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { RequireAuth } from "@/components/RequireAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ContractsList from "./pages/admin/ContractsList";
import ContractDetail from "./pages/admin/ContractDetail";
import ActivitiesCoordinator from "./pages/admin/ActivitiesCoordinator";
import MaterialsWarehouse from "./pages/admin/MaterialsWarehouse";
import Contractors from "./pages/admin/Contractors";
import CostsControl from "./pages/admin/CostsControl";
import Attendance from "./pages/admin/Attendance";
import PettyCash from "./pages/admin/PettyCash";
import ComingSoon from "./pages/ComingSoon";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/contratos" element={<RequireAuth roles={["admin", "coordinador"]}><ContractsList /></RequireAuth>} />
            <Route path="/contratos/:id" element={<RequireAuth roles={["admin", "coordinador"]}><ContractDetail /></RequireAuth>} />
            <Route path="/actividades" element={<RequireAuth roles={["admin", "coordinador", "cliente"]}><ActivitiesCoordinator /></RequireAuth>} />
            <Route path="/materiales" element={<RequireAuth roles={["admin", "coordinador", "conductor"]}><MaterialsWarehouse /></RequireAuth>} />
            <Route path="/contratistas" element={<RequireAuth roles={["admin", "coordinador"]}><Contractors /></RequireAuth>} />
            <Route path="/costos" element={<RequireAuth roles={["admin", "coordinador"]}><CostsControl /></RequireAuth>} />
            <Route path="/asistencia" element={<RequireAuth roles={["admin", "coordinador"]}><Attendance /></RequireAuth>} />
            <Route path="/caja-menor" element={<RequireAuth roles={["admin", "coordinador", "tecnico"]}><PettyCash /></RequireAuth>} />
            <Route path="/reportes" element={<RequireAuth roles={["admin"]}><ComingSoon title="Reportes" /></RequireAuth>} />
            <Route path="/configuracion" element={<RequireAuth><ComingSoon title="Configuración" /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
