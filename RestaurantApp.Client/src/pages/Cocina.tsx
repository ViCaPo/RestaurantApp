import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type ItemCocina, type EstadoItem, type Estacion } from "../api";
import { obtenerConexionComandas } from "../signalr";
import EnlaceAdmin from "../components/EnlaceAdmin";
import { useSesion } from "../contexts/SesionContext";
import { imprimirComanda, type DatosComanda } from "../ticket";

const SIGUIENTE_ESTADO: Record<EstadoItem, EstadoItem | null> = {
  Pendiente: "Preparando",
  Preparando: "Listo",
  Listo: "Entregado",
  Entregado: null,
};

const TEXTO_ACCION: Record<EstadoItem, string> = {
  Pendiente: "Iniciar",
  Preparando: "Marcar listo",
  Listo: "Entregar",
  Entregado: "",
};

function minutosTranscurridos(fechaIso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(fechaIso).getTime()) / 60000));
}

function tiempoTranscurrido(fechaIso: string): string {
  const minutos = minutosTranscurridos(fechaIso);
  return minutos < 1 ? "ahora" : `hace ${minutos} min`;
}

function urgenciaPorTiempo(minutos: number): "" | "ticket-cocina-tardando" | "ticket-cocina-urgente" {
  if (minutos >= 15) return "ticket-cocina-urgente";
  if (minutos >= 8) return "ticket-cocina-tardando";
  return "";
}

function agruparPorMesa(items: ItemCocina[]) {
  const grupos = new Map<number, ItemCocina[]>();
  for (const item of items) {
    const lista = grupos.get(item.comandaId) ?? [];
    lista.push(item);
    grupos.set(item.comandaId, lista);
  }
  return Array.from(grupos.values())
    .map((lista) => ({
      comandaId: lista[0].comandaId,
      mesaNombre: lista[0].mesaNombre,
      fechaMasAntigua: lista.reduce((min, i) => (i.fechaCreacion < min ? i.fechaCreacion : min), lista[0].fechaCreacion),
      items: lista.sort((a, b) => a.fechaCreacion.localeCompare(b.fechaCreacion)),
    }))
    .sort((a, b) => a.fechaMasAntigua.localeCompare(b.fechaMasAntigua));
}

function itemsCocinaAComanda(mesaNombre: string, comandaId: number, items: ItemCocina[], estacion?: string | null): DatosComanda {
  return {
    mesa: mesaNombre,
    comandaId,
    fecha: new Date(),
    estacion,
    items: items.map((i) => ({
      cantidad: i.cantidad,
      nombre: i.productoNombre,
      numeroComensal: i.numeroComensal,
      notas: i.notas,
      extras: i.extras,
    })),
  };
}

