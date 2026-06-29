namespace RestaurantApp.Core.Entidades;

public class Producto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
    public string? Descripcion { get; set; }
    public string? Sku { get; set; }
    public decimal Precio { get; set; }
    public int CategoriaId { get; set; }
    public Categoria? Categoria { get; set; }
    public int? EstacionId { get; set; }
    public Estacion? Estacion { get; set; }
    public bool Disponible { get; set; } = true;
    public bool Activo { get; set; } = true;
    public List<Extra> ExtrasDisponibles { get; set; } = new();
}
