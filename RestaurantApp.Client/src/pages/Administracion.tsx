import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Categoria, type Estacion, type Extra, type Mesa, type Producto, type Rol, type TemaVisual, type Usuario } from "../api";
import { useToast, mensajeDeError } from "../components/Toast";
import { useSesion } from "../contexts/SesionContext";
import { useTema } from "../contexts/TemaContext";
import { aplicarTema } from "../tema";
import Modal from "../components/Modal";
import Badge from "../components/Badge";
import Header from "../components/Header";
import SelectorExtras from "../components/SelectorExtras";

const ROLES: Rol[] = ["Administrador", "Cajero", "Mesero", "Cocinero"];

const ITEMS_NAV = ["Mesas", "Categorías", "Productos", "Extras", "Estaciones", "Usuarios"] as const;
const ITEMS_CONFIGURACION = ["Apariencia"] as const;
type Tab = (typeof ITEMS_NAV)[number] | (typeof ITEMS_CONFIGURACION)[number];

const ICONOS: Record<Tab, string> = {
  Mesas: "ti-tools-kitchen-2",
  Categorías: "ti-category",
  Productos: "ti-soup",
  Extras: "ti-stack-2",
  Estaciones: "ti-chef-hat",
  Usuarios: "ti-users",
  Apariencia: "ti-palette",
};

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
        api.productos.listar(),
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
  const productosAgotados = productos.filter((p) => !p.disponible).length;

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
        {tab === "Apariencia" && <SeccionApariencia />}
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
    if (!window.confirm(`¿Desactivar "${c.nombre}"?`)) return;
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((c) => (
            <tr key={c.id}>
              <td>{c.nombre}</td>
              <td>{c.orden}</td>
              <td>
                <button className="boton-secundario" onClick={() => abrirEditar(c)}>
                  Editar
                </button>
                <button className="boton-peligro" onClick={() => desactivar(c)}>
                  Desactivar
                </button>
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

  const productosFiltrados = productos.filter((p) => {
    const coincideBusqueda =
      !busqueda ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.sku ?? "").toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = filtroCategoria === "" || p.categoriaId === filtroCategoria;
    return coincideBusqueda && coincideCategoria;
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
    try {
      await api.productos.cambiarDisponibilidad(p.id, !p.disponible);
      toast.exito(p.disponible ? "Marcado como agotado." : "Marcado como disponible.");
      onCambio();
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  }

  async function desactivar(p: Producto) {
    if (!window.confirm(`¿Desactivar "${p.nombre}"?`)) return;
    try {
      await api.productos.desactivar(p.id);
      toast.exito("Producto desactivado.");
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
            <th></th>
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
                <Badge texto={p.disponible ? "Disponible" : "Agotado"} tono={p.disponible ? "verde" : "gris"} />
              </td>
              <td>
                <button className="boton-secundario" onClick={() => abrirEditar(p)}>
                  Editar
                </button>
                <button className="boton-secundario" onClick={() => toggleDisponibilidad(p)}>
                  {p.disponible ? "Marcar agotado" : "Marcar disponible"}
                </button>
                <button className="boton-peligro" onClick={() => desactivar(p)}>
                  Desactivar
                </button>
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
    if (!window.confirm(`¿Desactivar "${ex.nombre}"?`)) return;
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {extras.map((ex) => (
            <tr key={ex.id}>
              <td>{ex.nombre}</td>
              <td>${ex.precioAdicional.toFixed(2)}</td>
              <td>
                <button className="boton-secundario" onClick={() => abrirEditar(ex)}>
                  Editar
                </button>
                <button className="boton-peligro" onClick={() => desactivar(ex)}>
                  Desactivar
                </button>
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
    if (!window.confirm(`¿Desactivar "${est.nombre}"?`)) return;
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {estaciones.map((est) => (
            <tr key={est.id}>
              <td>{est.nombre}</td>
              <td>
                <button className="boton-secundario" onClick={() => abrirEditar(est)}>
                  Editar
                </button>
                <button className="boton-peligro" onClick={() => desactivar(est)}>
                  Desactivar
                </button>
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
    if (!window.confirm(`¿Desactivar a "${u.nombre}"?`)) return;
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td title="El PIN se guarda cifrado y no se puede consultar">••••</td>
              <td>{badgeRol(u.rol)}</td>
              <td>
                <button className="boton-peligro" onClick={() => desactivar(u)}>
                  Desactivar
                </button>
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

type CampoColor = keyof Omit<TemaVisual, "id" | "logoUrl" | "nombreRestaurante">;

const CAMPOS_TEMA: { campo: CampoColor; etiqueta: string }[] = [
  { campo: "colorPrimario", etiqueta: "Primario" },
  { campo: "colorPrimarioClaro", etiqueta: "Primario (claro)" },
  { campo: "colorPrimarioOscuro", etiqueta: "Primario (oscuro)" },
  { campo: "colorFondo", etiqueta: "Fondo" },
  { campo: "colorSuperficie", etiqueta: "Superficie (tarjetas/tablas)" },
  { campo: "colorBorde", etiqueta: "Bordes" },
  { campo: "colorTexto", etiqueta: "Texto" },
  { campo: "colorTextoTenue", etiqueta: "Texto secundario" },
  { campo: "colorExito", etiqueta: "Éxito" },
  { campo: "colorExitoClaro", etiqueta: "Éxito (claro)" },
  { campo: "colorError", etiqueta: "Error" },
  { campo: "colorErrorClaro", etiqueta: "Error (claro)" },
  { campo: "colorAdvertencia", etiqueta: "Advertencia" },
  { campo: "colorAdvertenciaClaro", etiqueta: "Advertencia (claro)" },
  { campo: "colorInfo", etiqueta: "Información" },
  { campo: "colorInfoClaro", etiqueta: "Información (claro)" },
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

      <div className="grid-colores">
        {CAMPOS_TEMA.map(({ campo, etiqueta }) => (
          <label key={campo} className="campo-color">
            <span>{etiqueta}</span>
            <input type="color" value={tema[campo]} onChange={(e) => cambiarCampo(campo, e.target.value)} />
          </label>
        ))}
      </div>
    </section>
  );
}
