# Gera os arquivos públicos (só prévia) e os completos criptografados em conteudo/*.enc.
# Uso: CONTENT_KEY=<hex> python3 tools/split_content.py <pasta_com_os_json_completos>
import json, os, sys
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
SRC = sys.argv[1]; ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = bytes.fromhex(os.environ['CONTENT_KEY'])
PEND_PS = [1,4,16,19,23,27,32,34,37,40,46,51,62,73,84,90,91,103,121,139,145]
def enc(name, obj):
    data = json.dumps(obj, ensure_ascii=False).encode(); iv = os.urandom(12)
    ct = AESGCM(KEY).encrypt(iv, data, None)  # ciphertext || tag(16)
    open(os.path.join(ROOT, 'conteudo', name + '.enc'), 'wb').write(iv + ct[-16:] + ct[:-16])
def pub(rel, obj):
    p = os.path.join(ROOT, 'app', 'data', rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    json.dump(obj, open(p, 'w'), ensure_ascii=False)
L = lambda f: json.load(open(os.path.join(SRC, f)))
ps = L('psalms.json'); enc('psalms', ps)
pub('psalms.json', [p if p['n'] in PEND_PS else {**p, 'blocks': p['blocks'][:2], 'nblocks': len(p['blocks']), 'conclusion': '', 'locked': True} for p in ps])
pr = L('prayers.json'); enc('prayers', pr); rank = {}; items = []
for it in pr['items']:
    r = rank.get(it['cat'], 0); rank[it['cat']] = r + 1
    items.append(it if r < 3 else {**it, 'text': it['text'].split('\n\n')[0], 'tip': '', 'locked': True})
pub('prayers.json', {'cats': pr['cats'], 'items': items})
pl = L('plan30.json'); enc('plan30', pl)
pub('plan30.json', [d if d['day'] <= 7 else {'day': d['day'], 'title': d['title'], 'verse': d['verse'], 'locked': True} for d in pl])
for b in ['mateo', 'marcos', 'lucas', 'juan']:
    g = L('bib/' + b + '.json'); enc('bib-' + b, g)
    pub('bib/' + b + '.json', [{**ch, 'blocks': ch['blocks'][:2], 'locked': True} for ch in g])
pv = L('bib/proverbios.json'); enc('bib-proverbios', pv)
pub('bib/proverbios.json', [{**ch, 'blocks': ch['blocks'][:2], 'ctx': {k: v for k, v in ch['ctx'].items() if k != 'curiosidad'}, 'locked': True} for ch in pv])
vs = L('bib/versiculos.json'); enc('bib-versiculos', vs)
pub('bib/versiculos.json', [v if i < 5 else {'ref': v['ref'], 't': v['t'], 'locked': True} for i, v in enumerate(vs)])
print('ok')