function reproducirAlerta() {
  try {
    const ContextoAudio = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new ContextoAudio();
    const osc = ctx.createOscillator();
    const ganancia = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    ganancia.gain.setValueAtTime(0.15, ctx.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(ganancia);
    ganancia.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => ctx.close();
  } catch {
    /* audio no disponible */
  }
}

export default function Cocina() {
  const { cerrarSesion } = useSesion();
  const navigate = useNavigate();
  const [items, setItems] = useState<ItemCocina[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [idsNuevos, setIdsNuevos] = useState<number[]>([]);
  const [estaciones, setEstaciones] = useState<Estacion[]>([]);
  const [estacionId, setEstacionId] = useState<number | "">("");
  const [, setTick] = useState(0);
  const loteAutoImpresion = useRef(new Map<number, { items: ItemCocina[]; temporizador: ReturnType<typeof setTimeout> }>());

  const estacionActual = estaciones.find((e) => e.id === estacionId) ?? null;

  useEffect(() => {
    const intervalo = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(intervalo);
  }, []);

  async function cargar(filtro?: number | "") {
    try {
      const datos = await api.comandas.obtenerItemsCocina(filtro || null);
      setItems(datos);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    api.estaciones.listar().then(setEstaciones).catch(() => {});
  }, []);

  useEffect(() => {
    cargar(estacionId);
    const conexion = obtenerConexionComandas();

    function coincideEstacion(item: ItemCocina) {
      return !estacionId || item.estacionId === estacionId;
    }

    function alRecibirNuevo(item: ItemCocina) {
      if (!coincideEstacion(item)) return;
      setItems((actual) => [...actual, item]);
      reproducirAlerta();
      setIdsNuevos((actual) => [...actual, item.itemId]);
      setTimeout(() => setIdsNuevos((actual) => actual.filter((id) => id !== item.itemId)), 3000);

      // Auto-impresión: solo si esta pantalla está filtrada a UNA estación y esa
      // estación tiene activada la impresión automática. Se agrupan los items que
      // llegan juntos (mismo envío a cocina) para imprimir una sola comanda.
      if (estacionActual?.imprimirComandaAutomatico) {
        const lote = loteAutoImpresion.current;
        const existente = lote.get(item.comandaId);
        if (existente) clearTimeout(existente.temporizador);
        const itemsDelLote = existente ? [...existente.items, item] : [item];
        const temporizador = setTimeout(() => {
          lote.delete(item.comandaId);
          imprimirComanda(
            itemsCocinaAComanda(item.mesaNombre, item.comandaId, itemsDelLote, estacionActual.nombre),
            estacionActual.anchoPapelComandaMm
          );
        }, 700);
        lote.set(item.comandaId, { items: itemsDelLote, temporizador });
      }
    }

    function alRecibirActualizado(item: ItemCocina) {
      setItems((actual) =>
        item.estado === "Entregado" || !coincideEstacion(item)
          ? actual.filter((i) => i.itemId !== item.itemId)
          : actual.some((i) => i.itemId === item.itemId)
          ? actual.map((i) => (i.itemId === item.itemId ? item : i))
          : [...actual, item]
      );
    }

    conexion.on("item-nuevo", alRecibirNuevo);
    conexion.on("item-actualizado", alRecibirActualizado);

    return () => {
      conexion.off("item-nuevo", alRecibirNuevo);
      conexion.off("item-actualizado", alRecibirActualizado);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estacionId, estaciones]);

  async function avanzar(item: ItemCocina) {
    const siguiente = SIGUIENTE_ESTADO[item.estado];
    if (!siguiente) return;
    try {
      await api.comandas.actualizarEstadoItem(item.itemId, siguiente);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function salir() {
    cerrarSesion();
    navigate("/login");
  }

  const columnas: { estado: EstadoItem; titulo: string }[] = [
    { estado: "Pendiente", titulo: "Pendientes" },
    { estado: "Preparando", titulo: "En preparación" },
    { estado: "Listo", titulo: "Listos para entregar" },
  ];

  return (
    <div className="cocina-shell">
      <header className="cocina-header">
        <div>
          <h1>Cocina</h1>
          <p className="texto-tenue">{items.length} pedidos activos</p>
        </div>
        <div className="cocina-header-acciones">
          {estaciones.length > 0 && (
            <select
              className="selector-estacion-cocina"
              value={estacionId}
              onChange={(e) => setEstacionId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">Todas las estaciones</option>
              {estaciones.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.nombre}
                </option>
              ))}
            </select>
          )}
          <EnlaceAdmin />
          <Link to="/" className="enlace-volver">
            <i className="ti ti-arrow-left" aria-hidden="true"></i> Volver a Mesas
          </Link>
          <button className="boton-secundario" onClick={salir}>
            <i className="ti ti-logout" aria-hidden="true"></i> Cerrar sesión
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="cocina-columnas">
        {columnas.map((col) => {
          const itemsColumna = items.filter((i) => i.estado === col.estado);
          return (
            <div key={col.estado} className={`cocina-columna cocina-columna-${col.estado.toLowerCase()}`}>
              <h2>
                {col.titulo} <span className="cocina-columna-contador">{itemsColumna.length}</span>
              </h2>
              <div className="cocina-tarjetas">
                {agruparPorMesa(itemsColumna).map((grupo) => {
                  const minutos = minutosTranscurridos(grupo.fechaMasAntigua);
                  return (
                    <div
                      key={grupo.mesaNombre + grupo.fechaMasAntigua}
                      className={`ticket-cocina ${urgenciaPorTiempo(minutos)}`}
                    >
                      <div className="ticket-cocina-header">
                        <span className="ticket-cocina-mesa">
                          <i className="ti ti-tools-kitchen-2" aria-hidden="true"></i> {grupo.mesaNombre}
                        </span>
                        <span className="ticket-cocina-header-derecha">
                          <span className="ticket-cocina-tiempo">
                            <i className="ti ti-clock" aria-hidden="true"></i> {tiempoTranscurrido(grupo.fechaMasAntigua)}
                          </span>
                          <button
                            className="boton-imprimir-comanda"
                            title="Imprimir comanda"
                            aria-label="Imprimir comanda"
                            onClick={() =>
                              imprimirComanda(
                                itemsCocinaAComanda(
                                  grupo.mesaNombre,
                                  grupo.comandaId,
                                  grupo.items,
                                  estacionActual?.nombre
                                ),
                                estacionActual?.anchoPapelComandaMm ?? 80
                              )
                            }
                          >
                            <i className="ti ti-printer" aria-hidden="true"></i>
                          </button>
                        </span>
                      </div>
                      {grupo.items.map((item) => (
                        <div
                          key={item.itemId}
                          className={`ticket-cocina-item ${idsNuevos.includes(item.itemId) ? "ticket-cocina-item-nuevo" : ""}`}
                        >
                          <div className="ticket-cocina-item-info">
                            <p className="tarjeta-comanda-cocina-producto">
                              {item.cantidad}x {item.productoNombre}
                              {item.estacion && <span className="badge-estacion"> {item.estacion}</span>}
                            </p>
                            {item.extras.length > 0 && (
                              <ul className="tarjeta-comanda-cocina-extras-lista">
                                {item.extras.map((extra, i) => (
                                  <li key={i} className="tarjeta-comanda-cocina-extras">
                                    <i className="ti ti-plus" aria-hidden="true"></i> {extra}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {item.notas && <p className="tarjeta-comanda-cocina-notas">"{item.notas}"</p>}
                          </div>
                          <button className="boton-primario boton-accion-cocina" onClick={() => avanzar(item)}>
                            {TEXTO_ACCION[item.estado]}
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
                {itemsColumna.length === 0 && <p className="texto-tenue">Sin pedidos.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
