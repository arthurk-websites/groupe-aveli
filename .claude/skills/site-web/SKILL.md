---
name: site-web
description: Construire et faire évoluer ce site vitrine statique (HTML, CSS, JavaScript simple) hébergé sur Vercel. À utiliser pour toute demande sur le site : créer ou modifier des pages, du texte, le design, des images, reprendre un artefact ou du code HTML collé, mettre en ligne, ou brancher un nom de domaine.
---

# Travailler sur ce site

La personne qui demande n'est pas développeuse. Elle décrit ce qu'elle veut, envoie
parfois un artefact ou du code. Ton travail : comprendre, demander ce qui manque,
construire proprement, vérifier, pousser, et donner le lien pour voir le résultat.
Parle simplement, sans jargon. Pas de commande à lui faire taper.

## 1. Comprendre avant de construire

Lis d'abord `CLAUDE.md` (section « Notes du site ») et les pages existantes.

Si la demande est floue ou si c'est le premier vrai contenu du site, pose **une seule
série de questions groupées** (outil AskUserQuestion, 4 questions au plus, avec des
choix proposés). Ne demande que ce qui change vraiment le résultat :

- l'activité et le but du site (présenter, prendre des contacts, réserver…) ;
- les pages voulues (une seule page longue ou plusieurs) ;
- le style : ambiance, couleurs, un site qu'elle aime bien ;
- les contenus disponibles : textes, logo, photos, coordonnées, horaires, réseaux.

Pour le reste, choisis toi-même avec bon sens et dis-le en une ligne. Pour un petit
changement (« change le numéro », « mets le titre en bleu »), ne pose pas de question :
fais-le.

Quand des décisions durables sont prises (couleurs, polices, ton, coordonnées, pages),
note-les dans la section « Notes du site » de `CLAUDE.md`.

## 2. Format technique (à respecter strictement)

- **HTML, CSS et JavaScript simples.** Pas de React, Vue, Svelte, Tailwind, npm,
  `package.json`, bundler ni étape de build. Vercel sert les fichiers tels quels.
- Structure :
  - pages à la racine : `index.html`, `contact.html`, `services.html`… (servies à
    `/contact`, `/services` grâce à `cleanUrls` dans `vercel.json`) ;
  - `assets/css/style.css` (un seul fichier, variables de couleur dans `:root`) ;
  - `assets/js/main.js` (seulement si utile ; pas de bibliothèque sauf vraie nécessité) ;
  - `assets/img/` pour les images ; `404.html` pour les adresses inconnues.
- Liens internes en chemins absolus sans `.html` : `href="/contact"`, `src="/assets/img/x.webp"`.
- Chaque page : `<html lang="fr">`, `<meta name="viewport">`, un `<title>` et une
  `<meta name="description">` propres à la page, balises Open Graph, favicon, même
  en-tête et même pied de page que les autres pages.
- Responsive d'abord pour mobile (testé à 390 px de large), sans défilement horizontal.
- Accessible : contrastes suffisants, `alt` sur les images, titres dans l'ordre
  (un seul `h1` par page), boutons et liens utilisables au clavier.
- Polices : celles du système, ou Google Fonts (2 polices au plus).
- Images : formats web (WebP ou JPEG optimisé, SVG pour les logos), largeur 2000 px
  au plus, `width`/`height` renseignés, `loading="lazy"` sous la ligne de flottaison.
  Si Pillow (`python3 -c "import PIL"`) ou ImageMagick est disponible, redimensionne et
  compresse les photos reçues.
- Jamais d'image prise au hasard sur internet (droits d'auteur). Sans photo fournie,
  utilise un bloc coloré ou une illustration CSS/SVG simple, et signale-le.
- Jamais de faux contenu présenté comme vrai : pas de faux avis, de faux chiffres ni
  de fausses coordonnées. Les éléments manquants s'écrivent `[À compléter : …]`,
  et tu les listes à la fin de ta réponse.
- Formulaires : pas de serveur ici. Propose un lien `mailto:` ou un service de
  formulaire (Formspree, Web3Forms…) dont la personne crée elle-même le compte.
  Ne mets jamais de clé secrète dans le code.
- Pas de suivi ni de cookies tiers (Google Analytics…) sans le demander. Si besoin,
  propose Vercel Web Analytics, sans cookie.
- Site d'une entreprise française : prévoir une page `mentions-legales.html` (éditeur,
  directeur de la publication, hébergeur : Vercel Inc., avec l'adresse indiquée sur
  vercel.com/legal) et demander les informations manquantes (raison sociale, SIRET,
  adresse, contact).

## 3. Reprendre un artefact ou du code collé

La personne peut avoir fait une maquette ailleurs (artefact Claude, autre outil) :

