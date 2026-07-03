namespace RestaurantApp.Core.Entidades;

/// <summary>Configuración del layout del ticket de venta que se imprime al cobrar.</summary>
public class ConfigTicket
{
    public int Id { get; set; }
    public bool MostrarLogo { get; set; } = true;
    public string? LogoUrl { get; set; }
    public string Direccion { get; set; } = "";
    public string Telefono { get; set; } = "";
    public string Rfc { get; set; } = "";
    public bool MostrarMeseroCajero { get; set; } = true;
    public bool MostrarPropina { get; set; } = true;
    public bool MostrarReferencia { get; set; } = true;
    public string MensajePie { get; set; } = "¡Gracias por su visita!";
    public int AnchoPapelMm { get; set; } = 80;
    public bool ImprimirAutomatico { get; set; } = true;
}
