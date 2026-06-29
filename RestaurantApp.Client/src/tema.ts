import type { TemaVisual } from "./api";

type CampoColor = keyof Omit<TemaVisual, "id" | "logoUrl" | "nombreRestaurante">;

const MAPEO: Record<CampoColor, string> = {
  colorFondo: "--color-fondo",
  colorSuperficie: "--color-superficie",
  colorBorde: "--color-borde",
  colorTexto: "--color-texto",
  colorTextoTenue: "--color-texto-tenue",
  colorPrimario: "--color-primario",
  colorPrimarioClaro: "--color-primario-claro",
  colorPrimarioOscuro: "--color-primario-oscuro",
  colorExito: "--color-exito",
  colorExitoClaro: "--color-exito-claro",
  colorError: "--color-error",
  colorErrorClaro: "--color-error-claro",
  colorAdvertencia: "--color-advertencia",
  colorAdvertenciaClaro: "--color-advertencia-claro",
  colorInfo: "--color-info",
  colorInfoClaro: "--color-info-claro",
};

export function aplicarTema(tema: TemaVisual) {
  const raiz = document.documentElement.style;
  for (const [propiedad, variable] of Object.entries(MAPEO)) {
    raiz.setProperty(variable, tema[propiedad as CampoColor]);
  }
}
