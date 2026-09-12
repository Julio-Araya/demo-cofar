#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
claude --dangerously-skip-permissions "Lee CLAUDE.md y BRIEF.md. Ejecuta la skill auditoria completa, paso a paso, sin saltar ninguno. Al terminar, valida hallazgos.json contra el esquema, escribe AUDITORIA.md y cierra con git como dice Cmd: rama auditoria, push y PR. No me preguntes nada; si algo no se puede verificar, anotalo en no_verificado y sigue."
