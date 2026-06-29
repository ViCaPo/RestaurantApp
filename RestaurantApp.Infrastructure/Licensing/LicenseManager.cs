using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using RestaurantApp.Core.Licensing;

namespace RestaurantApp.Infrastructure.Licensing;

public static class LicenseManager
{
    private const string RutaLicencia = "licencia.dat";
    private const string ClaveSecreta = "TU-CLAVE-SECRETA-LARGA-Y-UNICA-CAMBIALA";

    public static Licencia CargarLicencia()
    {
        if (!File.Exists(RutaLicencia)) return LicenciaDemo();
        try
        {
            var json = File.ReadAllText(RutaLicencia);
            var licencia = JsonSerializer.Deserialize<Licencia>(json)!;
            if (!VerificarFirma(licencia)) throw new Exception("Licencia alterada o inválida.");
            if (licencia.HardwareId != ObtenerHardwareId()) throw new Exception("Licencia no válida para este equipo.");
            if (!licencia.EstaVigente()) throw new Exception("La licencia ha expirado.");
            return licencia;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Licencia] {ex.Message} — entrando en modo demo.");
            return LicenciaDemo();
        }
    }

    public static string GenerarFirma(Licencia lic)
    {
        var contenido = $"{lic.NombreCliente}|{lic.HardwareId}|{lic.FechaExpiracion:O}|{string.Join(",", lic.ModulosActivos)}|{ClaveSecreta}";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(contenido));
        return Convert.ToBase64String(hash);
    }

    private static bool VerificarFirma(Licencia lic) => lic.Firma == GenerarFirma(lic);

    public static string ObtenerHardwareId()
    {
        var id = Environment.MachineName + Environment.ProcessorCount;
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(id));
        return Convert.ToBase64String(hash)[..16];
    }

    private static Licencia LicenciaDemo() => new()
    {
        NombreCliente = "DEMO",
        HardwareId = ObtenerHardwareId(),
        FechaExpiracion = DateTime.Now.AddDays(30),
        ModulosActivos = new()
    };
}
