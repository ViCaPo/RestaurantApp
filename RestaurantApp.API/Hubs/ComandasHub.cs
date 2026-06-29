using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace RestaurantApp.API.Hubs;

[Authorize]
public class ComandasHub : Hub
{
}
