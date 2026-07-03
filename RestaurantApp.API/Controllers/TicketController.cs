using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantApp.Core.Entidades;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TicketController : ControllerBase
{
    private static readonly string[] ExtensionesPermitidas = [".png", ".jpg", ".jpeg", ".svg", ".webp"];

    private readonly IAppDbContext _db;
    private readonly IWebHostEnvironment _entorno;
    public TicketController(IAppDbContext db, IWebHostEnvironment entorno)
    {
        _db = db;
        _entorno = entorno;
    }

    [HttpGet]
    public async Task<IActionResult> Obtener()
    {
        var config = await _db.ConfigsTicket.FindAsync(1) ?? new ConfigTicket { Id = 1 };
        return Ok(config);
    }

    [HttpPut]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Actualizar([FromBody] ConfigTicket datos)
    {
        var config = await _db.ConfigsTicket.FindAsync(1);
        if (config == null)
        {
            datos.Id = 1;
            _db.ConfigsTicket.Add(datos);
        }
        else
        {
            config.MostrarLogo = datos.MostrarLogo;
            config.Direccion = datos.Direccion;
            config.Telefono = datos.Telefono;
            config.Rfc = datos.Rfc;
            config.MostrarMeseroCajero = datos.MostrarMeseroCajero;
            config.MostrarPropina = datos.MostrarPropina;
            config.MostrarReferencia = datos.MostrarReferencia;
            config.MensajePie = datos.MensajePie;
            config.AnchoPapelMm = datos.AnchoPapelMm;
            config.ImprimirAutomatico = datos.ImprimirAutomatico;
        }
        await _db.SaveChangesAsync();
        return Ok(datos);
    }

    [HttpPost("logo")]
    [Authorize(Roles = "Administrador")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> SubirLogo(IFormFile archivo)
    {
        if (archivo.Length == 0) return BadRequest(new { error = "Archivo vacío." });

        var extension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
        if (!ExtensionesPermitidas.Contains(extension))
            return BadRequest(new { error = "Formato no permitido. Usa PNG, JPG, SVG o WEBP." });

        var carpetaUploads = Path.Combine(_entorno.ContentRootPath, "uploads");
        Directory.CreateDirectory(carpetaUploads);

        foreach (var ext in ExtensionesPermitidas)
        {
            var anterior = Path.Combine(carpetaUploads, $"logo-ticket{ext}");
            if (System.IO.File.Exists(anterior)) System.IO.File.Delete(anterior);
        }

        var rutaDestino = Path.Combine(carpetaUploads, $"logo-ticket{extension}");
        using (var stream = new FileStream(rutaDestino, FileMode.Create))
        {
            await archivo.CopyToAsync(stream);
        }

        var logoUrl = $"/uploads/logo-ticket{extension}?v={DateTime.UtcNow.Ticks}";
        var config = await _db.ConfigsTicket.FindAsync(1);
        if (config == null)
        {
            config = new ConfigTicket { Id = 1, LogoUrl = logoUrl };
            _db.ConfigsTicket.Add(config);
        }
        else
        {
            config.LogoUrl = logoUrl;
        }
        await _db.SaveChangesAsync();

        return Ok(new { logoUrl });
    }
}
