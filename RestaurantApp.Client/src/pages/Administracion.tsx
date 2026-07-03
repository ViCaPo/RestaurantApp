import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Categoria, type ConfigTicket, type Estacion, type Extra, type Mesa, type Producto, type Rol, type TemaVisual, type Transaccion, type Usuario } from "../api";
import {
  construirComandaHtml,
  construirTicketHtml,
  estilosTicket,
  imprimirComanda,
  type DatosComanda,
  type DatosTicket,
} from "../ticket";
import { useToast, mensajeDeError } from "../components/Toast";
import { useConfirmacion } from "../components/Confirmacion";
import { useSesion } from "../contexts/SesionContext";
import { useTema } from "../contexts/TemaContext";
import { aplicarTema } from "../tema";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import Header from "../components/Header";
import SelectorExtras from "../components/SelectorExtras";

const ROLES: Rol[] = ["Administrador", "Cajero", "Mesero", "Cocinero"];

const ITEMS_NAV = ["Mesas", "Categorías", "Productos", "Extras", "Estaciones", "Usuarios", "Transacciones"] as const;
const ITEMS_CONFIGURACION = ["Apariencia", "Ticket", "Impresión"] as const;
type Tab = (typeof ITEMS_NAV)[number] | (typeof ITEMS_CONFIGURACION)[number];

const ICONOS: Record<Tab, string> = {
  Mesas: "ti-tools-kitchen-2",
  Categorías: "ti-category",
  Productos: "ti-soup",
  Extras: "ti-stack-2",
  Estaciones: "ti-chef-hat",
  Usuarios: "ti-users",
  Transacciones: "ti-receipt",
  Apariencia: "ti-palette",
  Ticket: "ti-printer",
  Impresión: "ti-printer",
};

/** Botón de acción compacto con icono y tooltip, para las columnas "Acciones". */
function AccionIcono({
  icono,
  etiqueta,
  onClick,
  peligro,
}: {
  icono: string;
  etiqueta: string;
  onClick: () => void;
  peligro?: boolean;
}) {
  return (
    <button
      type="button"
      className={`boton-icono ${peligro ? "boton-icono-peligro" : ""}`}
      onClick={onClick}
      title={etiqueta}
      aria-label={etiqueta}
    >
      <i className={`ti ${icono}`} aria-hidden="true"></i>
    </button>
  );
}

export default function Administracion() {
  const { cerrarSesion } = useSesion();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("Mesas");
  const [configuracionAbierta, setConfiguracionAbierta] = useState(false);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [estaciones, setEstaciones] = useState<Estacion[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const toast = useToast();

  async function recargarTodo() {
    try {
      const [m, c, p, ex, est, u] = await Promise.all([
        api.mesas.listar(),
        api.categorias.listar(),
        api.productos.listar({ estado: "todos" }),
        api.extras.listar(),
        api.estaciones.listar(),
        api.usuarios.listar(),
      ]);
      setMesas(m);
      setCategorias(c);
      setProductos(p);
      setExtras(ex);
      setEstaciones(est);
      setUsuarios(u);
    } catch (e) {
      toast.error(mensajeDeError(e));
    }
  }

  useEffect(() => {
    recargarTodo();
  }, []);

  function irA(t: Tab, esConfiguracion: boolean) {
    setTab(t);
    if (esConfiguracion) setConfiguracionAbierta(true);
  }

  function salir() {
    cerrarSesion();
    navigate("/login");
  }

  const mesasOcupadas = mesas.filter((m) => m.estado !== "Libre").length;
  const productosAgotados = productos.filter((p) => p.activo && !p.disponible).length;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-marca">
          <Header />
          <span className="admin-sidebar-subtitulo">Panel admin</span>
        </div>
        <nav className="admin-nav">
          {ITEMS_NAV.map((t) => (
            <button
              key={t}
              className={`admin-nav-item ${tab === t ? "admin-nav-item-activo" : ""}`}
              onClick={() => irA(t, false)}
            >
              <i className={`ti ${ICONOS[t]}`} aria-hidden="true"></i>
              {t}
            </button>
          ))}

          <button
            className="admin-nav-item admin-nav-grupo"
            onClick={() => setConfiguracionAbierta((a) => !a)}
          >
            <i className="ti ti-settings" aria-hidden="true"></i>
            Configuración
            <i className={`ti ti-chevron-down admin-nav-chevron ${configuracionAbierta ? "admin-nav-chevron-abierto" : ""}`} aria-hidden="true"></i>
          </button>
          {configuracionAbierta && (
            <div className="admin-nav-submenu">
              {ITEMS_CONFIGURACION.map((t) => (
                <button
                  key={t}
                  className={`admin-nav-item admin-nav-item-sub ${tab === t ? "admin-nav-item-activo" : ""}`}
                  onClick={() => irA(t, true)}
                >
                  <i className={`ti ${ICONOS[t]}`} aria-hidden="true"></i>
                  {t}
                </button>
              ))}
            </div>
          )}
        </nav>
        <div className="admin-sidebar-pie">
          <Link to="/" className="admin-sidebar-volver">
            <i className="ti ti-arrow-left" aria-hidden="true"></i>
            Volver a Mesas
          </Link>
          <button type="button" className="admin-sidebar-salir" onClick={salir}>
            <i className="ti ti-logout" aria-hidden="true"></i>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin-contenido">
        <div className="seccion-header">
          <h1>{tab}</h1>
        </div>

        {tab === "Mesas" && (
          <>
            <div className="grid-resumen">
              <div className="tarjeta-resumen">
                <p className="tarjeta-resumen-etiqueta">Mesas ocupadas</p>
                <p className="tarjeta-resumen-valor">
                  {mesasOcupadas} <span>/ {mesas.length}</span>
                </p>
              </div>
              <div className="tarjeta-resumen">
                <p className="tarjeta-resumen-etiqueta">Productos agotados</p>
                <p className="tarjeta-resumen-valor tarjeta-resumen-valor-error">{productosAgotados}</p>
              </div>
            </div>
            <SeccionMesas mesas={mesas} usuarios={usuarios} onCambio={recargarTodo} />
          </>
        )}
        {tab === "Categorías" && <SeccionCategorias categorias={categorias} onCambio={recargarTodo} />}
        {tab === "Productos" && (
          <SeccionProductos
            productos={productos}
            categorias={categorias}
            extras={extras}
            estaciones={estaciones}
            onCambio={recargarTodo}
          />
        )}
        {tab === "Extras" && <SeccionExtras extras={extras} onCambio={recargarTodo} />}
        {tab === "Estaciones" && <SeccionEstaciones estaciones={estaciones} onCambio={recargarTodo} />}
        {tab === "Usuarios" && <SeccionUsuarios usuarios={usuarios} onCambio={recargarTodo} />}
        {tab === "Transacciones" && <SeccionTransacciones />}
        {tab === "Apariencia" && <SeccionApariencia />}
        {tab === "Ticket" && <SeccionTicket />}
        {tab === "Impresión" && <SeccionImpresionEstaciones estaciones={estaciones} onCambio={recargarTodo} />}
      </main>
    </div>
  );
}

