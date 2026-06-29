export type EstadoMesa = "Libre" | "Ocupada" | "Reservada" | "Cuenta";
export type EstadoComanda = "Abierta" | "Cobrada" | "Cancelada";
export type EstadoItem = "Pendiente" | "Preparando" | "Listo" | "Entregado";
export type MetodoPago = "Efectivo" | "Tarjeta" | "Transferencia" | "Mixto";
export type Rol = "Administrador" | "Cajero" | "Mesero" | "Cocinero";

export interface Mesa {
  id: number;
  nombre: string;
  capacidad: number;
  zona?: string | null;
  estado: EstadoMesa;
  comandaActivaId?: number | null;
  meseroAsignadoId?: number | null;
  meseroAsignado?: Usuario | null;
}

export interface Extra {
  id: number;
  nombre: string;
  precioAdicional: number;
}

export interface Estacion {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string | null;
  sku?: string | null;
  precio: number;
  categoriaId: number;
  categoria?: Categoria;
  estacionId?: number | null;
  estacion?: Estacion | null;
  disponible: boolean;
  activo: boolean;
  extrasDisponibles: Extra[];
}

export interface Categoria {
  id: number;
  nombre: string;
  orden: number;
  activo: boolean;
}

export interface Usuario {
  id: number;
  nombre: string;
  /** El backend ya no expone el PIN; solo se envía al crear/editar. */
  pin?: string;
  rol: Rol;
  activo: boolean;
}

export interface RespuestaLogin {
  token: string;
  usuario: Usuario;
}

export interface TemaVisual {
  id: number;
  colorFondo: string;
  colorSuperficie: string;
  colorBorde: string;
  colorTexto: string;
  colorTextoTenue: string;
  colorPrimario: string;
  colorPrimarioClaro: string;
  colorPrimarioOscuro: string;
  colorExito: string;
  colorExitoClaro: string;
  colorError: string;
  colorErrorClaro: string;
  colorAdvertencia: string;
  colorAdvertenciaClaro: string;
  colorInfo: string;
  colorInfoClaro: string;
  logoUrl?: string | null;
  nombreRestaurante: string;
}

export interface ItemCocina {
  itemId: number;
  comandaId: number;
  mesaId: number;
  meseroId: number;
  mesaNombre: string;
  productoNombre: string;
  estacionId?: number | null;
  estacion?: string | null;
  cantidad: number;
  numeroComensal?: number | null;
  notas?: string | null;
  extras: string[];
  estado: EstadoItem;
  fechaCreacion: string;
}

export interface ComandaItemExtra {
  id: number;
  extraId: number;
  nombre: string;
  precioAdicional: number;
}

export interface ComandaItem {
  id: number;
  comandaId: number;
  productoId: number;
  producto?: Producto;
  precioUnitario: number;
  precioUnitarioTotal: number;
  cantidad: number;
  numeroComensal?: number | null;
  notas?: string | null;
  estado: EstadoItem;
  enviadoACocina: boolean;
  cancelado: boolean;
  motivoCancelacion?: string | null;
  extras: ComandaItemExtra[];
}

export interface Comanda {
  id: number;
  mesaId: number;
  mesa?: Mesa;
  meseroId: number;
  numeroComensales: number;
  estado: EstadoComanda;
  items: ComandaItem[];
  subtotal: number;
  descuento: number;
  total: number;
  notas?: string | null;
}

const CLAVE_TOKEN = "sesion-token";

export function guardarToken(token: string | null) {
  if (token) localStorage.setItem(CLAVE_TOKEN, token);
  else localStorage.removeItem(CLAVE_TOKEN);
}

export function obtenerToken(): string | null {
  return localStorage.getItem(CLAVE_TOKEN);
}

/** fetch con el token de sesión adjunto y manejo central de 401 (sesión inválida). */
function fetchApi(input: string, init: RequestInit = {}): Promise<Response> {
  const token = obtenerToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return window.fetch(input, { ...init, headers }).then((res) => {
    if (res.status === 401) {
      localStorage.removeItem(CLAVE_TOKEN);
      localStorage.removeItem("sesion-mesero");
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    return res;
  });
}

async function manejarRespuesta<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? "Error en la solicitud");
  }
  return res.json();
}

