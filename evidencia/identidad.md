# Identidad y plataforma · cofar.cl (paso 1)

Fecha de observación: 2026-09-12. Capa: raw HTML vía curl con UA `RelevoStudio-Audit/1.0`.

| Campo | Valor observado | Fuente |
|---|---|---|
| Plataforma | Next.js (App Router, Turbopack) desarrollo propio | header `x-powered-by: Next.js`, `x-nextjs-prerender: 1`, chunks `/_next/static/chunks/turbopack-*.js`, payload `self.__next_f.push` (`evidencia/raw/home.headers`, `raw/home.html`) |
| Versión | No declarada en HTML ni headers | — |
| CDN / hosting front | CloudFront (`via: 1.1 ...cloudfront.net`, POP SCL51) | `raw/home.headers` |
| Backend catálogo | `services.cofar.cl` → CNAME `11ivwc89.up.railway.app` (Railway), server `railway-hikari` | `contacto/dns.txt`, `api_sku_012522017.headers` |
| Imágenes | `product-img.cofar.cl` (CloudFront) y bucket S3 `cofar-public-files-storage-production` | bundles JS (`js/_all.js`) |
| CMS contenidos | Strapi (`/mscontent/strapi/banners`, `/landing-content`, `/terminos-y-condiciones`) | `js/_all.js` |
| Blog | `blog.cofar.cl` WordPress (94 `wp-content`), IP distinta (147.93.64.253) | `contacto/blog_home.html` |
| Telemedicina | `cofar.mediclic.cl/login` (Cloudflare) | footer, `contacto/dns.txt` |
| `<html lang>` | `es` | `raw/home.html` |
| `<title>` home | `Farmacia Cofar` | idem |
| meta description home | `Compra tus medicamentos online y recíbelos en 24 horas` | idem |
| canonical home | **ausente** | idem |
| og:* / twitter:* | **ausentes** en home y fichas | idem, `fichas/*.html` |
| JSON-LD | **0 bloques** en home, fichas, categorías y estáticas | idem |
| GTM | `GTM-5K4PHP4` inyectado por JS (no en HTML raw) | `js/_all.js` |
| Google Merchant ID | presente en bundle (`GOOGLE_MERCHANT_ID`) | `js/_all.js` |
| Hotjar | id en bundle (`NEXT_PUBLIC_HOTJAR_ID`) | `js/_all.js` |

## Redirecciones

| Petición | Respuesta |
|---|---|
| `http://cofar.cl/` | 301 → `https://cofar.cl/` (CloudFront) |
| `http://www.cofar.cl/` | 301 → `https://www.cofar.cl/` |
| `https://www.cofar.cl/` | **200, sin redirigir a no-www**, mismo `etag` que la home; sin canonical → dos hosts sirven el mismo contenido |
| `/medicamentos` | 301 → `/category/medicamentos` |
| `/pagina-que-no-existe-relevo-test` | 404 real (HTML de "La página que buscas no existe") |
| `/product/999999999/no-existe` | **200** con título `Farmacia Cofar` (soft 404) |
| `/product/012522017` (sin slug) | 404 |
| `/product/012522017/<cualquier-slug>` | 200 con canonical al slug generado |

## Placeholders detectados
- 52 de 137 categorías del sitemap tienen `meta description` literal `NOT_ASSIGNED` (incluida `/category/medicamentos`). Ver `categorias/analisis_categorias.json`.
- Iconos de categoría con valor `NOT_ASSIGNED` en el árbol de navegación (payload de la home).
- Las 13 páginas estáticas del sitemap (`/como-comprar`, `/preguntas-frecuentes`, etc.) comparten título `Farmacia Cofar` y la meta description de la home, sin canonical (`textos/*.txt`).
