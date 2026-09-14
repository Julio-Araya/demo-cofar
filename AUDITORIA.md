# Auditoría Cofar Salud (cofar.cl) · 2026-09-12

Lectura para Julio. Los números salen de `hallazgos.json` y se reproducen desde `evidencia/`. Capas declaradas en cada punto: raw (curl sin JS), payload (script `self.__next_f.push` de Next.js), DOM (Chrome 153 headless, `--dump-dom`), API (endpoint público que usa el propio navegador), externo (DNS, redes, blog).

## En una frase

Cofar tiene el catálogo de medicamentos mejor estructurado que hemos auditado (principio activo, laboratorio, forma, condición de venta, refrigeración y precio en el 94-100% de 3.024 productos) y no lo publica: cada ficha y cada categoría salen vacías en HTML, así que Google sin render, ChatGPT, Perplexity y la vista previa de WhatsApp solo ven un nombre. Y donde de verdad falta dato, falta justo en la especialidad: 0% de las fichas de VIH y 4% de las oncológicas tienen descripción.

Para el cliente, sin jerga: "tu sitio le muestra al paciente todo, pero a las máquinas solo les muestra el nombre del remedio; y tus fichas de especialidad son las que menos explican".

## Hallazgos por gravedad

| ID | Grav. | Paso | Capa | Hallazgo | Cifra |
|---|---|---|---|---|---|
| H01 | 5 | 8 | mixto | Las fichas no entregan ningún dato de producto a quien no ejecuta JavaScript | 50/50 fichas sin precio, principio activo, laboratorio ni descripción en raw; 0/50 en payload; 21/21 con todo en DOM |
| H02 | 4 | 7 | raw | Las 137 categorías llegan sin un solo producto al HTML ni al payload | 137/137 |
| H03 | 4 | 5 | externo (API) | 79% del catálogo sin descripción; VIH 0%, oncológicos 4%, refrigerados 7%, dermocosmética 69% | 2.401 de 3.024 |
| H04 | 4 | 4 | jsonld | Cero JSON-LD, cero Open Graph, cero GTIN en todo el sitio | 0/60 fichas, 0 og en 212 páginas |
| H05 | 3 | 2 | raw | 93 URLs del sitemap (3%) apuntan a productos que ya no existen y responden 200 (soft 404); SKU inventado también 200 | 93 + 3 malformadas + 1 de prueba |
| H06 | 2 | 3 | raw | Canonical y sitemap generan slugs distintos para el mismo producto; cualquier slug responde 200 | 31/50 fichas |
| H07 | 3 | 1 | raw | 52 categorías con meta description `NOT_ASSIGNED`; 13 estáticas con el título de la home; www sin redirigir | 52/137 |
| H08 | 3 | 9 | raw | Footer dice "24 horas, 7 días" y "L-V 10:00-18:00"; teléfono distinto en política de privacidad; WhatsApp solo en el 404 | 2 contradicciones en 211 páginas |
| H09 | 3 | 9 | mixto | 15 preguntas frecuentes sin respuesta en ninguna capa; coordinación explícita por farmacéuticos; 23 productos solo presenciales, 10 fuera de su categoría | 15 preguntas, 23 productos |
| H10 | 2 | 6 | mixto | 62% con una sola imagen; el HTML no expone ninguna | 1.862 de 3.024 |
| H11 | 2 | 5 | externo (API) | 118 medicamentos con concentración solo en el nombre; 409 sin principio activo; combos con un solo principio (1 caso) | 118 |
| H12 | 1 | 2 | raw | robots.txt permite todo, también a GPTBot/ClaudeBot/PerplexityBot; no hay llms.txt | — |
| H13 | 2 | 12 | externo | Claves `NEXT_PUBLIC_*` de terceros en el bundle (una llamada HEALTH_INSTITUTE_API_KEY de uso desconocido); consulta de cobertura por RUT desde el cliente | — |

Detalle de los tres que sostienen la conversación:

