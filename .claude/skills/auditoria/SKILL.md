---
name: auditoria
description: Auditoría de legibilidad de un e-commerce chileno para máquinas (Google, LLMs). Ejecútala cuando CLAUDE.md o BRIEF.md lo pidan, o cuando el usuario diga "audita", "corre la auditoría" o "ejecuta el playbook". Produce hallazgos.json (esquema fijo) y AUDITORIA.md.
---

# Auditoría de legibilidad · Relevo Studio

La tesis de Relevo es una sola: cuando un sitio y su catálogo son ilegibles para máquinas, todos los síntomas aparecen a la vez. No sale en Google, no sale en las respuestas de ChatGPT, el catálogo de Instagram no sincroniza, y ningún chat (widget o WhatsApp) puede responder con datos reales porque no hay datos reales que leer. Esta auditoría mide esa legibilidad desde afuera, con lo mismoos crawlers.

Cada paso produce evidencia en `evidencia/` y cero o más hallazgos en `hallazgos.json`. Un hallazgo sin evidencia reproducible no es un hallazgo.

Antes de partir, lee `BRIEF.md`. Las hipótesis de ahí no reemplazan los pasos: se verifican mientras los ejecutas.

## Herramientas

- `curl -sL -A "RelevoStudio-Audit/1.0 (+https://relevostudio.com)"` para raw HTML. Guarda cada respuesta en `evidencia/`.
- Python con `requests`, `beautifulsoup4`, `lxml` para parsear. Instala con `pip install --break-system-packages`.
- Navegador headless (Playwright) solo si está disponible; si no, declara que la capa DOM no se verificó.
- `sleep 1` entre requests. Siempre.

## Pasos

### 1. Identidad y plataforma

Confirma la plataforma con evidencia, no con intuición. Busca en el e la home: `cdn.shopify.com`, `wp-content` + `woocommerce`, `jumpseller`, `vteximg`, `Magento_`, `wixstatic`, `prestashop`. Anota versión si aparece.

Registra en `evidencia/identidad.md`: título, meta description, idioma declarado (`lang`), canonical de la home, y si hay redirecciones raras (http→https, www vs no-www, trailing slash).

Hallazgo típico: meta/og con datos placeholder del template (direcciones extranjeras, "Mi tienda", lorem ipsum). Lo vimos en Tapizados: dirección italiana en og tags.

### 2. Archivos de control para máquinas

Pide cada uno y guarda la respuesta cruda:

| Archivo | Qué mirar |
|---|---|
| `/robots.txt` | ¿Existe? ¿Bloquea `/collections`, `/products`, `/search`? ¿Menciona sitemap? ¿Permite o bloquea GPTBot, ClaudeBot, PerplexityBot, Google-Extended? |
| `/llms.txt` |  válido o es un 404 disfrazado (HTML de "página no encontrada" con status 200)? |
| `/sitemap.xml` y los que declare | ¿Responde? ¿Cuántas URLs? ¿Las URLs de producto responden 200? Muestrea 20 al azar. |
| `/.well-known/` | Solo anotar si hay algo relevante. |

Hallazgo típico: sitemap declarado en robots que apunta a 404 (Dartel). llms.txt que existe pero devuelve HTML roto (Tapizados).

### 3. Presencia en Google

Sin scrapear Google. Usa lo que se puede observar sin violar sus términos:

- `site:{dominio}` aproximado vía la cantidad de URLs en el sitemap versus canónicos consistentes. Anota discrepancias.
- Revisa si las fichas de producto tienen `<title>` y meta description únicos o repetidos. Muestrea 30 productos: cuenta títuls.
- Canonical: ¿cada ficha apunta a sí misma o todas apuntan a la home?

Hallazgo típico: 40% de fichas con el mismo title, canonical a la home, paginación indexable infinita.

### 4. Datos estructurados

Por cada ficha de producto muestreada (mínimo 30, estratificadas por categoría), extrae JSON-LD y microdata:

- ¿Hay `Product`? ¿Tiene `offers.price`, `priceCurrency`, `availability`, `sku`, `gtin`, `brand`, `image`?
- ¿El `gtin` es un EAN real (13 dígitos, checksum válido) o un código interno? Verifica el checksum. Dartel publicaba códigos internos como gtin.
- ¿El precio del JSON-LD coincide con el precio visible en el raw HTML? ¿Y con el DOM si lo tienes?
- ¿`availability` dice InStock en productos que la página marca como agotados?

Registra cobertura por campo: qué porcentaje de fichas tiene cada campo. Esto alimenta el paso 5.

### 5. Cobertura de atributos por subcategoría

Este es el hallazgo más fuerte y el más difícil de refutar. Duplicados y 404 se arreglna asimetría de cobertura de atributos no.

Para cada subcategoría del catálogo (o las 6 más grandes si hay muchas):

1. Toma una muestra de fichas (10 a 20 por subcategoría).
2. Identifica qué atributos estructurados existen (tabla de especificaciones, JSON-LD `additionalProperty`, filtros de la categoría).
3. Calcula el porcentaje de fichas que tiene cada atributo relevante para esa subcategoría.
4. Detecta atributos que solo viven en el nombre del producto o la descripción libre (medidas, voltaje, talla, material). Cuenta cuántos SKUs los tienen solo ahí.

