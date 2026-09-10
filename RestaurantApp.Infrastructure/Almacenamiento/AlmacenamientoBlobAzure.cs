using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.Infrastructure.Almacenamiento;

/// <summary>Guarda archivos en Azure Blob Storage. Uso: despliegue en Azure App Service,
/// donde el filesystem local no persiste de forma confiable entre despliegues/reinicios.</summary>
public class AlmacenamientoBlobAzure : IAlmacenamientoArchivos
{
    private readonly BlobContainerClient _contenedor;

    public AlmacenamientoBlobAzure(string connectionString, string nombreContenedor)
    {
        _contenedor = new BlobContainerClient(connectionString, nombreContenedor);
        _contenedor.CreateIfNotExists(PublicAccessType.Blob);
    }

    public async Task<string> GuardarAsync(string nombreBase, string extension, Stream contenido)
    {
        await foreach (var blob in _contenedor.GetBlobsAsync(prefix: nombreBase))
        {
            if (Path.GetFileNameWithoutExtension(blob.Name) == nombreBase)
                await _contenedor.DeleteBlobIfExistsAsync(blob.Name);
        }

        var blobClient = _contenedor.GetBlobClient($"{nombreBase}{extension}");
        await blobClient.UploadAsync(contenido, overwrite: true);

        return $"{blobClient.Uri}?v={DateTime.UtcNow.Ticks}";
    }
}
