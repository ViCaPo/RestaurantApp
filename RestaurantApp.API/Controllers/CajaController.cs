using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantApp.Application.Servicios;

namespace RestaurantApp.API.Controllers;

public record AbrirTurnoDto(int CajeroId, decimal FondoInicial);
public record CerrarTurnoDto(decimal EfectivoContado);

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Cajero,Administrador")]
public class CajaController : ControllerBase
{
    private readonly CajaService _caja;
    public CajaController(CajaService caja) => _caja = caja;

    [HttpGet("abierto")]
    public async Task<IActionResult> Abierto([FromQuery] int cajeroId)
    {
        var turno = await _caja.ObtenerTurnoAbiertoAsync(cajeroId);
        return Ok(turno); // null si no hay turno abierto
    }

    [HttpGet("{turnoId}/resumen")]
    public async Task<IActionResult> Resumen(int turnoId)
    {
        try { return Ok(await _caja.ResumenTurnoAsync(turnoId)); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("abrir")]
    public async Task<IActionResult> Abrir([FromBody] AbrirTurnoDto dto)
    {
        try { return Ok(await _caja.AbrirTurnoAsync(dto.CajeroId, dto.FondoInicial)); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("{turnoId}/cerrar")]
    public async Task<IActionResult> Cerrar(int turnoId, [FromBody] CerrarTurnoDto dto)
    {
        try { return Ok(await _caja.CerrarTurnoAsync(turnoId, dto.EfectivoContado)); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }
}
