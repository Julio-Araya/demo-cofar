#!/usr/bin/env bash
# Espera a que termine la descarga de categorías, arma la muestra estratificada de fichas, baja el raw (1 req/s)
# y luego captura el DOM con Chrome headless para un subconjunto + home + FAQ + una categoría.
cd "$(dirname "$0")"
while ! grep -q "CATEGORIAS LISTAS" dump_catalogo.log; do sleep 5; done
python3 - <<'PY'
import json,re,glob,random
nodes=json.load(open('api/catalogo_completo.json')); by={n['sku']:n for n in nodes}
urls={}
for f in glob.glob('sitemaps/sitemap_PDP_*.xml'):
    for u in re.findall(r'<loc>(.*?)</loc>',open(f).read()):
        m=re.search(r'/product/(\d+)/',u)
        if m: urls[m.group(1)]=u
def tags(n): return {t['slug'] for t in n.get('tags') or []}
def subs(n): return {s['label'] for s in n.get('subTags') or []}
strata={'diabetes':lambda n:'diabetes-y-obesidad' in tags(n),'oncologicos':lambda n:'Oncológicos' in subs(n),'vih':lambda n:'vih' in tags(n),
 'fertilidad':lambda n:'fertilidad' in tags(n) or 'especial-fertilidad' in tags(n),'salud_mental':lambda n:'salud-mental' in tags(n),'refrigerados':lambda n:'refrigerados' in tags(n),
 'cardiovascular':lambda n:'cardiovascular' in tags(n),'vitaminas':lambda n:n['productType']=='Vitamins-supplements','dermo':lambda n:n['productType']=='Dermocosmetic','receta_cheque':lambda n:n['attributes'].get('isCheck')}
R=random.Random(42); sample=[]; seen=set()
for k,fn in strata.items():
    pool=[n for n in nodes if fn(n) and n['sku'] in urls and n['sku'] not in seen]
    for n in R.sample(pool,min(5,len(pool))): sample.append((k,n['sku'],urls[n['sku']])); seen.add(n['sku'])
diff=json.load(open('api/diff_sitemap_api.json'))
for s in R.sample(diff['solo_sitemap'],10): sample.append(('solo_sitemap',s,urls[s]))
json.dump(sample,open('muestra_fichas.json','w'),indent=0)
open('listas_fichas.txt','w').write('\n'.join(u for _,_,u in sample))
print('muestra',len(sample))
PY
python3 fetch_list.py listas_fichas.txt fichas 2>/dev/null
echo "FICHAS RAW LISTAS"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
dom_get(){ # url nombre
  "$CHROME" --headless=new --disable-gpu --no-first-run --no-default-browser-check --user-agent="RelevoStudio-Audit/1.0 (+https://relevostudio.com) HeadlessChrome" --virtual-time-budget=15000 --dump-dom "$1" > "dom/$2.html" 2>/dev/null
  echo "DOM $2 $(wc -c < dom/$2.html)"; sleep 2
}
dom_get "https://cofar.cl/" home
dom_get "https://cofar.cl/preguntas-frecuentes" preguntas-frecuentes
dom_get "https://cofar.cl/contigo-beneficios" contigo-beneficios
dom_get "https://cofar.cl/category/medicamentos/diabetes-y-obesidad" cat_diabetes-y-obesidad
dom_get "https://cofar.cl/category/medicamentos/receta-cheque---solo-compra-presencial" cat_receta-cheque
dom_get "https://cofar.cl/product/999999999/no-existe" product_999999999_no-existe
python3 - <<'PY' > listas_dom.txt
import json
s=json.load(open('muestra_fichas.json'))
# 2 por estrato (20) + 2 solo_sitemap
c={}
for k,sku,u in s:
    c.setdefault(k,0)
    if c[k]<2: print(u); c[k]+=1
PY
while read u; do n=$(echo "$u" | sed -E 's#https://cofar.cl/product/([0-9]+)/.*#product_\1#'); dom_get "$u" "$n"; done < listas_dom.txt
echo "DOM LISTO"
