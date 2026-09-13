#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
claude --dangerously-skip-permissions "Lee CLAUDE.md, BRIEF-DEMO.md, AUDITORIA.md y AUDITORIA-P2.md. Construye el comparador que describe BRIEF-DEMO.md en la carpeta demo/ de este repo. Verifica el build, haz commit en la rama demo, push y abre un PR. Al terminar imprime los pasos que me tocan en Vercel y Cloudflare. No me preguntes nada."
