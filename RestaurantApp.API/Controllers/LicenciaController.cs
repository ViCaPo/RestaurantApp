using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantApp.Core.Licensing;
using RestaurantApp.Infrastructure.Licensing;

namespace RestaurantApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class LicenciaController : ControllerBase
{
    private readonly Licencia _licencia;
    public LicenciaController(Licencia licencia) => _licencia = licencia;

    [HttpGet("hardware-id")]
    public IActionResult HardwareId() => Ok(new { hardwareId = LicenseManager.ObtenerHardwareId() });

    [HttpGet("estado")]
    public IActionResult Estado() => Ok(new
    {
        cliente = _licencia.NombreCliente, expira = _licencia.FechaExpiracion,
        vigente = _licencia.EstaVigente(), modulos = _licencia.ModulosActivos
    });
}
