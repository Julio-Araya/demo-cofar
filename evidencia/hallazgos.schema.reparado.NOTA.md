# Copia reparada del esquema

`.claude/skills/auditoria/hallazgos.schema.json` no es JSON válido (regla del repo: no se modifica). Esta copia aplica exactamente cuatro arreglos de sintaxis y nada más:

1. Línea 3: `"tilazgos.json · Relevo Studio"` -> `"title": "hallazgos.json · Relevo Studio"`.
2. Línea 25: falta la comilla inicial en `cobertura_precio_jsonld_pct` dentro de `required`.
3. Falta la llave de cierre del bloque `resumen.properties` antes de `cobertura_atributos`.
4. El enum de `hipotesis_brief[].estado` dice `"sinflada"`; SKILL.md y el CLAUDE.md dicen "desinflada".

`hallazgos.json` (pasada 1) y `hallazgos-p2.json` (pasada 2) se validaron contra esta copia. Generada el 2026-09-12 en la pasada 2.
