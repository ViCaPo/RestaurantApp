import type { Rol } from "./api";

export function rutaInicioPorRol(rol: Rol): string {
  switch (rol) {
    case "Cocinero":
      return "/cocina";
    case "Cajero":
      return "/caja";
    default:
      return "/";
  }
}
