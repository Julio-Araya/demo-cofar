# Paso 10 · Meta y Google como canales de campaña (pasada 2, 2026-09-12)

Capas: **raw** = curl sin JS (archivos de la pasada 1 en `evidencia/raw`, `evidencia/categorias`, `evidencia/fichas`); **DOM** = Chrome 153 headless `--dump-dom` (pasada 1, `evidencia/dom`); **bundle** = los 26 chunks propios de Next.js concatenados en `evidencia/js/_all.js` (2,28 MB). No se hicieron fetches nuevos para este paso.

## 1. Open Graph y Twitter Card

| Página | raw `og:*` | raw `twitter:*` | DOM `og:*` | DOM `twitter:*` |
|---|---|---|---|---|
| Home `/` | 0 | 0 | 0 | 0 |
| Categoría `/category/medicamentos/diabetes-y-obesidad` | 0 | 0 | 0 | 0 |
| Ficha Ozempic 2 mg (012522017) | 0 | 0 | 0 | 0 |
| Ficha Ziagen 300 mg (011000228, VIH) | 0 | 0 | 0 | 0 |

En el bundle: `og:` aparece 12 veces, todas como nombres de variables minificadas (`case og:`), ninguna como etiqueta; `openGraph` 0; `twitter` 0. **No se inyectan por JS.** El diagnóstico de la pasada 1 (H04) se mantiene en la capa DOM.

Tampoco hay `<link rel="image_src">` ni `<meta name="robots">`.

## 2. Qué recibe una plataforma al leer una ficha (solo etiquetas observables)

Etiquetas presentes en el `<head>` raw de una ficha (ejemplo Ozempic 2 mg, 012522017):

```
<title>Ozempic Semaglutida 2mg/1,5ml 1 Dispositivo Prellenado Multidosis</title>
<meta name="description" content="Ozempic 2mg/1,5ml (Multidosis): Pluma Multidosis de Semaglutida para etapas de inicio de tratamiento y adaptación en diabetes tipo 2. Requiere receta médica simple."/>
<link rel="canonical" href="https://cofar.cl/product/012522017/ozempic-semaglutida-2mg15ml-1-dispositivo-prellenado-multidosis"/>
<link rel="icon" href="/favicon.ico?..."/>
```

Eso es todo lo que un lector de vistas previas (WhatsApp, Instagram, LinkedIn, Slack) puede tomar de la ficha sin ejecutar JavaScript: un título, una descripción y ningún `og:image`. En el raw hay 18 `<img>` y las 18 son logo e íconos de interfaz; 0 imágenes de producto (medido en las 50 fichas vivas de la pasada 1). Cómo renderiza cada plataforma esa carencia no se simula aquí.

## 3. Meta Pixel

| Señal | raw (home/cat/ficha) | DOM (home/cat/ficha) | bundle propio |
|---|---|---|---|
| `fbq(` | 0 | 0 | 0 |
| `connect.facebook.net/en_US/fbevents.js` | 0 | sí (2 scripts) | 0 |
| `connect.facebook.net/signals/config/<id>` | 0 | sí, `domain=cofar.cl` | 0 |
| `facebook-domain-verification` (meta tag) | 0 | 0 | 0 |
| `facebook-domain-verification` (DNS TXT) | — | — | sí, en `evidencia/contacto/txt_cofar.txt` |

Lectura: el píxel de Meta **se carga en el navegador**, pero no desde el código propio: llega a través de Google Tag Manager (el bundle solo inicializa GTM). El ID del píxel queda en `evidencia/dom/home.html`; no se copia aquí. El dominio está verificado por DNS. No se afirma nada sobre eventos configurados (ViewContent, AddToCart, Purchase): no se observó ninguna llamada `fbq('track', ...)` porque no está en el código propio y no se ejecutó GTM más allá del dump de DOM.

## 4. Google

