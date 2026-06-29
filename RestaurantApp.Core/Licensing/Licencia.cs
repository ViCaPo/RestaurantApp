namespace RestaurantApp.Core.Licensing;

public class Licencia
{
    public string NombreCliente { get; set; } = "";
    public string RfcOIdentificador { get; set; } = "";
    public string HardwareId { get; set; } = "";
    public DateTime FechaExpiracion { get; set; }
    public List<Modulo> ModulosActivos { get; set; } = new();
    public string Firma { get; set; } = "";

    public bool TieneModulo(Modulo m) =>
        m == Modulo.PuntoDeVenta || ModulosActivos.Contains(m);
    public bool EstaVigente() => DateTime.Now <= FechaExpiracion;
}
