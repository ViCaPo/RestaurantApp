import type { Rol } from "./api";

export function rutaInicioPorRol(rol: Rol): string {
  switch (rol) {
    case "Administrador":
      return "/admin";
    case "Cocinero":
      return "/cocina";
    case "Cajero":
      return "/caja";
    default:
      return "/";
  }
}
