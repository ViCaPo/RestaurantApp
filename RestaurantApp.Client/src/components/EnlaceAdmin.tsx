import { Link } from "react-router-dom";
import { useSesion } from "../contexts/SesionContext";

/**
 * Enlace a Administración (configuración del tema y del sistema).
 * Se muestra solo al rol Administrador y se puede usar en el header de
 * cualquier pantalla para configurar el tema desde donde se esté trabajando.
 */
export default function EnlaceAdmin({ className = "enlace-volver" }: { className?: string }) {
  const { usuario } = useSesion();
  if (usuario?.rol !== "Administrador") return null;
  return (
    <Link to="/admin" className={className}>
      <i className="ti ti-settings" aria-hidden="true"></i> Administración
    </Link>
  );
}
