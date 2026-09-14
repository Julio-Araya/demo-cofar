import { useEffect, useMemo, useRef, useState } from 'react';
import data from './data/fichas.json';

/* ------------------------------------------------------------------ */
/* utilidades                                                          */
/* ------------------------------------------------------------------ */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const ESTADOS = {
  presente: { ico: '✓', txt: 'presente' },
  ausente: { ico: '✕', txt: 'ausente' },
  degradado: { ico: '!', txt: 'degradado' },
  no_aplica: { ico: '–', txt: 'no aplica' },
};

function Estado({ estado }) {
  const e = ESTADOS[estado] || ESTADOS.no_aplica;
  return (
    <span className={`estado ${estado}`}>
      <span className="ico" aria-hidden="true">
        {e.ico}
      </span>
      {e.txt}
    </span>
  );
}

function Fila({ label, campo }) {
  const vacio = campo.valor == null || campo.valor === '';
  const texto = vacio
    ? campo.estado === 'no_aplica'
      ? 'No aplica'
      : 'No está'
    : String(campo.valor);
  return (
    <li>
      <span className="lbl">{label}</span>
      <Estado estado={campo.estado} />
      <span className={`val${vacio ? ' faded' : ''}`}>{texto}</span>
      {campo.nota ? <span className="nota">{campo.nota}</span> : null}
    </li>
  );
}

function Score({ campos }) {
  const estados = Object.values(campos).map((c) => c.estado);
  return (
    <div className="score" aria-hidden="true">
      {estados.map((e, i) => (
        <i key={i} className={e} />
      ))}
    </div>
  );
}

function Mirada({ n, titulo, mirada, labels, dark }) {
  const campos = mirada.campos;
  const total = Object.keys(campos).length;
  const ok = Object.values(campos).filter((c) => c.estado === 'presente').length;
  return (
    <article className={`mirada${dark ? ' dark' : ''}`}>
      <div className="head">
        <div className="n">
          Mirada {n} · {ok} de {total} presentes
        </div>
        <h4>{titulo}</h4>
        <div className="capa">{mirada.capa}</div>
        <Score campos={campos} />
      </div>
      <ul>
        {Object.entries(labels).map(([k, label]) =>
          campos[k] ? <Fila key={k} label={label} campo={campos[k]} /> : null
        )}
      </ul>
      <div className="fuente">
        <span className="mono">
          {mirada.fuente}
          {mirada.fuente_dom ? ` · ${mirada.fuente_dom}` : ''}
        </span>
      </div>
    </article>
  );
}

const LABELS = {
  paciente: {
    nombre: 'Nombre',
    precio_normal: 'Precio normal',
    precio_oferta: 'Precio oferta',
    laboratorio: 'Laboratorio',
    principio_activo: 'Principio activo',
    concentracion: 'Concentración',
    forma_contenido: 'Forma y contenido',
    condicion_venta: 'Condición de venta',
    refrigeracion: 'Conservación',
    descripcion: 'Descripción',
    imagen: 'Imagen',
    compra: 'Compra',
  },
  bot: {
    titulo: 'Etiqueta <title>',
    meta_description: 'Meta description',
    canonical: 'Canonical',
    precio: 'Precio',
    laboratorio: 'Laboratorio',
    principio_activo: 'Principio activo',
    descripcion: 'Descripción',
    imagen: 'Imagen de producto',
    open_graph: 'Open Graph',
    json_ld: 'JSON-LD',
    payload_next: 'Payload de Next.js',
  },
  jsonld: {
    name: 'name',
    sku: 'sku',
    brand: 'brand.name',
    description: 'description',
    image: 'image',
    category: 'category',
    price: 'offers.price',
    availability: 'offers.availability',
    gtin: 'gtin',
    laboratorio: 'Laboratorio',
    principio_activo: 'Principio activo',
    condicion_venta: 'Condición de venta',
    refrigeracion: 'Conservación',
  },
  api: {
    nombre: 'Nombre',
    precio_normal: 'Precio normal',
    precio_oferta: 'Precio oferta',
    laboratorio: 'Laboratorio / marca',
    principio_activo: 'Principio activo',
    concentracion: 'Concentración',
    forma_contenido: 'Forma y contenido',
    condicion_venta: 'Condición de venta',
    refrigeracion: 'Conservación',
    disponibilidad: 'Disponibilidad',
    descripcion: 'Descripción',
    imagen: 'Imagen',
    gtin: 'GTIN',
  },
};

