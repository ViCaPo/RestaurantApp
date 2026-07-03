import { createContext, useCallback, useContext, useRef, useState, type FormEvent, type ReactNode } from "react";
import Modal from "./Modal";

interface OpcionesConfirmar {
  titulo?: string;
  mensaje: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  peligro?: boolean;
}

interface OpcionesTexto {
  titulo?: string;
  mensaje?: ReactNode;
  etiqueta?: string;
  placeholder?: string;
  textoConfirmar?: string;
  requerido?: boolean;
}

interface ConfirmacionContextValue {
  /** Modal de confirmación sí/no. Resuelve true si el usuario confirma. */
  confirmar: (opciones: OpcionesConfirmar) => Promise<boolean>;
  /** Modal con un campo de texto. Resuelve el texto, o null si se cancela. */
  pedirTexto: (opciones: OpcionesTexto) => Promise<string | null>;
}

type Estado =
  | { modo: "confirmar"; opciones: OpcionesConfirmar }
  | { modo: "texto"; opciones: OpcionesTexto };

const ConfirmacionContext = createContext<ConfirmacionContextValue | null>(null);

export function ConfirmacionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [valorTexto, setValorTexto] = useState("");
  const resolverRef = useRef<((valor: unknown) => void) | null>(null);

  const cerrar = useCallback((valor: unknown) => {
    resolverRef.current?.(valor);
    resolverRef.current = null;
    setEstado(null);
    setValorTexto("");
  }, []);

  const confirmar = useCallback((opciones: OpcionesConfirmar) => {
    setEstado({ modo: "confirmar", opciones });
    return new Promise<boolean>((resolver) => {
      resolverRef.current = resolver as (valor: unknown) => void;
    });
  }, []);

  const pedirTexto = useCallback((opciones: OpcionesTexto) => {
    setValorTexto("");
    setEstado({ modo: "texto", opciones });
    return new Promise<string | null>((resolver) => {
      resolverRef.current = resolver as (valor: unknown) => void;
    });
  }, []);

  function enviarTexto(e: FormEvent) {
    e.preventDefault();
    const texto = valorTexto.trim();
    if (estado?.modo === "texto" && estado.opciones.requerido && texto.length === 0) return;
    cerrar(texto.length > 0 ? texto : null);
  }

  return (
    <ConfirmacionContext.Provider value={{ confirmar, pedirTexto }}>
      {children}

      {estado?.modo === "confirmar" && (
        <Modal titulo={estado.opciones.titulo ?? "Confirmar"} onClose={() => cerrar(false)}>
          <p className="texto-confirmacion">{estado.opciones.mensaje}</p>
          <div className="form-modal-acciones">
            <button className="boton-secundario" onClick={() => cerrar(false)}>
              {estado.opciones.textoCancelar ?? "Cancelar"}
            </button>
            <button
              className={estado.opciones.peligro ? "boton-peligro" : "boton-primario"}
              onClick={() => cerrar(true)}
              autoFocus
            >
              {estado.opciones.textoConfirmar ?? "Confirmar"}
            </button>
          </div>
        </Modal>
      )}

      {estado?.modo === "texto" && (
        <Modal titulo={estado.opciones.titulo ?? "Confirmar"} onClose={() => cerrar(null)}>
          {estado.opciones.mensaje && <p className="texto-confirmacion">{estado.opciones.mensaje}</p>}
          <form className="form-modal" onSubmit={enviarTexto}>
            <label>
              {estado.opciones.etiqueta ?? "Motivo"}
              <input
                value={valorTexto}
                onChange={(e) => setValorTexto(e.target.value)}
                placeholder={estado.opciones.placeholder}
                autoFocus
              />
            </label>
            <div className="form-modal-acciones">
              <button type="button" className="boton-secundario" onClick={() => cerrar(null)}>
                Cancelar
              </button>
              <button
                type="submit"
                className="boton-primario"
                disabled={estado.opciones.requerido && valorTexto.trim().length === 0}
              >
                {estado.opciones.textoConfirmar ?? "Aceptar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </ConfirmacionContext.Provider>
  );
}

export function useConfirmacion() {
  const ctx = useContext(ConfirmacionContext);
  if (!ctx) throw new Error("useConfirmacion debe usarse dentro de ConfirmacionProvider");
  return ctx;
}
