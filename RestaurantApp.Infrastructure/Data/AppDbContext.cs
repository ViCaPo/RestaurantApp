using Microsoft.EntityFrameworkCore;
using RestaurantApp.Core.Entidades;
using RestaurantApp.Core.Enums;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.Infrastructure.Data;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Mesa> Mesas => Set<Mesa>();
    public DbSet<Comanda> Comandas => Set<Comanda>();
    public DbSet<ComandaItem> ComandaItems => Set<ComandaItem>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<TurnoCaja> TurnosCaja => Set<TurnoCaja>();
    public DbSet<TemaVisual> TemasVisuales => Set<TemaVisual>();
    public DbSet<Extra> Extras => Set<Extra>();
    public DbSet<ComandaItemExtra> ComandaItemExtras => Set<ComandaItemExtra>();
    public DbSet<Estacion> Estaciones => Set<Estacion>();
    public DbSet<SesionToken> SesionTokens => Set<SesionToken>();
    public DbSet<ConfigTicket> ConfigsTicket => Set<ConfigTicket>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<Producto>().Property(p => p.Precio).HasPrecision(10, 2);
        mb.Entity<ComandaItem>().Property(i => i.PrecioUnitario).HasPrecision(10, 2);
        mb.Entity<Comanda>().Property(c => c.Descuento).HasPrecision(10, 2);
        mb.Entity<Pago>().Property(p => p.Monto).HasPrecision(10, 2);
        mb.Entity<Pago>().Property(p => p.Propina).HasPrecision(10, 2);
        mb.Entity<Pago>().Property(p => p.MontoRecibido).HasPrecision(10, 2);
        mb.Entity<Pago>().Property(p => p.Cambio).HasPrecision(10, 2);
        mb.Entity<Pago>().Property(p => p.MontoEfectivo).HasPrecision(10, 2);
        mb.Entity<Pago>().Property(p => p.MontoTarjeta).HasPrecision(10, 2);
        mb.Entity<TurnoCaja>().Property(t => t.FondoInicial).HasPrecision(10, 2);
        mb.Entity<TurnoCaja>().Property(t => t.EfectivoContado).HasPrecision(10, 2);
        mb.Entity<Extra>().Property(e => e.PrecioAdicional).HasPrecision(10, 2);
        mb.Entity<ComandaItemExtra>().Property(e => e.PrecioAdicional).HasPrecision(10, 2);

        mb.Entity<Comanda>().Ignore(c => c.Subtotal);
        mb.Entity<Comanda>().Ignore(c => c.Total);
        mb.Entity<ComandaItem>().Ignore(i => i.PrecioUnitarioTotal);
        mb.Entity<TurnoCaja>().Ignore(t => t.Abierto);

        mb.Entity<Producto>().HasOne(p => p.Categoria).WithMany(c => c.Productos)
            .HasForeignKey(p => p.CategoriaId).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<Producto>().HasMany(p => p.ExtrasDisponibles).WithMany(e => e.Productos)
            .UsingEntity(j => j.ToTable("ProductoExtra"));
        mb.Entity<Producto>().HasOne(p => p.Estacion).WithMany()
            .HasForeignKey(p => p.EstacionId).OnDelete(DeleteBehavior.SetNull);
        mb.Entity<Comanda>().HasMany(c => c.Items).WithOne(i => i.Comanda)
            .HasForeignKey(i => i.ComandaId).OnDelete(DeleteBehavior.Cascade);
        mb.Entity<ComandaItem>().HasMany(i => i.Extras).WithOne()
            .HasForeignKey(e => e.ComandaItemId).OnDelete(DeleteBehavior.Cascade);
        mb.Entity<Comanda>().HasOne(c => c.Mesa).WithMany()
            .HasForeignKey(c => c.MesaId).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<Comanda>().HasOne(c => c.Mesero).WithMany()
            .HasForeignKey(c => c.MeseroId).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<Pago>().HasOne(p => p.Comanda).WithMany()
            .HasForeignKey(p => p.ComandaId).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<Pago>().HasOne(p => p.TurnoCaja).WithMany()
            .HasForeignKey(p => p.TurnoCajaId).OnDelete(DeleteBehavior.Restrict);
        mb.Entity<Mesa>().HasOne(m => m.MeseroAsignado).WithMany()
            .HasForeignKey(m => m.MeseroAsignadoId).OnDelete(DeleteBehavior.SetNull);

        mb.Entity<Comanda>().HasIndex(c => c.Estado);
        mb.Entity<Comanda>().HasIndex(c => c.FechaApertura);
        mb.Entity<Pago>().HasIndex(p => p.Fecha);
        mb.Entity<SesionToken>().HasIndex(s => s.Token).IsUnique();
        mb.Entity<SesionToken>()
            .HasOne(s => s.Usuario)
            .WithMany()
            .HasForeignKey(s => s.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        mb.Entity<Usuario>().HasData(new Usuario
        {
            Id = 1, Nombre = "Administrador", Pin = "1234",
            Rol = Rol.Administrador, Activo = true
        });

        mb.Entity<TemaVisual>().HasData(new TemaVisual { Id = 1 });
        mb.Entity<ConfigTicket>().HasData(new ConfigTicket { Id = 1 });

        base.OnModelCreating(mb);
    }
}
