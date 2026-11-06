(function () {
  "use strict";

  // Mobile menu
  var toggle = document.getElementById("menu-toggle");
  var mnav = document.getElementById("mobile-nav");
  function setMenu(open) { mnav.hidden = !open; toggle.setAttribute("aria-expanded", String(open)); toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu"); }
  toggle.addEventListener("click", function () { setMenu(mnav.hidden); });
  mnav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });

  // Quote form: five fields, a recap the visitor can copy and send.
  (function () {
    var form = document.getElementById("quote-form");
    var start = document.getElementById("quote-start");
    var errorEl = document.getElementById("form-error");
    var recap = document.getElementById("recap");
    var recapText = document.getElementById("recap-text");
    var copyStatus = document.getElementById("copy-status");
    function val(name) {
      var el = form.elements[name];
      if (!el) return "";
      if (el.length !== undefined && el.tagName !== "SELECT") { for (var i = 0; i < el.length; i++) if (el[i].checked) return el[i].value; return ""; }
      return (el.value || "").trim();
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = val("email"), tel = val("telephone"), missing = [];
      if (!val("nom")) missing.push("votre nom");
      if (!tel && !email) missing.push("un téléphone ou un e-mail");
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) missing.push("un e-mail valide");
      if (!val("ville")) missing.push("votre ville");
      if (missing.length) { errorEl.textContent = "Il manque " + missing.join(", ") + "."; errorEl.hidden = false; return; }
      errorEl.hidden = true;
      var lines = ["Demande de devis gratuit · Groupe Aveli", "", "Besoin : " + val("besoin"), "Nom : " + val("nom")];
      if (tel) lines.push("Téléphone : " + tel);
      if (email) lines.push("E-mail : " + email);
      lines.push("Ville : " + val("ville"));
      if (val("message")) lines.push("", "Message :", val("message"));
      recapText.textContent = lines.join("\n");
      document.getElementById("recap-name").textContent = val("nom").split(" ")[0];
      copyStatus.textContent = "";
      form.hidden = true; start.hidden = true; recap.hidden = false; recap.focus();
    });
    document.getElementById("edit-recap").addEventListener("click", function () { recap.hidden = true; form.hidden = false; start.hidden = false; document.getElementById("f-nom").focus(); });
    document.getElementById("copy-recap").addEventListener("click", function () {
      function fallback() { var r = document.createRange(); r.selectNodeContents(recapText); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); copyStatus.textContent = "Texte sélectionné : copiez-le avec Ctrl+C (ou ⌘+C)."; }
      try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(recapText.textContent).then(function () { copyStatus.textContent = "Récapitulatif copié."; }, fallback); else fallback(); } catch (err) { fallback(); }
    });
  })();

  // Application form: same recap mechanics.
  (function () {
    var jf = document.getElementById("job-form");
    if (!jf) return;
    var jerr = document.getElementById("job-error");
    var jrecap = document.getElementById("job-recap");
    var jtext = document.getElementById("job-recap-text");
    var jstatus = document.getElementById("job-copy-status");
    function jv(name) { var el = jf.elements[name]; return el ? (el.value || "").trim() : ""; }
    jf.addEventListener("submit", function (e) {
      e.preventDefault();
      var missing = [];
      if (!jv("prenom")) missing.push("votre prénom");
      if (!jv("nom")) missing.push("votre nom");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(jv("email"))) missing.push("un e-mail valide");
      if (!jv("telephone")) missing.push("votre téléphone");
      if (missing.length) { jerr.textContent = "Il manque " + missing.join(", ") + "."; jerr.hidden = false; return; }
      jerr.hidden = true;
      var lines = ["Candidature · Groupe Aveli", "", "Nom : " + jv("prenom") + " " + jv("nom"), "E-mail : " + jv("email"), "Téléphone : " + jv("telephone"), "Poste : " + jv("poste"), "CV : " + (jv("cv") || "à joindre")];
      if (jv("message")) lines.push("", "Message :", jv("message"));
      jtext.textContent = lines.join("\n");
      document.getElementById("job-recap-name").textContent = jv("prenom");
      jstatus.textContent = "";
      jf.hidden = true; jrecap.hidden = false; jrecap.focus();
    });
    document.getElementById("job-edit").addEventListener("click", function () { jrecap.hidden = true; jf.hidden = false; document.getElementById("j-prenom").focus(); });
    document.getElementById("job-copy").addEventListener("click", function () {
      function fallback() { var r = document.createRange(); r.selectNodeContents(jtext); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); jstatus.textContent = "Texte sélectionné : copiez-le avec Ctrl+C (ou ⌘+C)."; }
      try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(jtext.textContent).then(function () { jstatus.textContent = "Récapitulatif copié."; }, fallback); else fallback(); } catch (err) { fallback(); }
    });
  })();

  // Mobile action bar: steps aside while the quote form or the footer is on screen.
  (function () {
    var bar = document.getElementById("mobile-bar");
    if (!("IntersectionObserver" in window)) return;
    var seen = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
      bar.classList.toggle("away", seen.size > 0);
    }, { threshold: 0, rootMargin: "0px 0px -40% 0px" });
    io.observe(document.getElementById("devis"));
  })();

  // Sections fade in gently as they scroll into view.
  (function () {
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var items = document.querySelectorAll(".block .head, .trade, .sector, .figure, .stage, .dept, .promise, .faq details, .served, .duo figure");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  })();

  document.getElementById("year").textContent = String(new Date().getFullYear());
})();
