import * as signalR from "@microsoft/signalr";
import { obtenerToken } from "./api";

let conexion: signalR.HubConnection | null = null;

export function obtenerConexionComandas(): signalR.HubConnection {
  if (!conexion) {
    conexion = new signalR.HubConnectionBuilder()
      .withUrl("/hubs/comandas", {
        accessTokenFactory: () => obtenerToken() ?? "",
      })
      .withAutomaticReconnect()
      .build();
    conexion.start().catch(() => {});
  }
  return conexion;
}