**H01, el central.** Se muestrearon 60 fichas del sitemap estratificadas en 10 grupos (diabetes, oncológicos, VIH, fertilidad, salud mental, refrigerados, cardiovascular, vitaminas, dermocosmética, receta cheque) más 10 de las URLs muertas. En las 50 vivas el raw trae `<title>`, meta description (46) y canonical (50), y nada más: ni precio, ni principio activo, ni laboratorio, ni descripción, ni una sola `<img>` de producto. Se revisó el payload de Next.js para no caer en el falso positivo que advertía el BRIEF: tampoco está ahí. Estado: **dato ausente**, no "solo en script". El navegador lo pide después a `services.cofar.cl/products/2.0/{sku}`. En DOM (Chrome headless, 21 fichas vivas) aparece todo y el precio coincide 21/21 con la API; no hay discrepancia raw vs DOM porque el raw no tiene precio que comparar. Ejemplo para el demo: Ozempic 2 mg/1,5 ml (SKU 012522017): raw = "Ozempic Semaglutida 2mg/1,5ml 1 Dispositivo Prellenado Multidosis"; DOM y API = $237.390 normal, $151.890 oferta, Semaglutida 2 mg/1,5 ml, Novo Nordisk, receta simple, refrigerado 2-8 °C, reembolso en línea.

**H03, el que no se arregla con un fix.** El catálogo completo (3.024 productos, 31 páginas de la API pública, solo GET) muestra que los atributos de medicamento están casi perfectos en el backend: principio activo 94-99% según subcategoría, laboratorio 100%, forma farmacéutica 100%, condición de venta 100%, condición de almacenamiento 100%, cantidad por envase 100%. La asimetría no está en los atributos (5 puntos entre subcategorías) sino en la descripción, que es lo que un LLM o un snippet usarían: VIH 0%, Oncológicos 4,2%, Refrigerados 6,8%, Salud mental 12,1%, Diabetes 27%, Dolor 33,6%, Vitaminas 67%, Dermocosméticos 69,3%. Asimetría máxima 69,3 puntos. Las categorías que definen el posicionamiento "farmacia de especialidad" son las peor descritas.

**H09, el que conecta con la operación.** El sitio publica 15 preguntas frecuentes y ninguna respuesta es observable en raw, payload ni DOM (acordeones que cargan al clic). Lo que sí está escrito: los farmacéuticos "coordinan tu pedido" (/conoce-cofar), el reembolso lo "gestionamos nosotros" (Contigo+), el descuento progresivo es "solo con tu RUT", la receta cheque es solo presencial. Hay 23 productos con condición receta cheque sin botón Comprar, y 10 de ellos no están en la categoría "Solo Compra Presencial" sino en Salud mental, Diabetes y obesidad o Enfermedades específicas. El WhatsApp (+56 9 23929950) existe pero solo se publica en la página de error 404. `miCofarPrice` viene null en los 3.024 productos y el sitio nunca explica qué es un precio MiCofar.

## Hipótesis del BRIEF: confirmadas / desinfladas

| # | Hipótesis | Estado | Qué pasó |
|---|---|---|---|
| 1 | Fichas vacías sin JS | **Confirmada** (H01) | Con matiz: meta description y canonical SÍ existen en raw; lo ausente es todo el dato de producto, y no está en el payload. DOM verificado. |
| 2 | Mismo producto en varias URLs | **Parcial** (H06) | Las 4 variantes responden 200 sin redirigir y `/product/012522017/prueba` también, pero todas declaran el mismo canonical. Lo nuevo: ese canonical difiere de la URL del sitemap en 31/50 fichas. Sin slug: 404. SKU inexistente: 200. |
| 3 | Rutas del sitio anterior indexadas | **Desinflada** | `/programas/ozempic.html` es 404 real; `/medicamentos/diabetes/ozempic` y `/medicamentos/diabetes-y-obesidad/ozempic` hacen 301 a `/category/medicamentos/diabetes-y-obesidad/ozempic`, que existe. El servidor las maneja bien; si Google aún las muestra es rezago del índice. |
| 4 | Categorías sin productos sin JS | **Confirmada** (H02) | 137/137 sin productos en raw ni payload; en DOM sí renderizan. |
| 5 | Contradicción de horario | **Confirmada** (H08) | En 211 de 212 páginas; nada aclara que sean servicios distintos. Se suma el teléfono +562 23992950 de la política de privacidad (dígitos distintos al +56 2 23929950 del footer). |
| 6 | Coordinación depende de personas | **Parcial** (H09) | Explícito para reembolso, descuento por RUT y receta cheque. La receta simple/retenida se adjunta en el checkout. No hay chat; WhatsApp solo en 404. El checkout no se observó. |