/* ------------------------------------------------------------------ */
/* código con resaltado mínimo                                         */
/* ------------------------------------------------------------------ */
const MALOS = ['"Marca no disponible"', '"Descripcion no disponible"', '"availability": "InStock"'];
const BUENOS = ['"https://schema.org/InStock"', '"https://schema.org/OutOfStock"', '"https://schema.org/ListPrice"', '"https://schema.org/SalePrice"', '"additionalProperty"'];

function resaltar(json) {
  const partes = [];
  const re = new RegExp(
    [...MALOS, ...BUENOS].map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
    'g'
  );
  let last = 0;
  let m;
  while ((m = re.exec(json))) {
    partes.push(json.slice(last, m.index));
    const cls = MALOS.includes(m[0]) ? 'hl-bad' : 'hl-good';
    partes.push(
      <span key={m.index} className={cls}>
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
  }
  partes.push(json.slice(last));
  return partes;
}

function Codigo({ titulo, capa, obj, mejor }) {
  const [ok, setOk] = useState(false);
  const texto = useMemo(() => JSON.stringify(obj, null, 2), [obj]);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setOk(true);
    setTimeout(() => setOk(false), 1600);
  };
  return (
    <div className={`codigo${mejor ? ' mejor' : ''}`}>
      <div className="bar">
        <div>
          <h4>{titulo}</h4>
          <div className="capa">{capa}</div>
        </div>
        <button className={`copiar${ok ? ' ok' : ''}`} onClick={copiar} type="button">
          {ok ? 'Copiado ✓' : 'Copiar'}
        </button>
      </div>
      <pre>
        <code>{resaltar(texto)}</code>
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* página                                                              */
/* ------------------------------------------------------------------ */
export default function App() {
  useReveal();
  const { contexto, fichas, fecha_captura: fecha } = data;
  const [sku, setSku] = useState(fichas[0].sku);
  const ficha = fichas.find((f) => f.sku === sku);
  const compRef = useRef(null);

  const elegir = (s) => {
    setSku(s);
    if (compRef.current && window.innerWidth < 720) {
      compRef.current.scrollIntoView({ block: 'start' });
    }
  };

  const a = contexto.asistente;
  const nombreCorto = (f) => f.nombre.split(' ').slice(0, 2).join(' ');

  return (
    <>
      <header className="site-header">
        <div className="container">
          <a className="wordmark" href="https://relevostudio.com" rel="noreferrer">
            <span className="wm-main">
              relev
              <span className="wm-oo" aria-hidden="true">
                <i />
                <i />
              </span>
              <span className="sr-only">o</span>
            </span>
            <span className="wm-sub">studio</span>
          </a>
          <div className="header-tag">
            Cofar Salud · cuatro miradas a la misma ficha · datos del {fecha}
          </div>
        </div>
      </header>

      <main>
        {/* 1 · encabezado */}
        <section className="hero container">
          <div className="overline reveal">Auditoría de legibilidad · cofar.cl · capturado el {fecha}</div>
          <h1 className="reveal">
            El catálogo está completo. <span className="accent">La ficha no lo muestra.</span>
          </h1>
          <p className="body sub reveal">
            Tu backend tiene principio activo, laboratorio, condición de venta, refrigeración y precio para casi
            todos los medicamentos. El paciente lo ve en pantalla. Google sin render, ChatGPT y una vista previa de
            WhatsApp reciben solo un título y una frase.
          </p>

          {/* 2 · tres cifras */}
          <div className="metrics">
            {contexto.cifras.map((c, i) => (
              <div className="metric reveal" key={i}>
                <div className={`num ${i === 0 ? 'teal' : 'coral'}`}>{c.valor}</div>
                <div className="ttl">{c.titulo}</div>
                <div className="det">{c.detalle}</div>
                <span className="mono">{c.fuente}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 3 · comparador */}
        <section className="section container" id="comparador" ref={compRef}>
          <div className="overline reveal">El comparador</div>
          <h2 className="reveal">Seis fichas reales, cuatro maneras de leerlas.</h2>
          <p className="body lead reveal">
            Elige un producto. La primera columna es lo que ve una persona en el navegador. Las otras tres son lo
            que recibe una máquina: un bot sin JavaScript, el JSON-LD que hoy inyecta tu sitio y el mismo bloque
            generado desde tu propia API, sin agregar ningún dato nuevo.
          </p>

          <div className="pills reveal" role="tablist" aria-label="Productos">
            {fichas.map((f) => (
              <button
                key={f.sku}
                type="button"
                role="tab"
                className="pill"
                aria-pressed={f.sku === sku}
                aria-selected={f.sku === sku}
                onClick={() => elegir(f.sku)}
              >
                {nombreCorto(f)}
                <span className="tag">{f.grupo.split(' · ')[0]}</span>
              </button>
            ))}
          </div>

          <div className="swap" key={ficha.sku}>
            <div className="producto">
              <div>
                <h3>{ficha.nombre}</h3>
                <p className="why">{ficha.por_que}</p>
              </div>
              <div className="sku">
                SKU {ficha.sku} · {ficha.grupo}
              </div>
            </div>

            <div className="leyenda" aria-label="Leyenda">
              <Estado estado="presente" /> el dato está
              <Estado estado="ausente" /> no está
              <Estado estado="degradado" /> está, pero mal o incompleto
              <Estado estado="no_aplica" /> no corresponde a este producto
            </div>

            <div className="miradas">
              <Mirada n="1" titulo="Lo que ve el paciente" mirada={ficha.miradas.paciente} labels={LABELS.paciente} />
              <Mirada n="2" titulo="Lo que ve un bot sin JavaScript" mirada={ficha.miradas.bot} labels={LABELS.bot} />
              <Mirada n="3" titulo="Lo que dice el JSON-LD actual" mirada={ficha.miradas.jsonld} labels={LABELS.jsonld} />
              <Mirada n="4" titulo="Lo que diría desde tu propia API" mirada={ficha.miradas.api} labels={LABELS.api} dark />
            </div>
          </div>
        </section>

        {/* 4 · asistente */}
        <section className="section container">
          <div className="panel reveal">
            <div className="overline">Qué contesta un asistente hoy</div>
            <h2>Encuentra tu sitio, describe bien el producto y se equivoca en el precio.</h2>
            <p className="body lead">
              Observación puntual del {a.fecha}, hecha una sola vez desde el chat. No es una medición ni una
              posición: es lo que salió ese día.
            </p>

            <div className="asistente">
              <div className="caja">
                <h4>Consulta a ChatGPT · {a.producto}</h4>
                <ul>
                  {a.resumen_brief.map((t, i) => (
                    <li key={i} className={i === a.resumen_brief.length - 1 ? 'mal' : ''}>
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="precios">
                  <div className="precio mal">
                    <div className="k">Precio que dio el asistente</div>
                    <div className="v">{a.api_precio_normal}</div>
                  </div>
                  <div className="precio bien">
                    <div className="k">Oferta en la API ese día</div>
                    <div className="v">{a.api_precio_oferta}</div>
                  </div>
                </div>
                <div className="aviso">
                  {a.oferta_activa_en_volcado
                    ? `En el volcado del ${a.fecha} la oferta sigue activa: normal ${a.api_precio_normal}, oferta ${a.api_precio_oferta}.`
                    : 'En el volcado la oferta ya no está activa.'}{' '}
                  {a.transcripcion_literal
                    ? 'Transcripción literal más abajo.'
                    : `Resumen tomado de ${a.fuente_resumen}. La transcripción literal no está en la carpeta de evidencia.`}
                </div>
              </div>

              <div className="caja">
                <h4>Tres búsquedas web del mismo día</h4>
                {a.busquedas_web.consultas.map((c, i) => (
                  <div className="consulta" key={i}>
                    <code>{c.consulta}</code>
                    <div className="res">
                      Cofar: <b className={/aparece en/.test(c.resultado) ? 'ok' : ''}>{c.resultado}</b>
                    </div>
                  </div>
                ))}
                <div className="aviso">
                  Índice orientado a EE. UU., una consulta por producto. En las dos donde Cofar aparece, el resumen
                  no usó su precio. Fuente: {a.busquedas_web.fuente}.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5 · el bloque lado a lado */}
        <section className="section container">
          <div className="overline reveal">El bloque, lado a lado</div>
          <h2 className="reveal">El JSON-LD que tienes y el que saldría de tu API.</h2>
          <p className="body lead reveal">
            Mismo producto ({ficha.nombre}). A la izquierda, el bloque que tu sitio inyecta hoy con JavaScript. A
            la derecha, uno construido solo con los campos que ya devuelve tu API. Nada se inventa: donde no hay
            descripción ni GTIN, el campo se omite.
          </p>
          <div className="codigos reveal">
            <Codigo
              titulo="Actual · lo que inyecta el sitio"
              capa={`${ficha.miradas.jsonld.fuente_dom} · solo en DOM`}
              obj={ficha.miradas.jsonld.bloque}
            />
            <Codigo
              titulo="Generado · desde tu propia API"
              capa={`${ficha.miradas.api.fuente} · construido en build`}
              obj={ficha.miradas.api.bloque}
              mejor
            />
          </div>
          <div className="cambios reveal">
            <div className="cambio">
              <b>Marca real</b>
              {ficha.miradas.api.campos.laboratorio.valor
                ? `brand.name pasa de "Marca no disponible" a "${ficha.miradas.api.campos.laboratorio.valor}", que ya está en laboratory.label.`
                : 'La API tampoco tiene laboratorio para este producto; el campo se omite.'}
            </div>
            <div className="cambio">
              <b>Disponibilidad real</b>
              availability deja de ser un texto fijo y sale de la bandera de stock: {ficha.miradas.api.campos.disponibilidad.nota}.
            </div>
            <div className="cambio">
              <b>Precio normal y oferta</b>
              {ficha.miradas.api.campos.precio_oferta.valor
                ? `ListPrice ${ficha.miradas.api.campos.precio_normal.valor} y SalePrice ${ficha.miradas.api.campos.precio_oferta.valor}, en vez de un solo número.`
                : 'Sin oferta activa: un solo precio, igual que hoy.'}
            </div>
            <div className="cambio">
              <b>Atributos farmacéuticos</b>
              Principio activo, concentración, forma, condición de venta y almacenamiento como additionalProperty.
              Están en la API en el 94% al 100% de los medicamentos.
            </div>
          </div>
        </section>

        {/* 6 · campañas */}
        <section className="section container">
          <div className="overline reveal">Qué falta para campañas</div>
          <h2 className="reveal">Las herramientas están cargadas. El dato de producto, no.</h2>
          <div className="campanas">
            <div className="tabla-wrap reveal">
              <table>
                <thead>
                  <tr>
                    <th>Pieza</th>
                    <th>Estado observado</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {contexto.campanas.faltantes.map((f, i) => (
                    <tr key={i}>
                      <td>
                        <b>{f.pieza}</b>
                      </td>
                      <td>
                        <Estado estado="ausente" /> <span style={{ display: 'block', marginTop: 6 }}>{f.estado}</span>
                      </td>
                      <td>
                        {f.detalle}
                        <span className="mono">{f.fuente}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="lista reveal">
              <h4>Lo que sí está cargado</h4>
              <ul>
                {contexto.campanas.herramientas.map((h, i) => (
                  <li key={i}>
                    <span className="ico" aria-hidden="true">
                      ✓
                    </span>
                    <span>
                      {h.nombre}
                      <small>{h.donde}</small>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="punto">
                Píxel, etiquetas y Merchant ID esperan un feed o un JSON-LD con marca, precio y disponibilidad. Hoy
                no hay ninguno de los dos en el servidor.
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 7 · pie */}
      <footer className="site-footer">
        <div className="container">
          <div>
            <p className="fecha">Datos capturados el {fecha} desde fuentes públicas de cofar.cl y su API pública.</p>
            <p>
              Esta página no consulta nada en vivo: todo sale de un archivo generado desde la evidencia de la
              auditoría. Los precios, atributos y bloques mostrados son los de ese día y pueden haber cambiado.
            </p>
            <p>
              Relevo Studio no tiene relación comercial con Cofar Salud. Los nombres de producto y datos son
              públicos; no se usa el logo ni la identidad visual de Cofar. Página fuera de índices (noindex).
            </p>
          </div>
          <a className="wordmark" href="https://relevostudio.com" rel="noreferrer">
            <span className="wm-main">
              relev
              <span className="wm-oo" aria-hidden="true">
                <i />
                <i />
              </span>
              <span className="sr-only">o</span>
            </span>
            <span className="wm-sub">studio</span>
          </a>
        </div>
      </footer>
    </>
  );
}
