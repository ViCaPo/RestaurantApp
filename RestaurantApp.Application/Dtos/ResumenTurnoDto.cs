namespace RestaurantApp.Application.Dtos;

public record MetodoResumen(string Metodo, int Cantidad, decimal Monto);

public record ResumenTurnoDto(
    int TurnoId,
    int CajeroId,
    string? CajeroNombre,
    DateTime Apertura,
    DateTime? Cierre,
    decimal FondoInicial,
    int NumTransacciones,
    decimal TotalVentas,
    decimal TotalPropinas,
    List<MetodoResumen> PorMetodo,
    decimal VentasEfectivo,
    decimal EfectivoEsperado,
    decimal? EfectivoContado,
    decimal? Diferencia,
    string? Estado
);