Cosas del BRIEF que se revisaron y no son hallazgo: el hash distinto del brand-logo no se reproduce con curl (misma imagen en home y categorías); el filtro "hasta $41.358.115" no se vio en vivo (el DOM muestra un rango MÍN/MÁX vacío).

## Números para el score

| Métrica | Valor | Fuente |
|---|---|---|
| Productos públicos | 3.024 (API) / 3.118 URLs en sitemap | `evidencia/api/analisis_catalogo.txt` |
| Muestra de fichas | 60 raw (50 vivas + 10 muertas), 23 DOM | `evidencia/fichas/`, `evidencia/dom/` |
| Cobertura JSON-LD Product | 0% | `evidencia/fichas/analisis_fichas.txt` |
| Cobertura precio en JSON-LD | 0% | idem |
| GTIN válidos | no aplica (no existe el campo) | `evidencia/api/analisis_catalogo.txt` |
| Asimetría máxima de atributos | 69,3 puntos (descripción: VIH 0% vs dermocosmética 69,3%) | `evidencia/api/cobertura_atributos.txt` |
| SKUs con datos solo en el nombre | 118 (concentración sin principio activo estructurado) | `evidencia/api/skus_datos_solo_en_nombre.json` |
| Catálogo oculto | 0,1% (3 productos de la API fuera del sitemap); 0 categorías fuera de nav; 93 URLs muertas en sitemap (3%) | `evidencia/api/diff_sitemap_api.json` |
| Fichas con una sola imagen | 61,6% | `evidencia/api/analisis_catalogo.txt` |
| Contradicciones de contacto | 2 | H08 |
| Enlaces del footer en 404 | 0 de 10 externos; internos 13/13 en 200 | `evidencia/contacto/enlaces_externos.txt` |
| robots / llms.txt / sitemap | ok / no existe / ok con 93 muertas | `evidencia/raw/` |
| Catálogo público con precios | **sí**: `https://services.cofar.cl/products/2.0/?first=100&offset=0` (GET, sin token, 100 por página, precio normal y oferta, stock, atributos) | `evidencia/api/` |
| DOM verificado | sí, Chrome 153 headless | `evidencia/dom/` |

## Qué se podría construir como demo (solo opciones, sin decidir)

1. **Chat de catálogo sobre la API pública.** Responde "¿tienen Ozempic 2 mg, cuánto cuesta, requiere receta, es refrigerado, tiene reembolso?" con datos reales de `products/2.0`. Es exactamente lo que hoy ningún LLM puede responder desde el sitio. Construible sin tocar nada del cliente.
2. **Comparativa "lo que ve tu paciente vs lo que ve la máquina"** para 5 fichas de especialidad: DOM con precio y atributos frente al raw con solo el título, más la vista previa de WhatsApp sin imagen ni precio.
3. **Generador de JSON-LD Product y og tags** a partir de la API, mostrando el rich result que hoy no existe (hay Merchant ID en el bundle, así que hay feed de Google al que cruzar).
4. **Borrador de descripciones** para las 28 fichas de VIH o las 142 oncológicas a partir de los atributos estructurados, marcado como borrador para revisión del químico farmacéutico. Sin afirmar nada clínico.
5. **Asistente de preguntas frecuentes** con las 15 preguntas ya publicadas y las respuestas que el cliente valide, más el WhatsApp que hoy solo aparece en el 404.

