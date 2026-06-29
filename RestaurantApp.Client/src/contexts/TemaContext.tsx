import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type TemaVisual } from "../api";
import { aplicarTema } from "../tema";

interface TemaContextValue {
  tema: TemaVisual | null;
  recargar: () => Promise<void>;
}

const TemaContext = createContext<TemaContextValue | null>(null);

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<TemaVisual | null>(null);

  const recargar = useCallback(async () => {
    const actual = await api.tema.obtener();
    setTema(actual);
    aplicarTema(actual);
  }, []);

  useEffect(() => {
    recargar().catch(() => {});
  }, [recargar]);

  return <TemaContext.Provider value={{ tema, recargar }}>{children}</TemaContext.Provider>;
}

export function useTema() {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error("useTema debe usarse dentro de TemaProvider");
  return ctx;
}
