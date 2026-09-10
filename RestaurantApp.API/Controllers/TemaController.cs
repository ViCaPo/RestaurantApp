using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantApp.Core.Entidades;
using RestaurantApp.Core.Interfaces;

namespace RestaurantApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
public class TemaController : ControllerBase
{
    private static readonly string[] ExtensionesPermitidas = [".png", ".jpg", ".jpeg", ".svg", ".webp"];

    private readonly IAppDbContext _db;
    private readonly IAlmacenamientoArchivos _almacenamiento;

    public TemaController(IAppDbContext db, IAlmacenamientoArchivos almacenamiento)
    {
        _db = db;
        _almacenamiento = almacenamiento;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Obtener()
    {
        var tema = await _db.TemasVisuales.FindAsync(1) ?? new TemaVisual { Id = 1 };
        return Ok(tema);
    }

    [HttpPut]
    public async Task<IActionResult> Actualizar([FromBody] TemaVisual datos)
    {
        var tema = await _db.TemasVisuales.FindAsync(1);
        if (tema == null)
        {
            datos.Id = 1;
            _db.TemasVisuales.Add(datos);
        }
        else
        {
            tema.ColorFondo = datos.ColorFondo;
            tema.ColorSuperficie = datos.ColorSuperficie;
            tema.ColorBorde = datos.ColorBorde;
            tema.ColorTexto = datos.ColorTexto;
            tema.ColorTextoTenue = datos.ColorTextoTenue;
            tema.ColorPrimario = datos.ColorPrimario;
            tema.ColorPrimarioClaro = datos.ColorPrimarioClaro;
            tema.ColorPrimarioOscuro = datos.ColorPrimarioOscuro;
            tema.ColorExito = datos.ColorExito;
            tema.ColorExitoClaro = datos.ColorExitoClaro;
            tema.ColorError = datos.ColorError;
            tema.ColorErrorClaro = datos.ColorErrorClaro;
            tema.ColorAdvertencia = datos.ColorAdvertencia;
            tema.ColorAdvertenciaClaro = datos.ColorAdvertenciaClaro;
            tema.ColorInfo = datos.ColorInfo;
            tema.ColorInfoClaro = datos.ColorInfoClaro;
            tema.NombreRestaurante = datos.NombreRestaurante;
        }
        await _db.SaveChangesAsync();
        return Ok(datos);
    }

    [HttpPost("logo")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> SubirLogo(IFormFile archivo)
    {
        if (archivo.Length == 0) return BadRequest(new { error = "Archivo vacío." });

        var extension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
        if (!ExtensionesPermitidas.Contains(extension))
            return BadRequest(new { error = "Formato no permitido. Usa PNG, JPG, SVG o WEBP." });

        await using var stream = archivo.OpenReadStream();
        var logoUrl = await _almacenamiento.GuardarAsync("logo", extension, stream);

        var tema = await _db.TemasVisuales.FindAsync(1);
        if (tema == null)
        {
            tema = new TemaVisual { Id = 1, LogoUrl = logoUrl };
            _db.TemasVisuales.Add(tema);
        }
        else
        {
            tema.LogoUrl = logoUrl;
        }
        await _db.SaveChangesAsync();

        return Ok(new { logoUrl });
    }
}
