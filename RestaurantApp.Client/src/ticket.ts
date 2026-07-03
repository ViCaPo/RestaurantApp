import type { ConfigTicket, TemaVisual } from "./api";

export interface DatosTicket {
  mesa?: string | null;
  comandaId: number;
  fecha: Date;
  cajero?: string | null;
  mesero?: string | null;
  items: { cantidad: number; nombre: string; importe: number }[];
  subtotal: number;
  descuento?: number;
  propina: number;
  total: number;
  metodo: string;
  montoRecibido?: number | null;
  cambio?: number | null;
  referencia?: string | null;
  autorizacion?: string | null;
  ultimosDigitos?: string | null;
}

export interface DatosComanda {
  mesa: string;
  comandaId: number;
  fecha: Date;
  estacion?: string | null;
  items: {
    cantidad: number;
    nombre: string;
    numeroComensal?: number | null;
    notas?: string | null;
    extras: string[];
  }[];
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const money = (n: number) => n.toFixed(2);

function fila(izq: string, der: string, clase = "") {
  return `<div class="t-fila ${clase}"><span>${izq}</span><span>${der}</span></div>`;
}

function absoluta(url: string): string {
  return url.startsWith("http") ? url : window.location.origin + url;
}

/** Devuelve el HTML interno del ticket de venta (sin <html>/<body>), reutilizable en vista previa e impresión. */
export function construirTicketHtml(datos: DatosTicket, config: ConfigTicket, tema: TemaVisual): string {
  const p: string[] = [];

  p.push(`<div class="t-centro">`);
  if (config.mostrarLogo && config.logoUrl) {
    p.push(`<img class="t-logo" src="${esc(absoluta(config.logoUrl))}" alt="" />`);
  }
  p.push(`<div class="t-nombre">${esc(tema.nombreRestaurante || "")}</div>`);
  if (config.direccion) p.push(`<div class="t-tenue">${esc(config.direccion)}</div>`);
  if (config.telefono) p.push(`<div class="t-tenue">${esc(config.telefono)}</div>`);
  if (config.rfc) p.push(`<div class="t-tenue">${esc(config.rfc)}</div>`);
  p.push(`</div>`);

  p.push(`<div class="t-sep"></div>`);
  p.push(fila("Ticket", `#${datos.comandaId}`));
  const fecha = datos.fecha.toLocaleString();
  if (datos.mesa) p.push(fila(esc(`Mesa: ${datos.mesa}`), esc(fecha), "t-tenue"));
  else p.push(fila("", esc(fecha), "t-tenue"));
  if (config.mostrarMeseroCajero) {
    const linea: string[] = [];
    if (datos.mesero) linea.push(`Mesero: ${datos.mesero}`);
    if (datos.cajero) linea.push(`Cajero: ${datos.cajero}`);
    if (linea.length) p.push(`<div class="t-tenue">${esc(linea.join("  ·  "))}</div>`);
  }

  p.push(`<div class="t-sep"></div>`);
  for (const it of datos.items) {
    p.push(fila(esc(`${it.cantidad}  ${it.nombre}`), money(it.importe)));
  }

  p.push(`<div class="t-sep"></div>`);
  p.push(fila("Subtotal", money(datos.subtotal)));
  if (datos.descuento && datos.descuento > 0) p.push(fila("Descuento", `-${money(datos.descuento)}`));
  if (config.mostrarPropina && datos.propina > 0) p.push(fila("Propina", money(datos.propina)));
  p.push(fila("TOTAL", money(datos.total), "t-total"));

  p.push(`<div class="t-sep"></div>`);
  p.push(fila("Pago", esc(datos.metodo)));
  if (datos.montoRecibido != null) p.push(fila("Recibido", money(datos.montoRecibido), "t-tenue"));
  if (datos.cambio != null && datos.cambio > 0) p.push(fila("Cambio", money(datos.cambio), "t-tenue"));
  if (config.mostrarReferencia && datos.referencia) {
    const ref = datos.ultimosDigitos ? `${datos.referencia}  ····${datos.ultimosDigitos}` : datos.referencia;
    p.push(`<div class="t-tenue">Ref: ${esc(ref)}</div>`);
    if (datos.autorizacion) p.push(`<div class="t-tenue">Aut: ${esc(datos.autorizacion)}</div>`);
  }

  if (config.mensajePie) {
    p.push(`<div class="t-sep"></div>`);
    p.push(`<div class="t-centro">${esc(config.mensajePie)}</div>`);
  }

  return p.join("");
}

/** Devuelve el HTML interno de la comanda de cocina (sin precios, para la estación). */
export function construirComandaHtml(datos: DatosComanda): string {
  const p: string[] = [];

  p.push(`<div class="t-centro">`);
  p.push(`<div class="t-nombre">${esc(datos.estacion ? datos.estacion.toUpperCase() : "COCINA")}</div>`);
  p.push(`<div class="t-tenue">${esc(datos.fecha.toLocaleString())}</div>`);
  p.push(`</div>`);

  p.push(`<div class="t-sep"></div>`);
  p.push(fila("Mesa", esc(datos.mesa), "t-total"));
  p.push(fila("Comanda", `#${datos.comandaId}`, "t-tenue"));

  p.push(`<div class="t-sep"></div>`);
  for (const it of datos.items) {
    p.push(`<div class="t-item-comanda">${esc(`${it.cantidad}x  ${it.nombre}`)}</div>`);
    if (it.numeroComensal) p.push(`<div class="t-tenue">&nbsp;&nbsp;Comensal ${it.numeroComensal}</div>`);
    for (const extra of it.extras) p.push(`<div class="t-tenue">&nbsp;&nbsp;+ ${esc(extra)}</div>`);
    if (it.notas) p.push(`<div class="t-nota">&nbsp;&nbsp;"${esc(it.notas)}"</div>`);
  }

  return p.join("");
}

/** CSS del ticket (monospace, ancho de papel). Reutilizable en preview e impresión. */
export function estilosTicket(anchoMm: number): string {
  return `
    .t-doc { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.5; color: #000; width: ${anchoMm}mm; box-sizing: border-box; padding: 4mm 3mm; }
    .t-centro { text-align: center; }
    .t-tenue { color: #333; font-size: 11px; }
    .t-nombre { font-size: 15px; font-weight: bold; }
    .t-logo { max-width: 42px; max-height: 42px; object-fit: contain; margin-bottom: 2px; }
    .t-sep { border-top: 1px dashed #000; margin: 5px 0; }
    .t-fila { display: flex; justify-content: space-between; gap: 8px; }
    .t-fila span:last-child { white-space: nowrap; }
    .t-total { font-size: 14px; font-weight: bold; }
    .t-item-comanda { font-size: 13px; font-weight: bold; margin-top: 4px; }
    .t-nota { font-style: italic; }
  `;
}

/** Imprime el HTML de un documento (ticket o comanda) en un iframe oculto, vía diálogo del navegador. */
function imprimirHtml(contenidoInterno: string, anchoMm: number) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8" />
    <style>@page { size: ${anchoMm}mm auto; margin: 0; } body { margin: 0; }
    ${estilosTicket(anchoMm)}</style></head>
    <body><div class="t-doc">${contenidoInterno}</div></body></html>`);
  doc.close();

  const ventana = iframe.contentWindow;
  if (!ventana) return;
  const lanzar = () => {
    ventana.focus();
    ventana.print();
    setTimeout(() => iframe.remove(), 1000);
  };
  // Esperar a que cargue el logo/estilos antes de imprimir.
  if (doc.readyState === "complete") setTimeout(lanzar, 300);
  else ventana.onload = () => setTimeout(lanzar, 300);
}

export function imprimirTicket(datos: DatosTicket, config: ConfigTicket, tema: TemaVisual) {
  imprimirHtml(construirTicketHtml(datos, config, tema), config.anchoPapelMm);
}

export function imprimirComanda(datos: DatosComanda, anchoMm: number) {
  imprimirHtml(construirComandaHtml(datos), anchoMm);
}
