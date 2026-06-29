import { createContext, useContext, useState, type ReactNode } from "react";
import { api, guardarToken, type Usuario } from "../api";

const CLAVE_STORAGE = "sesion-mesero";

interface SesionContextValue {
  usuario: Usuario | null;
  iniciarSesion: (pin: string) => Promise<Usuario>;
  cerrarSesion: () => void;
}

const SesionContext = createContext<SesionContextValue | null>(null);

function leerSesionGuardada(): Usuario | null {
  try {
    const datos = localStorage.getItem(CLAVE_STORAGE);
    return datos ? JSON.parse(datos) : null;
  } catch {
    return null;
  }
}

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(leerSesionGuardada);

  async function iniciarSesion(pin: string) {
    const { token, usuario: u } = await api.usuarios.login(pin);
    guardarToken(token);
    setUsuario(u);
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(u));
    return u;
  }

  function cerrarSesion() {
    api.usuarios.logout();
    guardarToken(null);
    setUsuario(null);
    localStorage.removeItem(CLAVE_STORAGE);
  }

  return (
    <SesionContext.Provider value={{ usuario, iniciarSesion, cerrarSesion }}>{children}</SesionContext.Provider>
  );
}

export function useSesion() {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error("useSesion debe usarse dentro de SesionProvider");
  return ctx;
}
