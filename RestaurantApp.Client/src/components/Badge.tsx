export default function Badge({ texto, tono }: { texto: string; tono: "verde" | "rojo" | "amarillo" | "azul" | "gris" }) {
  return <span className={`badge badge-${tono}`}>{texto}</span>;
}
