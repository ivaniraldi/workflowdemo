import { useState, useEffect } from "react";
import { DependencyProvider } from "./context";
import { Layout } from "./ui/components";
import { CargarHorasView, AuditoriaView, LiquidacionView, RecibosView, EmpleadosView, CoeficientesView } from "./ui/views";
import { seedLegajoData } from "./adapters";

function AppContent() {
  const [currentTab, setCurrentTab] = useState("empleados");

  function renderView() {
    switch (currentTab) {
      case "empleados":
        return <EmpleadosView />;
      case "coeficientes":
        return <CoeficientesView />;
      case "cargar-horas":
        return <CargarHorasView />;
      case "auditoria":
        return <AuditoriaView />;
      case "liquidacion":
        return <LiquidacionView />;
      case "recibos":
        return <RecibosView />;
      default:
        return <EmpleadosView />;
    }
  }

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
      {renderView()}
    </Layout>
  );
}

function App() {
  useEffect(() => {
    // Initialize seed data on app startup
    seedLegajoData();
  }, []);

  return (
    <DependencyProvider>
      <AppContent />
    </DependencyProvider>
  );
}

export default App;
