#!/usr/bin/env node
// Vérifie le site statique : sert le dossier en local, ouvre chaque page en mobile
// et en ordinateur avec Chromium (Playwright) et signale les problèmes.
//
// Usage : node .claude/skills/site-web/verifier.cjs [dossier-captures]
// Sortie : liste des problèmes, captures PNG ; code 1 s'il y a un problème.

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error("Playwright introuvable : vérification visuelle impossible dans cet environnement.");
  process.exit(2);
}

const RACINE = path.resolve(__dirname, "../../..");
const CAPTURES = path.resolve(process.argv[2] || path.join(os.tmpdir(), "captures-site"));
const IGNORE = new Set([".git", ".claude", "node_modules", ".vercel"]);
const TAILLES = [
  { nom: "mobile", width: 390, height: 844 },
  { nom: "ordinateur", width: 1280, height: 800 },
];
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif",
  ".gif": "image/gif", ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff",
  ".pdf": "application/pdf", ".txt": "text/plain", ".xml": "application/xml",
  ".mp4": "video/mp4", ".webm": "video/webm",
};

function pagesHtml(dir, base = "") {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(e.name)) continue;
    const rel = path.posix.join(base, e.name);
    if (e.isDirectory()) out.push(...pagesHtml(path.join(dir, e.name), rel));
    else if (e.name.endsWith(".html")) out.push(rel);
  }
  return out;
}

// Résolution comme Vercel avec cleanUrls : /contact -> contact.html, /dossier -> dossier/index.html
function resoudre(urlPath) {
  let p = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  if (p.endsWith("/")) p += "index.html";
  const candidats = [p, p + ".html", path.posix.join(p, "index.html")];
  for (const c of candidats) {
    const abs = path.join(RACINE, path.posix.normalize(c));
    if (!abs.startsWith(RACINE)) return null;
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
  }
  return null;
}

const serveur = http.createServer((req, res) => {
  const fichier = resoudre(req.url);
  if (!fichier) {
    const p404 = path.join(RACINE, "404.html");
    res.writeHead(404, { "Content-Type": TYPES[".html"] });
    return res.end(fs.existsSync(p404) ? fs.readFileSync(p404) : "404");
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(fichier).toLowerCase()] || "application/octet-stream" });
  res.end(fs.readFileSync(fichier));
});

(async () => {
  await new Promise((r) => serveur.listen(0, "127.0.0.1", r));
  const origine = `http://127.0.0.1:${serveur.address().port}`;
  fs.mkdirSync(CAPTURES, { recursive: true });

  const pages = pagesHtml(RACINE).filter((p) => p !== "404.html");
  const problemes = [];
  const liensVus = new Map(); // url -> page d'origine
  const navigateur = await chromium.launch();

  for (const page of pages) {
    const url = origine + "/" + page.replace(/(^|\/)index\.html$/, "$1").replace(/\.html$/, "");
    for (const t of TAILLES) {
      const ctx = await navigateur.newContext({ viewport: { width: t.width, height: t.height } });
      const onglet = await ctx.newPage();
      const signaler = (m) => problemes.push(`[${page} · ${t.nom}] ${m}`);
      onglet.on("pageerror", (e) => signaler(`erreur JavaScript : ${e.message}`));
      onglet.on("console", (m) => { if (m.type() === "error") signaler(`console : ${m.text()}`); });
      onglet.on("response", (r) => {
        if (r.url().startsWith(origine) && r.status() >= 400) signaler(`ressource introuvable (${r.status()}) : ${r.url().slice(origine.length)}`);
      });
      try {
        await onglet.goto(url, { waitUntil: "networkidle", timeout: 20000 });
      } catch (e) {
        signaler(`chargement impossible : ${e.message.split("\n")[0]}`);
        await ctx.close();
        continue;
      }
      const info = await onglet.evaluate(() => ({
        debord: document.documentElement.scrollWidth - window.innerWidth,
        imagesCassees: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute("src")),
        sansAlt: [...document.images].filter((i) => !i.hasAttribute("alt")).map((i) => i.getAttribute("src")),
        liens: [...document.querySelectorAll("a[href]")].map((a) => a.href),
        titre: document.title,
        description: document.querySelector('meta[name="description"]')?.content || "",
        h1: document.querySelectorAll("h1").length,
        lang: document.documentElement.lang,
        aFaire: (document.body.innerText.match(/\[À compléter[^\]]*\]/g) || []).length,
      }));
      if (info.debord > 1) signaler(`défilement horizontal (${info.debord} px de trop)`);
      info.imagesCassees.forEach((s) => signaler(`image cassée : ${s}`));
      if (t.nom === "mobile") {
        info.sansAlt.forEach((s) => signaler(`image sans attribut alt : ${s}`));
        if (!info.titre) signaler("pas de <title>");
        if (!info.description) signaler('pas de <meta name="description">');
        if (info.h1 !== 1) signaler(`${info.h1} titre(s) h1 (il en faut exactement 1)`);
        if (info.lang !== "fr") signaler(`langue de la page : "${info.lang}" (attendu "fr")`);
        if (info.aFaire) console.log(`À compléter : ${info.aFaire} élément(s) sur ${page}`);
        info.liens.filter((l) => l.startsWith(origine)).forEach((l) => { if (!liensVus.has(l)) liensVus.set(l, page); });
      }
      const nomCapture = `${page.replace(/\//g, "_").replace(/\.html$/, "")}-${t.nom}.png`;
      await onglet.screenshot({ path: path.join(CAPTURES, nomCapture), fullPage: true });
      await ctx.close();
    }
  }
  await navigateur.close();

  // Liens internes
  for (const [lien, page] of liensVus) {
    const chemin = new URL(lien).pathname;
    if (!resoudre(chemin)) problemes.push(`[${page}] lien interne cassé : ${chemin}`);
  }
  serveur.close();

  console.log(`Pages vérifiées : ${pages.length} (${pages.join(", ")})`);
  console.log(`Captures : ${CAPTURES}`);
  if (problemes.length) {
    console.log(`\n${problemes.length} problème(s) :`);
    [...new Set(problemes)].forEach((p) => console.log(" - " + p));
    process.exit(1);
  }
  console.log("Aucun problème détecté.");
})().catch((e) => { console.error(e); serveur.close(); process.exit(2); });
