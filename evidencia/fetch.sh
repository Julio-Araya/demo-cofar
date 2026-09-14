#!/usr/bin/env bash
# uso: fetch.sh URL salida_base  -> guarda salida_base.html y salida_base.headers ; sleep 1
UA="RelevoStudio-Audit/1.0 (+https://relevostudio.com)"
url="$1"; out="$2"
curl -s -A "$UA" -L --max-time 40 -D "$out.headers" -o "$out.html" -w "%{http_code} %{url_effective} %{num_redirects} %{size_download}\n" "$url"
sleep 1