## Lo que no pude verificar y por qué

- **Respuestas de las 15 preguntas frecuentes**: no están en ninguna capa sin hacer clic; no se interactuó con el navegador.
- **Paso 11 (qué responden los LLMs)**: sin `ANTHROPIC_API_KEY` en el entorno. Pendiente en chat; ver `evidencia/llm.md`.
- **Precio MiCofar, checkout, receta adjunta, cupones, despacho refrigerado**: requieren cuenta o iniciar compra.
- **Alt y dimensiones de imágenes**: el raw no trae imágenes; en DOM no se midió sistemáticamente.
- **Tienda en Facebook/Instagram y Meta Pixel**: perfiles responden 200 (Instagram 14K seguidores, 721 posts; Facebook 7.445 me gusta) pero sin login no se ve la pestaña Tienda. El DOM carga `connect.facebook.net` vía GTM y el DNS tiene `facebook-domain-verification`; no se observó `fbq()` directo. No afirmo nada sobre catálogo en Meta.
- **Listado completo de categoría en DOM**: Chrome con 15 s de presupuesto solo renderizó 2 tarjetas; los conteos vienen de la API.
- **Uso de `NEXT_PUBLIC_HEALTH_INSTITUTE_API_KEY`**: solo lectura del bundle, no se probó.
- **Validación contra el esquema tal como está en el repo**: `hallazgos.schema.json` no es JSON válido (ver siguiente sección). Se validó contra una copia reparada fuera del repo.

## Sugerencias para el playbook

1. **El esquema está roto.** `.claude/skills/auditoria/hallazgos.schema.json` no parsea: línea 3 le falta la clave `"title"`, línea 25 le falta la comilla inicial en `cobertura_precio_jsonld_pct`, falta una llave de cierre del bloque `resumen` antes de `cobertura_atributos`, y el enum de `estado` dice `"sinflada"` donde el SKILL.md dice "desinflada". Con esos cuatro arreglos `hallazgos.json` valida. No lo toqué por regla.
2. **Paso "payload de framework" explícito.** En Next.js/Nuxt/Remix el dato puede vivir en `self.__next_f.push`, `__NEXT_DATA__` o `window.__NUXT__`. Conviene que el playbook exija clasificar cada campo en tres estados (HTML visible / solo script / ausente) como pidió el BRIEF; aquí evitó un falso positivo y produjo el hallazgo central.
3. **Buscar el endpoint de catálogo en los bundles antes de muestrear.** Grep de `NEXT_PUBLIC_API_URL`, `baseURL`, `/products`, `/search` en los chunks propios. En Cofar dio el catálogo completo con 32 GET y convirtió el paso 5 de "muestra de 10-20 por subcategoría" en censo.
4. **Chrome headless como fallback de Playwright.** `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --dump-dom --virtual-time-budget=15000 URL` funciona sin instalar nada y sirvió para verificar la capa DOM. Anotar el límite: listados con scroll infinito no se completan.
5. **Chequeo de soft 404**: pedir siempre un SKU inventado y 10 URLs del sitemap que no estén en la API/nav. Aquí dio 93 URLs muertas con 200.
6. **Chequeo de la página 404 como página de contacto.** El único WhatsApp del sitio estaba ahí. Vale la pena leer el texto del 404 en el paso 9.
7. **Mirar `www` sin `-L`.** `https://www.cofar.cl/` sirve el sitio completo sin redirigir y sin canonical; el paso 1 debería exigir la prueba de los cuatro hosts sin seguir redirecciones.
8. **Meta description literal `NOT_ASSIGNED`**: agregar a la lista de placeholders del paso 1 junto con "Mi tienda" y lorem ipsum.
