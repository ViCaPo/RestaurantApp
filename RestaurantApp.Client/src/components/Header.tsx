import { useTema } from "../contexts/TemaContext";

export default function Header() {
  const { tema } = useTema();

  return (
    <header className="encabezado">
      {tema?.logoUrl && <img src={tema.logoUrl} alt="" className="encabezado-logo" />}
      <span className="encabezado-nombre">{tema?.nombreRestaurante ?? "Mi Restaurante"}</span>
    </header>
  );
}
