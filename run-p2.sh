#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
claude --dangerously-skip-permissions "Lee CLAUDE.md, BRIEF.md, BRIEF-P2.md y el AUDITORIA.md de la pasada 1. Ejecuta SOLO el alcance de BRIEF-P2.md: pasos 2, 10 y 11 del playbook mas el inventario de la API. No repitas lo ya medido. Escribe hallazgos-p2.json y AUDITORIA-Paz commit en la rama auditoria-p2, push y abre un PR aparte. No me preguntes nada; lo que no se pueda verificar va en no_verificado."
