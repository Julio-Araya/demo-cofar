# Superficie de la API pública de catálogo (pasada 2, 2026-09-12)

Encuadre: **no es una prueba de seguridad.** Es un inventario de qué datos públicos ya recibe cualquier visitante al abrir una ficha o una categoría en cofar.cl. Solo GET; ningún request nuevo a la API en esta pasada: todo sale de los 32 volcados de la pasada 1 (`evidencia/api/catalogo/all_*.json`, 3.024 productos) y de `evidencia/api_sku_012522017.json`.

## Endpoints que llama el frontend (observados en los bundles propios, `evidencia/js/_all.js`)

Base: `NEXT_PUBLIC_API_URL` = `https://services.cofar.cl` (Railway, header `server: railway-hikari`).

| Ruta | Uso observado | Requiere sesión (según el código) | Se usó en la auditoría |
|---|---|---|---|
| `GET /products/2.0/?first=N&offset=M[&tags=…]` | listado / categoría | no | sí, 32 GET (pasada 1) |
| `GET /products/2.0/{sku}` | ficha | no | sí, 1 GET (pasada 1) |
| `GET /products/1.0/coverage/{sku}?rut=…` | cobertura de seguro por RUT en la ficha | no, pero pide RUT del paciente | **no** (dato personal) |
| `/mscustomer/yapp/benefits` | validación Contigo+ | sesión | no |
| `/mscontent/strapi/banners`, `/landing-content`, `/terminos-y-condiciones` | contenido CMS (Strapi) | no | no |
| `/api/auth/guest`, `/api/auth/migrate` | sesión invitado | — | no |
| `/api/checkout/cart/*`, `/api/checkout/shipping/*`, `/api/checkout/payment/*`, `/api/checkout/confirm` | carrito y checkout | sesión | no |
| `/api/orders/search`, `/api/shipping/user-addresses`, `/api/payment/methods` | cuenta | sesión | no |

No se probó ninguna ruta que el sitio no llame por sí solo. No se enviaron parámetros inventados.

## Cabeceras de la API (respuesta de `/products/2.0/012522017`)

`content-security-policy`, `strict-transport-security`, `x-frame-options: SAMEORIGIN`, `cross-origin-resource-policy: same-origin`, `vary: Origin`. Sin cabeceras `x-ratelimit-*` ni `retry-after`. Sin token, sin cookie, sin clave en la URL.

## Inventario de campos por producto (listado y ficha devuelven la misma estructura; la ficha agrega `staggeredDiscount`)

Columna "en la página": se comprobó si el valor aparece en el texto visible del DOM de las 21 fichas capturadas en la pasada 1 (`evidencia/p2/api_inventario_extra.txt`).

| Campo | Lleno (3.024) | En la página | Tipo de dato |
|---|---|---|---|
| `productName`, `sku` | 100% | 21/21 | comercial público |
| `normalPrice` | 100% | 21/21 | comercial público |
| `offerPrice` | 38,3% | 8/8 | comercial público |
| `fractionalUnitPrice` (precio por unidad) | 96,8% | 19/19 | comercial público |
| `laboratory.label` | 97,6% | 19/19 | público |
| `activePrinciples[]` (nombre, cantidad, unidad) | 86,5% | 17/17 | público |
| `pharmaceuticalForm.label`, `unitContent` | 100% | 21/21 | público |
| `saleCondition.value` (simpleRecipe 1.944, noPrescription 719, recipeRetention 233, MandatorySimpleRecipe 105, recipeCheck 23) | 100% | sí (como texto "Rec. Med. Simple", etc.) | público |
| `storageCondition` | 99,9% | 21/21 | público |
| `attributes.isRefrigerated`, `isBioequivalent`, `isInsurance`, `isProgresiveDisc`, `isCheck`, `hasDelivery`, `hasStore` | 100% | sí (como etiquetas) | público |
| `description` | 73,3% (20,6% con 40+ caracteres) | 4/4 | público |
| `imageURLs[]` (ruta relativa; el front antepone `NEXT_PUBLIC_IMAGE_CDN`) | 100% | sí | público |
| `tags[]`, `subTags[]` (categoría y subcategoría con `slug`) | 100% / 80,8% | 21/21 | público |
| `shippingMethod[]`, `deliveryLabel`, `storeLabel` | 100% | parcial | público |
| `metaTitle`, `metaDescription` | 92,3% / 93,9% | 1/20 (van al `<head>`, no al cuerpo) | SEO |
| `equivalence.value` (N/A 2.008, bioequivalent 651, referrer 364, generic 1) | 100% | 0/8 | interno-neutro |
| `stock` | 100%, **solo dos valores: 100 (2.770) o 0 (254)** | 0/21 (la página muestra "Comprar" o no) | bandera, no inventario |
| `attributes.isOutOfStock` | 254 en true (coincide con stock 0) | sí (sin botón) | público |
| `maxQuantity` | 9,9% (5, 2, 0, 3, 6) | no medido | regla de negocio |
| `enable` (100% true), `badge` (6), `subscription` (8), `freeDispatch` (14), `isNew` (5) | 100% | parcial | banderas |
| `attributes.isBlackFriday`, `isCyberMonday`, `isCyberDay` | 100%, todas false | no | banderas de campaña |
| `createdAt` | 100% | 0/21 | interno-neutro |
| `_id` (base64 de un id tipo `reaction/brand:…`) | 100% | no | identificador de plataforma (la cadena decodificada sugiere Reaction Commerce como origen del catálogo; solo observación) |
| `miCofarPrice`, `saleOnRequest`, `amountContent`, `slug`, `url` | 0% (null o vacío) | no | campos sin uso |
| `staggeredDiscount` (solo en ficha) | `[]` en el caso visto | no | descuento escalonado |
| **`promoAvailable[]`**: `promoId`, `discount` (monto), `condbenef`, `option`, `promType`, `qtyItems`, **`promoName`** | 38,3% (1.159 productos) | **0/8**: la página muestra el precio de oferta, no el nombre de la promoción | **ver abajo** |

