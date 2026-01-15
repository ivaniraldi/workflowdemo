// Dependency Injection Context - Provides services to React components
import { createContext, useContext, useMemo, ReactNode } from "react";

// Services
import { AttendanceService } from "../modules/attendance/service";
import { LiquidationService } from "../modules/liquidacion/service";
import { ReceiptService } from "../modules/recibo/service";

// Adapters
import { LocalStorageAttendanceRepository } from "../adapters/LocalStorageAttendanceRepository";
import { LocalStorageLegajoRepository } from "../adapters/LocalStorageLegajoRepository";

// Ports
import type { LegajoPort } from "../modules/legajo/port";

interface Services {
  attendanceService: AttendanceService;
  liquidationService: LiquidationService;
  receiptService: ReceiptService;
  legajoRepository: LegajoPort;
}

const DependencyContext = createContext<Services | null>(null);

interface DependencyProviderProps {
  children: ReactNode;
}

export function DependencyProvider({ children }: DependencyProviderProps) {
  const services = useMemo<Services>(() => {
    // Create adapters (implementing ports)
    const attendanceRepository = new LocalStorageAttendanceRepository();
    const legajoRepository = new LocalStorageLegajoRepository();

    // Inject adapters into services
    const attendanceService = new AttendanceService(attendanceRepository);
    const liquidationService = new LiquidationService();
    const receiptService = new ReceiptService();

    return {
      attendanceService,
      liquidationService,
      receiptService,
      legajoRepository,
    };
  }, []);

  return (
    <DependencyContext.Provider value={services}>
      {children}
    </DependencyContext.Provider>
  );
}

// Custom hook for consuming services
export function useServices(): Services {
  const context = useContext(DependencyContext);
  if (!context) {
    throw new Error("useServices must be used within a DependencyProvider");
  }
  return context;
}

// Individual service hooks for convenience
export function useAttendanceService(): AttendanceService {
  return useServices().attendanceService;
}

export function useLiquidationService(): LiquidationService {
  return useServices().liquidationService;
}

export function useReceiptService(): ReceiptService {
  return useServices().receiptService;
}

export function useLegajoRepository(): LegajoPort {
  return useServices().legajoRepository;
}
