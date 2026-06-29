using RestaurantApp.Core.Enums;

namespace RestaurantApp.Core.Entidades;

public class Usuario
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
    public string Pin { get; set; } = "";
    public Rol Rol { get; set; }
    public bool Activo { get; set; } = true;
}
