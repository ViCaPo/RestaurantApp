using RestaurantApp.Application.Dtos;

namespace RestaurantApp.Application.Servicios;

public interface IComandaNotificador
{
    Task NotificarItemNuevoAsync(ItemCocinaDto item);
    Task NotificarItemActualizadoAsync(ItemCocinaDto item);
}
