import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Comanda, type Mesa, type MetodoPago, type TurnoCaja, type ResumenTurno, type ConfigTicket } from "../api";
import Header from "../components/Header";
import Modal from "../components/Modal";
import EnlaceAdmin from "../components/EnlaceAdmin";
import { useSesion } from "../contexts/SesionContext";
import { useTema } from "../contexts/TemaContext";
import { useToast, mensajeDeError } from "../components/Toast";
import { imprimirTicket } from "../ticket";

const METODOS: MetodoPago[] = ["Efectivo", "Tarjeta", "Transferencia", "Mixto"];
const PORCENTAJES_PROPINA = [10, 15, 20];

const dinero = (n: number) => `$${n.toFixed(2)}`;

export default function Caja() {
  const { usuario, cerrarSesion } = useSesion();
  const { tema } = useTema();
  const toast = useToast();
  const navigate = useNavigate();
  const [configTicket, setConfigTicket] = useState<ConfigTicket | null>(null);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [comandas, setComandas] = useState<Record<number, Comanda>>({});
  const [error, setError] = useState<string | null>(null);

  // Turno de caja (apertura / corte)
  const [turno, setTurno] = useState<TurnoCaja | null>(null);
  const [fondoInicial, setFondoInicial] = useState(0);
  const [modalCorte, setModalCorte] = useState(false);
  const [resumenCorte, setResumenCorte] = useState<ResumenTurno | null>(null);
  const [efectivoContado, setEfectivoContado] = useState(0);
  const [resultadoCorte, setResultadoCorte] = useState<ResumenTurno | null>(null);

  // Cobro
  const [comandaParaCobrar, setComandaParaCobrar] = useState<Comanda | null>(null);
  const [metodo, setMetodo] = useState<MetodoPago>("Efectivo");
  const [propina, setPropina] = useState(0);
  const [porcentajePropina, setPorcentajePropina] = useState<number | null>(null);
  const [montoRecibido, setMontoRecibido] = useState(0);
  const [montoEfectivo, setMontoEfectivo] = useState(0);
  const [montoTarjeta, setMontoTarjeta] = useState(0);
  const [referencia, setReferencia] = useState("");
  const [autorizacion, setAutorizacion] = useState("");
  const [ultimosDigitos, setUltimosDigitos] = useState("");

  const totalAPagar = (comandaParaCobrar?.total ?? 0) + propina;
  const usaTarjeta = metodo === "Tarjeta" || (metodo === "Mixto" && montoTarjeta > 0);
  const usaTransferencia = metodo === "Transferencia";
  const requiereReferencia = usaTarjeta || usaTransferencia;

  async function cargarTurno() {
    if (!usuario) return;
    try {
      setTurno(await api.caja.turnoAbierto(usuario.id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function cargar() {
    try {
      const listaMesas = await api.mesas.listar();
      setMesas(listaMesas);
      const idsComanda = listaMesas.map((m) => m.comandaActivaId).filter((id): id is number => id != null);
      const detalles = await Promise.all(idsComanda.map((id) => api.comandas.obtener(id)));
      const mapa: Record<number, Comanda> = {};
      detalles.forEach((c) => (mapa[c.id] = c));
      setComandas(mapa);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    cargarTurno();
    cargar();
    api.ticket.obtener().then(setConfigTicket).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function imprimirTicketCobro() {
    if (!comandaParaCobrar || !usuario || !configTicket || !tema) return;
    const totalPagar = comandaParaCobrar.total + propina;
    const enEfectivo = metodo === "Efectivo";
    const enMixto = metodo === "Mixto";
    imprimirTicket(
      {
        mesa: comandaParaCobrar.mesa?.nombre,
        comandaId: comandaParaCobrar.id,
        fecha: new Date(),
        cajero: usuario.nombre,
        mesero: comandaParaCobrar.mesero?.nombre ?? null,
        items: comandaParaCobrar.items
          .filter((i) => !i.cancelado)
          .map((i) => ({
            cantidad: i.cantidad,
            nombre: i.producto?.nombre ?? "",
            importe: i.precioUnitarioTotal * i.cantidad,
          })),
        subtotal: comandaParaCobrar.subtotal,
        descuento: comandaParaCobrar.descuento,
        propina,
        total: totalPagar,
        metodo,
        montoRecibido: enEfectivo ? montoRecibido : enMixto ? montoEfectivo + montoTarjeta : null,
        cambio: enEfectivo
          ? Math.max(0, montoRecibido - totalPagar)
          : enMixto
          ? Math.max(0, montoEfectivo + montoTarjeta - totalPagar)
          : null,
        referencia: requiereReferencia ? referencia.trim() : null,
        autorizacion: usaTarjeta ? autorizacion.trim() : null,
        ultimosDigitos: usaTarjeta ? ultimosDigitos.trim() : null,
      },
      configTicket,
      tema
    );
  }

  const mesasConCuenta = mesas.filter((m) => m.comandaActivaId != null && comandas[m.comandaActivaId]);

  async function abrirCaja(e: FormEvent) {
    e.preventDefault();
    if (!usuario) return;
    try {
      const t = await api.caja.abrir(usuario.id, fondoInicial);
      setTurno(t);
      toast.exito("Caja abierta.");
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  }

  async function abrirCorte() {
    if (!turno) return;
    try {
      const r = await api.caja.resumen(turno.id);
      setResumenCorte(r);
      setEfectivoContado(Math.round(r.efectivoEsperado * 100) / 100);
      setResultadoCorte(null);
      setModalCorte(true);
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  }

  async function confirmarCorte() {
    if (!turno) return;
    try {
      const r = await api.caja.cerrar(turno.id, efectivoContado);
      setResultadoCorte(r);
      toast.exito("Corte de caja realizado.");
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  }

  function cerrarModalCorte() {
    setModalCorte(false);
    if (resultadoCorte) {
      setTurno(null);
      setResultadoCorte(null);
      setResumenCorte(null);
    }
  }

  function abrirCobro(comanda: Comanda) {
    setComandaParaCobrar(comanda);
    setMetodo("Efectivo");
    setPropina(0);
    setPorcentajePropina(null);
    setMontoRecibido(comanda.total);
    setMontoEfectivo(comanda.total);
    setMontoTarjeta(0);
    setReferencia("");
    setAutorizacion("");
    setUltimosDigitos("");
  }

  function elegirPorcentajePropina(porcentaje: number) {
    if (!comandaParaCobrar) return;
    setPorcentajePropina(porcentaje);
    setPropina(Math.round(comandaParaCobrar.total * (porcentaje / 100) * 100) / 100);
  }

  function cambiarPropinaManual(valor: number) {
    setPorcentajePropina(null);
    setPropina(valor);
  }

  async function confirmarCobro(e: FormEvent) {
    e.preventDefault();
    if (!comandaParaCobrar || !usuario) return;
    if (requiereReferencia && !referencia.trim()) {
      toast.error("Captura la referencia de la transacción para dejar trazabilidad.");
      return;
    }
    try {
      await api.comandas.cobrar(
        comandaParaCobrar.id,
        metodo,
        propina,
        usuario.id,
        metodo === "Efectivo" ? montoRecibido : undefined,
        metodo === "Mixto" ? montoEfectivo : undefined,
        metodo === "Mixto" ? montoTarjeta : undefined,
        requiereReferencia
          ? {
              referencia: referencia.trim(),
              autorizacion: usaTarjeta ? autorizacion.trim() : undefined,
              ultimosDigitos: usaTarjeta ? ultimosDigitos.trim() : undefined,
            }
          : undefined
      );
      if (configTicket?.imprimirAutomatico) imprimirTicketCobro();
      toast.exito(`Mesa ${comandaParaCobrar.mesa?.nombre} cobrada.`);
      setComandaParaCobrar(null);
      await cargar();
    } catch (err) {
      toast.error(mensajeDeError(err));
    }
  }

  function salir() {
    cerrarSesion();
    navigate("/login");
  }

  return (
    <div>
      <Header />
      <div className="mesas-encabezado">
        <div>
          <h1>Caja</h1>
          {usuario && <p className="texto-tenue">Hola, {usuario.nombre}</p>}
        </div>
        <div className="mesas-encabezado-acciones">
          <EnlaceAdmin />
          <Link to="/" className="enlace-volver">
            <i className="ti ti-arrow-left" aria-hidden="true"></i> Volver a Mesas
          </Link>
          <button className="boton-secundario" onClick={salir}>
            Cerrar sesión
          </button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      {!turno ? (
        <form className="panel-apertura-caja" onSubmit={abrirCaja}>
          <div className="panel-apertura-caja-texto">
            <h2>
              <i className="ti ti-lock" aria-hidden="true"></i> Caja cerrada
            </h2>
            <p className="texto-tenue">Abre la caja con el fondo inicial para empezar a cobrar.</p>
          </div>
          <label>
            Fondo inicial
            <input
              type="number"
              step="0.01"
              min={0}
              value={fondoInicial}
              onChange={(e) => setFondoInicial(Number(e.target.value))}
              required
              autoFocus
            />
          </label>
          <button type="submit" className="boton-primario">
            <i className="ti ti-cash" aria-hidden="true"></i> Abrir caja
          </button>
        </form>
      ) : (
        <>
          <div className="barra-turno-caja">
            <span className="barra-turno-caja-estado">
              <i className="ti ti-lock-open" aria-hidden="true"></i> Caja abierta
            </span>
            <span className="texto-tenue">
              Desde {new Date(turno.apertura).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Fondo{" "}
              {dinero(turno.fondoInicial)}
            </span>
            <button className="boton-secundario" onClick={abrirCorte}>
              <i className="ti ti-report-money" aria-hidden="true"></i> Corte de caja
            </button>
          </div>

          <div className="lista-cuentas-caja">
            {mesasConCuenta.map((m) => {
              const comanda = comandas[m.comandaActivaId!];
              return (
                <div key={m.id} className="tarjeta-cuenta-caja">
                  <div className="tarjeta-cuenta-caja-info">
                    <strong>{m.nombre}</strong>
                    <span className="texto-tenue">
                      {comanda.items.filter((i) => !i.cancelado).length} productos
                    </span>
                  </div>
                  <div className="tarjeta-cuenta-caja-acciones">
                    <span className="tarjeta-cuenta-caja-total">{dinero(comanda.total)}</span>
                    <button className="boton-primario" onClick={() => abrirCobro(comanda)}>
                      Cobrar
                    </button>
                  </div>
                </div>
              );
            })}
            {mesasConCuenta.length === 0 && <p className="celda-vacia">No hay cuentas abiertas por cobrar.</p>}
          </div>
        </>
      )}

      {comandaParaCobrar && (
        <Modal titulo={`Cobrar mesa ${comandaParaCobrar.mesa?.nombre}`} onClose={() => setComandaParaCobrar(null)}>
          <form onSubmit={confirmarCobro} className="form-modal">
            <p className="tarjeta-cuenta-caja-total">Total: {dinero(comandaParaCobrar.total)}</p>
            <label>
              Método de pago
              <select value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPago)}>
                {METODOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Propina
              <input
                type="number"
                step="0.01"
                min={0}
                value={propina}
                onChange={(e) => cambiarPropinaManual(Number(e.target.value))}
              />
            </label>
            <div className="selector-propina">
              {PORCENTAJES_PROPINA.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`chip-comensal ${porcentajePropina === p ? "chip-comensal-activo" : ""}`}
                  onClick={() => elegirPorcentajePropina(p)}
                >
                  {p}%
                </button>
              ))}
              <button
                type="button"
                className={`chip-comensal ${porcentajePropina === 0 ? "chip-comensal-activo" : ""}`}
                onClick={() => elegirPorcentajePropina(0)}
              >
                Sin propina
              </button>
            </div>
            <p className="tarjeta-cuenta-caja-total">Total a pagar: {dinero(totalAPagar)}</p>

            {metodo === "Efectivo" && (
              <>
                <label>
                  Monto recibido
                  <input
                    type="number"
                    step="0.01"
                    min={totalAPagar}
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(Number(e.target.value))}
                    required
                  />
                </label>
                {montoRecibido > totalAPagar && (
                  <p className="texto-tenue">Cambio: {dinero(montoRecibido - totalAPagar)}</p>
                )}
              </>
            )}

            {metodo === "Mixto" && (
              <>
                <label>
                  Monto en efectivo
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={montoEfectivo}
                    onChange={(e) => setMontoEfectivo(Number(e.target.value))}
                    required
                  />
                </label>
                <label>
                  Monto en tarjeta
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={montoTarjeta}
                    onChange={(e) => setMontoTarjeta(Number(e.target.value))}
                    required
                  />
                </label>
                <p className={montoEfectivo + montoTarjeta < totalAPagar ? "error" : "texto-tenue"}>
                  Suma: {dinero(montoEfectivo + montoTarjeta)} de {dinero(totalAPagar)}
                  {montoEfectivo + montoTarjeta > totalAPagar &&
                    ` (cambio: ${dinero(montoEfectivo + montoTarjeta - totalAPagar)})`}
                </p>
              </>
            )}

            {requiereReferencia && (
              <fieldset className="datos-transaccion">
                <legend>Datos de la transacción</legend>
                <p className="texto-tenue">
                  No hay TPV integrado: captura la referencia del comprobante para dejar trazabilidad.
                </p>
                <label>
                  {usaTransferencia ? "Referencia / folio" : "Referencia / n.º de operación"}
                  <input
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    placeholder={usaTransferencia ? "Ej: folio SPEI" : "Ej: núm. de voucher"}
                    required
                  />
                </label>
                {usaTarjeta && (
                  <>
                    <label>
                      Código de autorización (opcional)
                      <input
                        value={autorizacion}
                        onChange={(e) => setAutorizacion(e.target.value)}
                        placeholder="Aprobación del voucher"
                      />
                    </label>
                    <label>
                      Últimos 4 dígitos (opcional)
                      <input
                        value={ultimosDigitos}
                        onChange={(e) => setUltimosDigitos(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="1234"
                      />
                    </label>
                  </>
                )}
              </fieldset>
            )}
            <div className="form-modal-acciones">
              <button type="button" className="boton-secundario" onClick={() => setComandaParaCobrar(null)}>
                Cancelar
              </button>
              <button
                type="submit"
                className="boton-primario"
                disabled={
                  (metodo === "Mixto" && montoEfectivo + montoTarjeta < totalAPagar) ||
                  (requiereReferencia && !referencia.trim())
                }
              >
                Confirmar cobro
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modalCorte && resumenCorte && (
        <Modal titulo="Corte de caja" onClose={cerrarModalCorte}>
          <div className="corte-caja">
            <div className="corte-caja-fila">
              <span>Fondo inicial</span>
              <strong>{dinero(resumenCorte.fondoInicial)}</strong>
            </div>
            <div className="corte-caja-fila">
              <span>Transacciones</span>
              <strong>{resumenCorte.numTransacciones}</strong>
            </div>

            <table className="corte-caja-metodos">
              <tbody>
                {resumenCorte.porMetodo.map((m) => (
                  <tr key={m.metodo}>
                    <td>{m.metodo}</td>
                    <td className="texto-tenue">{m.cantidad}</td>
                    <td>{dinero(m.monto)}</td>
                  </tr>
                ))}
                {resumenCorte.porMetodo.length === 0 && (
                  <tr>
                    <td colSpan={3} className="texto-tenue">
                      Sin cobros en este turno.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="corte-caja-fila">
              <span>Ventas (sin propina)</span>
              <strong>{dinero(resumenCorte.totalVentas)}</strong>
            </div>
            <div className="corte-caja-fila">
              <span>Propinas</span>
              <strong>{dinero(resumenCorte.totalPropinas)}</strong>
            </div>
            <div className="corte-caja-fila corte-caja-fila-destacada">
              <span>Efectivo esperado en caja</span>
              <strong>{dinero(resumenCorte.efectivoEsperado)}</strong>
            </div>

            {!resultadoCorte ? (
              <>
                <label>
                  Efectivo contado
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={efectivoContado}
                    onChange={(e) => setEfectivoContado(Number(e.target.value))}
                    autoFocus
                  />
                </label>
                <div className="form-modal-acciones">
                  <button type="button" className="boton-secundario" onClick={cerrarModalCorte}>
                    Cancelar
                  </button>
                  <button type="button" className="boton-primario" onClick={confirmarCorte}>
                    Cerrar caja y hacer corte
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="corte-caja-fila">
                  <span>Efectivo contado</span>
                  <strong>{dinero(resultadoCorte.efectivoContado ?? 0)}</strong>
                </div>
                <div className={`corte-caja-resultado corte-caja-resultado-${(resultadoCorte.estado ?? "").toLowerCase()}`}>
                  <span>{resultadoCorte.estado}</span>
                  <strong>{dinero(resultadoCorte.diferencia ?? 0)}</strong>
                </div>
                <div className="form-modal-acciones">
                  <button type="button" className="boton-primario" onClick={cerrarModalCorte}>
                    Listo
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
