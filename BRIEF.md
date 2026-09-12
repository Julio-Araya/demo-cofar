# BRIEF · Cofar Salud

> Generado por el skill `prospectar-relevo` el 2026-09-11. Fila en Notion: https://app.notion.com/p/3d8236a8d74781db8a43f755b1fdc99d

## Ques

- **Empresa:** Cofar Salud
- **Rubro:** farmacia de especialidad para tratamientos crónicos (diabetes y control de peso, oncológicos, VIH, fertilidad, hormona del crecimiento, salud mental). Venta online con despacho a todo Chile continental y despacho refrigerado. Local en Av. Apoquindo 5016, Las Condes.
- **Sitio:** https://cofar.cl
- **Plataforma detectada:** desarrollo propien Next.js (evidencia: rutas `/_next/static/` y `/_next/image` en el HTML; imágenes de catálogo en `product-img.cofar.cl`). Satélites: blog en `blog.cofar.cl`, telemedicina en `cofar.mediclic.cl`.
- **Productos públicos aprox:** ~600 según su propio blog (mayo 2025). Sin contar todavía.
- **Canales visibles:** teléfono +56 2 23929950 e info@cofar.cl (header y footer). No se vio WhatsApp en el HTML sin JavaScript. Instagram @farmaciascofar y Facebook.

## Qué están buscando

- **No hay aviso de LinkedIn.** Es un lead directo. Esta auditoría no tiene una vacante que reencuadrar: el objetivo es encontrar el hallazgo que abra la conversación con la gerencia de e-commerce.
- **Contexto público (prensa de mayo 2025, no es dato de auditoría):** la empresa declara haber atendido a más de 500.000 pacientes y un crecimiento de 65% en venta web entre 2023 y 2024. Trabaja con aseguradoras para convenios y reembolsos. En `/conoce-cofar` dicen que su equipo de farmacéuticos atiende consultas y coordina el isor probable:** Claudia Aspe, gerente de Ecommerce & Marketing. No hace falta verificarlo en esta auditoría.

## Hipótesis a confirmar o descartar

Cada una salió del pre-análisis en chat, mirando el sitio por encima. Claude Code las verifica con datos. Si una se desinfla, se reporta desinflada.

