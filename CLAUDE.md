# Sites du Groupe Aveli (trois sites, un seul code)

Ce repo sert **trois sites** au même thème, chacun sur son domaine et son projet Vercel :

| Site | Domaine | Projet Vercel | Variable `SITE` |
|---|---|---|---|
| Groupe Aveli (le groupe) | groupe-aveli.fr | `groupe-aveli` | `groupe` (par défaut) |
| Aveli Blanchisserie | aveli-blanchisserie.fr | `aveli-blanchisserie` | `blanchisserie` |
| Aveli Propreté (nettoyage, pages villes) | aveli-proprete.fr | `aveli-proprete` | `proprete` |

Chaque push sur `main` met les trois sites en ligne ; les autres branches donnent un
aperçu de chacun.

## Organisation (à respecter, prime sur le format « pas de build » du skill)

- `commun/assets/` : CSS, JS et photos partagés. `commun/*.html` : pages présentes sur
  les trois sites (mentions légales, 404), avec des jetons `{{nom}}`, `{{domaine}}`…
- `commun/reseau.json` : coordonnées et liste des trois sites (liens croisés du pied de page).
- `sites/<site>/site.json` : nom, sous-titre, couleur d'accent, menu, pied de page, texte
  du `llms.txt`. `sites/<site>/*.html` : les pages du site (même nom qu'une page
  commune = la remplace). Les fichiers qui commencent par `_` sont des morceaux inclus.
- Dans chaque page : `<!-- @tete -->` (balises SEO, canonical, Open Graph, polices,
  CSS), `<!-- @entete -->` et `<!-- @pied -->` sont remplis à la construction ;
  `{{blanchisserie}}`, `{{proprete}}`, `{{groupe}}` donnent l'adresse de chaque site.
  `<!-- @noindex -->` exclut une page de l'indexation et du sitemap.
- `outils/construire.cjs` (Node, sans dépendance) construit un site dans `dist/` :
  logo et favicon, `sitemap.xml`, `robots.txt` (aperçus non indexés) et `llms.txt` sont
  générés. Vercel le lance tout seul (`vercel.json`). En local :
  `node outils/construire.cjs proprete /tmp/x` puis copier le vérificateur du skill dans
  `/tmp/x/.claude/skills/site-web/` et le lancer depuis là.
- Contenu distinct par site, pour le référencement : ne pas recopier un même bloc de
  texte sur deux sites. Les pages villes vivent sur aveli-proprete.fr ; les anciennes
  adresses de groupe-aveli.fr y sont redirigées (`vercel.json`).

Pour toute demande sur le contenu, le design ou les pages, suivre le skill `site-web`
(`.claude/skills/site-web/SKILL.md`). Ce skill est mis à jour automatiquement depuis
`arthurk-websites/hub` : ne pas le modifier ici.

Domaine personnalisé (OVH, Vercel…) : ça se fait depuis `arthurk-websites/hub`, voir la section
« Domaine » du skill.

## Notes du site

Mettre à jour cette section quand des décisions durables sont prises (public visé,
ton, couleurs, polices, coordonnées, pages prévues, ce qui reste à compléter).

- Nom technique : `groupe-aveli` (repo), sites `groupe`, `blanchisserie`, `proprete`
- Logos : même marque (un « A » et une vague sur carré marine), couleur de vague propre
  à chaque site : or (groupe), bleu (blanchisserie), vert sauge (propreté). Générés par
  le script de construction.
- Activité : blanchisserie professionnelle et propreté de locaux (entreprises, hôtels,
  campings, locations saisonnières, particuliers). Pas encore de SIRET (immatriculation en cours, nov. 2026) : n'en afficher aucun.
- Coordonnées (dans `commun/reseau.json`) : Groupe Aveli, 12 rue Jules Ferry, 83170 Brignoles ;
  fixe 09 80 86 81 66, portable 07 63 59 92 27 ; contact@groupe-aveli.fr ; lun.–sam. 8 h–19 h.
- Domaine : groupe-aveli.fr (acheté chez OVH, DNS chez OVH, site sur Vercel ; www redirige vers groupe-aveli.fr). Le site prestige-nettoyage.fr
  reste en ligne à part : ne pas le rediriger.
- Design (refonte de novembre 2026) : fond papier clair (#FBFAF7) et sable (#F3EFE7), bleu
  marine (#13244A) réservé à la zone devis et au pied de page, or (#B8893D) en simple accent.
  Polices Newsreader (titres) et Figtree (texte). Style sobre et « naturel » : pas d'icônes
  décoratives, pas de titres en majuscules espacées, pas de mot en italique doré dans les
  titres, pas de logo 3D. En-tête = nom en texte + téléphone + bouton devis.
- Pages : groupe = accueil (sociétés, références, territoire, carrières) ; blanchisserie =
  accueil + linge-hotelier, linge-locations-saisonnieres, vetements-de-travail ;
  propreté = accueil + 39 pages « entreprise-de-nettoyage-<ville> » (13, 83, 06, 84, 34,
  69). En ajoutant une ville : mettre à jour la section Territoire de
  `sites/proprete/index.html`, `sites/proprete/_villes.html` et les encadrés « villes
  voisines » (le sitemap est automatique).
- Photos : photos libres (Pexels) ; pour certaines petites villes, la photo montre un
  lieu proche et la légende le dit.
- Reste à faire : brancher les formulaires de devis et de candidature (ils préparent un
  récapitulatif à copier mais n'envoient rien) ; mentions légales : directeur de la publication
  (« [À compléter] ») et SIRET quand il existera.
