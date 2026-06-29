namespace RestaurantApp.Core.Entidades;

public class Categoria
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
    public int Orden { get; set; }
    public bool Activo { get; set; } = true;
    public List<Producto> Productos { get; set; } = new();
}
