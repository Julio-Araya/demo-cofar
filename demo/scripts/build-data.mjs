#!/usr/bin/env node
/**
 * build-data.mjs · Relevo Studio · demo Cofar
 *
 * Lee `evidencia/` (auditoría del 2026-09-12) y escribe `src/data/fichas.json`.
 * No hace ningún request de red. Cada campo lleva `fuente` (archivo de evidencia)
 * y `estado` (presente | ausente | degradado | no_aplica).
 *
 * Reglas del BRIEF-DEMO que este script hace cumplir:
 *  - Solo seis SKUs.
 *  - Nada de `promoAvailable` / `promoName`: la API se copia por lista blanca.
 *  - Si un campo no está en la evidencia, se dice que no está.
 *
 * Uso:  node scripts/build-data.mjs   (desde demo/)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEMO = resolve(__dirname, '..');
const ROOT = resolve(DEMO, '..');
const EV = join(ROOT, 'evidencia');
const OUT = join(DEMO, 'src', 'data', 'fichas.json');
const FECHA_CAPTURA = '2026-09-12';

// ---------------------------------------------------------------------------
// Los seis SKUs (BRIEF-DEMO.md · "Los seis SKUs")
// ---------------------------------------------------------------------------
const SKUS = [
  {
    sku: '012522017',
    grupo: 'Diabetes · oferta activa',
    porQue: 'Tiene oferta activa en la API. Es el caso del precio que un asistente citó mal.',
  },
  { sku: '011000228', grupo: 'VIH', porQue: 'La categoría con 0% de descripción.' },
  {
    sku: '082560020',
    grupo: 'Oncológico',
    porQue: 'Categoría con 4% de descripción. Producto de $4.289.990.',
  },
  {
    sku: '052010003',
    grupo: 'Fertilidad',
    porQue: 'Alta especialidad, refrigerado. Gonal F apareció 9.º en una búsqueda del 2026-09-12.',
  },
  { sku: '012510044', grupo: 'Salud mental', porQue: 'Categoría con 12% de descripción.' },
  {
    sku: '015970047',
    grupo: 'Dermocosmética · control',
    porQue: 'Control: la categoría mejor descrita del catálogo (69%).',
  },
];

// ---------------------------------------------------------------------------
// utilidades
// ---------------------------------------------------------------------------
const rel = (p) => p.replace(ROOT + '/', '');
const readJSON = (p) => JSON.parse(readFileSync(p, 'utf8'));
const clp = (n) => (n == null ? null : '$' + Number(n).toLocaleString('es-CL'));

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
}

/** Texto visible en segmentos, imitando BeautifulSoup get_text(' | ', strip=True). */
function textSegments(html) {
  const sinScripts = html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const sinHead = sinScripts.replace(/<head\b[\s\S]*?<\/head>/i, '');
  return sinHead
    .split(/<[^>]+>/)
    .map((t) => decodeEntities(t).replace(/[ \t\r]+/g, ' ').trim())
    .filter(Boolean);
}

const campo = (valor, estado, fuente, nota) => {
  const c = { valor, estado, fuente };
  if (nota) c.nota = nota;
  return c;
};
const presente = (valor, fuente, nota) => campo(valor, 'presente', fuente, nota);
const ausente = (fuente, nota) => campo(null, 'ausente', fuente, nota);
const degradado = (valor, fuente, nota) => campo(valor, 'degradado', fuente, nota);
const noAplica = (fuente, nota) => campo(null, 'no_aplica', fuente, nota);

// ---------------------------------------------------------------------------
// fuentes
// ---------------------------------------------------------------------------
const catalogo = readJSON(join(EV, 'api', 'catalogo_completo.json'));
const porSku = Object.fromEntries(catalogo.map((p) => [p.sku, p]));
const jsonldDom = readJSON(join(EV, 'p2', 'jsonld_dom.json'));
const hallazgos = readJSON(join(ROOT, 'hallazgos.json'));
const hallazgosP2 = readJSON(join(ROOT, 'hallazgos-p2.json'));
const fichasDir = join(EV, 'fichas');
const fichasRaw = readdirSync(fichasDir).filter((f) => f.endsWith('.html'));

