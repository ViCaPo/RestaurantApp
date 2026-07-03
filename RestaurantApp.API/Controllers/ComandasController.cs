using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantApp.Application.Servicios;
using RestaurantApp.Core.Enums;

namespace RestaurantApp.API.Controllers;

public record AbrirMesaDto(int MesaId, int MeseroId, int Comensales);
public record AgregarItemDto(int ProductoId, int Cantidad, string? Notas, List<int>? ExtraIds, int? NumeroComensal);
public record CancelarItemDto(string Motivo);
public record EstadoItemDto(EstadoItem Estado);
public record DescuentoDto(decimal Descuento);
public record CobrarDto(
    MetodoPago Metodo, decimal Propina, int CajeroId,
    decimal? MontoRecibido, decimal? MontoEfectivo, decimal? MontoTarjeta,
    string? ReferenciaTransaccion, string? AutorizacionTarjeta, string? UltimosDigitosTarjeta);
public record CambiarMesaDto(int NuevaMesaId);
public record UnirMesasDto(int ComandaOrigenId);

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ComandasController : ControllerBase
{
    private readonly ComandaService _comandas;
    public ComandasController(ComandaService comandas) => _comandas = comandas;

    [HttpPost]
    public async Task<IActionResult> AbrirMesa([FromBody] AbrirMesaDto dto)
    {
        try { return Ok(await _comandas.AbrirMesaAsync(dto.MesaId, dto.MeseroId, dto.Comensales)); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Obtener(int id)
    {
        var c = await _comandas.ObtenerComandaAsync(id);
        return c == null ? NotFound(new { error = "Comanda no encontrada." }) : Ok(c);
    }

    [HttpPost("{id}/items")]
    public async Task<IActionResult> AgregarItem(int id, [FromBody] AgregarItemDto dto)
    {
        try { return Ok(await _comandas.AgregarItemAsync(id, dto.ProductoId, dto.Cantidad, dto.Notas, dto.ExtraIds, dto.NumeroComensal)); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("items/{itemId}")]
    public async Task<IActionResult> CancelarItem(int itemId, [FromBody] CancelarItemDto dto)
    {
        try { await _comandas.CancelarItemAsync(itemId, dto.Motivo); return Ok(new { mensaje = "Item cancelado." }); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("{id}/enviar-cocina")]
    public async Task<IActionResult> EnviarACocina(int id)
    {
        try { return Ok(await _comandas.EnviarPedidoACocinaAsync(id)); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("cocina/items")]
    [Authorize(Roles = "Cocinero,Administrador")]
    public async Task<IActionResult> ObtenerItemsCocina([FromQuery] int? estacionId)
    {
        return Ok(await _comandas.ObtenerItemsCocinaAsync(estacionId));
    }

    [HttpPut("items/{itemId}/estado")]
    [Authorize(Roles = "Cocinero,Administrador")]
    public async Task<IActionResult> ActualizarEstadoItem(int itemId, [FromBody] EstadoItemDto dto)
    {
        try { return Ok(await _comandas.ActualizarEstadoItemAsync(itemId, dto.Estado)); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPut("{id}/descuento")]
    public async Task<IActionResult> AplicarDescuento(int id, [FromBody] DescuentoDto dto)
    {
        try { await _comandas.AplicarDescuentoAsync(id, dto.Descuento); return Ok(new { mensaje = "Descuento aplicado." }); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("{id}/cobrar")]
    [Authorize(Roles = "Cajero,Administrador")]
    public async Task<IActionResult> Cobrar(int id, [FromBody] CobrarDto dto)
    {
        try
        {
            return Ok(await _comandas.CobrarAsync(
                id, dto.Metodo, dto.Propina, dto.CajeroId, dto.MontoRecibido, dto.MontoEfectivo, dto.MontoTarjeta,
                dto.ReferenciaTransaccion, dto.AutorizacionTarjeta, dto.UltimosDigitosTarjeta));
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPut("{id}/mesa")]
    public async Task<IActionResult> CambiarMesa(int id, [FromBody] CambiarMesaDto dto)
    {
        try { return Ok(await _comandas.CambiarMesaAsync(id, dto.NuevaMesaId)); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("{id}/unir")]
    public async Task<IActionResult> UnirMesas(int id, [FromBody] UnirMesasDto dto)
    {
        try { return Ok(await _comandas.UnirMesasAsync(id, dto.ComandaOrigenId)); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }
}
