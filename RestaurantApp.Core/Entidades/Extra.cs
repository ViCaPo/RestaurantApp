namespace RestaurantApp.Core.Entidades;

public class Extra
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
    public decimal PrecioAdicional { get; set; }
    public bool Activo { get; set; } = true;
    public List<Producto> Productos { get; set; } = new();
}
