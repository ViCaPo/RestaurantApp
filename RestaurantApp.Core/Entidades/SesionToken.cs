namespace RestaurantApp.Core.Entidades;

/// <summary>
/// Token de sesión opaco emitido al iniciar sesión. No caduca por tiempo
/// (los meseros/cocineros/cajeros no deben re-loguearse constantemente); se
/// invalida solo al cerrar sesión o al desactivar al usuario.
/// </summary>
public class SesionToken
{
    public int Id { get; set; }
    public string Token { get; set; } = "";
    public int UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.Now;
}