## Señal de datos internos

**Sí hay una, y es una sola familia de campos: `promoAvailable[].promoName`.** Son 449 nombres distintos en 1.159 productos y leen como asuntos de correo o notas de trabajo del equipo comercial, no como textos para el público. Los más frecuentes (conteo de productos):

| Productos | `promoName` (literal) |
|---|---|
| 413 | `Re: Ajuste de precios (posicionamiento vs SB)` |
| 126 | `Carga Ofertas productos Lab Chile` |
| 55 | `Re: MONITOREO MG NEGATIVO/BAJOS` |
| 36 | `Re: Vencimientos en <100 días` |
| 16 | `Posicionamiento Fertilidad 25-04-2025 hasta 31-07-2025` |
| 14 | `posicionamiento abril 17-04-2026 hasta 31-07-2026` |
| 12 | `Re: POSICIONAR EN WEB//LCH` |
| 9 | `Ajustar Posicionamiento Insulinas 13-01-2026 hasta 05-10-2026` |
| 5 | `Posicionamiento Wegovy 15-05-2025 hasta 05-10-2025` |
| 4 | `Precio oferta Mounjaro ` |
| 2 | `Oferta Ozempic 01-06-2026 hasta 05-10-2026` |
| 3 | `Actualización sku 11040288 - EXELON 10` |

Lista completa de los 40 más frecuentes en `evidencia/p2/api_inventario_extra.txt`. Qué se lee ahí, sin interpretar más de lo escrito: referencias a un competidor por sigla, a monitoreo de margen, a productos con vencimiento cercano, y a fechas de vigencia de posicionamiento por producto. Junto con `discount` (monto exacto del descuento) y `promoId`, permite a cualquiera reconstruir la política de oferta producto por producto. **Se marca para revisión humana del cliente**; no se profundizó ni se cruzó con otros datos.

**Lo que NO aparece, con la misma claridad:** ningún campo de costo, margen numérico, proveedor, stock por bodega o local, datos de clientes, RUT, correos, ni credenciales. El `stock` es una bandera (100/0), no un inventario. Los identificadores son los de la plataforma de catálogo.

## Ritmo y límites (pasada 1, sin pruebas nuevas)

Requests a services.cofar.cl en la pasada 1: 32 de listado + 1 de ficha + 3 de SKUs muertos, a 1 por segundo, `--max-time 60`. Requests a cofar.cl: 212 páginas HTML + 26 chunks JS + 7 sitemaps + 3 archivos de control, mismo ritmo. En esta pasada: 13 requests a cofar.cl.

Resultado: **0 respuestas 429, 403 o 503; 0 cabeceras de límite; 0 bloqueos; 0 timeouts.** Todas 200 (los 404 fueron de rutas que no existen). Revisado en `evidencia/dump_catalogo.log`, `evidencia/muestra_y_dom.log`, `evidencia/fichas/_log.csv`, `evidencia/categorias/_log.csv`, `evidencia/js/_log.csv`, `evidencia/p2/feeds_log.txt`. No se hizo ninguna prueba de carga para averiguar dónde está el límite.
