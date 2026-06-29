import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api, type Comanda as ComandaType, type Mesa, type Producto } from "../api";
import Modal from "../components/Modal";
import SelectorExtras from "../components/SelectorExtras";
import Badge from "../components/Badge";
import { useToast } from "../components/Toast";
import EnlaceAdmin from "../components/EnlaceAdmin";
import { useSesion } from "../contexts/SesionContext";
import { obtenerConexionComandas } from "../signalr";
import type { ItemCocina } from "../api";

const TONO_ESTADO_ITEM = {
  Pendiente: "gris",
  Preparando: "amarillo",
  Listo: "verde",
  Entregado: "azul",
} as const;

export default function Comanda() {
  const { id } = useParams();
  const comandaId = Number(id);
  const toast = useToast();
  const navigate = useNavigate();
  const { cerrarSesion } = useSesion();

  const [comanda, setComanda] = useState<ComandaType | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [productoParaExtras, setProductoParaExtras] = useState<Producto | null>(null);
  const [extraIdsSeleccionados, setExtraIdsSeleccionados] = useState<number[]>([]);
  const [comensalActivo, setComensalActivo] = useState<number | null>(null);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [modalCambiarMesa, setModalCambiarMesa] = useState(false);
  const [modalUnirMesa, setModalUnirMesa] = useState(false);

  async function recargar() {
    try {
      const c = await api.comandas.obtener(comandaId);
      setComanda(c);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function recargarMesas() {
    try {
      setMesas(await api.mesas.listar());
    } catch {
      /* no crítico para esta pantalla */
    }
  }

  useEffect(() => {
    recargar();
    recargarMesas();
    api.productos.listar().then(setProductos).catch((e) => setError(e.message));

    const conexion = obtenerConexionComandas();
    function alActualizar(item: ItemCocina) {
      if (item.comandaId !== comandaId) return;
      recargar();
      if (item.estado === "Listo") toast.exito(`${item.productoNombre} está listo para servir.`);
    }
    conexion.on("item-actualizado", alActualizar);
    return () => conexion.off("item-actualizado", alActualizar);
  }, [comandaId]);

  async function agregar(productoId: number, extraIds?: number[]) {
    try {
      const producto = productos.find((p) => p.id === productoId);
      await api.comandas.agregarItem(comandaId, productoId, 1, undefined, extraIds, comensalActivo);
      await recargar();
      toast.exito(`${producto?.nombre ?? "Producto"} agregado al pedido.`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function enviarACocina() {
    try {
      await api.comandas.enviarACocina(comandaId);
      await recargar();
      toast.exito("Pedido enviado a cocina.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function clickProducto(p: Producto) {
    if (p.extrasDisponibles.length > 0) {
      setProductoParaExtras(p);
      setExtraIdsSeleccionados([]);
    } else {
      agregar(p.id);
    }
  }

  function toggleExtra(extraId: number) {
    setExtraIdsSeleccionados((actual) =>
      actual.includes(extraId) ? actual.filter((id) => id !== extraId) : [...actual, extraId]
    );
  }

  async function confirmarConExtras() {
    if (!productoParaExtras) return;
    await agregar(productoParaExtras.id, extraIdsSeleccionados);
    setProductoParaExtras(null);
  }

  async function agregarSinExtras() {
    if (!productoParaExtras) return;
    await agregar(productoParaExtras.id);
    setProductoParaExtras(null);
  }

  async function cancelar(itemId: number) {
    const motivo = window.prompt("Motivo de cancelación:");
    if (!motivo) return;
    try {
      await api.comandas.cancelarItem(itemId, motivo);
      await recargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function cambiarMesa(nuevaMesaId: number) {
    try {
      await api.comandas.cambiarMesa(comandaId, nuevaMesaId);
      setModalCambiarMesa(false);
      await Promise.all([recargar(), recargarMesas()]);
      toast.exito("Mesa cambiada.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function unirMesa(otraMesa: Mesa) {
    if (!otraMesa.comandaActivaId) return;
    try {
      await api.comandas.unirMesas(comandaId, otraMesa.comandaActivaId);
      setModalUnirMesa(false);
      await Promise.all([recargar(), recargarMesas()]);
      toast.exito(`Mesa ${otraMesa.nombre} unida a esta cuenta.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function salir() {
    cerrarSesion();
    navigate("/login");
  }

  if (!comanda) return <p>{error ?? "Cargando..."}</p>;

  const hayPorEnviar = comanda.items.some((it) => !it.cancelado && !it.enviadoACocina);
  const mostrarComensales = comanda.numeroComensales > 1;

  const gruposPorComensal = mostrarComensales
    ? Array.from({ length: comanda.numeroComensales }, (_, i) => i + 1)
        .map((n) => ({ numero: n, items: comanda.items.filter((it) => it.numeroComensal === n) }))
        .concat([{ numero: 0, items: comanda.items.filter((it) => !it.numeroComensal) }])
        .filter((g) => g.items.length > 0)
    : [{ numero: 0, items: comanda.items }];

  return (
    <div className="comanda-shell">
      <header className="comanda-header">
        <div>
          <h1>Mesa {comanda.mesa?.nombre}</h1>
          <p className="texto-tenue">Comanda #{comanda.id}</p>
        </div>
        <div className="comanda-header-acciones">
          <button className="boton-secundario" onClick={() => setModalCambiarMesa(true)}>
            <i className="ti ti-replace" aria-hidden="true"></i> Cambiar de mesa
          </button>
          <button className="boton-secundario" onClick={() => setModalUnirMesa(true)}>
            <i className="ti ti-arrows-join" aria-hidden="true"></i> Unir con otra mesa
          </button>
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

      <h2>Comanda</h2>
      {gruposPorComensal.map((grupo) => (
        <div key={grupo.numero} className="grupo-comensal">
          {mostrarComensales && (
            <h3 className="grupo-comensal-titulo">
              {grupo.numero === 0 ? "Para compartir / sin asignar" : `Comensal ${grupo.numero}`}
            </h3>
          )}
          <ul className="lista-items-comanda">
            {grupo.items.map((it) => (
              <li key={it.id} className={`item-comanda ${it.cancelado ? "item-comanda-cancelado" : ""}`}>
                <div className="item-comanda-info">
                  <span className="item-comanda-nombre">
                    {it.cantidad}x {it.producto?.nombre}
                  </span>
                  {it.extras.length > 0 && (
                    <span className="item-comanda-extras">+ {it.extras.map((e) => e.nombre).join(", ")}</span>
                  )}
                </div>
                <div className="item-comanda-acciones">
                  <span className="item-comanda-precio">${(it.precioUnitarioTotal * it.cantidad).toFixed(2)}</span>
                  {it.cancelado ? (
                    <Badge texto="Cancelado" tono="rojo" />
                  ) : !it.enviadoACocina ? (
                    <Badge texto="Por enviar" tono="gris" />
                  ) : (
                    <Badge texto={it.estado} tono={TONO_ESTADO_ITEM[it.estado]} />
                  )}
                  {!it.cancelado && (
                    <button className="boton-secundario" onClick={() => cancelar(it.id)}>
                      Cancelar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {comanda.items.length === 0 && <p className="celda-vacia">Aún no hay productos agregados.</p>}

      <h2>Agregar producto</h2>
      {mostrarComensales && (
        <div className="selector-comensal">
          <span className="texto-tenue">Agregar para:</span>
          <button
            className={`chip-comensal ${comensalActivo === null ? "chip-comensal-activo" : ""}`}
            onClick={() => setComensalActivo(null)}
          >
            Para compartir
          </button>
          {Array.from({ length: comanda.numeroComensales }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={`chip-comensal ${comensalActivo === n ? "chip-comensal-activo" : ""}`}
              onClick={() => setComensalActivo(n)}
            >
              Comensal {n}
            </button>
          ))}
        </div>
      )}
      <div className="grid-productos">
        {productos.map((p) => (
          <button key={p.id} disabled={!p.disponible} onClick={() => clickProducto(p)}>
            {p.nombre} — ${p.precio.toFixed(2)}
            {p.extrasDisponibles.length > 0 && <span className="indicador-extras"> +extras</span>}
          </button>
        ))}
      </div>

      <div className="comanda-pie">
        <h2>Total: ${comanda.total.toFixed(2)}</h2>
        <div className="comanda-pie-acciones">
          {hayPorEnviar && (
            <button className="boton-primario" onClick={enviarACocina}>
              <i className="ti ti-send" aria-hidden="true"></i> Enviar pedido a cocina
            </button>
          )}
          <span className="texto-tenue">El cobro lo realiza el cajero desde Caja.</span>
        </div>
      </div>

      {productoParaExtras && (
        <Modal titulo={`Extras para ${productoParaExtras.nombre}`} onClose={() => setProductoParaExtras(null)}>
          <SelectorExtras
            extras={productoParaExtras.extrasDisponibles}
            seleccionados={extraIdsSeleccionados}
            onToggle={toggleExtra}
          />
          <div className="form-modal-acciones">
            <button className="boton-secundario" onClick={agregarSinExtras}>
              Sin extras
            </button>
            <button className="boton-primario" onClick={confirmarConExtras}>
              Agregar
            </button>
          </div>
        </Modal>
      )}

      {modalCambiarMesa && (
        <Modal titulo="Cambiar de mesa" onClose={() => setModalCambiarMesa(false)}>
          <p className="texto-tenue">Elige una mesa libre para mover esta cuenta.</p>
          <div className="grid-mesas-selector">
            {mesas
              .filter((m) => m.estado === "Libre" && m.id !== comanda.mesaId)
              .map((m) => (
                <button key={m.id} className="boton-secundario" onClick={() => cambiarMesa(m.id)}>
                  {m.nombre}
                </button>
              ))}
          </div>
          {mesas.filter((m) => m.estado === "Libre" && m.id !== comanda.mesaId).length === 0 && (
            <p className="celda-vacia">No hay mesas libres disponibles.</p>
          )}
        </Modal>
      )}

      {modalUnirMesa && (
        <Modal titulo="Unir con otra mesa" onClose={() => setModalUnirMesa(false)}>
          <p className="texto-tenue">
            Elige otra mesa con cuenta abierta. Sus productos y comensales se agregarán a esta cuenta y esa mesa
            quedará libre.
          </p>
          <div className="grid-mesas-selector">
            {mesas
              .filter((m) => m.estado === "Ocupada" && m.comandaActivaId && m.id !== comanda.mesaId)
              .map((m) => (
                <button key={m.id} className="boton-secundario" onClick={() => unirMesa(m)}>
                  {m.nombre}
                </button>
              ))}
          </div>
          {mesas.filter((m) => m.estado === "Ocupada" && m.comandaActivaId && m.id !== comanda.mesaId).length ===
            0 && <p className="celda-vacia">No hay otras mesas con cuenta abierta.</p>}
        </Modal>
      )}
    </div>
  );
}
