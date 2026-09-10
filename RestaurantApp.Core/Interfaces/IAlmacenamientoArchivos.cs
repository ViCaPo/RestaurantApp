namespace RestaurantApp.Core.Interfaces;

/// <summary>
/// Abstrae dónde se guardan los archivos subidos (logo de la app, logo del ticket).
/// En local/Windows Service se usa disco local; en Azure App Service, Blob Storage
/// (el filesystem de App Service no es confiable entre despliegues/reinicios).
/// </summary>
public interface IAlmacenamientoArchivos
{
    /// <summary>
    /// Guarda el archivo con el nombre base dado (ej. "logo"), sustituyendo cualquier
    /// archivo previo con el mismo nombre base (aunque tenga otra extensión).
    /// Devuelve la URL pública para acceder al archivo.
    /// </summary>
    Task<string> GuardarAsync(string nombreBase, string extension, Stream contenido);
}
