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

const FUENTE = 'Fuente: auditoría del 12 de septiembre de 2026';

function Fuente({ detalle }) {
  return (
    <p className="fuente-linea" title={detalle}>
      {FUENTE}
    </p>
  );
}

const ESTADOS = {
  presente: 'está',
  ausente: 'no está',
  degradado: 'está, pero mal',
  no_aplica: 'no aplica',
};

function Estado({ estado }) {
  return (
    <span className={`estado ${estado}`}>
      <i aria-hidden="true" />
      {ESTADOS[estado] || ESTADOS.no_aplica}
    </span>
  );
}

function Fila({ label, campo }) {
  const vacio = campo.valor == null || campo.valor === '';
  const texto = vacio ? (campo.estado === 'no_aplica' ? 'No aplica a este producto' : 'No está') : String(campo.valor);
  return (
    <li title={campo.fuente}>
      <span className="lbl">{label}</span>
      <Estado estado={campo.estado} />
      <span className={`val${vacio ? ' faded' : ''}`}>{texto}</span>
      {campo.nota ? <span className="nota">{campo.nota}</span> : null}
    </li>
  );
}

function Columna({ n, titulo, bajada, mirada, labels, dark }) {
  const campos = mirada.campos;
  const total = Object.keys(campos).length;
  const ok = Object.values(campos).filter((c) => c.estado === 'presente').length;
  return (
    <article className={`mirada${dark ? ' dark' : ''}`} title={`${mirada.capa} · ${mirada.fuente}`}>
      <div className="head">
        <div className="n">
          {n} · {ok} de {total} campos
        </div>
        <h4>{titulo}</h4>
        <div className="capa">{bajada}</div>
      </div>
      <ul>
        {Object.entries(labels).map(([k, label]) =>
          campos[k] ? <Fila key={k} label={label} campo={campos[k]} /> : null
        )}
      </ul>
    </article>
  );
}

