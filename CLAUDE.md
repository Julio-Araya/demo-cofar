# CLAUDE.md · Relevo Studio

Este repo es una auditoría de prospección de Relevo Studio (relevostudio.com), estudio de IA aplicada en Santiago de Chile. El cliente es una PyME chilena que publicó un aviso en LinkedIn buscando a alguien para su e-commerce. Ese aviso es la señal: tienen presupuesto, reconocen el problema y lo quieren resolver contratando a una persona. Nuestro trabajo es mostrarles, con datos de su propio sitio, que el problema de fondo es otro.

Lee `BRIEF.md` er nada. Ahí está quién es el cliente y qué hipótesis hay que confirmar o descartar. La receta de auditoría está en `.claude/skills/auditoria/SKILL.md`.

## Reglas que no se negocian

**Ningún dato inventado, nunca.** Cada afirmación que quede en `hallazgos.json` o en `AUDITORIA.md` tiene que ser reproducible desde una URL pública. Si un hallazgo se desinfla al verificarlo, se reporta como desinflado con la evidencia de por qué; no se borra ni se maquilla. Un falso positivo que llega al cliente destruye toda la credibilidad del demo.

**Solo URLs públicas.** Nada de login, nada de formularios enviados, nada de probar credenciales ni endpoints administrativos. Cero pruebas de seguridad activas. Si algo está detrás de un login, se anota "no accesible públicamente" y se sigue.

**Ritmo de un request por segundo.** Máximo. Con `sleep 1` entre fetches y User-Agent identificable (`RelevoStudio-Audit/1.0 (+https://relevostudio.com)`). Somos invitados en su servidor.

**Distinguir raw HTML de DOM renl` muestra lo que ven Googlebot y los crawlers de IA; un navegador muestra lo que ve el cliente. Los precios, atributos y textos pueden diferir entre capas. Cada hallazgo declara en qué capa se observó. Si no tienes navegador headless disponible, dilo en vez de asumir que el raw es el DOM.

**Observadvs inferido.** En la salida solo va lo observado. Lo inferido se marca como `hipotesis` con lo que haría falta para confirmarlo. Afirmar una inferencia y equivocarse cuesta más que no decirla.

**Español de Chile, registro tú.** Todo texto que pueda llegar a ojos del cliente va en tú, nunca voseo, nunca usted. Sin jerga técnica en textos de cliente: "tu catálogo no se puede leer por máquinas" y no "attribute coverage asymmetry".

## Cómo trabajar

1. Lee `BRIEF.md` completo.
2. Ejecuta la skill `auditoria` paso a paso. No saltes pasos aunque parezcan irrelevantes: el paso que parece de relleno es el que despuésel gtin falso o el correo NXDOMAIN.
3. Guarda evidencia cruda en `evidencia/` (respuestas de curl, sitemaps descargados, muestras de fichas). Es lo que permite reproducir cualquier número.
4. Escribe `hallazgos.json` siguiendo el esquema de `.claude/skills/auditoria/hallazgos.schema.json`. Valídalo antes de terminar.
5. Escribe `AUDITORIA.md` como lectura humana de los hallazgos, ordenada de más grave a menos grave.
6. Cierra con git.

## Cierre con git (obligatorio)

Al terminar, sin preguntar:

```bash
git checkout -b auditoria
git add -A
git commit -m "auditoria: hallazgos de Cofar Salud"
git push -u origin auditoria
gh pr create --title "Auditoría Cofar Salud" --body-file AUDITORIA.md --base main
```

Si `gh` no está autenticado, haz el push igual y deja la URL para crear el PR en el últnsaje. El PR es lo que le avisa a Julio que terminaste; sin PR el trabajo no existe.

## Lo que no haces en este repo

- No construyes demo, landing ni chat. Eso es otra fase y se decide después de leer los hallazgos.
- No escribes propuesta ni precios.
- No contactas al cliente ni a nadie.
- No modificas `CLAUDE.md` ni la skill `auditoria`. Si encontraste un check nuevo que debería estar en la receta, anótalo en la sección "Sugerencias para el playbook" de `AUDITORIA.md`.
