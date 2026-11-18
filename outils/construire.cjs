#!/usr/bin/env node
// Construit UN des sites du groupe à partir du code commun.
//
//   node outils/construire.cjs [site] [dossier-sortie]
//
// site : groupe | blanchisserie | proprete. Par défaut, la variable d'environnement
// SITE (réglée dans chaque projet Vercel), sinon « groupe ».
// Sortie : dist/ (c'est ce que Vercel publie, voir vercel.json).
//
// Ce que fait le script, sans aucune dépendance :
//  - copie commun/assets puis sites/<site>/assets (s'il existe) ;
//  - pour chaque page de sites/<site>/ (et les pages communes de commun/ que le site
//    ne redéfinit pas), remplace les marqueurs <!-- @tete -->, <!-- @entete -->,
//    <!-- @pied --> et les jetons {{...}} par la version propre au site ;
//  - génère logo, favicon, sitemap.xml, robots.txt et llms.txt du site ;
//  - vérifie : un seul h1, un title et une description par page.

"use strict";
const fs = require("fs");
const path = require("path");

const RACINE = path.resolve(__dirname, "..");
const COMMUN = path.join(RACINE, "commun");
const RESEAU = JSON.parse(fs.readFileSync(path.join(COMMUN, "reseau.json"), "utf8"));

function devinerSite() {
  if (process.env.SITE) return process.env.SITE;
  const hote = process.env.VERCEL_PROJECT_PRODUCTION_URL || "";
  for (const s of RESEAU.sites) if (hote.includes(s.domaine)) return s.id;
  return "groupe";
}
const SITE_ID = (process.argv[2] || devinerSite()).trim();
const SORTIE = path.resolve(process.argv[3] || path.join(RACINE, "dist"));
const DOSSIER = path.join(RACINE, "sites", SITE_ID);
if (!fs.existsSync(path.join(DOSSIER, "site.json"))) {
  console.error(`Site inconnu : « ${SITE_ID} » (attendu : ${RESEAU.sites.map((s) => s.id).join(", ")}).`);
  process.exit(1);
}
const SITE = { ...RESEAU.sites.find((s) => s.id === SITE_ID), ...JSON.parse(fs.readFileSync(path.join(DOSSIER, "site.json"), "utf8")) };
const URL_SITE = `https://${SITE.domaine}`;
const C = RESEAU.contact;
// Les aperçus Vercel ne doivent pas être indexés ; la production, si.
const PRODUCTION = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const unesc = (s) => String(s).replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

// ── Copie des fichiers ───────────────────────────────────────────────────────
function copier(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const a = path.join(src, e.name), b = path.join(dst, e.name);
    if (e.isDirectory()) copier(a, b);
    else fs.copyFileSync(a, b);
  }
}
fs.rmSync(SORTIE, { recursive: true, force: true });
copier(path.join(COMMUN, "assets"), path.join(SORTIE, "assets"));
copier(path.join(DOSSIER, "assets"), path.join(SORTIE, "assets"));

// ── Logo : une même marque (un A et une vague), une couleur et un nom par site ─
function marque(accent, taille = 40) {
  return `<svg class="brand-mark" width="${taille}" height="${taille}" viewBox="0 0 48 48" aria-hidden="true" focusable="false">` +
    `<rect width="48" height="48" rx="11" fill="#13244A"/>` +
    `<path d="M14.5 35 24 11.5 33.5 35" fill="none" stroke="#FBFAF7" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M9.5 29.5c5-3.6 9.6-3.6 14.5 0s9.5 3.6 14.5 0" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>` +
    `</svg>`;
}
const ACCENT = SITE.couleurs.accent;
fs.writeFileSync(path.join(SORTIE, "assets/img/favicon.svg"),
  marque(ACCENT, 48).replace('class="brand-mark" ', 'xmlns="http://www.w3.org/2000/svg" ').replace(' aria-hidden="true" focusable="false"', ""));
