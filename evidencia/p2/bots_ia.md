# Paso 2 · archivos de control (pasada 2, 2026-09-12)

## robots.txt (transcripción íntegra, https://cofar.cl/robots.txt, HTTP 200, text/plain, 105 bytes)

```
User-Agent: *
Allow: /
Disallow: /profile/*
Disallow: /checkout/*

Sitemap: https://cofar.cl/sitemap.xml
```

Fuentes: `evidencia/raw/robots.html` (pasada 1, 13:07 UTC) y `evidencia/p2/robots_2026-09-12.txt` (pasada 2, 14:03 UTC). Idénticos.

## Bots de IA, uno por uno

Solo existe el grupo `User-Agent: *`. No hay ningún grupo específico, así que cada bot hereda `Allow: /` con las dos exclusiones (`/profile/*`, `/checkout/*`).

| Bot | Operador / uso | Mención en robots.txt | Estado efectivo |
|---|---|---|---|
| GPTBot | OpenAI, entrenamiento | no mencionado | permitido (hereda `*`) |
| OAI-SearchBot | OpenAI, búsqueda en ChatGPT | no mencionado | permitido (hereda `*`) |
| ChatGPT-User | OpenAI, navegación a pedido del usuario | no mencionado | permitido (hereda `*`) |
| ClaudeBot | Anthropic, rastreo | no mencionado | permitido (hereda `*`) |
| Claude-User | Anthropic, navegación a pedido del usuario | no mencionado | permitido (hereda `*`) |
| anthropic-ai | Anthropic (token antiguo) | no mencionado | permitido (hereda `*`) |
| PerplexityBot | Perplexity, índice | no mencionado | permitido (hereda `*`) |
| Perplexity-User | Perplexity, navegación a pedido del usuario | no mencionado | permitido (hereda `*`) |
| Google-Extended | Google, uso en Gemini | no mencionado | permitido (hereda `*`) |
| Applebot-Extended | Apple, uso en modelos | no mencionado | permitido (hereda `*`) |
| CCBot | Common Crawl | no mencionado | permitido (hereda `*`) |
| Bytespider | ByteDance | no mencionado | permitido (hereda `*`) |
| meta-externalagent | Meta, entrenamiento | no mencionado | permitido (hereda `*`) |

Conclusión con todas sus letras: **robots.txt no bloquea a ningún bot de IA.** Lo que esos bots reciben al entrar es el HTML medido en la pasada 1: título, meta description y canonical, sin precio, sin principio activo, sin descripción (H01). El problema no es de permiso, es de contenido. Si el cliente quisiera bloquearlos, hoy tampoco tendría cómo distinguirlos: no hay grupos por bot.

Nota de método: no se probó si CloudFront o un WAF responden distinto según el User-Agent (por ejemplo, bloqueando a GPTBot en el borde) porque la regla del repo es usar siempre un User-Agent identificable de Relevo; se anota en no_verificado.

## llms.txt

`https://cofar.cl/llms.txt` → HTTP 404 real (Next.js, `x-nextjs-prerender: 1`, página "not found" del sitio, 187 KB). No es un 404 disfrazado con 200. Fuente: `evidencia/raw/llms.headers`, `evidencia/raw/llms.html` (pasada 1). No se repitió.

## Sitemaps

Índice `https://cofar.cl/sitemap.xml` (200, application/xml, `cache-control: s-maxage=31536000`, servido desde caché de CloudFront). Declara 6 sitemaps:

| Sitemap | URLs | `lastmod` | `changefreq`/`priority` | Nota |
|---|---|---|---|---|
| sitemap-static.xml | 13 | 13/13, todas `2026-09-12T13:07:20.801Z` | sí | el lastmod es la hora exacta de la petición: se genera al vuelo, no informa cambios reales |
| sitemap_PLP.xml (categorías) | 137 | 137/137, todas `2026-09-12T13:07:22.177Z` | sí | ídem |
| sitemaps/sitemap_PDP_sitemap-productos-medicamentos.xml | 2.815 | 0 | no | trae `image:image` por producto; header `last-modified: Thu, 10 Sep 2026 03:55:06 GMT` |
| sitemaps/sitemap_PDP_sitemap-productos-vitaminas.xml | 203 | 0 | no | |
| sitemaps/sitemap_PDP_sitemap-productos-dermocosmeticos.xml | 85 | 0 | no | |
| sitemaps/sitemap_PDP_sitemap-productos-accesorios.xml | 15 | 0 | no | |
| **Total** | **3.268** (3.118 productos + 137 categorías + 13 estáticas) | | | |

Cruce con lo que ya midió la pasada 1 (no se repite): de las 3.118 URLs de producto, 93 apuntan a SKUs que ya no están en la API y responden 200 (H05); 4 tienen SKU malformado (`01.2359020`, `010070009%20`, `010077168-1`, `010195151-1`); el canonical de la ficha difiere del slug del sitemap en 31 de 50 muestreadas (H06). Los sitemaps de producto no declaran `lastmod`, así que no hay forma de saber desde afuera cuándo se generó la lista que contiene esas 93 muertas. Los 3 productos de la API que no están en el sitemap siguen en `evidencia/api/diff_sitemap_api.json`.

Fuentes: `evidencia/raw/sitemap.html`, `evidencia/raw/sitemap.headers`, `evidencia/sitemaps/*.xml`.

## /.well-known/

`/.well-known/` → 308 a `/.well-known` → 404. `/.well-known/security.txt` → 404. Nada relevante. Fuente: `evidencia/raw/wellknown.headers`, `evidencia/raw/securitytxt.headers` (pasada 1).

## Meta robots / X-Robots-Tag

No hay `<meta name="robots">` en raw ni DOM (home, ficha) ni header `x-robots-tag`. Nada bloquea la indexación.
