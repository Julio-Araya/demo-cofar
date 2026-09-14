# demo · Cofar Salud · cuatro miradas a la misma ficha

Página estática (Vite + React) que muestra, para seis fichas reales de cofar.cl, lo que ve el paciente frente a lo que ven las máquinas. Descrita en `../BRIEF-DEMO.md`.

- **Cero llamadas en vivo.** Todo sale de `src/data/fichas.json`, generado desde `../evidencia/` (auditoría del 2026-09-12). La página no hace ningún request a `cofar.cl` ni a `services.cofar.cl`; no hay `<img>` ni enlaces a su infraestructura.
- **noindex.** `<meta name="robots" content="noindex,nofollow">`, `public/robots.txt` con `Disallow: /` y cabecera `X-Robots-Tag` en `vercel.json`.
- **Sin campos de promoción.** `scripts/build-data.mjs` copia la API por lista blanca y aborta si el JSON de salida contiene alguno de esos campos.

## Comandos

```bash
npm install
npm run data     # regenera src/data/fichas.json desde ../evidencia/ (sin red)
npm run dev      # desarrollo
npm run build    # dist/
npm run preview  # sirve dist/ en http://localhost:4173
```

`src/data/fichas.json` va commiteado para que el build en Vercel (Root Directory `demo`) no dependa de la carpeta `evidencia/`. Si cambia la evidencia, corre `npm run data` y commitea el JSON.

## Publicación

Vercel: proyecto `demo-cofar`, Root Directory `demo`, preset Vite, salida `dist`. Dominio `cofar.relevostudio.com` con el CNAME en Cloudflare en gris (DNS only).
