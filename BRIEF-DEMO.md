# BRIEF DEMO · Cofar Salud · comparador de cuatro miradas

> 2026-09-12. Complementa la auditoría (`AUDITORIA.md`, `AUDITORIA-P2.md`) y no la reemplaza. Se construye sobre el mismo repo, en la rama `demo`.

## Qué se construye y para qué

Una sola página, estática, que muestre lado a lado **lo que ve el paciente y lo que ven las máquinas** en seis fichas reales de Cofar. Es el argumento central de la auditoría convertido en algo que se mira, no que se lee.

Se muestra en una reunión el lunes 2026-09-15. La audiencia es técnica. No es material de venta: no lleva precios de Relevo, no pide reunión, no tiene formulario ni captura de correos.

## Reglas duras

1. **Datos congelados, cero llamadas en vivo.** La página NUNCA llama a `services.cofar.cl` ni a `cofar.cl` en tiempo de ejecución. Todo sale de un JSON generado en build desde `evidencia/`. Un visitante del demo no debe generar ni un request a la infraestructura del cliente.
2. **`noindex` en serio.** `<meta name="robots" content="noindex,nofollow">` en el HTML y `robots.txt` con `User-agent: *` / `Disallow: /`. No queremos una página en relevostudio.com republicando catálogo de Cofar e indexable.
3. **Seis SKUs, no el catálogo.** Es una muestra para explicar un punto, no una copia de su tienda.
4. **Nada de `promoName` en la página.** Ese hallazgo se conversa en persona; no se publica en un sitio, ni siquiera con noindex.
5. **Sin logo de Cofar ni de su marca.** Nombres de producto y datos sí, porque son públicos y el punto es ese. Identidad visual, no.
6. **Fecha visible.** Pie de página: datos capturados el 2026-09-12 desde fuentes públicas, no en vivo, sin relación comercial con Cofar. En texto legible, no en letra chica.
7. **Todo dato mostrado tiene que existir en `evidencia/`.** Si un campo no está, la celda dice que no está. Nada inventado, nada rellenado a mano.

## Los seis SKUs

Elegidos para que el contraste se vea solo: cuatro de especialidad mal descritas, uno con oferta activa y uno de dermocosmética como control.

| # | Producto | Por qué está |
|---|---|---|
| 1 | Ozempic 2 mg/1,5 ml (SKU 012522017) | Tiene oferta activa; es el caso del precio equivocado |
| 2 | Ziagen 300 mg (VIH) | 0% de descripción en su categoría |
| 3 | Sutent 50 mg (oncológico) | 4% de descripción; producto de $4.289.990 |
| 4 | Un producto de fertilidad (Gonal F si está en la evidencia) | Aparece 9.º en búsqueda; alta especialidad |
| 5 | Un producto de salud mental presente en la muestra | 12% de descripción |
| 6 | Vichy Liftactiv Supreme Vit C Serum 20 ml | Control: la categoría mejor descrita (69%) |

Si alguno no está en las 50 fichas raw o en los 23 DOM de la evidencia, reemplázalo por otro de la misma categoría que sí esté y anótalo. No inventes datos para completar la tabla.

## Las cuatro miradas

Por cada SKU, cuatro columnas. Cada una declara su fuente en la evidencia.

1. **Lo que ve el paciente** — del DOM (`evidencia/dom/`). Nombre, precio normal y oferta, laboratorio, principio activo, concentración, forma, condición de venta, refrigeración, descripción, imagen.
2. **Lo que ve un bot sin JavaScript** — del raw (`evidencia/fichas/`). En la práctica: título, meta description, canonical. Nada más. Que se vea vacío es el punto; no lo maquilles.
3. **Lo que dice el JSON-LD actual** — del DOM (`evidencia/p2/jsonld_dom_analisis.txt` y los DOM guardados). Con sus defectos visibles: `"Marca no disponible"`, `availability` fijo en `InStock`, descripción placeholder cuando corresponda.
4. **Lo que diría generado desde su propia API** — construido en build desde el volcado de `evidencia/api/`, con los campos que ya existen: laboratorio real, principio activo, disponibilidad real según la bandera de stock, precio normal y de oferta, imagen.

La cuarta columna es la que cierra el argumento: no propone datos nuevos, solo usa los que Cofar ya tiene.

## Estructura de la página

Una sola página, scroll vertical, sin menú.