- Lien `claude.ai/...artifact...` : lis-le avec l'outil Artifact (`action: "read"`).
  Si ce n'est pas possible, demande-lui de coller le code ou d'envoyer le fichier.
- Code collé ou fichier envoyé : garde le design et le contenu, mais remets-le au
  format ci-dessus :
  - CSS dans `assets/css/style.css`, JS dans `assets/js/main.js` ;
  - React, JSX, Tailwind ou autres dépendances via CDN convertis en HTML et CSS simples ;
  - tout ce qui ne marche que dans un artefact supprimé (`window.claude`, stockage
    d'artefact, imports d'API) ;
  - une maquette d'une seule page découpée en vraies pages si plusieurs sont prévues ;
  - images en base64 extraites dans `assets/img/`.
- Fusionne avec l'existant au lieu d'écraser : garde l'en-tête, le pied de page, les
  pages et les mentions déjà en place, sauf demande contraire.

## 4. Vérifier avant chaque push

```bash
node .claude/skills/site-web/verifier.cjs
```

Le script sert le site en local, ouvre chaque page en mobile (390 px) et en ordinateur
(1280 px), puis signale les liens ou images cassés, les erreurs JavaScript et le
défilement horizontal. Il enregistre aussi des captures. Corrige tout ce qu'il signale.
Regarde au moins les captures de la page d'accueil (outil Read sur les PNG) pour
vérifier que le rendu est réussi, pas seulement qu'il est sans erreur.

## 5. Commit, push, aperçu, mise en ligne

- Des commits courts et cohérents, avec un message en français qui dit ce qui change
  pour le visiteur (« Ajoute la page Contact avec le plan d'accès »).
- **Travaille sur une branche d'aperçu, jamais directement sur `main`.** Si tu es sur
  `main` (repo attaché depuis le hub), crée d'abord une branche au nom court :
  `git switch -c apercu-$(date +%m%d-%H%M)`. Sinon garde la branche de la session.
  Pousse-la (`git push -u origin HEAD`) : Vercel construit un aperçu en environ une
  minute. Pour savoir quand il est prêt et obtenir les liens :

  ```bash
  sha=$(git rev-parse HEAD); repo=$(git remote get-url origin | sed -E 's#.*github.com[:/]##; s#\.git$##')
  gh api "repos/$repo/commits/$sha/statuses" -q '[.[] | select(.context=="Vercel")][0] | "\(.state) \(.target_url)"'
  ```

  Répéter toutes les 10 secondes jusqu'à `success` (ou `failure`/`error` : le
  `target_url` mène au journal Vercel). Donner alors à la personne :
  - **le lien d'aperçu** :
    `https://<site>-git-<branche>-arthur-3497.vercel.app`, où `<site>` est le nom du
    repo et `<branche>` le nom de la branche en minuscules, chaque caractère qui n'est
    ni une lettre ni un chiffre remplacé par `-` (ex. `claude/ajout-carte` devient
    `claude-ajout-carte`). Si l'adresse dépasse 63 caractères avant `.vercel.app`,
    Vercel la raccourcit : donner plutôt le second lien ;
  - **le lien Vercel** (`target_url`) : la page du déploiement, avec un bouton
    « Visit » vers l'aperçu.

  Les aperçus sont privés : il faut être connecté à vercel.com avec un compte de
  l'équipe `arthur-3497` pour les ouvrir (sinon Vercel affiche une page de connexion).
  Le dire la première fois. Le site en production, lui, est public.
- **Mise en ligne** seulement quand la personne la demande (« mets en ligne », « c'est
  bon, publie ») :

  ```bash
  git fetch origin main && git rebase origin/main && git push origin HEAD:main
  ```

  Si le push sur `main` est refusé, ouvre une pull request
  (`gh api repos/$repo/pulls -f title=... -f head=<branche> -f base=main`) et
  explique qu'il suffit de cliquer sur « Merge » dans GitHub (site ou app mobile).
  Le site en production se met à jour environ une minute après.
- Ne modifie pas `.claude/skills/` : ce dossier est mis à jour depuis le repo hub.

## 6. Domaine

Brancher un domaine (acheté chez OVH, chez Vercel ou ailleurs) se fait depuis le repo
`arthurk-websites/hub`, qui détient l'accès Vercel. Deux possibilités :

- Dire à la personne d'ouvrir une session Claude Code sur `arthurk-websites/hub` et
  de demander « branche le domaine exemple.fr sur le site <nom> ».
- Ou, si l'outil `add_repo` est disponible, attacher `arthurk-websites/hub` à cette
  session et suivre son skill `domaine`.

Le nom technique du site est le nom de ce repo.
