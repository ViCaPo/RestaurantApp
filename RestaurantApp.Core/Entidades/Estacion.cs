namespace RestaurantApp.Core.Entidades;

public class Estacion
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
    public bool Activo { get; set; } = true;
    // Impresión de comandas: cada estación puede tener su propio dispositivo/impresora
    // conectado en el equipo donde se muestra su pantalla de Cocina filtrada.
    public bool ImprimirComandaAutomatico { get; set; } = false;
    public int AnchoPapelComandaMm { get; set; } = 80;
}
