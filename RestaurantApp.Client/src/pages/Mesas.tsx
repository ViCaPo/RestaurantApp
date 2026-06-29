import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type ItemCocina, type Mesa } from "../api";
import Header from "../components/Header";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import { useSesion } from "../contexts/SesionContext";
import { useToast } from "../components/Toast";
import { obtenerConexionComandas } from "../signalr";

const TONO_ESTADO_MESA = {
  Libre: "verde",
  Ocupada: "rojo",
  Reservada: "amarillo",
  Cuenta: "azul",
} as const;

const ICONO_ESTADO_MESA: Record<Mesa["estado"], string> = {
  Libre: "ti-circle-check",
  Ocupada: "ti-users",
  Reservada: "ti-clock",
  Cuenta: "ti-receipt",
};

function agruparPorZona(mesas: Mesa[]) {
  const grupos = new Map<string, Mesa[]>();
  for (const mesa of mesas) {
    const zona = mesa.zona?.trim() || "Sin zona";
    grupos.set(zona, [...(grupos.get(zona) ?? []), mesa]);
  }
  return Array.from(grupos.entries());
}

export default function Mesas() {
  const { usuario, cerrarSesion } = useSesion();
  const toast = useToast();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mesaParaAbrir, setMesaParaAbrir] = useState<Mesa | null>(null);
  const [comensales, setComensales] = useState(2);
  const [verTodas, setVerTodas] = useState(false);
  const [mesasConPedidoListo, setMesasConPedidoListo] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    api.mesas.listar().then(setMesas).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!usuario) return;
    const usuarioId = usuario.id;
    const conexion = obtenerConexionComandas();

    function alActualizar(item: ItemCocina) {
      if (item.estado === "Listo" && item.meseroId === usuarioId) {
        toast.exito(`Mesa ${item.mesaNombre}: ${item.productoNombre} está listo para servir.`);
        setMesasConPedidoListo((actual) => new Set(actual).add(item.mesaId));
      }
    }

    conexion.on("item-actualizado", alActualizar);
    return () => conexion.off("item-actualizado", alActualizar);
  }, [usuario, toast]);

  const mesasVisibles = verTodas
    ? mesas
    : mesas.filter((m) => m.meseroAsignadoId == null || m.meseroAsignadoId === usuario?.id);

  function abrirMesa(mesa: Mesa) {
    if (mesa.estado === "Ocupada" && mesa.comandaActivaId) {
      setMesasConPedidoListo((actual) => {
        const nuevo = new Set(actual);
        nuevo.delete(mesa.id);
        return nuevo;
      });
      navigate(`/comanda/${mesa.comandaActivaId}`);
      return;
    }
    setComensales(Math.min(2, mesa.capacidad));
    setMesaParaAbrir(mesa);
  }

  async function confirmarAbrirMesa(e: FormEvent) {
    e.preventDefault();
    if (!mesaParaAbrir || !usuario) return;
    try {
      const comanda = await api.comandas.abrir(mesaParaAbrir.id, usuario.id, comensales);
      setMesaParaAbrir(null);
      navigate(`/comanda/${comanda.id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function salir() {
    cerrarSesion();
    navigate("/login");
  }

  const totalLibres = mesasVisibles.filter((m) => m.estado === "Libre").length;
  const totalOcupadas = mesasVisibles.filter((m) => m.estado === "Ocupada").length;

  return (
    <div className="mesas-shell">
      <Header />
      <div className="mesas-encabezado">
        <div>
          <h1>Mesas</h1>
          {usuario && (
            <p className="texto-tenue">
              Hola, {usuario.nombre} · {totalLibres} libres · {totalOcupadas} ocupadas
            </p>
          )}
        </div>
        <div className="mesas-encabezado-acciones">
          <label className="toggle-ver-todas">
            <input type="checkbox" checked={verTodas} onChange={(e) => setVerTodas(e.target.checked)} />
            Ver todas las mesas
          </label>
          <button className="boton-secundario" onClick={salir}>
            <i className="ti ti-logout" aria-hidden="true"></i> Cerrar sesión
          </button>
        </div>
      </div>
      <div className="enlaces-mesas">
        {(usuario?.rol === "Cocinero" || usuario?.rol === "Administrador") && (
          <Link to="/cocina">
            <i className="ti ti-tools-kitchen-2" aria-hidden="true"></i> Cocina
          </Link>
        )}
        {(usuario?.rol === "Cajero" || usuario?.rol === "Administrador") && (
          <Link to="/caja">
            <i className="ti ti-cash" aria-hidden="true"></i> Caja
          </Link>
        )}
        {usuario?.rol === "Administrador" && (
          <Link to="/admin">
            <i className="ti ti-settings" aria-hidden="true"></i> Administración
          </Link>
        )}
      </div>
      {error && <p className="error">{error}</p>}

      {mesasVisibles.length === 0 && (
        <p className="celda-vacia">
          No tienes mesas asignadas todavía. Activa "Ver todas las mesas" o pide al administrador que te asigne
          algunas.
        </p>
      )}

      {agruparPorZona(mesasVisibles).map(([zona, mesasDeZona]) => (
        <section key={zona} className="seccion-zona">
          {agruparPorZona(mesasVisibles).length > 1 && <h2 className="titulo-zona">{zona}</h2>}
          <div className="grid-mesas">
            {mesasDeZona.map((m) => (
              <button
                key={m.id}
                className={`mesa mesa-${m.estado.toLowerCase()} ${mesasConPedidoListo.has(m.id) ? "mesa-pedido-listo" : ""}`}
                onClick={() => abrirMesa(m)}
              >
                {mesasConPedidoListo.has(m.id) && <span className="mesa-badge-listo">Pedido listo</span>}
                <i className={`ti ${ICONO_ESTADO_MESA[m.estado]} mesa-icono`} aria-hidden="true"></i>
                <strong className="mesa-nombre">{m.nombre}</strong>
                <Badge texto={m.estado} tono={TONO_ESTADO_MESA[m.estado]} />
                <span className="mesa-capacidad">
                  <i className="ti ti-friends" aria-hidden="true"></i> {m.capacidad}
                </span>
                {verTodas && m.meseroAsignado && <span className="mesa-mesero-asignado">{m.meseroAsignado.nombre}</span>}
              </button>
            ))}
          </div>
        </section>
      ))}

      {mesaParaAbrir && (
        <Modal titulo={`Abrir mesa ${mesaParaAbrir.nombre}`} onClose={() => setMesaParaAbrir(null)}>
          <form onSubmit={confirmarAbrirMesa} className="form-modal">
            <label>
              Número de comensales
              <input
                type="number"
                value={comensales}
                onChange={(e) => setComensales(Number(e.target.value))}
                min={1}
                max={mesaParaAbrir.capacidad}
                required
                autoFocus
              />
            </label>
            <div className="form-modal-acciones">
              <button type="button" className="boton-secundario" onClick={() => setMesaParaAbrir(null)}>
                Cancelar
              </button>
              <button type="submit" className="boton-primario">
                Abrir mesa
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
