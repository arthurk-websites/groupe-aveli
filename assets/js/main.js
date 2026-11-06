(function () {
  "use strict";

  // Mobile menu
  var toggle = document.getElementById("menu-toggle");
  var mnav = document.getElementById("mobile-nav");
  function setMenu(open) { mnav.hidden = !open; toggle.setAttribute("aria-expanded", String(open)); toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu"); }
  toggle.addEventListener("click", function () { setMenu(mnav.hidden); });
  mnav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });

  // Gold and blue ribbons behind the two trades, echoing the waves of the logo.
  (function () {
  var canvas = document.getElementById("ribbons");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var RIBBONS = [
    { y: 0.20, amp: 0.07, k: 1.6, ph: 0.4, th: 0.035, a: 0.16, c0: "230,201,139", c1: "196,154,78" },
    { y: 0.24, amp: 0.06, k: 1.7, ph: 0.9, th: 0.022, a: 0.12, c0: "120,150,214", c1: "43,67,121" },
    { y: 0.86, amp: 0.05, k: 1.3, ph: 2.2, th: 0.03, a: 0.12, c0: "230,201,139", c1: "196,154,78" }
  ];
  function draw(t) {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    RIBBONS.forEach(function (r, i) {
      var phase = r.ph + (reduce ? 0 : t * 0.00012 * (i % 2 ? -1 : 1));
      var steps = 80, top = [], bot = [];
      for (var s = 0; s <= steps; s++) {
        var x = (s / steps) * w;
        var u = s / steps;
        var yc = h * r.y + Math.sin(u * Math.PI * r.k + phase) * h * r.amp;
        var thick = h * r.th * (0.25 + 0.75 * Math.sin(u * Math.PI));
        top.push([x, yc - thick / 2]); bot.push([x, yc + thick / 2]);
      }
      var g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "rgba(" + r.c0 + ",0)");
      g.addColorStop(0.4, "rgba(" + r.c0 + "," + r.a + ")");
      g.addColorStop(0.75, "rgba(" + r.c1 + "," + (r.a * 0.9) + ")");
      g.addColorStop(1, "rgba(" + r.c1 + ",0)");
      ctx.beginPath();
      ctx.moveTo(top[0][0], top[0][1]);
      top.forEach(function (p) { ctx.lineTo(p[0], p[1]); });
      for (var j = bot.length - 1; j >= 0; j--) ctx.lineTo(bot[j][0], bot[j][1]);
      ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    });
  }
  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size(); draw(0);
  var visible = false;
  if ("IntersectionObserver" in window && !reduce) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }).observe(canvas);
    (function loop(t) { if (visible) draw(t); requestAnimationFrame(loop); })(0);
  }
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { size(); draw(performance.now()); }, 120); });
  })();

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

  // Floating contact panel
  (function () {
    var fab = document.getElementById("contact-fab");
    var panel = document.getElementById("contact-panel");
    var status = document.getElementById("panel-status");
    function setOpen(open) {
      panel.hidden = !open; fab.setAttribute("aria-expanded", String(open)); status.textContent = "";
      if (open) document.getElementById("panel-close").focus(); else fab.focus();
    }
    fab.addEventListener("click", function () { setOpen(panel.hidden); });
    document.getElementById("panel-close").addEventListener("click", function () { setOpen(false); });
    document.getElementById("panel-quote").addEventListener("click", function () { panel.hidden = true; fab.setAttribute("aria-expanded", "false"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) setOpen(false); });
    document.addEventListener("click", function (e) { if (!panel.hidden && !panel.contains(e.target) && !fab.contains(e.target)) { panel.hidden = true; fab.setAttribute("aria-expanded", "false"); } });
    panel.querySelectorAll(".copy").forEach(function (b) {
      b.addEventListener("click", function () {
        var text = b.getAttribute("data-copy");
        function fallback() { var v = b.parentNode.querySelector(".v"); var r = document.createRange(); r.selectNodeContents(v); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); status.textContent = "Sélectionné : copiez avec Ctrl+C (ou ⌘+C)."; }
        try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { status.textContent = "Copié : " + text; }, fallback); else fallback(); } catch (err) { fallback(); }
      });
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

  document.getElementById("year").textContent = String(new Date().getFullYear());
})();
