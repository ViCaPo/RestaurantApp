namespace RestaurantApp.Core.Entidades;

public class TemaVisual
{
    public int Id { get; set; }
    public string ColorFondo { get; set; } = "#f4f5fb";
    public string ColorSuperficie { get; set; } = "#ffffff";
    public string ColorBorde { get; set; } = "#e2e5f0";
    public string ColorTexto { get; set; } = "#1e2233";
    public string ColorTextoTenue { get; set; } = "#6b7280";
    public string ColorPrimario { get; set; } = "#4f46e5";
    public string ColorPrimarioClaro { get; set; } = "#e0e7ff";
    public string ColorPrimarioOscuro { get; set; } = "#3730a3";
    public string ColorExito { get; set; } = "#16a34a";
    public string ColorExitoClaro { get; set; } = "#dcfce7";
    public string ColorError { get; set; } = "#dc2626";
    public string ColorErrorClaro { get; set; } = "#fee2e2";
    public string ColorAdvertencia { get; set; } = "#d97706";
    public string ColorAdvertenciaClaro { get; set; } = "#fef3c7";
    public string ColorInfo { get; set; } = "#0284c7";
    public string ColorInfoClaro { get; set; } = "#e0f2fe";
    public string? LogoUrl { get; set; }
    public string NombreRestaurante { get; set; } = "Mi Restaurante";
}
