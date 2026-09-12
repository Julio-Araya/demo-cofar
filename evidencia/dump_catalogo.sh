#!/usr/bin/env bash
# Vuelca el catálogo completo vía la API pública (GET, sin token), 100 por página, 1 req/s. Luego baja las 137 categorías.
UA="RelevoStudio-Audit/1.0 (+https://relevostudio.com)"
cd "$(dirname "$0")"
mkdir -p api/catalogo
for off in $(seq 0 100 3100); do
  f=api/catalogo/all_$(printf %05d $off).json
  [ -s "$f" ] && continue
  curl -s -A "$UA" --max-time 60 -o "$f" -w "$off %{http_code} %{size_download}\n" "https://services.cofar.cl/products/2.0/?first=100&offset=$off"
  sleep 1
done
echo "CATALOGO LISTO"
grep -o '<loc>[^<]*' sitemaps/sitemap_PLP.xml | sed 's/<loc>//' > listas_categorias.txt
python3 fetch_list.py listas_categorias.txt categorias 2>/dev/null
echo "CATEGORIAS LISTAS"
