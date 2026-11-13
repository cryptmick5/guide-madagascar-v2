#!/usr/bin/env python3
"""Génère les versions allégées (WebP) des images du guide.

  images/opt/800/<chemin>.webp   : cartes, listes, fiche détaillée (largeur max 800 px)
  images/opt/1600/<chemin>.webp  : bandeaux de page (largeur max 1600 px),
                                   uniquement pour les images utilisées en fond dans index.html

Les originaux ne sont jamais modifiés ni supprimés. Relancer après tout ajout
d'image :  python3 scripts/generer-vignettes.py
"""
import os, sys
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'images')
OUT = os.path.join(SRC, 'opt')
EXCLUS = ('opt', 'logo')
TAILLES = {'800': (800, 72), '1600': (1600, 76)}

def bandeaux():
    import re
    html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    noms = re.findall(r"url\('images/(?:opt/1600/)?([^')]+)'\)", html)
    return {os.path.normpath(os.path.splitext(x)[0] + '.webp') for x in noms}

def main():
    grands = bandeaux()
    avant = apres = n = 0
    for dossier, sous, fichiers in os.walk(SRC):
        rel_dir = os.path.relpath(dossier, SRC)
        if rel_dir.split(os.sep)[0] in EXCLUS:
            sous[:] = []
            continue
        for f in sorted(fichiers):
            if not f.lower().endswith(('.jpg', '.jpeg', '.png')):
                continue
            src = os.path.join(dossier, f)
            rel = os.path.normpath(os.path.join(rel_dir, os.path.splitext(f)[0] + '.webp'))
            try:
                im = ImageOps.exif_transpose(Image.open(src))
                im = im.convert('RGBA' if 'A' in im.getbands() else 'RGB')
            except Exception as e:
                print('IGNORÉ', src, e, file=sys.stderr)
                continue
            avant += os.path.getsize(src)
            n += 1
            for nom, (largeur, q) in TAILLES.items():
                if nom == '1600' and rel not in grands:
                    continue
                dst = os.path.join(OUT, nom, rel)
                if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
                    if nom == '800': apres += os.path.getsize(dst)
                    continue
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                v = im.copy()
                if v.width > largeur:
                    v = v.resize((largeur, round(v.height * largeur / v.width)), Image.LANCZOS)
                v.save(dst, 'WEBP', quality=q, method=6)
                if nom == '800': apres += os.path.getsize(dst)
    print(f'{n} images — originaux {avant/1048576:.1f} Mo → vignettes 800 px {apres/1048576:.1f} Mo')

if __name__ == '__main__':
    main()
