using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.Entidades;

namespace RestaurantApp.Core.Interfaces;

public interface IAppDbContext
{
    DbSet<Producto> Productos { get; }
    DbSet<Categoria> Categorias { get; }
    DbSet<Mesa> Mesas { get; }
    DbSet<Comanda> Comandas { get; }
    DbSet<ComandaItem> ComandaItems { get; }
    DbSet<Usuario> Usuarios { get; }
    DbSet<Pago> Pagos { get; }
    DbSet<TurnoCaja> TurnosCaja { get; }
    DbSet<TemaVisual> TemasVisuales { get; }
    DbSet<Extra> Extras { get; }
    DbSet<ComandaItemExtra> ComandaItemExtras { get; }
    DbSet<Estacion> Estaciones { get; }
    DbSet<SesionToken> SesionTokens { get; }
    DbSet<ConfigTicket> ConfigsTicket { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
