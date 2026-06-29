using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.Entidades;

public class Mesa
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
    public int Capacidad { get; set; }
    public string? Zona { get; set; }
    public EstadoMesa Estado { get; set; } = EstadoMesa.Libre;
    public int? ComandaActivaId { get; set; }
    public int? MeseroAsignadoId { get; set; }
    public Usuario? MeseroAsignado { get; set; }
}
