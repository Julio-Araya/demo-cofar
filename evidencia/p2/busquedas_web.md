# Paso 11 · búsquedas web (observación puntual, no medición)

Fecha: 2026-09-12. Herramienta: búsqueda web del entorno de Claude Code (índice orientado a EE. UU. según la propia herramienta; no es Google Chile ni un navegador chileno). Cada consulta se hizo una sola vez. Los resultados de una búsqueda cambian por hora, ubicación e historial: esto registra lo que salió en esa consulta, no una posición.

Los tres productos existen en el catálogo de Cofar (API pública, pasada 1): Ozempic 2 mg/1,5 ml (SKU 012522017), Rybelsus 14 mg pack 3x2 (SKU 012520006), Gonal F 900 UI (SKU 052010001).

## Consulta 1 · texto exacto: `comprar Ozempic 2 mg Chile precio farmacia`

Sitios en los resultados (orden de la herramienta):
1. farmaloop.cl
2. farmaciasahumada.cl
3. salcobrand.cl
4. buscafarma.cl
5. latercera.com (noticia)
6. ligafarmacia.cl
7. novasalud.cl
8. farmex.cl
9. ema.europa.eu (ficha regulatoria)

**Cofar: no aparece.** El resumen de la herramienta citó precios de Cruz Verde, Ahumada, Salcobrand y Farmex.

## Consulta 2 · texto exacto: `Rybelsus 14 mg precio Chile farmacia online`

1. farmaloop.cl
2. farmaciasahumada.cl
3. buscafarma.cl
4. medicompara.cl
5. **cofar.cl** → https://cofar.cl/product/012520006/rybelsus-14mg-pack-3x2
6. farmaciascurie.cl
7. buhochile.com
8. profar.cl
9. cruzverde.cl

**Cofar: aparece en la posición 5.** Ojo: la URL indexada usa el slug `rybelsus-14mg-pack-3x2`; el sitemap declara `rybelsus-semaglutida-14mg-90-comprimidos-pack-3x2` para el mismo SKU (ver H06 de la pasada 1: cualquier slug responde 200). El resumen de la herramienta no mencionó a Cofar ni su precio.

## Consulta 3 · texto exacto: `Gonal F 900 UI precio Chile farmacia`

1. farmaloop.cl
2. salcobrand.cl
3. reproduccionasistida.org
4. salcobrand.cl (Gonal F 300)
5. vademecum.es
6. fertifarma.com
7. farmaciabosques.com
8. cruzverde.cl
9. **cofar.cl** → https://cofar.cl/product/052010001/gonal-f-900ui-1-5ml-1-jp
10. ema.europa.eu

**Cofar: aparece en la posición 9.** El resumen citó el precio de Salcobrand; de Cofar solo el título de la ficha.

## Lectura (observado, no inferido)

- En 2 de 3 consultas Cofar aparece en el listado de enlaces; en ninguna el resumen usó datos de Cofar (precio, receta, refrigeración). Es consistente con lo medido en la pasada 1: el HTML sin JavaScript de sus fichas solo trae título y meta description.
- En la consulta de Ozempic (la categoría donde Cofar tiene oferta activa, según `promoAvailable` de la API) no aparece.
- Esto **no** mide posicionamiento. Para medirlo haría falta Search Console del cliente o una herramienta de rank tracking con ubicación Chile.

## Dato de contexto del BRIEF-P2 (no medido por esta pasada)

El 2026-09-12, desde el chat, una búsqueda por dónde comprar Ozempic en Chile devolvió Farmaloop, Salcobrand, Cruz Verde, Ahumada, Curie y Farmex; Cofar no apareció. Coincide con la consulta 1 de arriba.

## Qué falta para cerrar el paso 11 como lo pide el playbook

Preguntar a un modelo con y sin búsqueda web: "¿Qué vende Cofar Salud (cofar.cl)? ¿Qué productos y precios tienen?" y registrar la respuesta literal. No se hizo: sin `ANTHROPIC_API_KEY` en el entorno (igual que en la pasada 1). Se puede hacer desde el chat en 5 minutos y pegar la respuesta en este archivo.
