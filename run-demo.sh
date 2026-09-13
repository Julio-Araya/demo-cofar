#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
claude --dangerously-smissions "Lee CLAUDE.md, BRIEF-DEMO.md, AUDITORIA.md y AUDITORIA-P2.md. Construye el comparador que describe BRIEF-DEMO.md en la carpeta demo/ de este repo: Vite + React estatico, datos congelados desde evidencia/, sin ninguna llamada en vivo a cofar.cl ni services.cofar.cl, con noindex. Verifica el build localmente, corre la lista de verificacion del BRIEF, haz commit en la rama demo, push y abre un PR aparte. Al terminar imprime los pasos exactos que me tocan a mi en Vercel y en Cloudflare. No me preguntes nada; lo que no se pueda hacer va anotado en el PR."
