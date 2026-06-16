# 🌐 Nom de domaine `amtechdz.com` — Guide de configuration

Ce guide explique comment connecter le domaine **amtechdz.com** à votre site
GitHub Pages, pour remplacer l'adresse `amtechdzofficial.github.io/Projects/`
par `https://amtechdz.com`.

> 💳 L'achat du domaine et la configuration DNS se font sur votre compte chez un
> registrar (avec votre paiement) : ces étapes ne peuvent pas être automatisées.
> Une fois le DNS configuré, je peux ajouter le fichier `CNAME` et vérifier la
> mise en ligne.

---

## Étape 1 — Acheter le domaine

Vérifiez la disponibilité et achetez **amtechdz.com** chez un registrar fiable :

| Registrar | Prix indicatif .com/an | Remarque |
|-----------|------------------------|----------|
| Cloudflare Registrar | ~9–10 $ | Au prix coûtant, DNS rapide (recommandé) |
| Namecheap | ~10–13 $ | Simple, populaire |
| Porkbun | ~9–11 $ | Bon rapport qualité/prix |
| OVH | ~10–12 € | Support FR, facturation possible en Algérie |

> 💡 Astuce : Cloudflare est idéal car il fournit aussi un DNS gratuit et rapide,
> et ne surfacture pas le renouvellement.

---

## Étape 2 — Configurer le DNS

Dans la zone DNS de votre registrar, créez les enregistrements suivants.

### a) Domaine racine `amtechdz.com` (enregistrements A — IPv4)

| Type | Nom / Hôte | Valeur |
|------|-----------|--------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

### b) (Optionnel mais conseillé) IPv6 — enregistrements AAAA

| Type | Nom / Hôte | Valeur |
|------|-----------|--------|
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |

### c) Sous-domaine `www` (enregistrement CNAME)

| Type | Nom / Hôte | Valeur |
|------|-----------|--------|
| CNAME | `www` | `amtechdzofficial.github.io` |

> ⚠️ Pour le CNAME `www`, la valeur est `amtechdzofficial.github.io` (le compte),
> **sans** `/Projects` et **sans** `https://`.
>
> Si vous utilisez Cloudflare, mettez le statut du proxy sur **« DNS only »**
> (nuage gris) le temps de la première mise en place, pour éviter les conflits
> de certificat avec GitHub.

La propagation DNS peut prendre de quelques minutes à 24 h (souvent < 1 h).

---

## Étape 3 — Déclarer le domaine sur GitHub

1. Allez sur **https://github.com/AMtechDZofficial/Projects/settings/pages**
2. Section **« Custom domain »** : saisissez `amtechdz.com` puis **Save**
3. GitHub crée automatiquement un fichier `CNAME` dans le dépôt et lance une
   vérification DNS.
4. Attendez que la coche verte « DNS check successful » apparaisse.
5. Cochez **« Enforce HTTPS »** (disponible une fois le certificat émis, cela
   peut prendre jusqu'à ~1 h).

> 📌 Si vous préférez, je peux ajouter le fichier `CNAME` directement dans le
> dépôt à votre signal — le contenu doit être exactement :
>
> ```
> amtechdz.com
> ```

---

## Étape 4 — Vérification

Une fois tout configuré, ces adresses doivent afficher le site en HTTPS :

- https://amtechdz.com
- https://www.amtechdz.com (redirige vers le domaine racine)

Test rapide en ligne de commande :

```bash
dig amtechdz.com +short        # doit renvoyer les 4 IP 185.199.108-111.153
curl -I https://amtechdz.com   # doit renvoyer HTTP 200
```

---

## Après la mise en ligne (je m'en occupe)

Une fois le domaine actif, je mettrai à jour :

- L'URL du site dans le `README.md` et le kit Google (`google-business-profile.md`)
- Les balises **SEO / réseaux sociaux** (`<link rel="canonical">`, Open Graph)
  pour pointer vers `https://amtechdz.com`
- Un fichier `sitemap.xml` et `robots.txt` pour le référencement

---

## Checklist

- [ ] Domaine `amtechdz.com` acheté
- [ ] Enregistrements A (et AAAA) créés vers les IP GitHub Pages
- [ ] CNAME `www` → `amtechdzofficial.github.io`
- [ ] Domaine déclaré dans Settings → Pages
- [ ] « DNS check successful » validé
- [ ] « Enforce HTTPS » activé
- [ ] Site accessible sur https://amtechdz.com