function rawFileFor(sku) {
  const f = fichasRaw.find((n) => n.startsWith(`product_${sku}_`));
  if (!f) throw new Error(`No hay ficha raw para ${sku} en evidencia/fichas/`);
  return join(fichasDir, f);
}

// ---------------------------------------------------------------------------
// 1 · Lo que ve el paciente (DOM, Chrome 153 headless)
// ---------------------------------------------------------------------------
function miradaPaciente(sku) {
  const file = join(EV, 'dom', `product_${sku}.html`);
  if (!existsSync(file)) throw new Error(`No hay DOM para ${sku}`);
  const src = rel(file);
  const html = readFileSync(file, 'utf8');
  const segs = textSegments(html);
  const idx = (pred) => segs.findIndex(pred);
  const after = (label) => {
    const i = idx((s) => s === label);
    return i >= 0 ? segs[i + 1] : null;
  };
  const startsWith = (label) => segs.find((s) => s.startsWith(label));

  // nombre: el segmento que precede a "SKU {sku}"
  const iSku = idx((s) => s === `SKU ${sku}`);
  const nombre = iSku > 0 ? segs[iSku - 1] : null;

  // precios
  let normal = after('precio normal:');
  let oferta = after('precio oferta:');
  if (!normal) normal = after('precio:');
  const precioRe = /^\$\d{1,3}(\.\d{3})*$/;
  normal = normal && precioRe.test(normal) ? normal : null;
  oferta = oferta && precioRe.test(oferta) ? oferta : null;

  // condición de venta (etiqueta visible junto al nombre)
  const CONDICIONES = [
    'Rec. Med. Simple',
    'Rec. Med. Retenida',
    'Rec. Med. Cheque',
    'Receta Cheque',
    'Venta directa',
    'Solo Compra Presencial',
  ];
  const condicion = segs.find((s) => CONDICIONES.includes(s)) || null;
  const condicionLarga = after('Condición de venta:');

  // principio activo + concentración
  const paHeader = startsWith('Principio Activo:');
  const paTabla = after('Principio activo:'); // "ABACAVIR  - 300 mgr"
  let principio = null;
  let concentracion = null;
  if (paTabla && paTabla.includes(' - ')) {
    [principio, concentracion] = paTabla.split(' - ').map((s) => s.replace(/\s+/g, ' ').trim());
  } else if (paHeader) {
    const v = paHeader.replace('Principio Activo:', '').replace(/\s+/g, ' ').trim();
    const m = v.match(/^(.*?)\s+(\d[\d.,]*\s*\S+)$/);
    if (m) {
      principio = m[1];
      concentracion = m[2];
    } else principio = v;
  }

  // contenido / forma
  const contenidoHeader = startsWith('Contenido:');
  const contenido = contenidoHeader
    ? contenidoHeader.replace('Contenido:', '').trim() || after('Contenido:')
    : after('Contenido:');

  // atributos (entre "Atributos:" y el primer "precio")
  const iAttr = idx((s) => s === 'Atributos:');
  let atributos = [];
  if (iAttr >= 0) {
    for (let i = iAttr + 1; i < segs.length; i++) {
      if (/^precio/i.test(segs[i])) break;
      atributos.push(segs[i]);
    }
  }
  const refrigerado = atributos.includes('Refrigerado');
  const almacenamiento = after('Condiciones de almacenamiento:');

  // laboratorio
  let laboratorio = after('Laboratorio:');
  let labNota;
  if (!laboratorio) {
    const iDesc = idx((s) => s === 'Descripción');
    const descTxt = iDesc >= 0 ? segs[iDesc + 1] : '';
    const m = descTxt && descTxt.match(/Laboratorio:\s*([^.\n]+)\./);
    if (m) {
      laboratorio = m[1].trim();
      labNota = 'Solo aparece dentro del texto libre de la descripción, no como dato de la ficha.';
    }
  }

  // descripción
  const iDesc = idx((s) => s === 'Descripción');
  let descripcion = null;
  if (iDesc >= 0) {
    const d = segs[iDesc + 1];
    if (d && !/^Condiciones de almacenamiento:/.test(d) && d !== 'Nosotros') descripcion = d;
  }

  // imagen de producto (se registra la ruta, nunca se carga en el demo)
  const imgs = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]*product-img\.cofar\.cl[^"]*)"/gi)].map((m) =>
    decodeURIComponent(decodeEntities(m[1]))
  );
  const rutasImg = [...new Set(imgs.map((u) => (u.match(/product-img\.cofar\.cl(\/products\/[^&"]+)/) || [])[1]).filter(Boolean))];

  const envio = segs.includes('Envío disponible');
  const retiro = segs.includes('Retiro en tienda');
  const comprar = segs.includes('Comprar');

  const descLen = descripcion ? descripcion.length : 0;

  return {
    fuente: src,
    capa: 'DOM · Chrome 153 headless · --dump-dom',
    campos: {
      nombre: nombre ? presente(nombre, src) : ausente(src),
      precio_normal: normal ? presente(normal, src) : ausente(src),
      precio_oferta: oferta
        ? presente(oferta, src)
        : noAplica(src, 'La ficha muestra un solo precio; no hay oferta visible.'),
      laboratorio: laboratorio
        ? labNota
          ? degradado(laboratorio, src, labNota)
          : presente(laboratorio, src)
        : ausente(src, 'La ficha no muestra laboratorio ni marca como dato.'),
      principio_activo: principio ? presente(principio, src) : ausente(src, 'No aparece "Principio Activo" en la ficha.'),
      concentracion: concentracion ? presente(concentracion, src) : ausente(src),
      forma_contenido: contenido ? presente(contenido, src) : ausente(src),
      condicion_venta: condicion
        ? presente(condicion, src, condicionLarga || undefined)
        : ausente(src),
      refrigeracion: refrigerado
        ? presente('Refrigerado', src, almacenamiento || undefined)
        : almacenamiento
          ? presente(almacenamiento, src, 'Sin etiqueta "Refrigerado".')
          : ausente(src),
      descripcion: descripcion
        ? descLen < 40
          ? degradado(descripcion, src, `${descLen} caracteres. Es todo lo que dice la ficha.`)
          : presente(descripcion.slice(0, 280) + (descLen > 280 ? '…' : ''), src, `${descLen.toLocaleString('es-CL')} caracteres.`)
        : ausente(src, 'La sección "Descripción" está vacía.'),
      imagen: rutasImg.length
        ? presente(`${rutasImg.length} imagen${rutasImg.length > 1 ? 'es' : ''} de producto`, src, rutasImg.join(' · '))
        : ausente(src),
      compra: comprar
        ? presente([envio && 'Envío disponible', retiro && 'Retiro en tienda', 'Botón Comprar'].filter(Boolean).join(' · '), src)
        : ausente(src, 'Sin botón Comprar.'),
    },
  };
}

// ---------------------------------------------------------------------------
// 2 · Lo que ve un bot sin JavaScript (raw, curl)
// ---------------------------------------------------------------------------
function miradaBot(sku) {
  const file = rawFileFor(sku);
  const src = rel(file);
  const html = readFileSync(file, 'utf8');
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1];
  const metaDesc = (html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1];
  const canonical = (html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i) || [])[1];
  const og = (html.match(/property="og:/g) || []).length;
  const twitter = (html.match(/name="twitter:/g) || []).length;
  const ld = (html.match(/application\/ld\+json/g) || []).length;
  const imgProducto = (html.match(/<img\b[^>]*product-img\.cofar\.cl/gi) || []).length;
  const imgTotal = (html.match(/<img\b/gi) || []).length;
  const precios = (html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').match(/\$\s?\d{1,3}(?:\.\d{3})+/g) || []).length;
  const bytes = Buffer.byteLength(html, 'utf8');

  // ¿el payload de Next.js trae precio o laboratorio? (H01: no)
  const payload = (html.match(/self\.__next_f\.push\(([\s\S]*?)\)<\/script>/g) || []).join('\n');
  const payloadPrecio = /normalPrice|offerPrice/.test(payload);

  return {
    fuente: src,
    capa: 'raw · curl sin JavaScript · UA RelevoStudio-Audit/1.0',
    bytes,
    campos: {
      titulo: title ? presente(decodeEntities(title), src) : ausente(src),
      meta_description: metaDesc ? presente(decodeEntities(metaDesc), src) : ausente(src),
      canonical: canonical ? presente(canonical, src) : ausente(src),
      precio: precios === 0 ? ausente(src, 'Ningún precio en el HTML del servidor.') : presente(`${precios} precios`, src),
      laboratorio: ausente(src, 'No está en el HTML ni en el payload de Next.js.'),
      principio_activo: ausente(src, 'Solo si la meta description lo menciona de pasada.'),
      descripcion: ausente(src, 'La ficha llega vacía; el texto se carga después con JavaScript.'),
      imagen: imgProducto === 0 ? ausente(src, `${imgTotal} <img> en el HTML y todas son logo o íconos.`) : presente(`${imgProducto}`, src),
      open_graph: og + twitter === 0 ? ausente(src, 'Sin og:* ni twitter:*. Una vista previa de WhatsApp o LinkedIn no tiene imagen ni precio.') : presente(`${og + twitter}`, src),
      json_ld: ld === 0 ? ausente(src, 'Cero bloques ld+json en el HTML del servidor.') : presente(`${ld}`, src),
      payload_next: payloadPrecio ? presente('trae precio', src) : ausente(src, 'El payload self.__next_f tampoco trae precio ni atributos.'),
    },
  };
}

// ---------------------------------------------------------------------------
// 3 · Lo que dice el JSON-LD actual (DOM, inyectado por JS)
// ---------------------------------------------------------------------------
function miradaJsonLd(sku, api) {
  const key = `product_${sku}.html`;
  const src = 'evidencia/p2/jsonld_dom.json';
  const srcDom = `evidencia/dom/product_${sku}.html`;
  const bloques = jsonldDom[key];
  if (!bloques) throw new Error(`Sin JSON-LD en evidencia para ${sku}`);
  const product = bloques.find((b) => b['@type'] === 'Product');
  if (!product) throw new Error(`Sin bloque Product para ${sku}`);

  const brandName = product.brand && product.brand.name;
  const brandEsPlaceholder = brandName === 'Marca no disponible';
  const brandEsObjeto = brandName && typeof brandName === 'object';
  const desc = product.description || '';
  const descPlaceholder = desc === 'Descripcion no disponible';
  const descCorta = desc.length < 40;
  const avail = product.offers && product.offers.availability;
  const stockReal = api.stock > 0 && !api.attributes.isOutOfStock;

  return {
    fuente: src,
    fuente_dom: srcDom,
    capa: 'DOM · script ld+json inyectado por JavaScript · no existe en raw',
    bloque: product,
    campos: {
      name: presente(product.name, src),
      sku: presente(product.sku, src),
      brand: brandEsPlaceholder
        ? degradado('"Marca no disponible"', src, `Placeholder fijo en el código. La API trae laboratory.label = "${api.laboratory ? api.laboratory.label : '—'}".`)
        : brandEsObjeto
          ? degradado(JSON.stringify(brandName), src, 'Un objeto {label, value} donde schema.org espera texto.')
          : presente(String(brandName), src),
      description: descPlaceholder
        ? degradado('"Descripcion no disponible"', src, 'Placeholder fijo en el código.')
        : descCorta
          ? degradado(`"${desc}"`, src, `${desc.length} caracteres.`)
          : presente(desc.slice(0, 160) + '…', src, `${desc.length.toLocaleString('es-CL')} caracteres.`),
      image: product.image ? presente(product.image, src) : ausente(src),
      category: presente(product.category, src, 'Primer tag del producto, no la categoría clínica.'),
      price: presente(`${product.offers.price} ${product.offers.priceCurrency}`, src, api.offerPrice ? 'Es el precio de oferta. El precio normal no se declara.' : undefined),
      availability: degradado(`"${avail}"`, src, stockReal
        ? 'Fijo en el código para las 21 fichas; sin prefijo https://schema.org/. Aquí coincide con el stock real, pero no lo lee de la API.'
        : 'Fijo en el código. La API declara stock 0 para este producto.'),
      gtin: ausente(src, 'No se genera. El campo no existe en la API.'),
      laboratorio: ausente(src, 'No se genera aunque la API lo trae.'),
      principio_activo: ausente(src, 'No se genera aunque la API lo trae.'),
      condicion_venta: ausente(src, 'No se genera aunque la API lo trae.'),
      refrigeracion: ausente(src, 'No se genera aunque la API lo trae.'),
    },
  };
}

// ---------------------------------------------------------------------------
// 4 · Lo que diría generado desde su propia API (construido en build)
// ---------------------------------------------------------------------------
const CONDICION_VENTA = {
  simpleRecipe: 'Receta médica simple',
  retainedRecipe: 'Receta médica retenida',
  checkRecipe: 'Receta cheque',
  noPrescription: 'Venta directa',
};

function apiWhitelist(p) {
  // Lista blanca explícita: promoAvailable y cualquier campo interno quedan fuera.
  return {
    sku: p.sku,
    productName: p.productName,
    productType: p.productType,
    laboratory: p.laboratory ? { label: p.laboratory.label } : null,
    brand: p.brand ? { label: p.brand.label } : null,
    activePrinciples: (p.activePrinciples || []).map((a) => ({
      name: (a.name || '').trim(),
      amountContent: a.amountContent,
      unitMeasure: a.unitMeasure,
    })),
    pharmaceuticalForm: p.pharmaceuticalForm ? { label: p.pharmaceuticalForm.label } : null,
    unitContent: p.unitContent,
    saleCondition: p.saleCondition ? { value: p.saleCondition.value } : null,
    storageCondition: p.storageCondition,
    attributes: {
      isRefrigerated: !!p.attributes.isRefrigerated,
      isOutOfStock: !!p.attributes.isOutOfStock,
      isBioequivalent: !!p.attributes.isBioequivalent,
      hasDelivery: !!p.attributes.hasDelivery,
      hasStore: !!p.attributes.hasStore,
    },
    stock: p.stock,
    normalPrice: p.normalPrice,
    offerPrice: p.offerPrice,
    imageURLs: p.imageURLs || [],
    tags: (p.tags || []).map((t) => t.label),
    subTags: (p.subTags || []).map((t) => t.label),
    description_len: (p.description || '').trim().length,
    description: (p.description || '').trim() || null,
    metaTitle: p.metaTitle || null,
    metaDescription: p.metaDescription || null,
  };
}

function generarJsonLd(api, canonical) {
  const marca = (api.laboratory && api.laboratory.label) || (api.brand && api.brand.label) || null;
  const disponible = api.stock > 0 && !api.attributes.isOutOfStock;
  const pa = api.activePrinciples[0];
  const concentracion = pa && pa.amountContent != null ? `${pa.amountContent} ${pa.unitMeasure || ''}`.trim() : null;

  const props = [];
  if (pa && pa.name) props.push({ '@type': 'PropertyValue', name: 'Principio activo', value: pa.name });
  if (concentracion) props.push({ '@type': 'PropertyValue', name: 'Concentración', value: concentracion });
  if (api.pharmaceuticalForm) props.push({ '@type': 'PropertyValue', name: 'Forma farmacéutica', value: api.pharmaceuticalForm.label });
  if (api.unitContent != null) props.push({ '@type': 'PropertyValue', name: 'Cantidad por envase', value: String(api.unitContent) });
  if (api.saleCondition) props.push({ '@type': 'PropertyValue', name: 'Condición de venta', value: CONDICION_VENTA[api.saleCondition.value] || api.saleCondition.value });
  if (api.storageCondition) props.push({ '@type': 'PropertyValue', name: 'Almacenamiento', value: api.storageCondition });
  props.push({ '@type': 'PropertyValue', name: 'Refrigerado', value: api.attributes.isRefrigerated ? 'Sí' : 'No' });

  const offer = {
    '@type': 'Offer',
    url: canonical,
    price: api.offerPrice ?? api.normalPrice,
    priceCurrency: 'CLP',
    availability: disponible ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    availableDeliveryMethod: [
      api.attributes.hasDelivery && 'https://schema.org/ParcelService',
      api.attributes.hasStore && 'https://schema.org/OnSitePickup',
    ].filter(Boolean),
  };
  if (api.offerPrice != null && api.offerPrice !== api.normalPrice) {
    offer.priceSpecification = [
      { '@type': 'UnitPriceSpecification', priceType: 'https://schema.org/ListPrice', price: api.normalPrice, priceCurrency: 'CLP' },
      { '@type': 'UnitPriceSpecification', priceType: 'https://schema.org/SalePrice', price: api.offerPrice, priceCurrency: 'CLP' },
    ];
  }

  const bloque = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: api.productName,
    sku: api.sku,
    url: canonical,
    image: api.imageURLs.map((u) => `https://product-img.cofar.cl${u}`),
    brand: marca ? { '@type': 'Brand', name: marca } : undefined,
    category: [...api.tags, ...api.subTags].join(' > ') || undefined,
    description: api.description || undefined,
    additionalProperty: props,
    offers: offer,
  };
  // sin gtin: el campo no existe en la API y no se inventa
  return JSON.parse(JSON.stringify(bloque)); // limpia undefined
}

function miradaApi(sku, canonical) {
  const raw = porSku[sku];
  if (!raw) throw new Error(`SKU ${sku} no está en catalogo_completo.json`);
  const api = apiWhitelist(raw);
  const src = 'evidencia/api/catalogo_completo.json';
  const marca = (api.laboratory && api.laboratory.label) || null;
  const brand = (api.brand && api.brand.label) || null;
  const pa = api.activePrinciples[0];
  const disponible = api.stock > 0 && !api.attributes.isOutOfStock;
  const bloque = generarJsonLd(api, canonical);

  return {
    fuente: src,
    capa: 'API · GET services.cofar.cl/products/2.0 · volcado del 2026-09-12 · generado en build, sin llamadas en vivo',
    bloque,
    campos: {
      nombre: presente(api.productName, src),
      precio_normal: presente(clp(api.normalPrice), src),
      precio_oferta: api.offerPrice != null ? presente(clp(api.offerPrice), src, 'Se declara como SalePrice junto al ListPrice.') : noAplica(src, 'offerPrice es null en el volcado.'),
      laboratorio: marca
        ? presente(marca, src, 'laboratory.label')
        : brand
          ? presente(brand, src, 'brand.label (dermocosmética: sin campo laboratorio).')
          : ausente(src, 'laboratory y brand vienen null en la API.'),
      principio_activo: pa && pa.name ? presente(pa.name, src, 'activePrinciples[0].name') : ausente(src, 'activePrinciples viene vacío en la API.'),
      concentracion: pa && pa.amountContent != null ? presente(`${pa.amountContent} ${pa.unitMeasure || ''}`.trim(), src) : ausente(src),
      forma_contenido: api.pharmaceuticalForm ? presente(`${api.unitContent ?? ''} ${api.pharmaceuticalForm.label}`.trim(), src, 'unitContent + pharmaceuticalForm.label') : ausente(src),
      condicion_venta: api.saleCondition ? presente(CONDICION_VENTA[api.saleCondition.value] || api.saleCondition.value, src, `saleCondition.value = ${api.saleCondition.value}`) : ausente(src),
      refrigeracion: presente(api.attributes.isRefrigerated ? 'Refrigerado' : 'No refrigerado', src, api.storageCondition || undefined),
      disponibilidad: presente(disponible ? 'InStock (stock real)' : 'OutOfStock (stock real)', src, `stock = ${api.stock} · isOutOfStock = ${api.attributes.isOutOfStock}`),
      descripcion: api.description
        ? api.description_len < 40
          ? degradado(`"${api.description}"`, src, `${api.description_len} caracteres en la API. Es lo que hay; no se inventa.`)
          : presente(api.description.slice(0, 160) + '…', src, `${api.description_len.toLocaleString('es-CL')} caracteres.`)
        : ausente(src, 'La API no tiene descripción para este producto. El campo se omite; no se rellena.'),
      imagen: api.imageURLs.length ? presente(`${api.imageURLs.length} imagen${api.imageURLs.length > 1 ? 'es' : ''}`, src, api.imageURLs.join(' · ')) : ausente(src),
      gtin: ausente(src, 'No existe en la API. No se inventa.'),
    },
    api,
  };
}

// ---------------------------------------------------------------------------
// contexto: cifras, campañas, asistente
// ---------------------------------------------------------------------------
function contexto() {
  const cob = Object.fromEntries(hallazgos.cobertura_atributos.map((c) => [c.subcategoria, c]));
  const meds = cob['Solo medicamentos'].atributos;
  const claves = ['principio_activo', 'laboratorio', 'forma_farmaceutica', 'condicion_venta', 'condicion_almacenamiento'];
  const vals = claves.map((k) => meds[k]);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const r = hallazgos.resumen;
  const p2 = hallazgosP2.resumen;
  const h01 = hallazgos.hallazgos.find((h) => h.id === 'H01');
  const h03 = hallazgos.hallazgos.find((h) => h.id === 'H03');
  const h14 = hallazgosP2.hallazgos.find((h) => h.id === 'H14');
  const h15 = hallazgosP2.hallazgos.find((h) => h.id === 'H15');
  const h16 = hallazgosP2.hallazgos.find((h) => h.id === 'H16');

  const cifras = [
    {
      valor: r.productos_publicos_aprox.toLocaleString('es-CL'),
      titulo: 'productos en la API con atributos de medicamento entre el ' + `${Math.round(min)}% y el ${Math.round(max)}%`,
      detalle: `Principio activo ${meds.principio_activo}%, laboratorio ${meds.laboratorio}%, forma ${meds.forma_farmaceutica}%, condición de venta ${meds.condicion_venta}%, almacenamiento ${meds.condicion_almacenamiento}% en los ${cob['Solo medicamentos'].n.toLocaleString('es-CL')} medicamentos.`,
      fuente: 'hallazgos.json · cobertura_atributos · evidencia/api/cobertura_atributos.txt',
    },
    {
      valor: `0 de ${r.muestra_fichas}`,
      titulo: 'fichas con algún dato de producto en el HTML del servidor',
      detalle: h01.cifra,
      fuente: 'hallazgos.json · H01 · evidencia/fichas/analisis_fichas.txt',
    },
    {
      valor: `${cob['VIH'].atributos['descripcion_40+']}% vs ${cob['Dermocosméticos (tipo)'].atributos['descripcion_40+']}%`,
      titulo: 'fichas con descripción en VIH frente a dermocosmética',
      detalle: h03.cifra,
      fuente: 'hallazgos.json · H03 · evidencia/api/cobertura_atributos.txt',
    },
  ];

  // Herramientas de campaña: verificadas contra el archivo de evidencia en build.
  const senales = readFileSync(join(EV, 'p2', 'senales_meta_google.md'), 'utf8');
  const herramientas = [
    { nombre: 'Google Tag Manager', prueba: 'gtm.js?id=GTM-' },
    { nombre: 'Google Analytics 4', prueba: 'gtag/js?id=G-' },
    { nombre: 'Google Ads (tag de conversión)', prueba: 'gtag/js?id=AW-' },
    { nombre: 'Meta Pixel', prueba: 'fbevents.js' },
    { nombre: 'Hotjar', prueba: 'hotjar' },
    { nombre: 'Merchant ID (constante en el bundle)', prueba: 'GOOGLE_MERCHANT_ID' },
  ].map((h) => {
    if (!senales.includes(h.prueba)) throw new Error(`No encuentro "${h.prueba}" en senales_meta_google.md`);
    return { nombre: h.nombre, donde: h.nombre.startsWith('Merchant') ? 'bundle propio de Next.js' : 'DOM, cargado vía GTM; 0 en raw', fuente: 'evidencia/p2/senales_meta_google.md' };
  });

  const faltantes = [
    { pieza: 'Open Graph / Twitter Card', estado: `${p2.og_tags_raw} en raw · ${p2.og_tags_dom} en DOM`, detalle: 'No llegan tarde por JavaScript: no llegan.', fuente: 'hallazgos-p2.json · H15' , cifra: h15.cifra },
    { pieza: 'Feed público de productos', estado: p2.feed_productos_publico ? 'existe' : 'no existe', detalle: '12 rutas habituales en 404 real; nada en robots ni sitemap.', fuente: 'hallazgos-p2.json · H16 · evidencia/p2/feeds_log.txt', cifra: h16.cifra },
    { pieza: 'JSON-LD Product en el servidor', estado: `${p2.cobertura_jsonld_product_pct}% en raw · ${p2.cobertura_jsonld_product_dom_pct}% en DOM`, detalle: 'Solo lo crea el JavaScript, con marca y stock degradados.', fuente: 'hallazgos-p2.json · H14', cifra: h14.cifra },
    { pieza: 'JSON-LD Organization', estado: 'ausente en todas las capas', detalle: 'La home no declara Organization, WebSite ni LocalBusiness.', fuente: 'evidencia/p2/senales_meta_google.md §6' },
    { pieza: 'GTIN / código de barras', estado: 'no existe', detalle: 'No está en la API ni en el JSON-LD.', fuente: 'hallazgos.json · resumen.gtin_validos_pct = null' },
  ];

  // Asistente: la observación del 2026-09-12. Se verifica contra el volcado que la oferta siga activa.
  const oz = porSku['012522017'];
  const busquedas = readFileSync(join(EV, 'p2', 'busquedas_web.md'), 'utf8');
  const consultas = [...busquedas.matchAll(/## Consulta \d · texto exacto: `([^`]+)`[\s\S]*?\*\*Cofar: ([^*]+)\*\*/g)].map((m) => ({
    consulta: m[1],
    resultado: m[2].trim().replace(/\.$/, ''),
  }));

  return {
    cifras,
    campanas: { herramientas, faltantes },
    asistente: {
      fecha: FECHA_CAPTURA,
      producto: oz.productName,
      sku: oz.sku,
      api_precio_normal: clp(oz.normalPrice),
      api_precio_oferta: clp(oz.offerPrice),
      oferta_activa_en_volcado: oz.offerPrice != null,
      // BRIEF-DEMO.md §4 resume la observación; la transcripción literal no está en evidencia/.
      transcripcion_literal: null,
      resumen_brief: [
        'Encontró el sitio de Cofar.',
        'Citó bien la presentación (2 mg/1,5 ml, dispositivo prellenado) y la conservación (refrigerado).',
        `Dio ${clp(oz.normalPrice)} como precio, cuando la API declaraba una oferta de ${clp(oz.offerPrice)}.`,
      ],
      fuente_resumen: 'BRIEF-DEMO.md §4 (observación del 2026-09-12 desde el chat)',
      busquedas_web: { fuente: 'evidencia/p2/busquedas_web.md', consultas },
    },
  };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
const fichas = SKUS.map((s) => {
  const bot = miradaBot(s.sku);
  const canonical = bot.campos.canonical.valor;
  const api = miradaApi(s.sku, canonical);
  const ficha = {
    sku: s.sku,
    nombre: api.api.productName,
    grupo: s.grupo,
    por_que: s.porQue,
    url_publica: canonical,
    miradas: {
      paciente: miradaPaciente(s.sku),
      bot,
      jsonld: miradaJsonLd(s.sku, api.api),
      api,
    },
  };
  return ficha;
});

const salida = {
  generado: new Date().toISOString(),
  fecha_captura: FECHA_CAPTURA,
  nota: 'Datos congelados desde evidencia/ de la auditoría del 2026-09-12. Ningún request en vivo. Los campos de promociones de la API quedan fuera por regla del BRIEF-DEMO.',
  contexto: contexto(),
  fichas,
};

// Cinturón y tirantes: que jamás se cuele un nombre de promoción.
const serializado = JSON.stringify(salida, null, 1);
if (/promoName|promoAvailable|promoId|condbenef/.test(serializado)) {
  throw new Error('El JSON de salida contiene campos de promoción; abortando.');
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, serializado + '\n');

// resumen por consola
for (const f of fichas) {
  const p = f.miradas.paciente.campos;
  const j = f.miradas.jsonld.campos;
  console.log(
    `${f.sku} ${f.nombre}\n  paciente: nombre=${p.nombre.estado} normal=${p.precio_normal.valor} oferta=${p.precio_oferta.valor} lab=${p.laboratorio.valor}(${p.laboratorio.estado}) pa=${p.principio_activo.valor} conc=${p.concentracion.valor} forma=${p.forma_contenido.valor} cond=${p.condicion_venta.valor} refri=${p.refrigeracion.valor} desc=${p.descripcion.estado} img=${p.imagen.valor}\n  bot: title=${f.miradas.bot.campos.titulo.estado} og=${f.miradas.bot.campos.open_graph.estado} ld=${f.miradas.bot.campos.json_ld.estado}\n  jsonld: brand=${j.brand.estado} desc=${j.description.estado} avail=${j.availability.valor}\n  api: lab=${f.miradas.api.campos.laboratorio.valor} desc=${f.miradas.api.campos.descripcion.estado} disp=${f.miradas.api.campos.disponibilidad.valor}`
  );
}
console.log(`\nEscrito ${rel(OUT)} (${(serializado.length / 1024).toFixed(0)} KB)`);