fs.writeFileSync(path.join(SORTIE, "assets/img/logo.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 64" role="img" aria-label="${esc(SITE.nom)}">` +
  `<g transform="translate(8 8)">${marque(ACCENT, 48).replace(/ class="brand-mark"| aria-hidden="true" focusable="false"/g, "")}</g>` +
  `<text x="70" y="34" font-family="Newsreader, Georgia, serif" font-size="26" fill="#13244A">${esc(SITE.nom)}</text>` +
  `<text x="71" y="52" font-family="Figtree, Segoe UI, sans-serif" font-size="12.5" fill="#58617A">${esc(SITE.sous)}</text></svg>`);

// ── Morceaux communs ─────────────────────────────────────────────────────────
const fleche = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6"/></svg>';
const combine = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h3.5l1.8 4.4-2.2 1.4a11 11 0 0 0 6.1 6.1l1.4-2.2L20 15.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/></svg>';
const liens = (l) => l.map(([t, h]) => `<a href="${h}">${esc(t)}</a>`).join("\n        ");
const brand = (cls = "") =>
  `<a class="brand${cls}" href="/" aria-label="${esc(SITE.nom)}, accueil">${marque(ACCENT)}<span class="brand-text"><span class="brand-word">${esc(SITE.nom)}</span><span class="brand-sub">${esc(SITE.sous)}</span></span></a>`;

const ENTETE = `<a class="skip" href="#contenu">Aller au contenu</a>
<header class="site-header band">
  <div class="wrap">
    <div class="header-row">
      ${brand()}
      <nav class="nav" aria-label="Navigation principale">
        ${liens(SITE.nav)}
      </nav>
      <a class="header-tel" href="tel:${C.telLien}">${C.tel}</a>
      <a class="btn btn-navy header-cta" href="${SITE.devis}">Devis gratuit</a>
      <button class="menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Ouvrir le menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3 8h18M3 16h18"/></svg>
      </button>
    </div>
    <nav class="mobile-nav" id="mobile-nav" aria-label="Navigation mobile" hidden>
      ${liens(SITE.nav)}
      <a class="btn btn-navy" href="${SITE.devis}">Demander un devis gratuit</a>
    </nav>
  </div>
</header>`;

const autres = RESEAU.sites.filter((s) => s.id !== SITE_ID);
const colonnes = SITE.pied.map((c) => `<div><h4>${esc(c.titre)}</h4><ul>${c.liens.map(([t, h]) => `<li><a href="${h}">${esc(t)}</a></li>`).join("")}</ul></div>`).join("\n      ");
const reseau = `<div><h4>Le groupe Aveli</h4><ul>${autres.map((s) => `<li><a href="https://${s.domaine}/">${esc(s.nom)}<span class="foot-sub">${esc(s.role)}</span></a></li>`).join("")}</ul></div>\n      <div><h4>Contact</h4><ul><li><a href="tel:${C.telLien}">${C.tel}</a> · <a href="tel:${C.mobileLien}">${C.mobile}</a></li><li><a href="mailto:${C.email}">${C.email}</a></li><li>${esc(C.horaires)}</li><li>${esc(C.rue)}, ${C.cp} ${esc(C.ville)}</li><li><a href="${SITE.devis}">Devis gratuit</a></li></ul></div>`;
const extra = SITE.piedExtra ? fs.readFileSync(path.join(DOSSIER, SITE.piedExtra), "utf8").trim() : "";

const PIED = `<footer class="site-footer navy band">
  <div class="wrap">
    <div class="foot">
      <div>
        ${brand()}
        <p class="tag">${esc(SITE.accroche)}</p>
      </div>
      ${colonnes}
      ${reseau}
    </div>
    ${extra}
    <div class="legal">
      <span>© <span id="year">${new Date().getFullYear()}</span> ${esc(SITE.nom)} · Groupe Aveli, ${esc(C.rue)}, ${C.cp} ${esc(C.ville)}</span>
      <span><a href="/mentions-legales">Mentions légales et confidentialité</a></span>
    </div>
  </div>
</footer>

<nav class="mobile-bar" id="mobile-bar" aria-label="Contact rapide">
  <a class="btn btn-navy" href="${SITE.devis}">Devis gratuit</a>
  <a class="btn btn-call" href="tel:${C.telLien}" aria-label="Appeler le ${C.tel}">${combine}Appeler</a>
</nav>
<script src="/assets/js/main.js" defer></script>`;

const POLICES = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap">';

function tete(page, html) {
  const titre = unesc((html.match(/<title>([^<]*)<\/title>/) || [])[1] || "");
  const desc = unesc((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "");
  const img = (html.match(/<img[^>]+src="(\/assets\/img\/[^"]+\.(?:jpg|jpeg|png|webp))"/) || [])[1] || SITE.image;
  const url = page.slug ? `${URL_SITE}/${page.slug}` : `${URL_SITE}/`;
  const v = Object.entries(SITE.couleurs).filter(([k]) => k !== "accent").map(([k, val]) => `--${k}: ${val};`).join(" ");
  return [
    page.noindex || !PRODUCTION ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow, max-image-preview:large">',
    page.noindex ? "" : `<link rel="canonical" href="${url}">`,
    `<meta name="theme-color" content="#FBFAF7">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(SITE.nom)}">`,
    `<meta property="og:locale" content="fr_FR">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${esc(titre)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:image" content="${URL_SITE}${img}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">`,
    `<link rel="alternate" type="text/plain" title="Résumé pour les assistants IA" href="/llms.txt">`,
    POLICES,
    `<link rel="stylesheet" href="/assets/css/style.css">`,
    `<style>:root { ${v} }</style>`,
  ].filter(Boolean).join("\n");
}

