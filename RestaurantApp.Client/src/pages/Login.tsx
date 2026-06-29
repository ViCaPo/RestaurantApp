import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useSesion } from "../contexts/SesionContext";
import { mensajeDeError } from "../components/Toast";
import Header from "../components/Header";
import { rutaInicioPorRol } from "../roles";

export default function Login() {
  const { iniciarSesion } = useSesion();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const usuario = await iniciarSesion(pin);
      navigate(rutaInicioPorRol(usuario.rol));
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="pantalla-login">
      <div className="tarjeta-login">
        <Header />
        <h1>Ingresar</h1>
        <p className="texto-tenue">Ingresa tu PIN para acceder a tus mesas.</p>
        <form onSubmit={enviar} className="form-modal">
          <label>
            PIN
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
              required
              maxLength={6}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="boton-primario" disabled={cargando}>
            {cargando ? "Verificando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
