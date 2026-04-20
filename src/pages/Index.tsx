import { useAuth } from "@/context/AuthContext";
import Login from "@/pages/Login";
import DashboardAdmin from "@/pages/admin/DashboardAdmin";
import TechnicianHome from "@/pages/technician/TechnicianHome";
import DriverHome from "@/pages/driver/DriverHome";
import ClientPortal from "@/pages/client/ClientPortal";

export default function Index() {
  const { user } = useAuth();
  if (!user) return <Login />;
  if (user.role === "tecnico") return <TechnicianHome />;
  if (user.role === "conductor") return <DriverHome />;
  if (user.role === "cliente") return <ClientPortal />;
  return <DashboardAdmin />;
}