1. **Encabezado.** Titular y una bajada de dos líneas. El titular debe decir la idea, no ser un eslogan: algo como "El catálogo está completo. La ficha no lo muestra." Nada publicitario.
2. **Tres cifras de contexto**, en tarjetas: 3.024 productos con atributos en el 94-100%, 0 de 60 fichas con dato de producto en el HTML del servidor, 0% de descripción en VIH frente a 69% en dermocosmética.
3. **El comparador.** Selector de los seis productos (pills). Al elegir uno, se muestran las cuatro miradas. En pantalla ancha, cuatro columnas; en teléfono, una debajo de otra en el mismo orden. Cada celda marca con claridad si el dato está presente, ausente o degradado.
4. **Bloque "qué contesta un asistente hoy".** Con el texto literal de la consulta a ChatGPT del 2026-09-12 y su respuesta, resumida a lo esencial: encontró el sitio, citó bien la presentación y la conservación, y dio $237.390 cuando la API declara una oferta de $151.890. Declarar que es una observación puntual con fecha, no una medición. Si al construir el demo la oferta ya no está activa en el volcado, ajusta el texto a lo que diga la evidencia.
5. **Pestaña o sección "el bloque, lado a lado".** El JSON-LD actual y el generado desde la API, en dos cajas de código con botón de copiar. Este es el generador que pidió Julio dentro del comparador.
6. **Qué falta para campañas.** Tabla corta: Open Graph ausente en raw y DOM, sin feed público, JSON-LD solo en cliente y degradado, sin Organization, sin GTIN. Al lado, lo que sí está cargado (GTM, GA4, Google Ads, Meta Pixel, Hotjar, Merchant ID). El punto es que las herramientas están y el dato no.
7. **Pie.** Fecha, origen de los datos, la aclaración de no afiliación, y el wordmark de Relevo.

## Diseño

Sigue el design system de Relevo. La fuente de verdad es `relevo-design-system-v1.html`; si no está en el repo, usa estos tokens, que salen de ahí:

- **Color.** Ink `#16332B` y `#1E4034` para tinta y paneles oscuros. Off-white `#fffff3` (fondo), `#fbfbf3`, `#f0f0e2`, `#deded0`. Coral `#FF5A3C` (acción), `#FF7A5E`, `#E5431F`, `#FFE7DF`. Teal `#0E8C7F` (criterio y método), `#0A5F57`, `#7FC9BC`, `#E2F0EC`, `#063B36`.
- **Tipografía.** Plus Jakarta Sans para display y cuerpo, Hanken Grotesk para textos secundarios y overlines. Regla de oro: `letter-spacing: -0.05em` en todos los headers. Overlines en 12px, peso 600, mayúsculas, tracking positivo, en coral. Cuerpo en peso 500.
- **Forma.** Radios 14, 20, 32 y 40px; pills full-round. Sombra de tarjeta `0 24px 64px rgba(22,51,43,.20), 0 4px 16px rgba(22,51,43,.10)`.
- **Motion.** Easing firma `cubic-bezier(.25,1,.5,1)`. Movimiento sobrio: revelado al entrar en pantalla y transición al cambiar de producto. Respeta `prefers-reduced-motion`.
- **Semántica de color en el comparador.** Teal para el dato presente, coral para el ausente o degradado, gris para el no aplica. Nunca solo color: cada estado lleva también texto o ícono.

Se ve en teléfono. La reunión puede ser en un notebook, pero igual se prueba.

## Stack y publicación

- **Vite + React**, estático. **No hay funciones de servidor ni chat**, así que no hay `api/`, ni claves, ni tsconfig aparte. Si el build no necesita algo, no lo agregues.
- Carpeta `demo/` dentro del repo `demo-cofar`, rama `demo`. La auditoría no se toca.
- Script `demo/scripts/build-data.mjs` que lee `evidencia/` y escribe `demo/src/data/fichas.json`. Que se pueda volver a correr. Deja en el JSON, por cada campo, de qué archivo salió.
- Salida `dist`. Proyecto de Vercel `demo-cofar`, Root Directory `demo`, preset Vite.
- Dominio `cofar.relevostudio.com`. En Cloudflare el proxy va en **gris, DNS only**, o Vercel no valida el certificado.

## Verificación antes de mostrarlo

- [ ] Carga por HTTPS con candado
- [ ] Cero requests a `cofar.cl` y a `services.cofar.cl` en la pestaña de red
- [ ] `noindex` presente y `robots.txt` bloqueando
- [ ] Los seis productos cambian bien y ninguna celda queda en blanco sin explicación
- [ ] Cada cifra de la página coincide con `hallazgos.json` o `hallazgos-p2.json`
- [ ] Se ve bien en teléfono
- [ ] `relevostudio.com` está vivo

## Salida

Commit en la rama `demo`, push y PR aparte. En el cuerpo del PR: la URL de producción y la lista de verificación marcada.
