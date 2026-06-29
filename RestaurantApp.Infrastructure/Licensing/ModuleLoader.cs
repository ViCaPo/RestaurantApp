using Microsoft.Extensions.DependencyInjection;
using RestaurantApp.Core.Licensing;

namespace RestaurantApp.Infrastructure.Licensing;

public static class ModuleLoader
{
    public static void RegistrarModulosActivos(IServiceCollection services, Licencia licencia)
    {
        Console.WriteLine("[Módulo] Punto de Venta ✓ (base)");
        // A medida que existan los módulos, registra aquí según licencia.TieneModulo(...)
        // Ej: if (licencia.TieneModulo(Modulo.Cocina)) CocinaModule.Registrar(services);
    }
}