/* Etiquetas en lenguaje de la persona; el nombre técnico va entre paréntesis. */
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
    titulo: 'Título de la página',
    meta_description: 'Frase de resumen (meta description)',
    canonical: 'Dirección de la ficha',
    precio: 'Precio',
    laboratorio: 'Laboratorio',
    principio_activo: 'Principio activo',
    descripcion: 'Descripción',
    imagen: 'Imagen de producto',
    open_graph: 'Tarjeta de vista previa (Open Graph)',
    json_ld: 'Ficha para máquinas (JSON-LD)',
    payload_next: 'Datos precargados en la página',
  },
  jsonld: {
    name: 'Nombre',
    sku: 'Código interno (sku)',
    brand: 'Marca',
    description: 'Descripción',
    image: 'Imagen',
    category: 'Categoría',
    price: 'Precio',
    availability: 'Disponibilidad',
    gtin: 'Código de barras (gtin)',
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
    gtin: 'Código de barras (gtin)',
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

const clp = (n) => (n == null ? null : '$' + Number(n).toLocaleString('es-CL'));
const sinComillas = (s) => (typeof s === 'string' ? s.replace(/^"|"$/g, '') : s);

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

  /* Cifras de contexto. Los valores 3.024 y "0 de 60" vienen del JSON generado.
     "0 de 28" sale de hallazgos.json · cobertura_atributos · VIH (n = 28, descripcion_40+ = 0.0). */
  const cifras = [
    {
      valor: contexto.cifras[0].valor,
      titulo: 'productos en la base de Cofar',
      bajada: 'Principio activo, laboratorio, forma, receta y refrigeración están cargados en casi todos los medicamentos.',
      fuente: contexto.cifras[0].fuente + ' · ' + contexto.cifras[0].detalle,
      color: 'teal',
    },
    {
      valor: contexto.cifras[1].valor,
      titulo: 'fichas que le entregan esos datos a una máquina',
      bajada: 'Revisamos 60 fichas. Ninguna trae precio, laboratorio ni descripción hasta que un navegador los va a buscar aparte.',
      fuente: contexto.cifras[1].fuente + ' · ' + contexto.cifras[1].detalle,
      color: 'coral',
    },
    {
      valor: '0 de 28',
      titulo: 'fichas de VIH que tienen descripción escrita',
      bajada: 'En dermocosmética la tienen 7 de cada 10. Lo que Cofar vende como especialidad es lo que menos explica.',
      fuente: 'hallazgos.json · cobertura_atributos · VIH n=28, descripción 0,0% · Dermocosméticos 69,3% · ' + contexto.cifras[2].detalle,
      color: 'coral',
    },
  ];

  /* Tabla de la sección "lado a lado": valores reales del SKU elegido. */
  const jl = ficha.miradas.jsonld;
  const ap = ficha.miradas.api;
  const marcaHoy = jl.campos.brand.estado === 'presente' ? sinComillas(jl.campos.brand.valor) : jl.campos.brand.estado === 'degradado' && /Marca no disponible/.test(jl.campos.brand.valor) ? 'Marca no disponible' : 'Un objeto en vez de un nombre';
  const marcaApi = ap.campos.laboratorio.valor || 'Tampoco está en la API';
  const precioHoy = clp(jl.bloque.offers.price);
  const precioApi = ap.campos.precio_oferta.valor
    ? `${ap.campos.precio_normal.valor} normal y ${ap.campos.precio_oferta.valor} oferta`
    : ap.campos.precio_normal.valor;
  const dispApi = /InStock/.test(ap.campos.disponibilidad.valor) ? 'La real, según tu API: en stock' : 'La real, según tu API: sin stock';
  const diferencias = [
    { campo: 'Marca', hoy: marcaHoy, api: marcaApi, tec: 'brand.name', igual: marcaHoy === marcaApi, nota: jl.campos.brand.nota },
    { campo: 'Disponibilidad', hoy: 'En stock, siempre', api: dispApi, tec: 'offers.availability', igual: false, nota: jl.campos.availability.nota + ' ' + (ap.campos.disponibilidad.nota || '') },
    { campo: 'Precio', hoy: precioHoy, api: precioApi, tec: 'offers.price', igual: precioHoy === precioApi, nota: ap.campos.precio_oferta.nota || jl.campos.price.nota || '' },
    { campo: 'Código de barras', hoy: 'No está', api: 'No está', tec: 'gtin', igual: true, nota: ap.campos.gtin.nota },
  ];
  const nDif = diferencias.filter((d) => !d.igual).length;
  const tituloDif = nDif === 3 ? 'Tres campos separan uno del otro.' : nDif === 2 ? 'Dos campos separan uno del otro.' : `${nDif} campos separan uno del otro.`;

  const piezas = [
    { para: 'La tarjeta de vista previa', sirve: 'Que un link compartido en WhatsApp o redes muestre foto y precio.', tec: 'Open Graph / Twitter Card' },
    { para: 'El archivo de catálogo', sirve: 'Que Google y Meta puedan armar anuncios con tus productos.', tec: 'feed de productos' },
    { para: 'La ficha para máquinas, desde el servidor', sirve: 'Que te lean sin tener que renderizar.', tec: 'JSON-LD Product en el HTML del servidor' },
    { para: 'Los datos de la empresa', sirve: 'Que Google sepa quién eres, no solo qué vendes.', tec: 'JSON-LD Organization' },
    { para: 'El código de barras', sirve: 'Identificar el producto en cualquier plataforma.', tec: 'GTIN' },
  ].map((p, i) => ({ ...p, ...contexto.campanas.faltantes[i] }));

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
          <div className="header-tag">Cofar Salud · cuatro miradas a la misma ficha · datos del {fecha}</div>
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
            Cofar tiene guardado el principio activo, el laboratorio, el precio y si el remedio va refrigerado, para
            casi todo su catálogo. El paciente lo ve completo en pantalla. Un asistente de IA, o la vista previa de un
            link en WhatsApp, recibe solo el nombre del remedio y una frase.
          </p>

          {/* 2 · tres cifras */}
          <div className="metrics">
            {cifras.map((c, i) => (
              <div className="metric reveal" key={i} title={c.fuente}>
                <div className={`num ${c.color}`}>{c.valor}</div>
                <div className="ttl">{c.titulo}</div>
                <div className="det">{c.bajada}</div>
              </div>
            ))}
          </div>
          <Fuente detalle="hallazgos.json · cobertura_atributos, H01, H03 · evidencia/api/cobertura_atributos.txt · evidencia/fichas/analisis_fichas.txt" />
        </section>

        {/* 3 · comparador */}
        <section className="section container" id="comparador" ref={compRef}>
          <div className="overline reveal">El comparador</div>
          <h2 className="reveal">Seis fichas reales, cuatro lectores distintos.</h2>
          <p className="body lead reveal">
            Toda ficha de producto tiene dos versiones: la que lee la persona y una versión resumida, oculta en la
            página, escrita en un formato estándar que Google y los asistentes entienden. Estas cuatro columnas
            muestran qué recibe cada lector.
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
                Código {ficha.sku} · {ficha.grupo}
              </div>
            </div>

            <div className="leyenda" aria-label="Leyenda">
              <Estado estado="presente" />
              <Estado estado="ausente" />
              <Estado estado="degradado" />
              <Estado estado="no_aplica" />
            </div>

            <div className="miradas">
              <Columna
                n="1"
                titulo="Lo que ve el paciente"
                bajada="La ficha en pantalla, completa."
                mirada={ficha.miradas.paciente}
                labels={LABELS.paciente}
              />
              <Columna
                n="2"
                titulo="Lo que recibe una máquina que no renderiza"
                bajada="El nombre y una frase."
                mirada={ficha.miradas.bot}
                labels={LABELS.bot}
              />
              <Columna
                n="3"
                titulo="La ficha para máquinas que tienes hoy"
                bajada="Existe, pero la escribe el navegador y sale con la marca en blanco."
                mirada={ficha.miradas.jsonld}
                labels={LABELS.jsonld}
              />
              <Columna
                n="4"
                titulo="La misma ficha, llenada con tus datos"
                bajada="Misma estructura, con el laboratorio y la disponibilidad que ya están en tu API."
                mirada={ficha.miradas.api}
                labels={LABELS.api}
                dark
              />
            </div>
          </div>
          <Fuente detalle="Columna 1: evidencia/dom (Chrome headless). Columna 2: evidencia/fichas (curl sin JavaScript). Columna 3: evidencia/p2/jsonld_dom.json. Columna 4: evidencia/api/catalogo_completo.json, construido en build." />
        </section>

        {/* 4 · asistente */}
        <section className="section container">
          <div className="panel reveal">
            <div className="overline">Qué contesta un asistente hoy</div>
            <h2>Encuentra tu sitio, describe bien el producto y se equivoca en el precio.</h2>
            <p className="body lead">
              Observación puntual del {a.fecha}, hecha una sola vez desde el chat. No es una medición ni una posición:
              es lo que salió ese día.
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
                    <div className="k">Oferta en tu API ese día</div>
                    <div className="v">{a.api_precio_oferta}</div>
                  </div>
                </div>
                <div className="aviso">
                  {a.oferta_activa_en_volcado
                    ? `Ese día la oferta estaba activa: ${a.api_precio_normal} normal, ${a.api_precio_oferta} oferta.`
                    : 'En la captura de ese día la oferta ya no estaba activa.'}{' '}
                  {a.transcripcion_literal
                    ? 'Transcripción literal más abajo.'
                    : 'Este bloque resume lo observado; la transcripción literal no está en la evidencia.'}
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
                  Buscador orientado a EE. UU., una consulta por producto. En las dos donde Cofar aparece, el resumen
                  no usó su precio.
                </div>
              </div>
            </div>
            <Fuente detalle="BRIEF-DEMO.md §4 (resumen de la consulta a ChatGPT) · evidencia/p2/busquedas_web.md · evidencia/api/catalogo_completo.json" />
          </div>
        </section>

        {/* 5 · el bloque lado a lado */}
        <section className="section container">
          <div className="overline reveal">La ficha para máquinas, lado a lado</div>
          <h2 className="reveal">{tituloDif}</h2>
          <p className="body lead reveal">
            Mismo producto, misma estructura. Lo único que cambia es que el segundo lee los campos que tu API ya
            devuelve.
          </p>

          <div className="tabla-wrap dif swap" key={`dif-${ficha.sku}`}>
            <table>
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>La ficha que tienes hoy</th>
                  <th>Llenada con tus datos</th>
                </tr>
              </thead>
              <tbody>
                {diferencias.map((d) => (
                  <tr key={d.campo} className={d.igual ? 'igual' : ''} title={d.nota}>
                    <td>
                      <b>{d.campo}</b>
                      <span className="tec">{d.tec}</span>
                    </td>
                    <td className={d.igual ? '' : 'hoy'}>{d.hoy}</td>
                    <td className={d.igual ? '' : 'api'}>
                      {d.api}
                      {d.igual ? <span className="tec">igual en los dos</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="detalle reveal">
            <summary>Ver el bloque completo</summary>
            <div className="codigos">
              <Codigo titulo="La ficha que tienes hoy" capa="Tal como la escribe el navegador en tu sitio" obj={jl.bloque} />
              <Codigo titulo="Llenada con tus datos" capa="Construida solo con lo que devuelve tu API" obj={ap.bloque} mejor />
            </div>
          </details>
          <Fuente detalle="evidencia/p2/jsonld_dom.json (bloque actual) · evidencia/api/catalogo_completo.json (bloque generado en build)" />
        </section>

        {/* 6 · campañas */}
        <section className="section container">
          <div className="overline reveal">Qué falta para campañas</div>
          <h2 className="reveal">Las herramientas están cargadas. El dato de producto, no.</h2>
          <div className="campanas">
            <div className="lista reveal">
              <h4>Lo que sí está cargado</h4>
              <ul>
                {contexto.campanas.herramientas.map((h, i) => (
                  <li key={i} title={h.donde}>
                    <span className="ico" aria-hidden="true">
                      ✓
                    </span>
                    <span>{h.nombre}</span>
                  </li>
                ))}
              </ul>
              <div className="punto">
                Píxel, etiquetas y Merchant ID esperan un catálogo con marca, precio y disponibilidad. Hoy no existe
                ninguno en el servidor.
              </div>
            </div>
            <div className="tabla-wrap reveal">
              <table>
                <thead>
                  <tr>
                    <th>Lo que falta</th>
                    <th>Para qué sirve</th>
                    <th>Hoy</th>
                  </tr>
                </thead>
                <tbody>
                  {piezas.map((p, i) => (
                    <tr key={i} title={`${p.fuente}${p.cifra ? ' · ' + p.cifra : ''}`}>
                      <td>
                        <b>{p.para}</b>
                        <span className="tec">{p.tec}</span>
                      </td>
                      <td>{p.sirve}</td>
                      <td>
                        <Estado estado="ausente" />
                        <span className="det">{p.detalle}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Fuente detalle="hallazgos-p2.json · H14, H15, H16 · evidencia/p2/senales_meta_google.md · evidencia/p2/feeds_log.txt" />
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
              Relevo Studio no tiene relación comercial con Cofar Salud. Los nombres de producto y datos son públicos;
              no se usa el logo ni la identidad visual de Cofar. Página fuera de índices (noindex).
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