// ── Pages ────────────────────────────────────────────────────────────────────
const pages = new Map();
for (const dir of [COMMUN, DOSSIER]) {
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".html") || f.startsWith("_")) continue;
    pages.set(f, path.join(dir, f)); // une page du site remplace la page commune du même nom
  }
}

const erreurs = [];
const inventaire = [];
for (const [f, src] of [...pages].sort()) {
  let html = fs.readFileSync(src, "utf8");
  const slug = f === "index.html" ? "" : f.replace(/\.html$/, "");
  const page = { slug, noindex: f === "404.html" || /<!-- @noindex -->/.test(html) };
  html = html.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    const valeurs = { nom: SITE.nom, sous: SITE.sous, domaine: SITE.domaine, url: URL_SITE, tel: C.tel, telLien: C.telLien, mobile: C.mobile, mobileLien: C.mobileLien, adresse: `${C.rue}, ${C.cp} ${C.ville}`, email: C.email, horaires: C.horaires, societe: C.societe, devis: SITE.devis };
    if (k in valeurs) return esc(valeurs[k]);
    const s = RESEAU.sites.find((x) => x.id === k);
    if (s) return `https://${s.domaine}`;
    erreurs.push(`${f} : jeton inconnu ${m}`);
    return m;
  });
  html = html.replace(/<script type="application\/ld\+json">(.*?)<\/script>/gs, (m, j) => {
    let o; try { o = JSON.parse(j); } catch { erreurs.push(`${f} : JSON-LD invalide`); return m; }
    if (["LocalBusiness", "Organization"].includes(o["@type"])) {
      o.address = { "@type": "PostalAddress", streetAddress: C.rue, postalCode: C.cp, addressLocality: C.ville, addressCountry: "FR" };
      o.telephone = "+33 9 80 86 81 66";
      o.contactPoint = [{ "@type": "ContactPoint", telephone: "+33 7 63 59 92 27", contactType: "customer service", areaServed: "FR", availableLanguage: "French" }];
    }
    return `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
  });
  html = html.replace("<!-- @noindex -->", "");
  html = html.replace("<!-- @tete -->", () => tete(page, html));
  html = html.replace("<!-- @entete -->", () => ENTETE).replace("<!-- @pied -->", () => PIED);

  const titre = unesc((html.match(/<title>([^<]*)<\/title>/) || [])[1] || "");
  const desc = unesc((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "");
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (!titre) erreurs.push(`${f} : pas de <title>`);
  if (!desc) erreurs.push(`${f} : pas de meta description`);
  if (h1 !== 1) erreurs.push(`${f} : ${h1} titres h1 (il en faut un seul)`);
  if (/<!-- @/.test(html)) erreurs.push(`${f} : marqueur non remplacé`);
  if (desc.length > 165) console.warn(`Attention : ${f} : description longue (${desc.length} caractères).`);

  fs.writeFileSync(path.join(SORTIE, f), html);
  if (!page.noindex) inventaire.push({ slug, titre, desc });
}

// ── sitemap.xml, robots.txt, llms.txt ────────────────────────────────────────
const urlDe = (p) => (p.slug ? `${URL_SITE}/${p.slug}` : `${URL_SITE}/`);
inventaire.sort((a, b) => (a.slug === "" ? -1 : b.slug === "" ? 1 : a.slug.localeCompare(b.slug)));
fs.writeFileSync(path.join(SORTIE, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  inventaire.map((p) => `  <url><loc>${urlDe(p)}</loc></url>`).join("\n") + `\n</urlset>\n`);

const IA = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot"];
fs.writeFileSync(path.join(SORTIE, "robots.txt"), PRODUCTION
  ? `# ${SITE.nom} · ${SITE.domaine}\n# Tous les robots sont les bienvenus, y compris les moteurs de recherche et les\n# assistants IA (résumé du site pour eux : ${URL_SITE}/llms.txt).\n\nUser-agent: *\nAllow: /\n\n` +
    IA.map((b) => `User-agent: ${b}`).join("\n") + `\nAllow: /\n\nSitemap: ${URL_SITE}/sitemap.xml\n`
  : `# Aperçu : ne pas indexer.\nUser-agent: *\nDisallow: /\n`);

const sections = SITE.llms.sections || [];
const groupes = sections.length
  ? sections.map((s) => ({ titre: s.titre, pages: inventaire.filter((p) => new RegExp(s.motif).test(p.slug)) }))
  : [];
const rangees = new Set(groupes.flatMap((g) => g.pages));
const principales = inventaire.filter((p) => !rangees.has(p));
const ligne = (p) => `- [${p.titre}](${urlDe(p)}): ${p.desc}`;
fs.writeFileSync(path.join(SORTIE, "llms.txt"),
  `# ${SITE.nom}\n\n> ${SITE.llms.resume}\n\n${SITE.llms.details.map((d) => `- ${d}`).join("\n")}\n\n` +
  `## Pages\n\n${principales.map(ligne).join("\n")}\n\n` +
  groupes.map((g) => `## ${g.titre}\n\n${g.pages.map(ligne).join("\n")}\n\n`).join("") +
  `## Les autres sites du groupe\n\n${autres.map((s) => `- [${s.nom}](https://${s.domaine}/): ${s.role}`).join("\n")}\n\n` +
  `## Contact\n\n- Téléphone : ${C.tel} (fixe), ${C.mobile} (portable)\n- Adresse : Groupe Aveli, ${C.rue}, ${C.cp} ${C.ville}\n- E-mail : ${C.email}\n- Horaires : ${C.horaires}\n- Devis gratuit et sans engagement : ${URL_SITE}${SITE.devis.replace(/^\//, "/")}\n`);

if (erreurs.length) {
  console.error("Problèmes :\n- " + erreurs.join("\n- "));
  process.exit(1);
}
console.log(`${SITE.nom} (${SITE.domaine}) : ${pages.size} pages construites dans ${path.relative(RACINE, SORTIE) || "."}${PRODUCTION ? "" : " (aperçu, non indexé)"}.`);
