using Microsoft.AspNetCore.SignalR;
using RestaurantApp.Application.Dtos;
using RestaurantApp.Application.Servicios;

namespace RestaurantApp.API.Hubs;

public class ComandaNotificadorSignalR : IComandaNotificador
{
    private readonly IHubContext<ComandasHub> _hub;
    public ComandaNotificadorSignalR(IHubContext<ComandasHub> hub) => _hub = hub;

    public Task NotificarItemNuevoAsync(ItemCocinaDto item) => _hub.Clients.All.SendAsync("item-nuevo", item);

    public Task NotificarItemActualizadoAsync(ItemCocinaDto item) => _hub.Clients.All.SendAsync("item-actualizado", item);
}