Salida: una tabla `subcategoría × atributo → % cobertura`, más la lista de SKUs con datos clave solo en el string del nombre. En Epysa esto dio 100% en una subcategoría y 24% en otra, con 60 SKUs con medidas solo en el nombre. Ese fue el hallazgo central de la propuesta.

Si el catálogo es chico (menos de 100 productos), haz esto sobre el catálo muestra.

### 6. Imágenes

Por ficha muestreada: cuántas imágenes, si tienen `alt`, si el alt es el nombre del producto o está vacío, dimensiones aproximadas, si son la misma imagen para variantes distintas.

Hallazgo típico: 100% de fichas con una sola imagen (Dartel).

### 7. Navegación y catálogo oculto

Compara tres fuentes: URLs del sitemap, URLs alcanzables desde nav + footer (crawl de 2 niveles), y si la plataforma expone API pública de catálogo (Shopify `/products.json`, WooCommerce `/wp-json/wc/store/v1/products`, Jumpseller, VTEX) de esa API.

- Productos en sitemap o API que no se alcanzan desde la navegación.
- Categorías con productos pero sin entrada en nav.
- Productos publicados con precio 0, sin precio, o sin botón de compra.

Hallazgo típico: outlet de 7.326 productos inalcanzable desde nav, 49% de ellos sin poder comprarse (Dartel).

### 8. Precios: raw vs DOM

ienes navegador headless, para 20 fichas compara precio en raw HTML, precio en JSON-LD y precio en DOM. Discrepancias van como hallazgo con las tres capas declaradas.

Si no tienes navegador, compara solo raw vs JSON-LD y declara que DOM no se verificó.

### 9. Canales de contacto

Recolecta todos los teléfonos, WhatsApp, correos y direcciones que aparecen en: home, footer, página de contacto, checkout (si es visible sin comprar), meta/og, JSON-LD `Organization`, y el aviso de LinkedIn.

- ¿Coinciden entre sí?
- Verifica los dominios de correo con `dig MX`. Un correo con dominio NXDOMAIN es hallazgo (Tapizados tenía uno en el botón de notificación de pago).
- Enlaces del footer: sigue cada uno, cuenta 404.
- Botones de WhatsApp: ¿el número del `wa.me` coincide con el del texto?

### 10. Presencia en Meta

Desde afuera y sin login:

- ¿Hay link a Instagram y Facebook? ¿Responden?
- ¿La página de Facebook muestra "Tienda" o catálogo?
- ¿El sitio tiene Meta Pixel (ook-domain-verification` en meta tags?

Si nada de esto es observable, dilo. No inferir que "no tienen catálogo en Meta" solo porque no lo viste.

### 11. Qué responden los LLMs

Este paso se hace con la API de Anthropic si hay `ANTHROPIC_API_KEY` disponible en el entorno, o se marca como pendiente para hacer en chat.

Pregunta a un modelo con búsqueda web (si está disponible) o sin ella: "¿Qué vende {empresa} ({dominio})? ¿Qué productos y precios tienen?". Registra la respuesta literal en `evidencia/llm.md`. Lo que importa: ¿el modelo sabe qué venden? ¿Inventa productos? ¿Confunde con otra empresa del mi
Esto alimenta la narrativa del PDF, no el score.

### 12. JavaScript y lógica visible

Revisa los scripts propios del sitio (no los de terceros) por lógica de negocio expuesta: distribución de leads, cálculos de precio, validaciones. Solo lectura. Si encuentras algo, describe qué hace sin publicar el código completo en el PDF.

Hallazgo real: distribuidor round-robin de leads en JavaScript con algoritmo sesgado y cero logging (Tapizados).

## Salida

### hallazgos.json

Sigue exactamente `hallazgos.schema.json` en esta misma carpeta. Valida con:

```bash
python3 -crt json,jsonschema; jsonschema.validate(json.load(open('hallazgos.json')), json.load(open('.claude/skills/auditoria/hallazgos.schema.json'))); print('ok')"
```

Cada hallazgo lleva: id, paso de origen, gravedad (1 a 5), capa observada (raw, jsonld, dom, externo), evidencia (rutas en `evidencia/` y URLs), y un campo `desinflado` que explica si una hipótesis del BRIEF no se sostuvo.

El bloque `resumen` tiene los números que después alimentan el score: cobertura de JSON-LD, asimetría máxima de atributos entre subcategorías, porcentaje de catálogo oculto, cantidad de contradicciones de contacto, si hay catálogo público con precios (construibilidad del demo).

### AUDITORIA.md

Lectura humana para Julio, no para el cliente. Estructura fija:

```
# Auditoría {empresna frase
## Hallazgos por gravedad
## Hipótesis del BRIEF: confirmadas / desinfladas
## Números para el score
## Qué se podría construir como demo (solo opciones, sin decidir)
## Lo que no pude verificar y por qué
## Sugerencias para el playbook
```

La sección "En una frase" es el candidato a hallazgo principal: una frase que el dueño no había formulado y que reordena su problema. Si no la encuentras, di que no la encontraste; es información útil para el no-go.
