#!/usr/bin/env python3
"""uso: fetch_list.py lista.txt outdir [nofollow]
Descarga cada URL (1 req/s, UA identificable), guarda html+headers y un log CSV."""
import sys,time,os,re,csv,requests,warnings
warnings.filterwarnings('ignore')
UA={'User-Agent':'RelevoStudio-Audit/1.0 (+https://relevostudio.com)'}
urls=[l.strip() for l in open(sys.argv[1]) if l.strip() and not l.startswith('#')]
out=sys.argv[2]; follow = len(sys.argv)<4
os.makedirs(out,exist_ok=True)
logf=open(os.path.join(out,'_log.csv'),'a',newline=''); w=csv.writer(logf)
if os.path.getsize(os.path.join(out,'_log.csv'))==0: w.writerow(['url','status','final_url','redirects','bytes','file','content_type'])
def safe(u):
    p=re.sub(r'^https?://[^/]+','',u).strip('/') or 'root'
    return re.sub(r'[^A-Za-z0-9._-]+','_',p)[:150]
for u in urls:
    f=safe(u)
    if os.path.exists(os.path.join(out,f+'.html')):
        continue
    try:
        r=requests.get(u,headers=UA,timeout=40,allow_redirects=follow)
        open(os.path.join(out,f+'.html'),'wb').write(r.content)
        open(os.path.join(out,f+'.headers'),'w').write('\n'.join(f'{k}: {v}' for k,v in r.headers.items()))
        chain=' > '.join(f'{h.status_code} {h.url}' for h in r.history)
        w.writerow([u,r.status_code,r.url,chain if follow else r.headers.get('Location',''),len(r.content),f+'.html',r.headers.get('content-type','')])
        print(u,r.status_code,r.url if follow else r.headers.get('Location',''),len(r.content),flush=True)
    except Exception as e:
        w.writerow([u,'ERR',str(e),'',0,'','']); print(u,'ERR',e,flush=True)
    logf.flush(); time.sleep(1)
