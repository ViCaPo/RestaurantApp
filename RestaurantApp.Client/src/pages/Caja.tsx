import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Comanda, type Mesa, type MetodoPago } from "../api";
import Header from "../components/Header";
import Modal from "../components/Modal";
import EnlaceAdmin from "../components/EnlaceAdmin";
import { useSesion } from "../contexts/SesionContext";
import { useToast, mensajeDeError } from "../components/Toast";

const METODOS: MetodoPago[] = ["Efectivo", "Tarjeta", "Transferencia", "Mixto"];
const PORCENTAJES_PROPINA = [10, 15, 20];

export default function Caja() {
  const { usuario, cerrarSesion } = useSesion();
  const toast = useToast();
  const navigate = useNavigate();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [comandas, setComandas] = useState<Record<number, Comanda>>({});
  const [error, setError] = useState<string | null>(null);
  const [comandaParaCobrar, setComandaParaCobrar] = useState<Comanda | null>(null);
  const [metodo, setMetodo] = useState<MetodoPago>("Efectivo");
  const [propina, setPropina] = useState(0);
  const [porcentajePropina, setPorcentajePropina] = useState<number | null>(null);
  const [montoRecibido, setMontoRecibido] = useState(0);
  const [montoEfectivo, setMontoEfectivo] = useState(0);
  const [montoTarjeta, setMontoTarjeta] = useState(0);

  const totalAPagar = (comandaParaCobrar?.total ?? 0) + propina;

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
    cargar();
  }, []);

  const mesasConCuenta = mesas.filter((m) => m.comandaActivaId != null && comandas[m.comandaActivaId]);

  function abrirCobro(comanda: Comanda) {
    setComandaParaCobrar(comanda);
    setMetodo("Efectivo");
    setPropina(0);
    setPorcentajePropina(null);
    setMontoRecibido(comanda.total);
    setMontoEfectivo(comanda.total);
    setMontoTarjeta(0);
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
    try {
      await api.comandas.cobrar(
        comandaParaCobrar.id,
        metodo,
        propina,
        usuario.id,
        metodo === "Efectivo" ? montoRecibido : undefined,
        metodo === "Mixto" ? montoEfectivo : undefined,
        metodo === "Mixto" ? montoTarjeta : undefined
      );
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

      <div className="lista-cuentas-caja">
        {mesasConCuenta.map((m) => {
          const comanda = comandas[m.comandaActivaId!];
          return (
            <div key={m.id} className="tarjeta-cuenta-caja">
              <div className="tarjeta-cuenta-caja-info">
                <strong>{m.nombre}</strong>
                <span className="texto-tenue">{comanda.items.filter((i) => !i.cancelado).length} productos</span>
              </div>
              <div className="tarjeta-cuenta-caja-acciones">
                <span className="tarjeta-cuenta-caja-total">${comanda.total.toFixed(2)}</span>
                <button className="boton-primario" onClick={() => abrirCobro(comanda)}>
                  Cobrar
                </button>
              </div>
            </div>
          );
        })}
        {mesasConCuenta.length === 0 && <p className="celda-vacia">No hay cuentas abiertas por cobrar.</p>}
      </div>

      {comandaParaCobrar && (
        <Modal titulo={`Cobrar mesa ${comandaParaCobrar.mesa?.nombre}`} onClose={() => setComandaParaCobrar(null)}>
          <form onSubmit={confirmarCobro} className="form-modal">
            <p className="tarjeta-cuenta-caja-total">Total: ${comandaParaCobrar.total.toFixed(2)}</p>
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
            <p className="tarjeta-cuenta-caja-total">Total a pagar: ${totalAPagar.toFixed(2)}</p>

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
                  <p className="texto-tenue">Cambio: ${(montoRecibido - totalAPagar).toFixed(2)}</p>
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
                  Suma: ${(montoEfectivo + montoTarjeta).toFixed(2)} de ${totalAPagar.toFixed(2)}
                  {montoEfectivo + montoTarjeta > totalAPagar &&
                    ` (cambio: $${(montoEfectivo + montoTarjeta - totalAPagar).toFixed(2)})`}
                </p>
              </>
            )}
            <div className="form-modal-acciones">
              <button type="button" className="boton-secundario" onClick={() => setComandaParaCobrar(null)}>
                Cancelar
              </button>
              <button
                type="submit"
                className="boton-primario"
                disabled={metodo === "Mixto" && montoEfectivo + montoTarjeta < totalAPagar}
              >
                Confirmar cobro
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