| Señal | raw | DOM | bundle propio |
|---|---|---|---|
| `googletagmanager.com/gtm.js?id=GTM-…` | 0 | sí | sí (constante `NEXT_PUBLIC_GTM_ID`) |
| `googletagmanager.com/gtag/js?id=G-…` (GA4) | 0 | sí | 0 (lo carga GTM) |
| `googletagmanager.com/gtag/js?id=AW-…` (Google Ads) | 0 | sí | 0 (lo carga GTM) |
| `googleads.g.doubleclick.net/pagead/viewthroughconversion/<id>` | 0 | sí (1-2 por página) | 0 |
| `gtag(` | 0 | 0 | 0 |
| `dataLayer` | 0 | sí | sí (25 menciones; evento `purchase` con `ecommerce.items`) |
| `<meta name="google-site-verification">` | **0** | **sí** (inyectada por JS) | 0 |
| `google-site-verification` (DNS TXT) | — | — | sí, 2 registros |
| `GOOGLE_MERCHANT_ID` | 0 | 0 | sí, constante con valor numérico en el chunk de config |
| `accounts.google.com/gsi/client` (Google Sign-In) | 0 | sí | sí (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`) |
| Hotjar `static.hotjar.com/c/hotjar-<id>.js` | 0 | sí | sí (`NEXT_PUBLIC_HOTJAR_ID`) |

Lectura: existe la infraestructura de campaña (GTM, GA4, tag de conversión de Google Ads, Merchant ID en el código, Hotjar). Lo que falta no es el tag, es el **dato de producto** que esos tags y feeds necesitan: sin OG, sin JSON-LD en el servidor, sin feed. Los IDs quedan en los archivos de evidencia; no se reportan cuentas ni configuraciones.

Detalle: la etiqueta `google-site-verification` solo existe en el DOM (la inserta el JavaScript). Como además hay 2 registros TXT en DNS, la verificación probablemente se hizo por DNS; se anota como observación, no como problema.

## 5. Feed público de productos

Probadas el 2026-09-12 14:03 UTC, 1 request por segundo, UA identificable (`evidencia/p2/feeds_log.txt`):

| Ruta | Status | Tipo |
|---|---|---|
| /feed, /feed.xml, /rss.xml, /feed/products | 404 | HTML "no encontrado" de Next.js |
| /merchant, /google, /facebook | 404 | ídem |
| /products.xml, /product-feed.xml, /google-merchant.xml, /facebook-feed.xml, /catalog.xml | 404 | ídem |

Son 404 reales (mismo cuerpo de 187 KB que `/llms.txt`), no 200 disfrazados. Ni robots.txt ni los sitemaps declaran un feed. En el bundle no aparece la palabra `feed`. **No hay feed público de catálogo observable.** Eso no significa que no exista uno privado subido a Merchant Center o a Meta: no es observable desde afuera.

## 6. Datos estructurados: JSON-LD (corrección a la pasada 1)

La pasada 1 midió **0 JSON-LD en raw** (correcto: `evidencia/fichas/analisis_fichas.txt`). En esta pasada se revisaron los DOM ya capturados y **sí hay JSON-LD, inyectado por JavaScript** (`evidencia/p2/jsonld_dom.json`, `evidencia/p2/jsonld_dom_analisis.txt`):

| Página (DOM) | Tipos JSON-LD |
|---|---|
| Home | ninguno (no hay `Organization`, `WebSite` ni `LocalBusiness`) |
| Categoría (2 revisadas) | `BreadcrumbList` + `ItemsList` (sic) con `itemsListElement` (sic) de `Product` |
| Fichas vivas (21 de 21) | `Product` + `BreadcrumbList` |
| Ficha muerta / SKU inexistente (3) | ninguno |

Código que lo genera (chunk propio, `evidencia/js/_all.js`): un componente React que en `useEffect` crea un `<script type="application/ld+json" id="product-structured-data">` y lo agrega al `<head>`. Por eso nunca está en el HTML del servidor.

Calidad del `Product` en las 21 fichas:

| Campo | Qué pone el código | Observado en 21 fichas | Dato disponible en la API |
|---|---|---|---|
| `name` | `productName` | 21/21 correcto | sí |
| `sku` | `sku` | 21/21 | sí |
| `image` | primera de `imageURLs` | 21/21 URL absoluta a product-img.cofar.cl | sí (1-N imágenes) |
| `url` | slug generado desde el nombre | 21/21 (es el mismo slug del canonical, distinto al del sitemap en 31/50) | — |
| `description` | `description` o `"Descripcion no disponible"` | **7/21 con el placeholder** | API sin descripción en 79% del catálogo (H03) |
| `brand.name` | `brand` o `"Marca no disponible"` | **19/21 con el placeholder**; 2/21 con un objeto `{label, value}` en vez de texto | **`laboratory.label` existe en 100% de los medicamentos y el código no lo usa** |
| `category` | primer `tag` | 21/21 (ej. "Seguro Complementario" para Ziagen) | sí |
| `offers.price` | `offerPrice` o `normalPrice` | 21/21 coincide con la API | sí |
| `offers.priceCurrency` | `"CLP"` fijo | 21/21 | — |
| `offers.availability` | **`"InStock"` fijo en el código** | 21/21 InStock; 1 de ellas (011050004) tiene `stock: 0` e `isOutOfStock: true` en la API | sí (`stock`, `isOutOfStock`) |
| `gtin` / `mpn` | no se genera | 0/21 | no existe en la API |
| `offers.priceValidUntil`, `itemCondition`, `seller`, `shippingDetails`, `hasMerchantReturnPolicy` | no se genera | 0/21 | parcial (despacho sí, retiro sí) |
| `aggregateRating` / `review` | no se genera | 0/21 | no |

Además, `availability: "InStock"` está escrito sin el prefijo `https://schema.org/`, y en categorías el tipo `ItemsList` y la propiedad `itemsListElement` no existen en schema.org (los correctos son `ItemList` e `itemListElement`). Se anota lo observado; qué acepta o rechaza Google se verifica con su herramienta de resultados enriquecidos, no aquí.

Resumen de la comparación que pide el BRIEF-P2 (qué hay en la API y no se publica): laboratorio (marca), principio activo y concentración, forma farmacéutica, cantidad por envase, condición de venta, refrigeración, stock real, precio normal cuando hay oferta, e imágenes adicionales. Todo eso viaja en `services.cofar.cl/products/2.0/{sku}` a cada navegador y no llega ni al HTML ni al JSON-LD.