export const api = {
  mesas: {
    listar: () => fetchApi("/api/mesas").then((r) => manejarRespuesta<Mesa[]>(r)),
    crear: (mesa: Partial<Mesa>) =>
      fetchApi("/api/mesas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mesa),
      }).then((r) => manejarRespuesta<Mesa>(r)),
    editar: (id: number, mesa: Partial<Mesa>) =>
      fetchApi(`/api/mesas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mesa),
      }).then((r) => manejarRespuesta<Mesa>(r)),
  },
  productos: {
    listar: (filtros?: { buscar?: string; categoriaId?: number; disponible?: boolean }) => {
      const params = new URLSearchParams();
      if (filtros?.buscar) params.set("buscar", filtros.buscar);
      if (filtros?.categoriaId != null) params.set("categoriaId", String(filtros.categoriaId));
      if (filtros?.disponible != null) params.set("disponible", String(filtros.disponible));
      const query = params.toString();
      return fetchApi(`/api/productos${query ? `?${query}` : ""}`).then((r) => manejarRespuesta<Producto[]>(r));
    },
    crear: (producto: Partial<Producto>) =>
      fetchApi("/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto),
      }).then((r) => manejarRespuesta<Producto>(r)),
    editar: (id: number, producto: Partial<Producto>) =>
      fetchApi(`/api/productos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto),
      }).then((r) => manejarRespuesta<Producto>(r)),
    asignarExtras: (id: number, extraIds: number[]) =>
      fetchApi(`/api/productos/${id}/extras`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraIds }),
      }).then((r) => manejarRespuesta<Extra[]>(r)),
    cambiarDisponibilidad: (id: number, disponible: boolean) =>
      fetchApi(`/api/productos/${id}/disponibilidad?disponible=${disponible}`, {
        method: "PUT",
      }).then((r) => manejarRespuesta<Producto>(r)),
    desactivar: (id: number) =>
      fetchApi(`/api/productos/${id}`, { method: "DELETE" }).then((r) =>
        manejarRespuesta<{ mensaje: string }>(r)
      ),
  },
  categorias: {
    listar: () => fetchApi("/api/categorias").then((r) => manejarRespuesta<Categoria[]>(r)),
    crear: (categoria: Partial<Categoria>) =>
      fetchApi("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoria),
      }).then((r) => manejarRespuesta<Categoria>(r)),
    editar: (id: number, categoria: Partial<Categoria>) =>
      fetchApi(`/api/categorias/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoria),
      }).then((r) => manejarRespuesta<Categoria>(r)),
    desactivar: (id: number) =>
      fetchApi(`/api/categorias/${id}`, { method: "DELETE" }).then((r) =>
        manejarRespuesta<{ mensaje: string }>(r)
      ),
  },
  extras: {
    listar: () => fetchApi("/api/extras").then((r) => manejarRespuesta<Extra[]>(r)),
    crear: (extra: { nombre: string; precioAdicional: number }) =>
      fetchApi("/api/extras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(extra),
      }).then((r) => manejarRespuesta<Extra>(r)),
    editar: (id: number, extra: { nombre: string; precioAdicional: number }) =>
      fetchApi(`/api/extras/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(extra),
      }).then((r) => manejarRespuesta<Extra>(r)),
    desactivar: (id: number) =>
      fetchApi(`/api/extras/${id}`, { method: "DELETE" }).then((r) =>
        manejarRespuesta<{ mensaje: string }>(r)
      ),
  },
  estaciones: {
    listar: () => fetchApi("/api/estaciones").then((r) => manejarRespuesta<Estacion[]>(r)),
    crear: (nombre: string) =>
      fetchApi("/api/estaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      }).then((r) => manejarRespuesta<Estacion>(r)),
    editar: (id: number, nombre: string) =>
      fetchApi(`/api/estaciones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      }).then((r) => manejarRespuesta<Estacion>(r)),
    desactivar: (id: number) =>
      fetchApi(`/api/estaciones/${id}`, { method: "DELETE" }).then((r) =>
        manejarRespuesta<{ mensaje: string }>(r)
      ),
  },
  usuarios: {
    listar: () => fetchApi("/api/usuarios").then((r) => manejarRespuesta<Usuario[]>(r)),
    login: (pin: string) =>
      fetchApi("/api/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      }).then((r) => manejarRespuesta<RespuestaLogin>(r)),
    logout: () =>
      fetchApi("/api/usuarios/logout", { method: "POST" })
        .then((r) => manejarRespuesta<{ mensaje: string }>(r))
        .catch(() => undefined),
    crear: (usuario: Partial<Usuario>) =>
      fetchApi("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario),
      }).then((r) => manejarRespuesta<Usuario>(r)),
    desactivar: (id: number) =>
      fetchApi(`/api/usuarios/${id}`, { method: "DELETE" }).then((r) =>
        manejarRespuesta<{ mensaje: string }>(r)
      ),
  },
  tema: {
    obtener: () => fetchApi("/api/tema").then((r) => manejarRespuesta<TemaVisual>(r)),
    actualizar: (tema: TemaVisual) =>
      fetchApi("/api/tema", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tema),
      }).then((r) => manejarRespuesta<TemaVisual>(r)),
    subirLogo: (archivo: File) => {
      const formData = new FormData();
      formData.append("archivo", archivo);
      return fetchApi("/api/tema/logo", { method: "POST", body: formData }).then((r) =>
        manejarRespuesta<{ logoUrl: string }>(r)
      );
    },
  },
  comandas: {
    abrir: (mesaId: number, meseroId: number, comensales: number) =>
      fetchApi("/api/comandas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesaId, meseroId, comensales }),
      }).then((r) => manejarRespuesta<Comanda>(r)),
    obtener: (id: number) =>
      fetchApi(`/api/comandas/${id}`).then((r) => manejarRespuesta<Comanda>(r)),
    agregarItem: (
      comandaId: number,
      productoId: number,
      cantidad: number,
      notas?: string,
      extraIds?: number[],
      numeroComensal?: number | null
    ) =>
      fetchApi(`/api/comandas/${comandaId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productoId, cantidad, notas, extraIds, numeroComensal }),
      }).then((r) => manejarRespuesta<ComandaItem>(r)),
    cancelarItem: (itemId: number, motivo: string) =>
      fetchApi(`/api/comandas/items/${itemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo }),
      }).then((r) => manejarRespuesta<{ mensaje: string }>(r)),
    obtenerItemsCocina: (estacionId?: number | null) =>
      fetchApi(`/api/comandas/cocina/items${estacionId ? `?estacionId=${estacionId}` : ""}`).then((r) =>
        manejarRespuesta<ItemCocina[]>(r)
      ),
    enviarACocina: (comandaId: number) =>
      fetchApi(`/api/comandas/${comandaId}/enviar-cocina`, { method: "POST" }).then((r) =>
        manejarRespuesta<ComandaItem[]>(r)
      ),
    actualizarEstadoItem: (itemId: number, estado: EstadoItem) =>
      fetchApi(`/api/comandas/items/${itemId}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      }).then((r) => manejarRespuesta<ComandaItem>(r)),
    cobrar: (
      comandaId: number,
      metodo: MetodoPago,
      propina: number,
      cajeroId: number,
      montoRecibido?: number,
      montoEfectivo?: number,
      montoTarjeta?: number
    ) =>
      fetchApi(`/api/comandas/${comandaId}/cobrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metodo, propina, cajeroId, montoRecibido, montoEfectivo, montoTarjeta }),
      }).then((r) => manejarRespuesta<unknown>(r)),
    cambiarMesa: (comandaId: number, nuevaMesaId: number) =>
      fetchApi(`/api/comandas/${comandaId}/mesa`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nuevaMesaId }),
      }).then((r) => manejarRespuesta<Comanda>(r)),
    unirMesas: (comandaDestinoId: number, comandaOrigenId: number) =>
      fetchApi(`/api/comandas/${comandaDestinoId}/unir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comandaOrigenId }),
      }).then((r) => manejarRespuesta<Comanda>(r)),
  },
};
