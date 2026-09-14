#!/usr/bin/env python3
"""Compara, para las fichas capturadas con Chrome headless, precio/atributos en DOM vs API vs raw."""
import re,json,glob,os
from bs4 import BeautifulSoup
nodes={n['sku']:n for n in json.load(open('api/catalogo_completo.json'))}
def fmt(p): return '$'+f'{int(p):,}'.replace(',','.')
rows=[]
for f in sorted(glob.glob('dom/product_*.html')):
    sku=re.search(r'product_(\d+)',f).group(1)
    if sku=='999999999': continue
    h=open(f).read(); s=BeautifulSoup(h,'lxml')
    for t in s(['script','style','noscript']): t.decompose()
    txt=s.get_text(' ',strip=True)
    n=nodes.get(sku)
    precios=re.findall(r'\$\s?\d{1,3}(?:\.\d{3})+',txt)
    r=dict(sku=sku,en_api=bool(n),dom_chars=len(txt),precios_dom=precios[:4])
    if n:
        r.update(api_normal=n['normalPrice'],api_oferta=n['offerPrice'],
          normal_en_dom=fmt(n['normalPrice']) in txt,
          oferta_en_dom=(fmt(n['offerPrice']) in txt) if n['offerPrice'] else None,
          lab_en_dom=bool((n.get('laboratory') or {}).get('label')) and (n['laboratory']['label'] in txt),
          pa_en_dom=bool(n.get('activePrinciples')) and n['activePrinciples'][0]['name'] in txt,
          sku_en_dom=f'SKU {sku}' in txt,
          desc_en_dom=(re.sub(r'\s+',' ',n.get('description') or '').strip()[:40] in re.sub(r'\s+',' ',txt)) if len(re.sub(r'\s+',' ',n.get('description') or '').strip())>=40 else None,
          comprar_en_dom='Comprar' in txt, is_check=n['attributes'].get('isCheck'), stock=n['stock'],
          receta_dom=[k for k in ['Rec. Med. Simple','Rec. Med. Retenida','Venta directa','Receta Cheque','Solo Compra Presencial','Rec. Med. Cheque'] if k in txt],
          refrigerado_dom='Refrigerado' in txt, api_refrigerado=n['attributes'].get('isRefrigerated'),
          contenido_dom=re.findall(r'Contenido:\s*([^A-Z]{0,30}[A-Za-z. ]{0,40})',txt)[:1],
          sin_stock_dom=any(k in txt for k in ['Sin stock','Agotado','sin stock','No disponible']))
    else:
        i=txt.find('Todos los Derechos Reservados.'); r['cola_texto']=txt[txt.rfind('Todos los Derechos Reservados.')+30:][:200]
    rows.append(r)
json.dump(rows,open('dom/analisis_dom_fichas.json','w'),indent=1,ensure_ascii=False)
ok=[r for r in rows if r['en_api']]
print('fichas DOM analizadas',len(rows),'| en API',len(ok))
print('precio normal API presente en DOM:',sum(1 for r in ok if r['normal_en_dom']),'/',len(ok))
print('precio oferta API presente en DOM:',sum(1 for r in ok if r['oferta_en_dom']),'/',sum(1 for r in ok if r['oferta_en_dom'] is not None))
print('laboratorio en DOM:',sum(1 for r in ok if r['lab_en_dom']),'| principio activo en DOM:',sum(1 for r in ok if r['pa_en_dom']),'| SKU en DOM:',sum(1 for r in ok if r['sku_en_dom']))
print('descripción (API>=40) en DOM:',sum(1 for r in ok if r['desc_en_dom']),'/',sum(1 for r in ok if r['desc_en_dom'] is not None))
print('botón Comprar en DOM:',sum(1 for r in ok if r['comprar_en_dom']),'| isCheck sin Comprar:',[(r['sku'],r['comprar_en_dom']) for r in ok if r['is_check']])
print('stock 0 en API:',[(r['sku'],r['sin_stock_dom'],r['comprar_en_dom']) for r in ok if not r['stock']])
print('refrigerado coincide:',sum(1 for r in ok if bool(r['refrigerado_dom'])==bool(r['api_refrigerado'])),'/',len(ok))
print('discrepancias de precio:',[(r['sku'],r['api_normal'],r['api_oferta'],r['precios_dom']) for r in ok if not r['normal_en_dom']])
print('fichas sin datos en DOM (chars<1500):',[(r['sku'],r['dom_chars']) for r in rows if r['dom_chars']<1500])
print('solo-sitemap en DOM:',[(r['sku'],r['dom_chars'],r.get('cola_texto','')[:120]) for r in rows if not r['en_api']])
for r in ok[:3]: print(' ej:',r['sku'],r['receta_dom'],r['contenido_dom'],r['precios_dom'])
