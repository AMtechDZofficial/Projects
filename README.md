# AMtechDZ — Site vitrine

Site web vitrine de **AMtechDZ**, société de consulting et maintenance informatique à domicile basée à Chlef, Algérie.

## Services

- 🔧 Dépannage à domicile (matériel, virus, installation)
- 🛡️ Maintenance préventive (contrats mensuels pour petites entreprises)
- 💾 Sauvegarde de bases de données
- 🔄 Récupération de données
- 📈 Scaling matériel & logiciel
- 🗺️ Consulting & roadmap réseau
- 📡 Installation réseau & Wi-Fi
- 🖥️ Montage & upgrade PC sur mesure
- 🔐 Sécurité informatique

## Structure

- `index.html` — page principale (bilingue FR / AR)
- `style.css` — styles du site (avec support RTL pour l'arabe)
- `app.js` — bascule de langue, formulaire et interactions
- `assets/` — logo et favicon (voir ci-dessous)
- `google-business-profile.md` — kit pour la fiche Google
- `nom-de-domaine.md` — guide du domaine amtechdz.com

## Logo & identité visuelle

Fichiers dans `assets/` (format SVG, vectoriel, redimensionnable sans perte) :

| Fichier | Usage |
|---------|-------|
| `logo-mark.svg` | Icône seule (monogramme « A ») — transparent |
| `favicon.svg` | Favicon du site (onglet du navigateur) |
| `logo.svg` | Logo horizontal (icône + texte) pour fonds clairs |
| `logo-square.svg` | Version carrée 512×512 — **photo de profil Google / réseaux sociaux** |

Couleurs de la marque : turquoise `#2dd4bf` → `#0d9488`, fond sombre `#0b1220`.

> Pour obtenir un PNG (ex. pour Facebook qui n'accepte pas le SVG), ouvrez le SVG
> dans un navigateur et faites une capture, ou demandez-moi de l'exporter.

Site 100 % statique : aucun build, aucune dépendance.

## Fonctionnalités

- 🌐 **Bilingue FR / العربية** — bouton de bascule dans le menu, mise en page RTL automatique en arabe, préférence mémorisée
- 💬 **Bouton WhatsApp flottant** toujours visible
- 📨 **Formulaire de contact** envoyé par e-mail via Formspree (voir configuration ci-dessous)

## Configurer le formulaire (Formspree — gratuit)

Le formulaire envoie les demandes directement dans votre boîte mail. Pour l'activer :

1. Créez un compte gratuit sur **https://formspree.io** avec `amtechdzofficial@gmail.com`
2. Créez un nouveau formulaire ; Formspree vous donne un identifiant, ex. `xeqwabcd`
3. Dans `index.html`, remplacez `VOTRE_ID_FORMSPREE` par cet identifiant :
   `action="https://formspree.io/f/xeqwabcd"`
4. Validez votre adresse au premier envoi de test.

> Tant que l'identifiant n'est pas remplacé, le formulaire bascule
> automatiquement sur l'ouverture du client e-mail (aucune erreur côté visiteur).

## Lancer en local

Ouvrir `index.html` dans un navigateur, ou :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Déploiement

Le site peut être déployé gratuitement sur **GitHub Pages** (Settings → Pages → branche `main`, dossier `/`), Netlify ou Vercel.

## Contact

- 📞 / 💬 WhatsApp : 07 93 97 93 81
- ✉️ amtechdzofficial@gmail.com

## À personnaliser

- La liste des communes de la zone d'intervention
- Les horaires d'ouverture
