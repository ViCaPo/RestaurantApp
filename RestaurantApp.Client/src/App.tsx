import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Mesas from "./pages/Mesas";
import Comanda from "./pages/Comanda";
import Cocina from "./pages/Cocina";
import Caja from "./pages/Caja";
import Administracion from "./pages/Administracion";
import Login from "./pages/Login";
import { ToastProvider } from "./components/Toast";
import { ConfirmacionProvider } from "./components/Confirmacion";
import { TemaProvider } from "./contexts/TemaContext";
import { SesionProvider, useSesion } from "./contexts/SesionContext";
import { rutaInicioPorRol } from "./roles";
import type { Rol } from "./api";
import "./App.css";

function RutaProtegida({ children, roles }: { children: ReactNode; roles?: Rol[] }) {
  const { usuario } = useSesion();
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to={rutaInicioPorRol(usuario.rol)} replace />;
  return <>{children}</>;
}

function App() {
  return (
    <TemaProvider>
      <ToastProvider>
        <ConfirmacionProvider>
        <SesionProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <RutaProtegida>
                    <Mesas />
                  </RutaProtegida>
                }
              />
              <Route
                path="/comanda/:id"
                element={
                  <RutaProtegida>
                    <Comanda />
                  </RutaProtegida>
                }
              />
              <Route
                path="/cocina"
                element={
                  <RutaProtegida roles={["Cocinero", "Administrador"]}>
                    <Cocina />
                  </RutaProtegida>
                }
              />
              <Route
                path="/caja"
                element={
                  <RutaProtegida roles={["Cajero", "Administrador"]}>
                    <Caja />
                  </RutaProtegida>
                }
              />
              <Route
                path="/admin"
                element={
                  <RutaProtegida roles={["Administrador"]}>
                    <Administracion />
                  </RutaProtegida>
                }
              />
            </Routes>
          </BrowserRouter>
        </SesionProvider>
        </ConfirmacionProvider>
      </ToastProvider>
    </TemaProvider>
  );
}

export default App;