1. **Las fichas llegan vacías a quien no ejecuta JavaScript.** En un fetch sin JS de `/product/102520002/ozempic-semaglutida-4mg3ml-1-dispositivo-prellenado-multidosis` y `/product/012522017/ozempic-2mg-1-5ml-1-disp-prell`, el texto visible fue solo el título: sin precio, sin descripción, sin meta description y sin canonical. Ojo: la herramienta usada extrae texto y pudo descartar los `<script>`. Next.js puede traer los datos dentro del payload (`self.__next_f.push` o `__NEXT_DATA__`) aunque no estén como HTML. Clasifica cada ficha en tres estados: dato en HTML visible, dato solo dentro de un script, o dato ausente. Un snippet de Google sí mostraba la descrrga, así que Google renderiza; el impacto a medir es sobre crawlers sin JS (GPTBot, ClaudeBot, PerplexityBot, vistas previas de WhatsApp y redes).
2. **Un mismo producto responde en varias URLs.** En el índice de Google, el SKU 012522017 aparece con al menos cuatro variantes (`/product/012522017`, `.../ozempic-2mg-1-5ml-1-disp-prell`, `.../ozpic-semaglutida-2mg15ml-1-dispprell`, `.../ozempic-semaglutida-2mg-1-5ml-1-disp-prell`) y el 102520002 con tres. El slug antiguo `ozempic-2mg-1-5ml-1-disp-prell` respondió 200 sin redirigir. Verifica status y redirecciones de cada variante, canonical en raw y en DOM, y si un slug cuaquiera (`/product/012522017/prueba`) también responde 200.
3. **Siguen indexadas rutas de un sitio anterior.** Aparecieron en Google `/programas/ozempic.html`, `/medicamentos/diabetes/ozempic` y `/medicamentos/diabetes-y-obesidad/ozempic`, con un snippet de app que pide activar JavaScript. Verifica status, redirección y contenido actual.
4. **Las categorías no listan productos sin JavaScript.** `/category/medicamentos/diabetes-y-obesidad` trae canonical y meta description, pero ningún producto en el texto extraído. Aplica la misma advertencia de la hipótesis 1 sobre scripts.
5. **Contradicción en el horario de atención.** El footer de todas las páginas dice línea directa 24 horas, 7 días, y en el mismo footer publica horario L-V 10:00–18:00 y S-D 10:00–17:00. Confirma que se repite en todas las páginas y si algún texto aclara que son servicios distintos (por ejemplo, línea 24/7 de asistencia y horario del local).
6. **La coordinación del pedido depende de personas.** Receta (simple, reguro complementario, reembolso, descuento por RUT y despacho refrigerado parecen resolverse con un farmacéutico por teléfono o correo. Solo con texto público (`/como-comprar`, `/contigo-beneficios`, `/preguntas-frecuentes`, `/informacion-reglamentaria`, `/terminos-y-condiciones` y fichas), documenta qué pasos dicen explícitamente que requieren contacto humano, qué información pide el sitio antes de comprar y qué dudas frecuentes no tienen respuesta publicada. Busca también `wa.me`, `api.whatsapp.com` o widgets de chat en el raw y en los bundles JS propios.

## Dónde poner más atención

1. **Hipótesis 1 con rigor de capas.** Es el candidato a hallazgo central y el más fácil de convertir en falso positivo. Mínimo 30 fichas estratificadas por categoría. Si hay Playwright, compara raw, payload de scripy, dilo.
2. **Atributos de medicamento (paso 5 del playbook).** Para este rubro los atributos relevantes son principio activo, concentración, forma farmacéutica, cantidad por envase, laboratorio, tipo de receta, si requiere refrigeración y registro sanitario. Mide cuáles viven estructurados y cuáles solo en el nombre. Subcategorías prioritarias: Diabetes y obesidad, Oncológicos (bajo Enfermedades Específicas), VIH, Fertilidad, Salud mental y Refrigerados. Anota lo observado sin afirmar qué exige la normativa.
3. **Sitemap y robots.** Cantidad real de productos, qué slugs usa el sitemap frente a los indexados, y qué reglas hay para GPTBot, ClaudeBot, PerplexityBot y Google-Extended.
4. **Catálogo sin login.** Lona "precios MiCofar". Determina qué precio ve un visitante sin cuenta y si hay productos sin precio o sin botón de compra. Existe la categoría "Receta Cheque - Solo Compra Presencial": cuenta cuántos productos tiene y cómo se presentan.
5. **API de catálogo pública.** Si los bundles JS llaman a un endpoint de productos sin autenticación (el mismo que usa el navegador de cualquier visitante), úsalo para contar el catálogo. Solo GET, al ritmo de siempre, nada que requiera token.

## Lo que ya sabemos que NO es hallazgo

- Que Google no vea las fichas: un snippet muestra la descripción, así que Google renderiza. No escribir "no aparecen en Google" sin medirlo.
- Las cifras de prensa (500.000 pacientes, crecimiento de 65%) son declaraciones de la empresa, no datos de auditoría.
- El filtro de precio "hasta $41.358.115" salió de un snippet en caché. No usarlo salvo que se verifique en vivo.
- La errata "22.09.2020z" en la resolución ISP del footer es mucho, una línea menor.
- El hash de assets distinto entre home y categoría (`brand-logo-2.2syn7p_3v7ixz.png` y `brand-logo-2.ad5d8d8d.png`) probablemente es caché de la herramienta. Solo reportar si se reproduce con curl.
- No tener WhatsApp no es hallazgo por sí solo; lo es solo si se conecta con la hipótesis 6.
- Nada sobre la calidad o exactitud del contenido médico de las fichas o del blog. No es nuestro rol ni podemos verificarlo.

---

## Aviso original

No hay aviso. Lead directo de Julio.
