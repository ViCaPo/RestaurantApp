namespace RestaurantApp.Core.Entidades;

public class ComandaItemExtra
{
    public int Id { get; set; }
    public int ComandaItemId { get; set; }
    public int ExtraId { get; set; }
    public string Nombre { get; set; } = "";
    public decimal PrecioAdicional { get; set; }
}
