namespace RestaurantApp.Application.Dtos;

public record ItemCocinaDto(
    int ItemId,
    int ComandaId,
    int MesaId,
    int MeseroId,
    string MesaNombre,
    string ProductoNombre,
    int? EstacionId,
    string? Estacion,
    int Cantidad,
    int? NumeroComensal,
    string? Notas,
    List<string> Extras,
    string Estado,
    DateTime FechaCreacion
);
