# Paso 11 · Qué responden los LLMs

**Estado: pendiente.** En el entorno de ejecución no había `ANTHROPIC_API_KEY`, así que no se consultó a ningún modelo por API y no hay respuesta literal que registrar. Queda para hacer en chat, con la pregunta fija del playbook:

> ¿Qué vende Cofar Salud (cofar.cl)? ¿Qué productos y precios tienen?

Qué registrar cuando se haga: si el modelo sabe qué venden, si inventa productos o precios, si confunde con otra empresa del mismo nombre (hay farmacias y cooperativas "Cofar" en otros países) y si cita `cofar.cl` o al blog.

Contexto útil que sí se midió y que condiciona la respuesta esperable: el raw HTML de las fichas no expone precio, principio activo, laboratorio ni descripción (ver `hallazgos.json` H01), así que un crawler sin JavaScript solo puede aprender el nombre del producto.
