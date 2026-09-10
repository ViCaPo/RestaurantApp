using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.Infrastructure.Almacenamiento;

/// <summary>Guarda archivos en disco local, bajo la carpeta "uploads" del sitio. Uso: local / Windows Service.</summary>
public class AlmacenamientoLocalDisco : IAlmacenamientoArchivos
{
    private readonly string _carpetaUploads;
    private const string UrlBase = "/uploads";

    public AlmacenamientoLocalDisco(string carpetaUploads)
    {
        _carpetaUploads = carpetaUploads;
        Directory.CreateDirectory(_carpetaUploads);
    }

    public async Task<string> GuardarAsync(string nombreBase, string extension, Stream contenido)
    {
        foreach (var archivo in Directory.GetFiles(_carpetaUploads, $"{nombreBase}.*"))
            File.Delete(archivo);

        var rutaDestino = Path.Combine(_carpetaUploads, $"{nombreBase}{extension}");
        await using var stream = new FileStream(rutaDestino, FileMode.Create);
        await contenido.CopyToAsync(stream);

        return $"{UrlBase}/{nombreBase}{extension}?v={DateTime.UtcNow.Ticks}";
    }
}