function badgeEstadoMesa(estado: Mesa["estado"]) {
  const tono = estado === "Libre" ? "verde" : estado === "Ocupada" ? "rojo" : estado === "Cuenta" ? "azul" : "amarillo";
  return <Badge texto={estado} tono={tono} />;
}

function SeccionMesas({ mesas, usuarios, onCambio }: { mesas: Mesa[]; usuarios: Usuario[]; onCambio: () => void }) {
  const toast = useToast();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Mesa | null>(null);
  const [nombre, setNombre] = useState("");
  const [capacidad, setCapacidad] = useState(4);
  const [zona, setZona] = useState("");
  const [meseroAsignadoId, setMeseroAsignadoId] = useState<number | "">("");
  const [montosPorComanda, setMontosPorComanda] = useState<Record<number, number>>({});

  const meseros = usuarios.filter((u) => u.rol === "Mesero");

  useEffect(() => {
    const idsComanda = mesas.map((m) => m.comandaActivaId).filter((id): id is number => id != null);
    if (idsComanda.length === 0) return;
    Promise.all(idsComanda.map((id) => api.comandas.obtener(id)))
      .then((comandas) => {
        const mapa: Record<number, number> = {};
        comandas.forEach((c) => (mapa[c.id] = c.total));
        setMontosPorComanda(mapa);
      })
      .catch(() => {});
  }, [mesas]);

  function abrirCrear() {
    setEditando(null);
    setNombre("");
    setCapacidad(4);
    setZona("");
    setMeseroAsignadoId("");
    setModalAbierto(true);
  }

  function abrirEditar(m: Mesa) {
    setEditando(m);
    setNombre(m.nombre);
    setCapacidad(m.capacidad);
    setZona(m.zona ?? "");
    setMeseroAsignadoId(m.meseroAsignadoId ?? "");
    setModalAbierto(true);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    try {
      if (editando) {
        await api.mesas.editar(editando.id, {
          nombre,
          capacidad,
          zona: zona || null,
          meseroAsignadoId: meseroAsignadoId || null,
        });
        toast.exito("Mesa actualizada.");
      } else {
        await api.mesas.crear({
          nombre,
          capacidad,
          zona: zona || null,
          meseroAsignadoId: meseroAsignadoId || null,
        });
        toast.exito("Mesa creada.");
      }
      setModalAbierto(false);
      onCambio();
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  }

  return (
    <section>
      <div className="seccion-header seccion-header-solo-accion">
        <button className="boton-primario" onClick={abrirCrear}>
          + Nueva mesa
        </button>
      </div>

      <div className="grid-mesas-admin">
        {mesas.map((m) => (
          <button key={m.id} className="tarjeta-mesa" onClick={() => abrirEditar(m)}>
            <div className="tarjeta-mesa-encabezado">
              <span className="tarjeta-mesa-nombre">{m.nombre}</span>
              {badgeEstadoMesa(m.estado)}
            </div>
            <div className="tarjeta-mesa-info">
              <i className="ti ti-users" aria-hidden="true"></i>
              {m.capacidad} personas{m.zona && ` · ${m.zona}`}
            </div>
            <div className="tarjeta-mesa-info">
              <i className="ti ti-id-badge-2" aria-hidden="true"></i>
              {m.meseroAsignado?.nombre ?? "Sin mesero asignado"}
            </div>
            {m.comandaActivaId != null && montosPorComanda[m.comandaActivaId] != null && (
              <div className="tarjeta-mesa-monto">
                ${montosPorComanda[m.comandaActivaId].toFixed(2)} en cuenta
              </div>
            )}
          </button>
        ))}
        {mesas.length === 0 && <p className="celda-vacia">No hay mesas todavía.</p>}
      </div>

      {modalAbierto && (
        <Modal titulo={editando ? "Editar mesa" : "Nueva mesa"} onClose={() => setModalAbierto(false)}>
          <form onSubmit={guardar} className="form-modal">
            <label>
              Nombre
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
            </label>
            <label>
              Capacidad
              <input
                type="number"
                value={capacidad}
                onChange={(e) => setCapacidad(Number(e.target.value))}
                min={1}
                required
              />
            </label>
            <label>
              Zona (opcional)
              <input value={zona} onChange={(e) => setZona(e.target.value)} />
            </label>
            <label>
              Mesero asignado (opcional)
              <select
                value={meseroAsignadoId}
                onChange={(e) => setMeseroAsignadoId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Sin asignar</option>
                {meseros.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
              {meseros.length === 0 && (
                <span className="texto-tenue">No hay usuarios con rol Mesero todavía.</span>
              )}
            </label>
            <div className="form-modal-acciones">
              <button type="button" className="boton-secundario" onClick={() => setModalAbierto(false)}>
                Cancelar
              </button>
              <button type="submit" className="boton-primario">
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

function SeccionCategorias({ categorias, onCambio }: { categorias: Categoria[]; onCambio: () => void }) {
  const toast = useToast();
  const { confirmar } = useConfirmacion();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [nombre, setNombre] = useState("");
  const [orden, setOrden] = useState(0);

  function abrirCrear() {
    setEditando(null);
    setNombre("");
    setOrden(0);
    setModalAbierto(true);
  }

  function abrirEditar(c: Categoria) {
    setEditando(c);
    setNombre(c.nombre);
    setOrden(c.orden);
    setModalAbierto(true);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    try {
      if (editando) {
        await api.categorias.editar(editando.id, { nombre, orden });
        toast.exito("Categoría actualizada.");
      } else {
        await api.categorias.crear({ nombre, orden });
        toast.exito("Categoría creada.");
      }
      setModalAbierto(false);
      onCambio();
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  }

  async function desactivar(c: Categoria) {
    const ok = await confirmar({
      titulo: "Desactivar categoría",
      mensaje: `¿Seguro que quieres desactivar "${c.nombre}"? Dejará de estar disponible en el menú.`,
      textoConfirmar: "Desactivar",
      peligro: true,
    });
    if (!ok) return;
    try {
      await api.categorias.desactivar(c.id);
      toast.exito("Categoría desactivada.");
      onCambio();
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  }

  return (
    <section>
      <div className="seccion-header seccion-header-solo-accion">
        <button className="boton-primario" onClick={abrirCrear}>
          + Nueva categoría
        </button>
      </div>

      <table className="tabla-admin">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Orden</th>
            <th className="col-acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((c) => (
            <tr key={c.id}>
              <td>{c.nombre}</td>
              <td>{c.orden}</td>
              <td className="acciones-tabla">
                <AccionIcono icono="ti-pencil" etiqueta="Editar" onClick={() => abrirEditar(c)} />
                <AccionIcono icono="ti-trash" etiqueta="Desactivar" peligro onClick={() => desactivar(c)} />
              </td>
            </tr>
          ))}
          {categorias.length === 0 && (
            <tr>
              <td colSpan={3} className="celda-vacia">
                No hay categorías todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {modalAbierto && (
        <Modal titulo={editando ? "Editar categoría" : "Nueva categoría"} onClose={() => setModalAbierto(false)}>
          <form onSubmit={guardar} className="form-modal">
            <label>
              Nombre
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
            </label>
            <label>
              Orden
              <input type="number" value={orden} onChange={(e) => setOrden(Number(e.target.value))} />
            </label>
            <div className="form-modal-acciones">
              <button type="button" className="boton-secundario" onClick={() => setModalAbierto(false)}>
                Cancelar
              </button>
              <button type="submit" className="boton-primario">
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

function SeccionProductos({
  productos,
  categorias,
  extras,
  estaciones,
  onCambio,
}: {
  productos: Producto[];
  categorias: Categoria[];
  extras: Extra[];
  estaciones: Estacion[];
  onCambio: () => void;
}) {
  const toast = useToast();
  const { confirmar } = useConfirmacion();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [nombre, setNombre] = useState("");
  const [sku, setSku] = useState("");
  const [precio, setPrecio] = useState(0);
  const [categoriaId, setCategoriaId] = useState<number | "">("");
  const [estacionId, setEstacionId] = useState<number | "">("");
  const [extraIdsSeleccionados, setExtraIdsSeleccionados] = useState<number[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<number | "">("");
  const [filtroEstado, setFiltroEstado] = useState<"activos" | "inactivos" | "todos">("activos");

  const productosFiltrados = productos.filter((p) => {
    const coincideBusqueda =
      !busqueda ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.sku ?? "").toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = filtroCategoria === "" || p.categoriaId === filtroCategoria;
    const coincideEstado =
      filtroEstado === "todos" || (filtroEstado === "activos" ? p.activo : !p.activo);
    return coincideBusqueda && coincideCategoria && coincideEstado;
  });

  function abrirCrear() {
    setEditando(null);
    setNombre("");
    setSku("");
    setPrecio(0);
    setCategoriaId("");
    setEstacionId("");
    setExtraIdsSeleccionados([]);
    setModalAbierto(true);
  }

  function abrirEditar(p: Producto) {
    setEditando(p);
    setNombre(p.nombre);
    setSku(p.sku ?? "");
    setPrecio(p.precio);
    setCategoriaId(p.categoriaId);
    setEstacionId(p.estacionId ?? "");
    setExtraIdsSeleccionados(p.extrasDisponibles.map((e) => e.id));
    setModalAbierto(true);
  }

  function toggleExtra(extraId: number) {
    setExtraIdsSeleccionados((actual) =>
      actual.includes(extraId) ? actual.filter((id) => id !== extraId) : [...actual, extraId]
    );
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (categoriaId === "") {
      toast.error("Selecciona una categoría.");
      return;
    }
    try {
      let productoId: number;
      if (editando) {
        await api.productos.editar(editando.id, {
          nombre,
          sku: sku || null,
          precio,
          categoriaId,
          estacionId: estacionId || null,
          disponible: editando.disponible,
        });
        productoId = editando.id;
        toast.exito("Producto actualizado.");
      } else {
        const creado = await api.productos.crear({
          nombre,
          sku: sku || null,
          precio,
          categoriaId,
          estacionId: estacionId || null,
          disponible: true,
          activo: true,
        });
        productoId = creado.id;
        toast.exito("Producto creado.");
      }
      await api.productos.asignarExtras(productoId, extraIdsSeleccionados);
      setModalAbierto(false);
      onCambio();
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  }

  async function toggleDisponibilidad(p: Producto) {
    if (p.disponible) {
      const ok = await confirmar({
        titulo: "Marcar como agotado",
        mensaje: `¿Marcar "${p.nombre}" como agotado? No se podrá pedir hasta que lo marques disponible de nuevo.`,
        textoConfirmar: "Marcar agotado",
        peligro: true,
      });
      if (!ok) return;
    }
    try {
      await api.productos.cambiarDisponibilidad(p.id, !p.disponible);
      toast.exito(p.disponible ? "Marcado como agotado." : "Marcado como disponible.");
      onCambio();
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  }

  async function desactivar(p: Producto) {
    const ok = await confirmar({
      titulo: "Desactivar producto",
      mensaje: `¿Seguro que quieres desactivar "${p.nombre}"? Dejará de estar disponible en el menú.`,
      textoConfirmar: "Desactivar",
      peligro: true,
    });
    if (!ok) return;
    try {
      await api.productos.desactivar(p.id);
      toast.exito("Producto desactivado.");
      onCambio();
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  }

  async function reactivar(p: Producto) {
    try {
      await api.productos.reactivar(p.id);
      toast.exito("Producto reactivado.");
      onCambio();
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  }

  return (
    <section>
      <div className="seccion-header">
        <div className="filtros-productos">
          <input
            placeholder="Buscar por nombre o SKU..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as "activos" | "inactivos" | "todos")}
          >
            <option value="activos">Activos</option>
            <option value="inactivos">Desactivados</option>
            <option value="todos">Todos</option>
          </select>
        </div>
        <button className="boton-primario" onClick={abrirCrear} disabled={categorias.length === 0}>
          + Nuevo producto
        </button>
      </div>
      {categorias.length === 0 && <p className="aviso">Crea primero una categoría para poder agregar productos.</p>}

      <table className="tabla-admin">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>SKU</th>
            <th>Precio</th>
            <th>Categoría</th>
            <th>Estación</th>
            <th>Extras</th>
            <th>Disponibilidad</th>
            <th className="col-acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosFiltrados.map((p) => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>{p.sku || "—"}</td>
              <td>${p.precio.toFixed(2)}</td>
              <td>{categorias.find((c) => c.id === p.categoriaId)?.nombre ?? "—"}</td>
              <td>{p.estacion?.nombre ?? "—"}</td>
              <td>{p.extrasDisponibles.length > 0 ? p.extrasDisponibles.map((e) => e.nombre).join(", ") : "—"}</td>
              <td>
                {!p.activo ? (
                  <Badge texto="Desactivado" tono="rojo" />
                ) : (
                  <Badge texto={p.disponible ? "Disponible" : "Agotado"} tono={p.disponible ? "verde" : "gris"} />
                )}
              </td>
              <td className="acciones-tabla">
                {p.activo ? (
                  <>
                    <AccionIcono icono="ti-pencil" etiqueta="Editar" onClick={() => abrirEditar(p)} />
                    <AccionIcono
                      icono={p.disponible ? "ti-eye-off" : "ti-eye"}
                      etiqueta={p.disponible ? "Marcar agotado" : "Marcar disponible"}
                      onClick={() => toggleDisponibilidad(p)}
                    />
                    <AccionIcono icono="ti-trash" etiqueta="Desactivar" peligro onClick={() => desactivar(p)} />
                  </>
                ) : (
                  <AccionIcono icono="ti-refresh" etiqueta="Reactivar" onClick={() => reactivar(p)} />
                )}
              </td>
            </tr>
          ))}
          {productosFiltrados.length === 0 && (
            <tr>
              <td colSpan={8} className="celda-vacia">
                {productos.length === 0 ? "No hay productos todavía." : "Ningún producto coincide con el filtro."}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {modalAbierto && (
        <Modal titulo={editando ? "Editar producto" : "Nuevo producto"} onClose={() => setModalAbierto(false)}>
          <form onSubmit={guardar} className="form-modal">
            <label>
              Nombre
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
            </label>
            <label>
              SKU (opcional)
              <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="TACO-001" />
            </label>
            <label>
              Precio
              <input
                type="number"
                step="0.01"
                min={0}
                value={precio}
                onChange={(e) => setPrecio(Number(e.target.value))}
                required
              />
            </label>
            <label>
              Categoría
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value ? Number(e.target.value) : "")}
                required
              >
                <option value="">Categoría...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Estación / cocina (opcional)
              <select value={estacionId} onChange={(e) => setEstacionId(e.target.value ? Number(e.target.value) : "")}>
                <option value="">Sin asignar</option>
                {estaciones.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Extras disponibles para este producto
              {extras.length === 0 ? (
                <span className="texto-tenue">No hay extras creados todavía. Ve a la sección "Extras".</span>
              ) : (
                <SelectorExtras extras={extras} seleccionados={extraIdsSeleccionados} onToggle={toggleExtra} />
              )}
            </label>
            <div className="form-modal-acciones">
              <button type="button" className="boton-secundario" onClick={() => setModalAbierto(false)}>
                Cancelar
              </button>
              <button type="submit" className="boton-primario">
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

function SeccionExtras({ extras, onCambio }: { extras: Extra[]; onCambio: () => void }) {
  const toast = useToast();
  const { confirmar } = useConfirmacion();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Extra | null>(null);
  const [nombre, setNombre] = useState("");
  const [precioAdicional, setPrecioAdicional] = useState(0);

  function abrirCrear() {
    setEditando(null);
    setNombre("");
    setPrecioAdicional(0);
    setModalAbierto(true);
  }

  function abrirEditar(ex: Extra) {
    setEditando(ex);
    setNombre(ex.nombre);
    setPrecioAdicional(ex.precioAdicional);
    setModalAbierto(true);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    try {
      if (editando) {
        await api.extras.editar(editando.id, { nombre, precioAdicional });
        toast.exito("Extra actualizado.");
      } else {
        await api.extras.crear({ nombre, precioAdicional });
        toast.exito("Extra creado.");
      }
      setModalAbierto(false);
      onCambio();
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  }

  async function desactivar(ex: Extra) {
    const ok = await confirmar({
      titulo: "Desactivar extra",
      mensaje: `¿Seguro que quieres desactivar "${ex.nombre}"?`,
      textoConfirmar: "Desactivar",
      peligro: true,
    });
    if (!ok) return;
    try {
      await api.extras.desactivar(ex.id);
      toast.exito("Extra desactivado.");
      onCambio();
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  }

  return (
    <section>
      <p className="aviso">
        Los extras son ingredientes o modificadores opcionales (ej. "Queso extra", "Aguacate") que se pueden
        habilitar por producto desde la sección Productos.
      </p>
      <div className="seccion-header seccion-header-solo-accion">
        <button className="boton-primario" onClick={abrirCrear}>
          + Nuevo extra
        </button>
      </div>

      <table className="tabla-admin">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Precio adicional</th>
            <th className="col-acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {extras.map((ex) => (
            <tr key={ex.id}>
              <td>{ex.nombre}</td>
              <td>${ex.precioAdicional.toFixed(2)}</td>
              <td className="acciones-tabla">
                <AccionIcono icono="ti-pencil" etiqueta="Editar" onClick={() => abrirEditar(ex)} />
                <AccionIcono icono="ti-trash" etiqueta="Desactivar" peligro onClick={() => desactivar(ex)} />
              </td>
            </tr>
          ))}
          {extras.length === 0 && (
            <tr>
              <td colSpan={3} className="celda-vacia">
                No hay extras todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {modalAbierto && (
        <Modal titulo={editando ? "Editar extra" : "Nuevo extra"} onClose={() => setModalAbierto(false)}>
          <form onSubmit={guardar} className="form-modal">
            <label>
              Nombre
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus placeholder="Queso extra" />
            </label>
            <label>
              Precio adicional
              <input
                type="number"
                step="0.01"
                min={0}
                value={precioAdicional}
                onChange={(e) => setPrecioAdicional(Number(e.target.value))}
                required
              />
            </label>
            <div className="form-modal-acciones">
              <button type="button" className="boton-secundario" onClick={() => setModalAbierto(false)}>
                Cancelar
              </button>
              <button type="submit" className="boton-primario">
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

function SeccionEstaciones({ estaciones, onCambio }: { estaciones: Estacion[]; onCambio: () => void }) {
  const toast = useToast();
  const { confirmar } = useConfirmacion();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Estacion | null>(null);
  const [nombre, setNombre] = useState("");

  function abrirCrear() {
    setEditando(null);
    setNombre("");
    setModalAbierto(true);
  }

  function abrirEditar(est: Estacion) {
    setEditando(est);
    setNombre(est.nombre);
    setModalAbierto(true);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    try {
      if (editando) {
        await api.estaciones.editar(editando.id, nombre);
        toast.exito("Estación actualizada.");
      } else {
        await api.estaciones.crear(nombre);
        toast.exito("Estación creada.");
      }
      setModalAbierto(false);
      onCambio();
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  }

  async function desactivar(est: Estacion) {
    const ok = await confirmar({
      titulo: "Desactivar estación",
      mensaje: `¿Seguro que quieres desactivar "${est.nombre}"?`,
      textoConfirmar: "Desactivar",
      peligro: true,
    });
    if (!ok) return;
    try {
      await api.estaciones.desactivar(est.id);
      toast.exito("Estación desactivada.");
      onCambio();
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  }

  return (
    <section>
      <p className="aviso">
        Las estaciones representan las distintas cocinas o áreas de preparación (ej. "Cocina caliente", "Barra",
        "Postres"). Asigna una estación a cada producto desde la sección Productos para que la pantalla de Cocina
        pueda filtrar los pedidos por área.
      </p>
      <div className="seccion-header seccion-header-solo-accion">
        <button className="boton-primario" onClick={abrirCrear}>
          + Nueva estación
        </button>
      </div>

      <table className="tabla-admin">
        <thead>
          <tr>
            <th>Nombre</th>
            <th className="col-acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {estaciones.map((est) => (
            <tr key={est.id}>
              <td>{est.nombre}</td>
              <td className="acciones-tabla">
                <AccionIcono icono="ti-pencil" etiqueta="Editar" onClick={() => abrirEditar(est)} />
                <AccionIcono icono="ti-trash" etiqueta="Desactivar" peligro onClick={() => desactivar(est)} />
              </td>
            </tr>
          ))}
          {estaciones.length === 0 && (
            <tr>
              <td colSpan={2} className="celda-vacia">
                No hay estaciones todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {modalAbierto && (
        <Modal titulo={editando ? "Editar estación" : "Nueva estación"} onClose={() => setModalAbierto(false)}>
          <form onSubmit={guardar} className="form-modal">
            <label>
              Nombre
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                autoFocus
                placeholder="Cocina caliente"
              />
            </label>
            <div className="form-modal-acciones">
              <button type="button" className="boton-secundario" onClick={() => setModalAbierto(false)}>
                Cancelar
              </button>
              <button type="submit" className="boton-primario">
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

function badgeRol(rol: Rol) {
  const tono = rol === "Administrador" ? "azul" : rol === "Cajero" ? "amarillo" : rol === "Mesero" ? "verde" : "gris";
  return <Badge texto={rol} tono={tono} />;
}

function SeccionUsuarios({ usuarios, onCambio }: { usuarios: Usuario[]; onCambio: () => void }) {
  const toast = useToast();
  const { confirmar } = useConfirmacion();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [pin, setPin] = useState("");
  const [rol, setRol] = useState<Rol>("Mesero");

  function abrirCrear() {
    setNombre("");
    setPin("");
    setRol("Mesero");
    setModalAbierto(true);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    try {
      await api.usuarios.crear({ nombre, pin, rol, activo: true });
      toast.exito("Usuario creado.");
      setModalAbierto(false);
      onCambio();
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  }

  async function desactivar(u: Usuario) {
    const ok = await confirmar({
      titulo: "Desactivar usuario",
      mensaje: `¿Seguro que quieres desactivar a "${u.nombre}"? Se cerrarán sus sesiones activas.`,
      textoConfirmar: "Desactivar",
      peligro: true,
    });
    if (!ok) return;
    try {
      await api.usuarios.desactivar(u.id);
      toast.exito("Usuario desactivado.");
      onCambio();
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  }

  return (
    <section>
      <div className="seccion-header seccion-header-solo-accion">
        <button className="boton-primario" onClick={abrirCrear}>
          + Nuevo usuario
        </button>
      </div>

      <table className="tabla-admin">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>PIN</th>
            <th>Rol</th>
            <th className="col-acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td title="El PIN se guarda cifrado y no se puede consultar">••••</td>
              <td>{badgeRol(u.rol)}</td>
              <td className="acciones-tabla">
                <AccionIcono icono="ti-trash" etiqueta="Desactivar" peligro onClick={() => desactivar(u)} />
              </td>
            </tr>
          ))}
          {usuarios.length === 0 && (
            <tr>
              <td colSpan={4} className="celda-vacia">
                No hay usuarios todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {modalAbierto && (
        <Modal titulo="Nuevo usuario" onClose={() => setModalAbierto(false)}>
          <form onSubmit={guardar} className="form-modal">
            <label>
              Nombre
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
            </label>
            <label>
              PIN
              <input value={pin} onChange={(e) => setPin(e.target.value)} required maxLength={6} />
            </label>
            <label>
              Rol
              <select value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-modal-acciones">
              <button type="button" className="boton-secundario" onClick={() => setModalAbierto(false)}>
                Cancelar
              </button>
              <button type="submit" className="boton-primario">
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

function SeccionTransacciones() {
  const toast = useToast();
  const [pagos, setPagos] = useState<Transaccion[]>([]);
  const [dias, setDias] = useState<number | "">(7);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    api.pagos
      .listar(dias === "" ? undefined : dias)
      .then((data) => vigente && setPagos(data))
      .catch((e) => vigente && toast.error(mensajeDeError(e)))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias]);

  const totalCobrado = pagos.reduce((s, p) => s + p.total, 0);
  const totalPropinas = pagos.reduce((s, p) => s + p.propina, 0);

  return (
    <section>
      <div className="seccion-header seccion-header-solo-accion">
        <select value={dias} onChange={(e) => setDias(e.target.value === "" ? "" : Number(e.target.value))}>
          <option value={1}>Hoy</option>
          <option value={7}>Últimos 7 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value="">Todo</option>
        </select>
      </div>

      <div className="grid-resumen">
        <div className="tarjeta-resumen">
          <p className="tarjeta-resumen-etiqueta">Transacciones</p>
          <p className="tarjeta-resumen-valor">{pagos.length}</p>
        </div>
        <div className="tarjeta-resumen">
          <p className="tarjeta-resumen-etiqueta">Total cobrado</p>
          <p className="tarjeta-resumen-valor">${totalCobrado.toFixed(2)}</p>
        </div>
        <div className="tarjeta-resumen">
          <p className="tarjeta-resumen-etiqueta">Propinas</p>
          <p className="tarjeta-resumen-valor">${totalPropinas.toFixed(2)}</p>
        </div>
      </div>

      <table className="tabla-admin">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Mesa</th>
            <th>Método</th>
            <th>Total</th>
            <th>Referencia</th>
            <th>Cajero</th>
          </tr>
        </thead>
        <tbody>
          {pagos.map((p) => (
            <tr key={p.id}>
              <td>{new Date(p.fecha).toLocaleString()}</td>
              <td>{p.mesa ?? "—"}</td>
              <td>{p.metodo}</td>
              <td>${p.total.toFixed(2)}</td>
              <td>
                {p.referencia ? (
                  <span title={[p.autorizacion && `Aut: ${p.autorizacion}`].filter(Boolean).join("")}>
                    {p.referencia}
                    {p.ultimosDigitos ? ` ····${p.ultimosDigitos}` : ""}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td>{p.cajero ?? "—"}</td>
            </tr>
          ))}
          {!cargando && pagos.length === 0 && (
            <tr>
              <td colSpan={6} className="celda-vacia">
                No hay transacciones en el periodo.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

const TICKET_MUESTRA: DatosTicket = {
  mesa: "5",
  comandaId: 1042,
  fecha: new Date(),
  cajero: "Laura",
  mesero: "Ana",
  items: [
    { cantidad: 2, nombre: "Tacos Pastor", importe: 50 },
    { cantidad: 1, nombre: "Limonada", importe: 30 },
    { cantidad: 1, nombre: "Agua", importe: 20 },
  ],
  subtotal: 100,
  descuento: 0,
  propina: 15,
  total: 115,
  metodo: "Tarjeta",
  montoRecibido: null,
  cambio: null,
  referencia: "VCH-889231",
  autorizacion: "AUTH-4455",
  ultimosDigitos: "4321",
};

function SeccionTicket() {
  const toast = useToast();
  const { tema } = useTema();
  const [config, setConfig] = useState<ConfigTicket | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);

  useEffect(() => {
    api.ticket.obtener().then(setConfig).catch((e) => toast.error(mensajeDeError(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof ConfigTicket>(campo: K, valor: ConfigTicket[K]) {
    setConfig((c) => (c ? { ...c, [campo]: valor } : c));
  }

  async function guardar() {
    if (!config) return;
    setGuardando(true);
    try {
      await api.ticket.actualizar(config);
      toast.exito("Configuración del ticket guardada.");
    } catch (e) {
      toast.error(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  }

  async function subirLogoTicket(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendoLogo(true);
    try {
      const { logoUrl } = await api.ticket.subirLogo(archivo);
      setConfig((c) => (c ? { ...c, logoUrl } : c));
      toast.exito("Logo del ticket actualizado.");
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setSubiendoLogo(false);
      e.target.value = "";
    }
  }

  if (!config) return <p>Cargando...</p>;

  const previewHtml = tema
    ? `<style>${estilosTicket(config.anchoPapelMm)}</style><div class="t-doc">${construirTicketHtml(
        TICKET_MUESTRA,
        config,
        tema
      )}</div>`
    : "";

  return (
    <section className="config-ticket">
      <div className="config-ticket-form">
        <p className="aviso">
          Este es el ticket que se imprime al cerrar el cobro. El nombre del negocio se toma de Apariencia; el logo
          del ticket es independiente (puede ser distinto al de la app, por ejemplo uno en blanco y negro para
          impresora térmica).
        </p>

        <div className="bloque-logo">
          <div className="logo-preview">
            {config.logoUrl ? <img src={config.logoUrl} alt="Logo del ticket" /> : <span>Sin logo</span>}
          </div>
          <div>
            <label className="toggle-config">
              <input
                type="checkbox"
                checked={config.mostrarLogo}
                onChange={(e) => set("mostrarLogo", e.target.checked)}
              />
              Mostrar logo en el ticket
            </label>
            <label className="boton-secundario boton-subir-logo">
              {subiendoLogo ? "Subiendo..." : "Subir logo del ticket"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={subirLogoTicket}
                hidden
              />
            </label>
          </div>
        </div>

        <label>
          Dirección
          <input value={config.direccion} onChange={(e) => set("direccion", e.target.value)} placeholder="Calle y número" />
        </label>
        <label>
          Teléfono
          <input value={config.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="Tel." />
        </label>
        <label>
          RFC / identificador fiscal
          <input value={config.rfc} onChange={(e) => set("rfc", e.target.value)} placeholder="RFC" />
        </label>

        <label className="toggle-config">
          <input
            type="checkbox"
            checked={config.mostrarMeseroCajero}
            onChange={(e) => set("mostrarMeseroCajero", e.target.checked)}
          />
          Mostrar mesero y cajero
        </label>
        <label className="toggle-config">
          <input type="checkbox" checked={config.mostrarPropina} onChange={(e) => set("mostrarPropina", e.target.checked)} />
          Mostrar propina
        </label>
        <label className="toggle-config">
          <input
            type="checkbox"
            checked={config.mostrarReferencia}
            onChange={(e) => set("mostrarReferencia", e.target.checked)}
          />
          Mostrar referencia de la transacción
        </label>

        <label>
          Mensaje de pie
          <input value={config.mensajePie} onChange={(e) => set("mensajePie", e.target.value)} placeholder="Mensaje final" />
        </label>

        <label>
          Ancho de papel
          <select value={config.anchoPapelMm} onChange={(e) => set("anchoPapelMm", Number(e.target.value))}>
            <option value={58}>58 mm</option>
            <option value={80}>80 mm</option>
          </select>
        </label>

        <label className="toggle-config">
          <input
            type="checkbox"
            checked={config.imprimirAutomatico}
            onChange={(e) => set("imprimirAutomatico", e.target.checked)}
          />
          Imprimir automáticamente al cobrar
        </label>

        <button className="boton-primario" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      <div className="config-ticket-preview">
        <p className="texto-tenue">Vista previa</p>
        <div className="ticket-paper" dangerouslySetInnerHTML={{ __html: previewHtml }} />
      </div>
    </section>
  );
}

const COMANDA_MUESTRA: DatosComanda = {
  mesa: "5",
  comandaId: 1042,
  fecha: new Date(),
  estacion: "Cocina caliente",
  items: [
    { cantidad: 2, nombre: "Tacos Pastor", numeroComensal: 1, notas: null, extras: ["Queso extra"] },
    { cantidad: 1, nombre: "Sopa Azteca", numeroComensal: 2, notas: "Sin cilantro", extras: [] },
  ],
};

function SeccionImpresionEstaciones({
  estaciones,
  onCambio,
}: {
  estaciones: Estacion[];
  onCambio: () => void;
}) {
  const toast = useToast();
  const [guardandoId, setGuardandoId] = useState<number | null>(null);
  const [previaId, setPreviaId] = useState<number | null>(null);

  async function actualizar(est: Estacion, cambios: Partial<Pick<Estacion, "imprimirComandaAutomatico" | "anchoPapelComandaMm">>) {
    setGuardandoId(est.id);
    try {
      await api.estaciones.editarImpresion(
        est.id,
        cambios.imprimirComandaAutomatico ?? est.imprimirComandaAutomatico,
        cambios.anchoPapelComandaMm ?? est.anchoPapelComandaMm
      );
      toast.exito(`Impresión de "${est.nombre}" actualizada.`);
      onCambio();
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setGuardandoId(null);
    }
  }

  function probarImpresion(est: Estacion) {
    imprimirComanda({ ...COMANDA_MUESTRA, estacion: est.nombre }, est.anchoPapelComandaMm);
  }

  return (
    <section>
      <p className="aviso">
        Cada estación de cocina (Barra, Cocina caliente, etc.) puede tener su propia impresora conectada al equipo
        donde se muestra su pantalla de Cocina filtrada. Configura aquí si esa estación imprime la comanda
        automáticamente al recibir un pedido nuevo, y el ancho de su papel.
      </p>

      <table className="tabla-admin">
        <thead>
          <tr>
            <th>Estación</th>
            <th>Imprimir automático</th>
            <th>Ancho de papel</th>
            <th className="col-acciones">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {estaciones.map((est) => (
            <tr key={est.id}>
              <td>{est.nombre}</td>
              <td>
                <label className="toggle-config">
                  <input
                    type="checkbox"
                    checked={est.imprimirComandaAutomatico}
                    disabled={guardandoId === est.id}
                    onChange={(e) => actualizar(est, { imprimirComandaAutomatico: e.target.checked })}
                  />
                  {est.imprimirComandaAutomatico ? "Activo" : "Inactivo"}
                </label>
              </td>
              <td>
                <select
                  value={est.anchoPapelComandaMm}
                  disabled={guardandoId === est.id}
                  onChange={(e) => actualizar(est, { anchoPapelComandaMm: Number(e.target.value) })}
                >
                  <option value={58}>58 mm</option>
                  <option value={80}>80 mm</option>
                </select>
              </td>
              <td className="acciones-tabla">
                <AccionIcono icono="ti-printer" etiqueta="Ver comanda de muestra" onClick={() => setPreviaId(est.id)} />
              </td>
            </tr>
          ))}
          {estaciones.length === 0 && (
            <tr>
              <td colSpan={4} className="celda-vacia">
                No hay estaciones todavía. Crea una en la sección Estaciones.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {previaId != null && (
        <Modal
          titulo={`Comanda de muestra — ${estaciones.find((e) => e.id === previaId)?.nombre ?? ""}`}
          onClose={() => setPreviaId(null)}
        >
          {(() => {
            const est = estaciones.find((e) => e.id === previaId);
            if (!est) return null;
            const html = `<style>${estilosTicket(est.anchoPapelComandaMm)}</style><div class="t-doc">${construirComandaHtml(
              { ...COMANDA_MUESTRA, estacion: est.nombre }
            )}</div>`;
            return (
              <>
                <div className="ticket-paper" dangerouslySetInnerHTML={{ __html: html }} />
                <div className="form-modal-acciones">
                  <button className="boton-secundario" onClick={() => setPreviaId(null)}>
                    Cerrar
                  </button>
                  <button className="boton-primario" onClick={() => probarImpresion(est)}>
                    <i className="ti ti-printer" aria-hidden="true"></i> Imprimir de prueba
                  </button>
                </div>
              </>
            );
          })()}
        </Modal>
      )}
    </section>
  );
}

type CampoColor = keyof Omit<TemaVisual, "id" | "logoUrl" | "nombreRestaurante">;

const GRUPOS_TEMA: { titulo: string; campos: { campo: CampoColor; etiqueta: string; descripcion: string }[] }[] = [
  {
    titulo: "Marca y acento",
    campos: [
      { campo: "colorPrimario", etiqueta: "Primario", descripcion: "Botones principales, enlaces activos y bordes al enfocar un campo." },
      { campo: "colorPrimarioClaro", etiqueta: "Primario (claro)", descripcion: "Fondo de pestañas y chips activos (ej. \"Comensal 1\" seleccionado)." },
      { campo: "colorPrimarioOscuro", etiqueta: "Primario (oscuro)", descripcion: "Color del botón principal al pasar el cursor (hover)." },
    ],
  },
  {
    titulo: "Superficies",
    campos: [
      { campo: "colorFondo", etiqueta: "Fondo", descripcion: "Fondo general detrás de todas las pantallas." },
      { campo: "colorSuperficie", etiqueta: "Superficie", descripcion: "Fondo de tarjetas, tablas, modales y botones secundarios." },
      { campo: "colorBorde", etiqueta: "Bordes", descripcion: "Líneas divisorias y bordes de tarjetas, tablas e inputs." },
    ],
  },
  {
    titulo: "Texto",
    campos: [
      { campo: "colorTexto", etiqueta: "Texto principal", descripcion: "Color del texto normal en toda la app." },
      { campo: "colorTextoTenue", etiqueta: "Texto secundario", descripcion: "Etiquetas, ayudas y texto de menor énfasis." },
    ],
  },
  {
    titulo: "Estados",
    campos: [
      { campo: "colorExito", etiqueta: "Éxito", descripcion: "Texto de badges de éxito (ej. \"Disponible\", \"Cuadrado\")." },
      { campo: "colorExitoClaro", etiqueta: "Éxito (fondo)", descripcion: "Fondo de esos mismos badges de éxito." },
      { campo: "colorError", etiqueta: "Error", descripcion: "Texto de badges de error (ej. \"Agotado\", \"Faltante\")." },
      { campo: "colorErrorClaro", etiqueta: "Error (fondo)", descripcion: "Fondo de esos mismos badges de error." },
      { campo: "colorAdvertencia", etiqueta: "Advertencia", descripcion: "Texto de badges de advertencia (ej. \"Sobrante\")." },
      { campo: "colorAdvertenciaClaro", etiqueta: "Advertencia (fondo)", descripcion: "Fondo de esos mismos badges de advertencia." },
      { campo: "colorInfo", etiqueta: "Información", descripcion: "Texto de badges informativos (ej. estado \"Reservada\")." },
      { campo: "colorInfoClaro", etiqueta: "Información (fondo)", descripcion: "Fondo de esos mismos badges informativos." },
    ],
  },
];

function SeccionApariencia() {
  const toast = useToast();
  const { tema: temaGlobal, recargar } = useTema();
  const [tema, setTema] = useState<TemaVisual | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);

  useEffect(() => {
    if (temaGlobal) setTema(temaGlobal);
  }, [temaGlobal]);

  function cambiarCampo(campo: CampoColor, valor: string) {
    if (!tema) return;
    const actualizado = { ...tema, [campo]: valor };
    setTema(actualizado);
    aplicarTema(actualizado);
  }

  async function guardar() {
    if (!tema) return;
    setGuardando(true);
    try {
      await api.tema.actualizar(tema);
      await recargar();
      toast.exito("Apariencia guardada.");
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function subirLogo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendoLogo(true);
    try {
      await api.tema.subirLogo(archivo);
      await recargar();
      toast.exito("Logo actualizado.");
    } catch (err) {
      toast.error(mensajeDeError(err));
    } finally {
      setSubiendoLogo(false);
      e.target.value = "";
    }
  }

  if (!tema) return <p>Cargando...</p>;

  return (
    <section>
      <div className="seccion-header seccion-header-solo-accion">
        <button className="boton-primario" onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
      <p className="aviso">
        Los colores se previsualizan al instante. Presiona "Guardar cambios" para aplicarlos a todos los
        dispositivos. El logo se sube y aplica de inmediato.
      </p>

      <div className="bloque-logo">
        <div className="logo-preview">
          {tema.logoUrl ? <img src={tema.logoUrl} alt="Logo actual" /> : <span>Sin logo</span>}
        </div>
        <div>
          <label>
            Nombre del restaurante
            <input
              value={tema.nombreRestaurante}
              onChange={(e) => setTema({ ...tema, nombreRestaurante: e.target.value })}
            />
          </label>
          <label className="boton-secundario boton-subir-logo">
            {subiendoLogo ? "Subiendo..." : "Subir logo"}
            <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={subirLogo} hidden />
          </label>
        </div>
      </div>

      <div className="apariencia-layout">
        <div className="apariencia-colores">
          {GRUPOS_TEMA.map((grupo) => (
            <div key={grupo.titulo} className="grupo-colores">
              <h3 className="grupo-colores-titulo">{grupo.titulo}</h3>
              <div className="grid-colores">
                {grupo.campos.map(({ campo, etiqueta, descripcion }) => (
                  <label key={campo} className="campo-color">
                    <div className="campo-color-encabezado">
                      <span>{etiqueta}</span>
                      <input type="color" value={tema[campo]} onChange={(e) => cambiarCampo(campo, e.target.value)} />
                    </div>
                    <span className="campo-color-descripcion">{descripcion}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="apariencia-preview">
          <p className="texto-tenue">Vista previa en vivo</p>
          <div className="apariencia-preview-tarjeta">
            <p className="apariencia-preview-texto">Texto principal de ejemplo</p>
            <p className="texto-tenue">Texto secundario de ejemplo</p>
            <div className="apariencia-preview-fila">
              <button type="button" className="boton-primario">
                Botón primario
              </button>
              <button type="button" className="boton-secundario">
                Botón secundario
              </button>
            </div>
            <div className="apariencia-preview-fila">
              <Badge texto="Disponible" tono="verde" />
              <Badge texto="Agotado" tono="rojo" />
              <Badge texto="Sobrante" tono="amarillo" />
              <Badge texto="Reservada" tono="azul" />
            </div>
            <div className="apariencia-preview-fila">
              <span className="chip-comensal chip-comensal-activo">Comensal 1 (activo)</span>
              <span className="chip-comensal">Comensal 2</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
