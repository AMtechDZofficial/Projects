# 🔍 Google Search Console — Guide AMtechDZ

Google Search Console (GSC) est l'outil **gratuit** de Google qui permet de :
- demander à Google d'**indexer** votre site (apparaître dans les résultats) ;
- **soumettre votre sitemap** ;
- suivre les **mots-clés** qui amènent des visiteurs et votre position ;
- détecter les éventuelles erreurs.

> URL actuelle du site : `https://amtechdzofficial.github.io/Projects/`
> (à remplacer par `https://amtechdz.com` une fois le domaine actif — voir plus bas).

---

## Étape 1 — Ajouter le site

1. Allez sur **https://search.google.com/search-console**
2. Connectez-vous avec **amtechdzofficial@gmail.com**
3. « Ajouter une propriété » → choisissez le type **« Préfixe d'URL »** (la colonne
   de droite), **pas** « Domaine ».
4. Saisissez exactement (avec le `/` final) :
   ```
   https://amtechdzofficial.github.io/Projects/
   ```
5. Cliquez sur **Continuer**.

> ℹ️ On utilise « Préfixe d'URL » car le domaine `github.io` ne vous appartient
> pas (la vérification par DNS « Domaine » est impossible ici). Quand
> `amtechdz.com` sera actif, on ajoutera une propriété « Domaine » (voir §6).

---

## Étape 2 — Vérifier que le site est à vous

Google propose plusieurs méthodes. **La plus simple ici : la balise HTML.**

### Méthode recommandée — Balise HTML meta

1. Google vous affiche une ligne du type :
   ```html
   <meta name="google-site-verification" content="XXXXXXXXXXXXXXXXXXXXXXXX" />
   ```
2. **Copiez uniquement le code** `content` (la longue chaîne `XXXX...`).
3. ➜ **Envoyez-moi ce code** : je l'ajoute dans le `<head>` du site, je publie,
   et vous n'avez plus qu'à cliquer sur **« Vérifier »** dans Google.

> Alternative : « Importer un fichier HTML ». Google fournit un fichier
> `googleXXXX.html` à placer à la racine du site. Comme `/Projects/` correspond à
> votre dépôt, je peux aussi committer ce fichier — envoyez-le moi si vous
> préférez cette méthode.

---

## Étape 3 — Soumettre le sitemap

Une fois la propriété vérifiée :

1. Menu de gauche → **Sitemaps**
2. Dans « Ajouter un sitemap », saisissez :
   ```
   sitemap.xml
   ```
   (Google le complète en `https://amtechdzofficial.github.io/Projects/sitemap.xml`)
3. Cliquez sur **Envoyer**. Statut attendu : **« Réussite »** (peut prendre un
   peu de temps).

---

## Étape 4 — Demander l'indexation tout de suite

Sans attendre, forcez la découverte de votre page :

1. En haut, dans la barre **« Inspecter une URL »**, collez :
   ```
   https://amtechdzofficial.github.io/Projects/
   ```
2. Appuyez sur Entrée → Google teste l'URL.
3. Cliquez sur **« Demander une indexation »**.

> L'indexation peut prendre de quelques heures à quelques jours. C'est normal.

---

## Étape 5 — Relier votre fiche Google Business

Pour renforcer le référencement local (recherches « dépannage informatique Chlef ») :

- Dans votre **fiche Google Business Profile**, ajoutez le site web :
  `https://amtechdzofficial.github.io/Projects/` (puis `amtechdz.com` plus tard).
- Search Console + fiche Google + site cohérents = meilleur classement local.

---

## Étape 6 — Quand `amtechdz.com` sera actif

1. Dans Search Console : « Ajouter une propriété » → type **« Domaine »** →
   saisissez `amtechdz.com`.
2. Vérification par **enregistrement DNS TXT** (Google fournit la valeur, à
   ajouter chez votre registrar — je documenterai si besoin).
3. Soumettez le nouveau sitemap : `https://amtechdz.com/sitemap.xml`
4. On gardera l'ancienne propriété github.io quelque temps, puis on pourra
   l'abandonner.

> Côté site, dès que le domaine sera en place, je mettrai à jour le `sitemap.xml`,
> les URLs canoniques et les balises Open Graph vers `amtechdz.com`.

---

## Que regarder ensuite (1 fois / semaine)

- **Performances** : les requêtes (mots-clés) qui vous amènent des clics, votre
  position moyenne, le nombre d'impressions.
- **Indexation > Pages** : vérifier que la page est bien « indexée ».
- Utilisez ces données pour ajuster les textes du site (ajouter les mots-clés que
  les gens tapent réellement).

---

## Checklist

- [ ] Propriété « Préfixe d'URL » ajoutée
- [ ] Site vérifié (balise HTML envoyée à intégrer)
- [ ] Sitemap `sitemap.xml` soumis
- [ ] Indexation demandée pour la page d'accueil
- [ ] Site web ajouté dans la fiche Google Business
- [ ] (Plus tard) Propriété « Domaine » pour `amtechdz.com`
