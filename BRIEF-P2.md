# PASADA 2 · Cofar Salud · canales de descubrimiento

> Segunda pasada sobre la misma auditoría, 2026-09-12. La pasada 1 está en la rama `auditoria` (PR #1) y no se toca: esto la complementa.

## Por qué esta pasada

La pasada 1 midió el catálogo y encontró el hallazgo central: los datos existen completos en el backend y no salen en el HTML. Lo que quedó corto o pendiente es todo lo que decide **quién encuentra a Cofar cuando no llega escribiendo cofar.cl**: buscadores, asistentes de IA, y las campañas de Google y Meta.

Esta pasada cierra los pasos 2, 10 y 11 del playbook con el mismo rigor, y agrega una pregunta técnica sobre la API que ya se descubrió.

Todo lo de la pasada 1 sigue vigente. No repitas mediciones ya hechas. Si un dato ya está en `hallazgos.json`, ce volver a medirlo.

## Alcance

### A. Paso 2 completo · archivos de control (prioridad 1)

Si la pasada 1 ya lo hizo, di dónde está y no lo repitas. Si no, hazlo ahora y con detalle:

- `/robots.txt`: ¿existe? ¿Qué permite y qué bloquea? Transcríbelo entero en la evidencia.
- **Bots de IA, uno por uno**: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, CCBot, Bytespider, meta-externalagent. Para cada uno: permitido, bloqueado o no mencionado. Tabla explícita.
- `/llms.txt`: ¿existe, es v� un 404 con status 200?
- `/sitemap.xml` y los que declare robots: cuántos, cuántas URLs, si el sitemap de productos declara `lastmod` y si coincide con lo que la pasada 1 ya midió (93 URLs muertas, canonical distinto en 31 de 50).
- `/.well-known/`: solo si hay algo relevante.

Nota para el análisis: la pasada 1 mostró que el dato de producto no está en el HTML ni en el payload. Si además robots bloquea a los bots de IA, el se suma. Si robots los deja pasar, el problema es solo de contenido, y eso cambia la recomendación. Deja esa distinción escrita con todas sus letras.

### B. Paso 10 · Meta y Google como canales de campaña (prioridad 1)

La pasada 1 reportó cero JSON-LD y cero Open Graph en todo el sitio. Eso ya es el hallazgo; lo que falta es dimensionarlo para publicidad.

- **Open Graph y Twitter Card**: confirma la ausencia en home, categoría y ficha, en raw y en DOM. Si en DOM aparecen inyectados por JS, dilo: cambia el diagnóstico.
- **Qué se ve al compadescribe qué recibiría WhatsApp, Instagram o LinkedIn al leer una ficha (título, descripción, imagen). Solo lo observable en las etiquetas; no simules el render de esas plataformas.
- **Meta Pixel**: busca `fbq(`, `connect.book.net`, `facebook-domain-verification` en raw, en DOM y en los bundles JS propios. Reporta presencia o ausencia, sin inferir configuración.
- **Google**: busca `gtag(`, `googletagmanager.com`, `google-site-verification`, y cuaquier ID de conversión visible en el cliente. Solo presencia; nada de cuentas ni datos privados.
- **Feed de productos**: revisa si existe algún feed público de catálogo (XML, TSV, rutipo `/feed`, `/merchant`, `/google`, `/facebook`, o algo declarado en robots o sitemap).
- **Datos estructurados**: confirma la ausencia de JSON-LD `Product` y `Organization`, y anota qué campos exigidos por Google para un producto están hoy disponibles en la API pero no publicados. Esa comparación es el argumento.

No afirmes qué requiere exactamente Google Merchant Center o el catálogo de Meta. Reporta qué hay y qué falta en el sitio; las reglas de esas plataformas cambian y se verifican aparte.

### C. Paso 11 · qué saben los asistentes de IA (prioridad 2)

No hay `ANTHROPIC_API_KEY` y probablemente siga sin haberla. No la pidas ni la busques. En su lugcumenta con precisión **qué recibe un crawler sin JavaScript** en una ficha de especialidad (VIH u oncológico) y en una de dermocosmética, lado a lado. Ese contraste es el dato que reemplaza al experimento.
- Si hay acceso a búsqueda web en el entorno, registra qué sitios aparecen al buscar dos o tres medicamentos que Cofar vende, y si Cofar aparece o no. Marca cada consulta con su fecha y su texto exacto. **Es una observación puntual, no una medición**: dilo así.
- Si no hay búsqueda web, deja el paso en `no_verificado` con una nota de cómo completarlo desde el chat.

Dato de contexto, no medido por ti y no citable como hallazgo: el 2026-09-12, en una búsqueda web desde el chat por dónde comprar Ozempic en Chile, aparecieron Farmaloop, Salcobrand, Cruz Verde, Ahumada, Curie y Fao apareció.

### D. Superficie de la API pública (prioridad 1)

La pasada 1 encontró una API de catálogo sin token, la misma que usa el navegador, y bajó el catálogo completo con 32 GET. Falta responder qué expone exactamente. **Solo GET, solo lo que un ve ya recibe al abrir el sitio. Nada de autenticación, nada de escritura, nada de fuerza bruta, nada de endpoints administrativos, nada de parámetros inventados para provocar errores.**

- **Inventario de campos**: lista todos los campos que devuelve un producto. Marca cuáles se muestran en la página y cuáles no.
- **Señal de datos internos**: indica si aparecen campos que un visitante no debería ver (costo, margen, proveedor, stock por bodega, banderas internas, identificadores de terceros). Si no aparecen, dilo con la misma claridad: es la respuesta que más vale.
- **Qué endpoints usa el frontend**: lista los que ya se observaron en los bundles JS. No pruebes rutas que el sitio no llame por sí solo.
- **Ritmo**: reporta si hubo señales de límite de velocidad durante la pasada 1 (429, bloqueos, throttling). No hagas pruebas de carga para averiguarlo.

Encuadre obligatorio: esto **no es una prueba de seguridad yta como vulnerabilidad**. Es un inventario de qué datos públicos están disponible en qué estado. Si algo parece sensible, descríbelo en una línea y márcalo para revisión humana; no profundices.

## Qué NO hacer en esta pasada

- No repetir el muestreo de fichas ni el conteo de catálogo. Ya está.
- No tocar `hallazgos.json` de la pasada 1: crea `hallazgos-p2.json` con el mismo esquema.
- No abrir juicio sobre el contenido médico ni sobre decisiones clínicas.
- No estimar cuánto dinero pierden. No hay datos de tráfico ni de conversión y cualquier cifra sería inventada.
- No proponer precios ni alcance comercial.

## Salida

- `hallazgos-p2.json`, mismo esquema. **Ojo: `hallazgos.schema.json` del repo tiene errores de sintaxis JSON.** Valida contra la copia repsaste en la pasada 1 y deja esa copia en `evidencia/` con una nota.
- `AUDITORIA-P2.md` con esta estructura:
  - En una frase
  - Archivos de control: tabla de bots de IA
  - Campañas: qué falta para Google y para Meta hoy
  - Qué ve un asistente de IA
  - API pública: inventario de campos y señal de datos internos
  - Qué no pude verificar y por qué
  - Sugerencias para el playbook
- Rama `auditoria-p2`, push y PR aparte. No mezclar con el PR #1.
