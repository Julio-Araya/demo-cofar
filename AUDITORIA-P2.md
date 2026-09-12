# Auditoría Cofar Salud · pasada 2 · canales de descubrimiento · 2026-09-12

Lectura para Julio. Complementa `AUDITORIA.md` (pasada 1, rama `auditoria`, PR #1) y no la reemplaza. Los números salen de `hallazgos-p2.json` y se reproducen desde `evidencia/p2/` más los archivos de la pasada 1 que se reutilizaron sin volver a pedir. Capas: raw (curl sin JS), DOM (Chrome 153 headless, capturas de la pasada 1), bundle (26 chunks propios de Next.js), API (services.cofar.cl, volcado de la pasada 1), externo (DNS, búsqueda web). Requests nuevos en esta pasada: 13 a cofar.cl, 0 a la API.

## En una frase

La puerta está abierta y la vitrina vacía: robots.txt deja pasar a los 13 bots de IA, GTM, GA4, Google Ads y el píxel de Meta cargan en cada página, y hasta existe un JSON-LD de producto; pero todo el dato se arma en el navegador y llega con marca "no disponible" y stock siempre "InStock", sin Open Graph, sin feed público y sin llms.txt. Para Meta, para Google sin render y para los asistentes de IA, cada ficha de Cofar es un título y una frase. Y la misma API que se lo niega a ellos le cuenta a cualquier visitante el nombre interno de cada decisión de precio.

Para el cliente, sin jerga: "no tienes que darle permiso a nadie, ya lo tienen todos; lo que falta es que la ficha les diga algo. Y ojo con lo que tu propio sitio cuenta de tus promociones".

## Hallazgos de esta pasada

| ID | Grav. | Paso | Capa | Hallazgo | Cifra |
|---|---|---|---|---|---|
| H14 | 4 | 4 | mixto | El JSON-LD Product existe, pero solo lo crea el JS y sale con marca "no disponible" y stock siempre "InStock" | 21/21 en DOM, 0/60 en raw; 19/21 sin marca; 7/21 sin descripción; 1 InStock con stock 0 |
| H15 | 3 | 10 | mixto | Cero Open Graph y Twitter Card también en el DOM; la ficha compartida lleva título y descripción, sin imagen | 0 og/twitter en raw y DOM; 0 imágenes de producto en el HTML |
| H16 | 2 | 10 | dom | GTM, GA4, Google Ads, Meta Pixel, Hotjar y Merchant ID están; no hay feed público ni dato de producto que alimentar | 6 herramientas en DOM, 0 en raw; 12 rutas de feed en 404 |
| H17 | 3 | 12 | externo (API) | La API pública entrega a cada visitante los nombres internos de las decisiones de precio | 1.159 productos con `promoName`, 449 nombres distintos; 0 costo/margen/proveedor/clientes |
| H18 | 2 | 2 | raw | robots.txt deja pasar a los 13 bots de IA; los sitemaps de producto no declaran `lastmod` | 13/13 permitidos; 0/3.118 con lastmod |

**Corrección a la pasada 1.** H04 decía "cero JSON-LD en todo el sitio". Es cierto en raw y falso en DOM: un componente React lo inyecta con `useEffect` después de cargar. La pasada 1 miró JSON-LD solo en raw y no lo buscó en los DOM que ya tenía guardados. Se corrige aquí (H14) y no se toca `hallazgos.json`.

## Archivos de control: tabla de bots de IA

`robots.txt` completo (105 bytes, idéntico a las 13:07 y a las 14:03 UTC de hoy):

```
User-Agent: *
Allow: /
Disallow: /profile/*
Disallow: /checkout/*

Sitemap: https://cofar.cl/sitemap.xml
```

| Bot | Mención | Estado efectivo |
|---|---|---|
| GPTBot | no mencionado | permitido (hereda `*`) |
| OAI-SearchBot | no mencionado | permitido |
| ChatGPT-User | no mencionado | permitido |
| ClaudeBot | no mencionado | permitido |
| Claude-User | no mencionado | permitido |
| anthropic-ai | no mencionado | permitido |
| PerplexityBot | no mencionado | permitido |
| Perplexity-User | no mencionado | permitido |
| Google-Extended | no mencionado | permitido |
| Applebot-Extended | no mencionado | permitido |
| CCBot | no mencionado | permitido |
| Bytespider | no mencionado | permitido |
| meta-externalagent | no mencionado | permitido |

Con todas sus letras: **robots.txt no bloquea a ningún bot de IA.** El problema no es de permiso. Lo que reciben al entrar es lo que midió la pasada 1 (H01): título, meta description y canonical, y nada de producto. Abrirles la puerta no cambia nada porque ya está abierta; lo que cambia la recomendación es que la solución es de contenido (dato de producto en el HTML del servidor), no de configuración.

Resto del paso 2: `llms.txt` 404 real; `.well-known` nada; sin meta robots ni `x-robots-tag`. Sitemaps: índice más 6 archivos, 3.268 URLs. Los 4 sitemaps de producto (3.118 URLs) no traen `lastmod`; los de categorías (137) y estáticas (13) sí, pero con la hora exacta de la petición, o sea, se generan al vuelo y no informan nada. Cruce con la pasada 1, sin repetir: las 93 URLs muertas (H05), los 4 SKUs malformados y el canonical distinto del sitemap en 31/50 (H06) siguen ahí, y sin `lastmod` no hay forma externa de saber desde cuándo. Detalle en `evidencia/p2/bots_ia.md`.

## Campañas: qué falta para Google y para Meta hoy

Lo que ya está (DOM, cargado vía Google Tag Manager; nada de esto existe en raw): GTM, GA4, tag de conversión de Google Ads con llamadas a `viewthroughconversion`, Meta Pixel (`fbevents.js` + `signals/config` para `cofar.cl`), Hotjar, Google Sign-In. En el bundle propio: constante `GOOGLE_MERCHANT_ID`, inicialización de GTM y un `dataLayer` con evento `purchase`. En DNS: 2 TXT `google-site-verification` y 1 `facebook-domain-verification`. Los IDs quedan en `evidencia/dom/home.html` y no se reportan; no se afirma nada sobre cuentas ni configuración.

Lo que falta, observado:

| Pieza | Google | Meta | Estado |
|---|---|---|---|
| Open Graph / Twitter Card | vistas previas, anuncios dinámicos | catálogo, vistas previas, anuncios dinámicos | **0 en raw y 0 en DOM** en home, categoría y ficha. No es que lleguen tarde por JS: no llegan (H15) |
| Imagen compartible en el HTML | | | 0 `<img>` de producto en 50 fichas raw; 18 imágenes de logo e íconos |
| Feed de productos público | Merchant Center | catálogo | **no existe**: 12 rutas habituales en 404 real, nada en robots, sitemap ni bundle (H16). Un feed privado ya cargado no es observable |
| JSON-LD `Product` en servidor | resultados enriquecidos, Merchant | | solo en DOM, inyectado por JS (H14) |
| JSON-LD `Organization` | | | ausente en todas las capas |
| Marca en el JSON-LD | | | "Marca no disponible" en 19/21; la API tiene `laboratory.label` en el 100% de los medicamentos y el código no lo usa |
| Disponibilidad en el JSON-LD | | | "InStock" fijo en el código; 1/21 con stock 0 en la API |
| GTIN / código de barras | | | no existe en la API |

Lo que sí ve una plataforma al leer una ficha (solo etiquetas): `<title>`, `<meta name="description">`, `<link rel="canonical">`. Ejemplo Ozempic 2 mg: "Ozempic Semaglutida 2mg/1,5ml 1 Dispositivo Prellenado Multidosis" y "Ozempic 2mg/1,5ml (Multidosis): Pluma Multidosis de Semaglutida para etapas de inicio de tratamiento y adaptación en diabetes tipo 2. Requiere receta médica simple." Sin imagen, sin precio, sin disponibilidad. Cómo lo renderiza WhatsApp o LinkedIn no se simula.

Comparación que pedía el BRIEF-P2, en una tabla (qué tiene la API y qué publica el sitio):

| Campo | API (3.024 productos) | JSON-LD en DOM | HTML raw |
|---|---|---|---|
| Nombre, SKU | 100% | sí | solo en `<title>` |
| Precio (normal / oferta) | 100% / 38% | uno solo (oferta o normal) | no |
| Imagen | 100% (1 a N) | la primera | no |
| Laboratorio | 97,6% | **no** (placeholder) | no |
| Principio activo y concentración | 86,5% (94% en medicamentos) | no | no |
| Forma, cantidad por envase | 100% | no (solo en `description` en algunos) | no |
| Condición de venta (receta) | 100% | no | no |
| Refrigeración, almacenamiento | 100% | no | no |
| Disponibilidad real | 100% (bandera 100/0) | **fijo InStock** | no |
| Descripción | 73% (21% útil) | placeholder en 7/21 | no |

No afirmo qué exige hoy Merchant Center ni el catálogo de Meta; se verifica aparte. Detalle en `evidencia/p2/senales_meta_google.md`.

## Qué ve un asistente de IA

Sin `ANTHROPIC_API_KEY`, como en la pasada 1. Dos sustitutos:

**1. Contraste raw, lado a lado** (lo que recibe un crawler sin JavaScript; archivos de la pasada 1, `evidencia/p2/lado_a_lado_raw.json`):

| | Ziagen 300 mg (VIH) | Sutent 50 mg (oncológico) | Vichy Liftactiv (dermocosmética) |
|---|---|---|---|
| `<title>` | Ziagen 300mg 60 Comp. | Sutent 50mg 28 Cap. | Vichy Liftactiv Supreme Vit C Serum 20ml |
| meta description | "Ziagen 300mg con Abacavir. Cofar Asegura Confidencialidad. Somos expertos en medicamentos de especialidad crónicos…" | "Sutent 50mg con Sunitinib, Cápsulas. Confía en Cofar…" | "Vichy Liftactiv Supreme Vit C Serum 20ml. Somos especialistas en dermocosmética…" |
| precio en HTML | no | no | no |
| imagen de producto | no | no | no |
| og / JSON-LD | 0 / 0 | 0 / 0 | 0 / 0 |
| texto visible | 1.338 caracteres (header y footer) | 1.336 | 1.357 |
| en la API | $600.890, GlaxoSmithKline, Abacavir, sin descripción | $4.289.990, Pfizer, Sunitinib, sin descripción | $42.190, sin laboratorio, descripción de 1.738 caracteres |
| JSON-LD en DOM | marca y descripción "no disponible" | marca y descripción "no disponible" | marca como objeto, descripción completa |

Lo que sorprende: en raw las tres son iguales de vacías. La diferencia aparece solo cuando alguien renderiza, y ahí la dermocosmética queda mejor que la especialidad porque es la única con descripción (H03 de la pasada 1). El principio activo aparece únicamente dentro de la meta description ("con Abacavir", "con Sunitinib"): es lo único farmacéutico que un asistente sin JS puede aprender.

**2. Búsqueda web del entorno, tres consultas, 2026-09-12** (observación puntual, no medición; índice orientado a EE. UU.; detalle y texto exacto en `evidencia/p2/busquedas_web.md`):

| Consulta | Sitios en los resultados | Cofar |
|---|---|---|
| `comprar Ozempic 2 mg Chile precio farmacia` | Farmaloop, Ahumada, Salcobrand, BuscaFarma, La Tercera, Ligafarmacia, Novasalud, Farmex, EMA | **no aparece** |
| `Rybelsus 14 mg precio Chile farmacia online` | Farmaloop, Ahumada, BuscaFarma, Medicompara, **Cofar (5.º)**, Curie, Buhochile, Profar, Cruz Verde | aparece; el resumen no usó su precio |
| `Gonal F 900 UI precio Chile farmacia` | Farmaloop, Salcobrand ×2, reproduccionasistida.org, Vademecum, Fertifarma, Bosques, Cruz Verde, **Cofar (9.º)**, EMA | aparece; el resumen no usó su precio |

Dos detalles: la URL de Rybelsus que aparece indexada (`/product/012520006/rybelsus-14mg-pack-3x2`) no es la del sitemap (`…/rybelsus-semaglutida-14mg-90-comprimidos-pack-3x2`), que es lo que ya describía H06. Y en Ozempic, donde la API muestra una oferta activa con vigencia declarada, Cofar no sale. Coincide con el dato de contexto del BRIEF-P2. Ninguna de las dos cosas mide posicionamiento.

## API pública: inventario de campos y señal de datos internos

Encuadre obligatorio: **esto no es una prueba de seguridad y no se reporta como vulnerabilidad.** Es un inventario de qué recibe cualquier navegador al abrir una ficha. Solo GET, ningún request nuevo a la API en esta pasada.

Endpoints que llama el frontend (observados en el bundle): `GET /products/2.0/?first&offset` (listado, sin token), `GET /products/2.0/{sku}` (ficha, sin token), `GET /products/1.0/coverage/{sku}?rut=` (cobertura por RUT; no se usó), `/mscontent/strapi/*` (CMS), y con sesión `/api/auth/*`, `/api/checkout/*`, `/api/orders/search`, `/api/shipping/user-addresses`, `/api/payment/methods`, `/mscustomer/yapp/benefits`. No se probó ninguno que el sitio no llame solo.

Campos por producto: 66 contando anidados. Los comerciales y farmacéuticos se muestran en la página (verificado contra el DOM de 21 fichas: nombre, SKU, precios, laboratorio, principio activo, forma, cantidad, condición de venta, almacenamiento, refrigeración). Los que no se muestran y son neutros: `createdAt`, `equivalence`, banderas de campaña (todas en false), `maxQuantity`, `_id` de plataforma, `metaTitle`/`metaDescription`, y `stock`, que solo vale 100 o 0 (2.770 / 254): es una bandera de disponibilidad, no un inventario.

**Señal de datos internos: sí, una familia de campos.** `promoAvailable[]` trae `promoId`, `discount` (monto exacto), `condbenef`, `promType`, `qtyItems` y `promoName`. `promoName` tiene 449 valores distintos en 1.159 productos y leen como asuntos de correo del equipo comercial:

| Productos | `promoName` literal |
|---|---|
| 413 | Re: Ajuste de precios (posicionamiento vs SB) |
| 126 | Carga Ofertas productos Lab Chile |
| 55 | Re: MONITOREO MG NEGATIVO/BAJOS |
| 36 | Re: Vencimientos en <100 días |
| 16 | Posicionamiento Fertilidad 25-04-2025 hasta 31-07-2025 |
| 9 | Ajustar Posicionamiento Insulinas 13-01-2026 hasta 05-10-2026 |
| 5 | Posicionamiento Wegovy 15-05-2025 hasta 05-10-2025 |
| 2 | Oferta Ozempic 01-06-2026 hasta 05-10-2026 |

La página muestra el precio de oferta, nunca ese nombre (0/8 fichas con promo). En una línea y sin interpretar más: referencias a un competidor por sigla, a monitoreo de margen, a vencimiento cercano y a vigencias por producto, visibles para cualquiera que abra la API. **Marcado para revisión humana del cliente; no se profundizó.**

**Con la misma claridad, lo que no aparece:** ningún costo, margen numérico, proveedor, stock por bodega o local, datos de clientes, RUT, correos ni credenciales.

**Ritmo:** 0 respuestas 429, 403 o 503; 0 cabeceras de límite (`x-ratelimit-*`, `retry-after`); 0 timeouts en los 36 GET a la API y 261 a cofar.cl de las dos pasadas. No se hizo prueba de carga. Detalle en `evidencia/p2/api_inventario.md`.

## Hipótesis del BRIEF-P2: confirmadas / desinfladas

| # | Hipótesis | Estado | Qué pasó |
|---|---|---|---|
| A | robots bloquea a los bots de IA | **Desinflada** | 13/13 permitidos; solo hay un grupo `*`. |
| B | OG/Twitter ausentes también en DOM | **Confirmada** (H15) | 0 en raw y DOM; el bundle no los genera. |
| C | Cero JSON-LD (H04 de la pasada 1) | **Parcial** (H14) | 0 en raw; 21/21 en DOM con marca y stock degradados. Organization ausente. |
| D | La API expone datos internos | **Parcial** (H17) | Sí en `promoAvailable`; no hay costo, margen, proveedor ni clientes. |
| E | Hubo límite de velocidad en la pasada 1 | **Desinflada** | 0 señales en 297 requests. |
| F | Existe feed público | **Desinflada** (H16) | 12 rutas en 404 real; nada declarado. |
| G | Los LLMs no saben qué vende Cofar | **No verificable** | Sin API key; 3 búsquedas puntuales: ausente en Ozempic, 5.º en Rybelsus, 9.º en Gonal F. |

## Números para el score (solo lo nuevo)

| Métrica | Valor | Fuente |
|---|---|---|
| Bots de IA bloqueados / evaluados | 0 / 13 | `evidencia/p2/bots_ia.md` |
| llms.txt | no existe (404 real) | `evidencia/raw/llms.headers` |
| Sitemaps / URLs | 7 archivos / 3.268 URLs; 0 productos con lastmod | `evidencia/p2/bots_ia.md` |
| JSON-LD Product: raw / DOM | 0% / 100% (21 fichas) | `evidencia/p2/jsonld_dom_analisis.txt` |
| JSON-LD con marca placeholder | 19 de 21 | idem |
| JSON-LD con availability fijo InStock | 21 de 21 (1 con stock 0) | idem |
| og:* / twitter:* en raw y DOM | 0 / 0 | `evidencia/p2/senales_meta_google.md` |
| Herramientas de campaña en DOM | GTM, GA4, Google Ads, Meta Pixel, Hotjar, Google Sign-In | idem |
| Feed público de productos | no (12 rutas 404) | `evidencia/p2/feeds_log.txt` |
| Campos por producto en la API | 66 | `evidencia/p2/api_inventario.md` |
| Familias de campos internos | 1 (`promoAvailable`, 1.159 productos) | idem |
| Señales de rate limit | 0 en 297 requests | logs de ambas pasadas |
| Búsquedas web con Cofar en resultados | 2 de 3 (observación puntual) | `evidencia/p2/busquedas_web.md` |

## Qué se podría construir como demo (solo opciones, sin decidir)

1. **Comparador de cuatro miradas** para 5 fichas de especialidad: lo que ve el paciente (DOM), lo que ve Google (JSON-LD real con "Marca no disponible"), lo que ve WhatsApp (título y frase, sin imagen) y lo que vería si el JSON-LD se generara desde la API (laboratorio, principio activo, stock real).
2. **Generador de JSON-LD y og:\* en servidor** a partir de `products/2.0/{sku}`, lado a lado con el bloque actual del cliente.
3. **Borrador de feed de catálogo** (TSV/XML) desde la API pública con los campos que ya existen, para que el equipo lo cargue donde corresponda. Sin afirmar qué exige cada plataforma.
4. **"Qué saben de ti los asistentes"**: respuestas literales de 2 o 3 modelos a la pregunta fija del playbook, hechas desde el chat, frente a un chat conectado a la API pública.

## Qué no pude verificar y por qué

- **Paso 11 como lo pide el playbook** (respuesta literal de un modelo): sin `ANTHROPIC_API_KEY`. Se sustituyó por el contraste raw y 3 búsquedas puntuales. Para cerrarlo: preguntar desde el chat con y sin búsqueda web y pegar la respuesta en `evidencia/p2/busquedas_web.md`.
- **Posicionamiento real en Google Chile**: la búsqueda del entorno es un índice orientado a EE. UU. y se hizo una vez por consulta. Haría falta Search Console del cliente o un rank tracker con ubicación Chile.
- **Bloqueo por User-Agent en CloudFront o WAF**: no se suplantó a ningún bot (regla de UA identificable). robots permite; un bloqueo en el borde no sería visible así.
- **Eventos del píxel y de GTM, y reglas vigentes de Merchant Center y del catálogo de Meta**: solo se observó la carga de scripts; no se ejecutó GTM ni se revisó el contenedor.
- **Si Google acepta el JSON-LD inyectado** (placeholder de marca, availability sin prefijo, `ItemsList`): no se usó la prueba de resultados enriquecidos.
- **Feed privado ya cargado en Merchant Center o Meta**: no observable desde afuera.
- **Alcance de `promoName`**: por encuadre del BRIEF-P2, una línea y revisión humana; no se cruzó con nada.
- **Endpoints con sesión y `coverage/{sku}?rut=`**: fuera de alcance; solo se listan.
- **Validación contra el esquema del repo**: sigue sin ser JSON válido. Se validó contra `evidencia/hallazgos.schema.reparado.json` (cuatro arreglos documentados en `evidencia/hallazgos.schema.reparado.NOTA.md`); `hallazgos.json` de la pasada 1 también valida contra esa copia.

## Sugerencias para el playbook

1. **Buscar JSON-LD y og también en el DOM guardado, no solo en raw.** La pasada 1 tenía 23 DOM en disco con 21 bloques `Product` y los contó como cero porque el paso 4 se ejecutó sobre raw. Regla: si hay capa DOM, el paso 4 se repite sobre ella y se reporta por capa. Habría evitado una corrección.
2. **Leer el código que genera el JSON-LD.** Un grep de `"@type":"Product"` y `ld+json` en los chunks propios muestra en un minuto qué campos se fijan a mano (aquí `availability: "InStock"` y `priceCurrency`) y cuáles vienen del backend. Es la diferencia entre "faltan datos" y "los datos están y el código los ignora".
3. **Tabla explícita de bots de IA en el paso 2**, con la lista de 13 de este BRIEF, y la regla "no mencionado = hereda `*`". La respuesta corta ("permite todo") esconde la conclusión útil: si no hay grupos por bot, el cliente tampoco podría bloquearlos aunque quisiera.
4. **Inventario de campos de la API con columna "se muestra en la página"**, comprobado contra el texto del DOM. Aquí separó en un solo paso lo público, lo neutro y lo interno (`promoName`), sin adivinar.
5. **`lastmod` igual a la hora de la petición** es un patrón a detectar: sitemaps generados al vuelo que parecen actualizados y no dicen nada. Agregarlo al paso 2 junto a "sitemap sin lastmod".
6. **Rutas de feed**: la lista de 12 rutas de esta pasada sirve como estándar. Comparar siempre el cuerpo del 404 con el de una ruta inexistente conocida (`/llms.txt`) para distinguir 404 real de soft 404.
7. **Búsqueda web del entorno como sustituto declarado del paso 11**, con texto exacto, fecha y la advertencia de índice. No reemplaza al modelo, pero deja algo verificable en vez de "pendiente".
8. **El esquema sigue roto** (`hallazgos.schema.json`); la copia reparada ahora vive en `evidencia/` con nota. Conviene arreglar el original en la skill cuando se abra la ventana para tocarla.
