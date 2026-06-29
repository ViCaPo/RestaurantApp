import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type Tipo = "exito" | "error";
interface ToastItem {
  id: number;
  mensaje: string;
  tipo: Tipo;
}

interface ToastContextValue {
  exito: (mensaje: string) => void;
  error: (mensaje: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const siguienteId = useRef(0);

  const mostrar = useCallback((mensaje: string, tipo: Tipo) => {
    const id = siguienteId.current++;
    setToasts((t) => [...t, { id, mensaje, tipo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const value: ToastContextValue = {
    exito: (mensaje) => mostrar(mensaje, "exito"),
    error: (mensaje) => mostrar(mensaje, "error"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tipo}`}>
            {t.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}

export function mensajeDeError(e: unknown): string {
  return e instanceof Error ? e.message : "Ocurrió un error inesperado.";
}
