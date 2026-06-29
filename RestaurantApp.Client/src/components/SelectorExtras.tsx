import { useState } from "react";
import type { Extra } from "../api";

export default function SelectorExtras({
  extras,
  seleccionados,
  onToggle,
}: {
  extras: Extra[];
  seleccionados: number[];
  onToggle: (extraId: number) => void;
}) {
  const [busqueda, setBusqueda] = useState("");

  const extrasFiltrados = extras.filter((ex) => ex.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const seleccionadosInfo = extras.filter((ex) => seleccionados.includes(ex.id));
  const totalAdicional = seleccionadosInfo.reduce((acc, ex) => acc + ex.precioAdicional, 0);

  return (
    <div className="selector-extras">
      {extras.length > 6 && (
        <input
          className="selector-extras-buscar"
          placeholder="Buscar extra..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      )}

      <div className="selector-extras-chips">
        {extrasFiltrados.map((ex) => {
          const activo = seleccionados.includes(ex.id);
          return (
            <button
              key={ex.id}
              type="button"
              className={`chip-extra ${activo ? "chip-extra-activo" : ""}`}
              onClick={() => onToggle(ex.id)}
              aria-pressed={activo}
            >
              {activo && <i className="ti ti-check" aria-hidden="true"></i>}
              {ex.nombre}
              <span className="chip-extra-precio">+${ex.precioAdicional.toFixed(2)}</span>
            </button>
          );
        })}
        {extrasFiltrados.length === 0 && <span className="texto-tenue">Sin resultados.</span>}
      </div>

      {seleccionadosInfo.length > 0 && (
        <p className="selector-extras-resumen">
          {seleccionadosInfo.length} extra{seleccionadosInfo.length > 1 ? "s" : ""} seleccionado
          {seleccionadosInfo.length > 1 ? "s" : ""} · +${totalAdicional.toFixed(2)}
        </p>
      )}
    </div>
  );
}
