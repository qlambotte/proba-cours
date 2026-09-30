/* ============================================================
   proba.js — figures du module typweb « proba » : arbres, arbre
   double, diagrammes de Venn (partitions : CSS seul), simulateur
   (lancers de dés, pièce, urne, Monty Hall : histogrammes après n
   répétitions et stabilisation des fréquences).
   Les étiquettes sont du HTML produit par Quarto (maths MathJax,
   réponses cachées .rep gérées par reponses.js) ; ce script les
   place et trace les traits en SVG. Aucune dépendance.
   Même géométrie que proba-lib.typ (PDF).
   ============================================================ */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";

  function el(nom, attrs, parent) {
    var e = document.createElementNS(NS, nom);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function enfants(fig, sel) {
    return Array.prototype.filter.call(fig.querySelectorAll(sel), function (e) {
      return e.closest(".pb-fig") === fig;
    });
  }
  function scene(fig) {
    var sc = fig.querySelector(":scope > .pb-scene");
    if (sc) return sc;
    sc = document.createElement("div");
    sc.className = "pb-scene";
    Array.prototype.slice.call(fig.children).forEach(function (c) {
      if (c.classList.contains("pb-n") || c.classList.contains("pb-p") || c.classList.contains("pb-z") ||
          c.classList.contains("pb-nom") || c.classList.contains("pb-univers")) sc.appendChild(c);
    });
    fig.insertBefore(sc, fig.firstChild);
    return sc;
  }
  function svgDe(sc) {
    var s = sc.querySelector(":scope > svg.pb-traits");
    if (!s) { s = el("svg", { "class": "pb-traits" }); sc.insertBefore(s, sc.firstChild); }
    while (s.firstChild) s.removeChild(s.firstChild);
    return s;
  }
  function ligne(s, x1, y1, x2, y2) { el("line", { x1: x1, y1: y1, x2: x2, y2: y2 }, s); }

  // ---------------------------------------------------------------- arbre
  function arbre(fig) {
    var sc = scene(fig);
    var noeuds = enfants(fig, ".pb-n"), ps = enfants(fig, ".pb-p");
    if (!noeuds.length) return;
    var parId = {}, maxW = [], gapP = [], hMax = 0;
    noeuds.forEach(function (n) {
      var niv = +n.dataset.niv;
      parId[n.dataset.id] = n;
      maxW[niv] = Math.max(maxW[niv] || 0, n.offsetWidth);
      hMax = Math.max(hMax, n.offsetHeight);
    });
    var pPour = {};
    ps.forEach(function (p) {
      pPour[p.dataset.pour] = p;
      var n = parId[p.dataset.pour];
      if (!n) return;
      var niv = +n.dataset.niv;
      gapP[niv] = Math.max(gapP[niv] || 0, p.offsetWidth);
      hMax = Math.max(hMax, p.offsetHeight * 0.9);
    });
    var gauche = [0];
    for (var i = 1; i < maxW.length; i++) gauche[i] = gauche[i - 1] + maxW[i - 1] + Math.max(60, (gapP[i] || 0) * 1.6 + 20);
    var rangH = Math.max(hMax + 20, 40), F = +fig.dataset.feuilles || 1;
    var L = gauche[maxW.length - 1] + maxW[maxW.length - 1] + 6, H = F * rangH;
    sc.style.width = L + "px"; sc.style.height = H + "px";
    var s = svgDe(sc);
    s.setAttribute("width", L); s.setAttribute("height", H);
    var pos = {};
    noeuds.forEach(function (n) {
      var niv = +n.dataset.niv, y = (+n.dataset.y + 0.5) * rangH;
      var x = niv === 0 ? gauche[0] + maxW[0] - n.offsetWidth : gauche[niv];
      n.style.left = x + "px"; n.style.top = (y - n.offsetHeight / 2) + "px";
      pos[n.dataset.id] = { x: x, y: y, w: n.offsetWidth };
    });
    noeuds.forEach(function (n) {
      var pa = n.dataset.parent;
      if (!pa || !pos[pa]) return;
      var a = pos[pa], b = pos[n.dataset.id];
      var x1 = a.x + a.w + 2, x2 = b.x - 2;
      ligne(s, x1, a.y, x2, b.y);
      var p = pPour[n.dataset.id];
      if (p) {
        var mx = x1 + 0.55 * (x2 - x1), my = a.y + 0.55 * (b.y - a.y);
        var w = p.offsetWidth, h = p.offsetHeight, px, py;
        if (b.y < a.y - 1) { px = mx - w - 1; py = my - h - 1; }        // branche montante : au-dessus
        else if (b.y > a.y + 1) { px = mx - w - 1; py = my + 1; }       // descendante : en dessous
        else { px = mx - w / 2; py = my - h - 2; }
        p.style.left = px + "px"; p.style.top = py + "px";
      }
    });
  }

  // ---------------------------------------------------------------- arbre double
  function double(fig) {
    var sc = scene(fig);
    var noeuds = enfants(fig, ".pb-n");
    var wMax = 0, hMax = 0, pos = {};
    noeuds.forEach(function (n) { wMax = Math.max(wMax, n.offsetWidth); hMax = Math.max(hMax, n.offsetHeight); });
    var colW = wMax + 24, rangH = hMax + 38;
    var L = 4 * colW, H = 5 * rangH;
    sc.style.width = L + "px"; sc.style.height = H + "px";
    var s = svgDe(sc);
    s.setAttribute("width", L); s.setAttribute("height", H);
    noeuds.forEach(function (n) {
      var cx = (+n.dataset.col + 0.5) * colW, cy = (+n.dataset.rang + 0.5) * rangH;
      n.style.left = (cx - n.offsetWidth / 2) + "px"; n.style.top = (cy - n.offsetHeight / 2) + "px";
      pos[n.dataset.id] = { x: cx, y: cy, h: n.offsetHeight };
    });
    var aretes = [];
    try { aretes = JSON.parse(fig.dataset.aretes || "[]"); } catch (e) { aretes = []; }
    aretes.forEach(function (ar) {
      var a = pos[ar[0]], b = pos[ar[1]];
      if (a && b) ligne(s, a.x, a.y + a.h / 2 + 2, b.x, b.y - b.h / 2 - 2);
    });
  }

  // ---------------------------------------------------------------- Venn
  function geo(n, inclus, disjoints) {
    if (disjoints) return { W: 8, H: 4.2, c: [[2.45, 2.1, 1.4], [5.55, 2.1, 1.4]],
      pos: { a: [2.45, 2.1], b: [5.55, 2.1], dehors: [0.55, 0.35] }, noms: [[1.2, 3.65], [6.8, 3.65]] };
    if (inclus) return { W: 8, H: 4.2, c: [[4, 2.1, 1.85], [4.55, 1.95, 0.95]],
      pos: { a: [2.75, 2.5], b: [4.55, 1.95], dehors: [0.55, 0.35] }, noms: [[2.35, 3.75], [4.55, 3.15]] };
    if (n === 1) return { W: 8, H: 4.2, c: [[4, 2.1, 1.6]], pos: { a: [4, 2.1], dehors: [0.55, 0.35] }, noms: [[2.75, 3.6]] };
    if (n === 2) return { W: 8, H: 4.2, c: [[3.15, 2.1, 1.55], [4.85, 2.1, 1.55]],
      pos: { a: [2.45, 2.1], ab: [4, 2.1], b: [5.55, 2.1], dehors: [0.55, 0.35] }, noms: [[1.75, 3.55], [6.25, 3.55]] };
    return { W: 8, H: 4.8, c: [[3.35, 2.95, 1.35], [4.65, 2.95, 1.35], [4, 1.8, 1.35]],
      pos: { a: [2.75, 3.3], b: [5.25, 3.3], c: [4, 1.2], ab: [4, 3.55], ac: [3.25, 2], bc: [4.75, 2], abc: [4, 2.55], dehors: [0.55, 0.35] },
      noms: [[2, 4.35], [6, 4.35], [5.55, 0.65]] };
  }
  function zone(g, inclus, x, y) {
    var z = "";
    g.c.forEach(function (c, i) {
      if ((x - c[0]) * (x - c[0]) + (y - c[1]) * (y - c[1]) < c[2] * c[2]) z += "abc"[i];
    });
    if (z === "") return "dehors";
    if (inclus && z === "ab") return "b";
    return z;
  }
  function venn(fig) {
    var sc = scene(fig);
    var n = +fig.dataset.n || 2, inclus = fig.dataset.inclus === "1", act = fig.dataset.activite === "1";
    var ombre = [];
    try { ombre = JSON.parse(fig.dataset.ombre || "[]"); } catch (e) { ombre = []; }
    var g = geo(n, inclus, fig.dataset.disjoints === "1"), S = 50;
    var s = sc.querySelector(":scope > svg.pb-v");
    if (!s) {
      s = el("svg", { "class": "pb-v", viewBox: "0 0 " + g.W * S + " " + g.H * S });
      sc.insertBefore(s, sc.firstChild);
      function X(x) { return x * S; } function Y(y) { return (g.H - y) * S; }
      // hachures (mêmes segments que le PDF : droites y = x + k)
      if (ombre.length) {
        var N = 200, k;
        for (k = -g.W; k < g.H; k += 0.22) {
          var debut = null;
          for (var i = 0; i <= N; i++) {
            var x = g.W * i / N, y = x + k;
            var dedans = y > 0 && y < g.H && ombre.indexOf(zone(g, inclus, x, y)) >= 0;
            if (dedans && !debut) debut = [x, y];
            if ((!dedans || i === N) && debut) {
              var fx = dedans ? x : x - g.W / N, fy = dedans ? y : y - g.W / N;
              el("line", { x1: X(debut[0]), y1: Y(debut[1]), x2: X(fx), y2: Y(fy),
                "class": "pb-hach" + (act ? " pb-reponse" : "") }, s);
              debut = null;
            }
          }
        }
      }
      el("rect", { x: 1, y: 1, width: g.W * S - 2, height: g.H * S - 2, "class": "pb-cadre" }, s);
      g.c.forEach(function (c) { el("circle", { cx: X(c[0]), cy: Y(c[1]), r: c[2] * S, "class": "pb-cercle" }, s); });
      if (act && (ombre.length || enfants(fig, ".pb-z").length)) {
        fig.classList.add("pb-cache");
        var b = document.createElement("button");
        b.type = "button"; b.className = "pb-btn"; b.textContent = "Voir la réponse";
        b.addEventListener("click", function () {
          var cache = fig.classList.toggle("pb-cache");
          enfants(fig, ".rep").forEach(function (r) { r.classList.toggle("vu", !cache); });
          b.textContent = cache ? "Voir la réponse" : "Cacher la réponse";
        });
        fig.appendChild(b);
      }
    }
    function placer(e, p) { e.style.left = (p[0] / g.W * 100) + "%"; e.style.top = ((1 - p[1] / g.H) * 100) + "%"; }
    enfants(fig, ".pb-z").forEach(function (z) { if (g.pos[z.dataset.z]) placer(z, g.pos[z.dataset.z]); });
    enfants(fig, ".pb-nom").forEach(function (z) { var p = g.noms[+z.dataset.i]; if (p) placer(z, p); });
    enfants(fig, ".pb-univers").forEach(function (z) {
      z.style.left = "auto"; z.style.top = "auto"; z.style.right = "0.4%"; z.style.bottom = "1%"; z.style.transform = "none";
    });
  }


  // ---------------------------------------------------------------- simulateur
  // Expériences : de, des (somme de k dés), piece, urne (issues pondérées),
  // monty (Monty Hall : quelle stratégie gagne ?). Histogramme des fréquences
  // (ou effectifs) après n répétitions, modèle théorique à la demande,
  // et courbe de stabilisation de la fréquence d'une issue suivie.
  function fmt(x, d) { var m = Math.pow(10, d); return String(Math.round(x * m) / m).replace(".", ","); }
  function modele(c) {
    var i, j;
    if (c.experience === "de") return { issues: ["1", "2", "3", "4", "5", "6"], p: [1, 1, 1, 1, 1, 1].map(function () { return 1 / 6; }) };
    if (c.experience === "piece") return { issues: ["Pile", "Face"], p: [0.5, 0.5] };
    if (c.experience === "monty") return { issues: ["Garder gagne", "Changer gagne"], p: [1 / 3, 2 / 3] };
    if (c.experience === "anniversaires") {
      var q = 1, g = c.groupe || 25;
      for (i = 0; i < g; i++) q *= (365 - i) / 365;
      return { issues: ["au moins deux communs", "tous différents"], p: [1 - q, q] };
    }
    if (c.experience === "au-moins-un") {
      var un = (c.des || 1) === 2 ? 1 / 36 : 1 / 6, L = c.lancers || 4;
      var pg = 1 - Math.pow(1 - un, L);
      return { issues: [(c.des || 1) === 2 ? "au moins un double six" : "au moins un 6", "aucun"], p: [pg, 1 - pg] };
    }
    if (c.experience === "lotto") {
      var C = function (n, k) { var r = 1; for (var t = 1; t <= k; t++) r = r * (n - k + t) / t; return r; };
      var iss2 = [], p2 = [];
      for (i = 0; i <= 6; i++) { iss2.push(String(i)); p2.push(C(6, i) * C(39, 6 - i) / C(45, 6)); }
      return { issues: iss2, p: p2 };
    }
    if (c.experience === "urne") {
      var tot = c.poids.reduce(function (a, b) { return a + b; }, 0);
      return { issues: c.issues.slice(), p: c.poids.map(function (w) { return w / tot; }) };
    }
    var k = Math.max(1, Math.min(6, c.des || 2)), dist = [1];          // somme de k dés
    for (i = 0; i < k; i++) {
      var nd = [];
      for (j = 0; j < dist.length + 6; j++) nd.push(0);
      dist.forEach(function (v, s) { for (var f = 1; f <= 6; f++) nd[s + f] += v / 6; });
      dist = nd;
    }
    var iss = [], p = [];
    for (i = k; i <= 6 * k; i++) { iss.push(String(i)); p.push(dist[i]); }
    return { issues: iss, p: p };
  }
  function tirage(c, m) {
    if (c.experience === "monty") {
      var voiture = Math.floor(Math.random() * 3), choix = Math.floor(Math.random() * 3);
      return choix === voiture ? 0 : 1;
    }
    if (c.experience === "anniversaires") {
      var vus = {}, g = c.groupe || 25;
      for (var a = 0; a < g; a++) { var d = Math.floor(Math.random() * 365); if (vus[d]) return 0; vus[d] = 1; }
      return 1;
    }
    if (c.experience === "au-moins-un") {
      for (var t = 0; t < (c.lancers || 4); t++) {
        var d1 = Math.floor(Math.random() * 6);
        if ((c.des || 1) === 2) { if (d1 === 5 && Math.floor(Math.random() * 6) === 5) return 0; }
        else if (d1 === 5) return 0;
      }
      return 1;
    }
    if (c.experience === "lotto") {
      var urne = [], bons = 0;
      for (var u = 1; u <= 45; u++) urne.push(u);
      for (var r = 0; r < 6; r++) {
        var j = r + Math.floor(Math.random() * (45 - r)), tmp = urne[r]; urne[r] = urne[j]; urne[j] = tmp;
        if (urne[r] <= 6) bons++;                 // la grille jouée : 1, 2, 3, 4, 5, 6
      }
      return bons;
    }
    if (c.experience === "des") {
      var s = 0, k = Math.max(1, Math.min(6, c.des || 2));
      for (var i = 0; i < k; i++) s += 1 + Math.floor(Math.random() * 6);
      return s - k;
    }
    var u = Math.random(), acc = 0;
    for (var j = 0; j < m.p.length; j++) { acc += m.p[j]; if (u < acc) return j; }
    return m.p.length - 1;
  }
  function simulation(div) {
    if (div.dataset.pret) return;
    div.dataset.pret = "1";
    var c = {};
    try { c = JSON.parse(div.dataset.cfg || "{}"); } catch (e) { c = {}; }
    var m = modele(c), K = m.issues.length;
    var eff = [], n = 0, courbe = [], iSuivi = c.suivre != null ? m.issues.indexOf(String(c.suivre)) : -1;
    var mode = "freq", voirModele = false;
    function raz() { eff = m.issues.map(function () { return 0; }); n = 0; courbe = []; }
    raz();
    div.innerHTML =
      '<div class="pb-sim-cmd">' +
      '<button type="button" data-n="1">+1</button><button type="button" data-n="10">+10</button>' +
      '<button type="button" data-n="100">+100</button><button type="button" data-n="1000">+1 000</button>' +
      '<button type="button" data-raz="1">Recommencer</button>' +
      '<span class="pb-sim-n"></span></div>' +
      '<div class="pb-sim-opt"><label><input type="checkbox" data-opt="eff"> effectifs</label> ' +
      '<label><input type="checkbox" data-opt="mod"> modèle théorique</label></div>' +
      '<svg class="pb-sim-histo" viewBox="0 0 560 250"></svg>' +
      (iSuivi >= 0 ? '<svg class="pb-sim-courbe" viewBox="0 0 560 190"></svg>' : "");
    var svgH = div.querySelector(".pb-sim-histo"), svgC = div.querySelector(".pb-sim-courbe");
    function dessiner() {
      div.querySelector(".pb-sim-n").textContent = "n = " + n.toLocaleString("fr-BE");
      while (svgH.firstChild) svgH.removeChild(svgH.firstChild);
      var g0 = 40, d0 = 550, h0 = 215, t0 = 12, larg = (d0 - g0) / K;
      var val = eff.map(function (e) { return mode === "freq" ? (n ? e / n : 0) : e; });
      var th = m.p.map(function (p) { return mode === "freq" ? p : p * n; });
      var ymax = Math.max.apply(null, val.concat(voirModele ? th : [])) || (mode === "freq" ? 1 : 1);
      ymax *= 1.15;
      function Y(v) { return h0 - (h0 - t0) * v / ymax; }
      el("line", { x1: g0, y1: h0, x2: d0, y2: h0, "class": "pb-sim-axe" }, svgH);
      el("line", { x1: g0, y1: h0, x2: g0, y2: t0, "class": "pb-sim-axe" }, svgH);
      for (var q = 0; q <= 4; q++) {
        var v = ymax * q / 4, y = Y(v);
        el("line", { x1: g0 - 4, y1: y, x2: d0, y2: y, "class": "pb-sim-grille" }, svgH);
        var t = el("text", { x: g0 - 6, y: y + 4, "class": "pb-sim-grad", "text-anchor": "end" }, svgH);
        t.textContent = mode === "freq" ? fmt(v, 2) : String(Math.round(v));
      }
      val.forEach(function (v, i) {
        var x = g0 + i * larg + larg * 0.15, w = larg * 0.7;
        el("rect", { x: x, y: Y(v), width: w, height: h0 - Y(v), "class": "pb-sim-barre" + (i === iSuivi ? " pb-suivi" : "") }, svgH);
        if (voirModele) el("line", { x1: x - 3, y1: Y(th[i]), x2: x + w + 3, y2: Y(th[i]), "class": "pb-sim-mod" }, svgH);
        var lab = el("text", { x: x + w / 2, y: h0 + 16, "class": "pb-sim-grad", "text-anchor": "middle" }, svgH);
        lab.textContent = m.issues[i];
        if (n && K <= 12) {
          var hv = el("text", { x: x + w / 2, y: Y(v) - 4, "class": "pb-sim-val", "text-anchor": "middle" }, svgH);
          hv.textContent = mode === "freq" ? fmt(v, 3) : String(eff[i]);
        }
      });
      if (!svgC) return;
      while (svgC.firstChild) svgC.removeChild(svgC.firstChild);
      var g1 = 40, d1 = 550, h1 = 160, t1 = 12, nmax = Math.max(10, n);
      var fm = Math.min(1, Math.max(0.05, Math.max.apply(null, courbe.map(function (p) { return p[1]; }).concat([m.p[iSuivi] * 1.6]))));
      function CX(k) { return g1 + (d1 - g1) * k / nmax; }
      function CY(f) { return h1 - (h1 - t1) * f / fm; }
      el("line", { x1: g1, y1: h1, x2: d1, y2: h1, "class": "pb-sim-axe" }, svgC);
      el("line", { x1: g1, y1: h1, x2: g1, y2: t1, "class": "pb-sim-axe" }, svgC);
      [0, 0.5, 1].forEach(function (q) {
        var tt = el("text", { x: g1 - 6, y: CY(fm * q) + 4, "class": "pb-sim-grad", "text-anchor": "end" }, svgC);
        tt.textContent = fmt(fm * q, 2);
      });
      var tn = el("text", { x: d1, y: h1 + 18, "class": "pb-sim-grad", "text-anchor": "end" }, svgC);
      tn.textContent = "n = " + nmax.toLocaleString("fr-BE");
      var tl = el("text", { x: g1 + 6, y: t1 + 4, "class": "pb-sim-grad" }, svgC);
      tl.textContent = "fréquence de « " + m.issues[iSuivi] + " » en fonction de n";
      if (voirModele) el("line", { x1: g1, y1: CY(m.p[iSuivi]), x2: d1, y2: CY(m.p[iSuivi]), "class": "pb-sim-mod" }, svgC);
      if (courbe.length > 1) el("polyline", { points: courbe.map(function (p) { return CX(p[0]) + "," + CY(p[1]); }).join(" "), "class": "pb-sim-trace" }, svgC);
    }
    function lancer(k) {
      for (var i = 0; i < k; i++) {
        eff[tirage(c, m)]++; n++;
        if (iSuivi >= 0 && (n <= 200 || n % Math.ceil(n / 400) === 0)) courbe.push([n, eff[iSuivi] / n]);
      }
      dessiner();
    }
    div.addEventListener("click", function (ev) {
      var b = ev.target.closest("button");
      if (!b) return;
      if (b.dataset.raz) { raz(); dessiner(); } else lancer(+b.dataset.n);
    });
    div.addEventListener("change", function (ev) {
      var o = ev.target.dataset.opt;
      if (o === "eff") mode = ev.target.checked ? "eff" : "freq";
      if (o === "mod") voirModele = ev.target.checked;
      dessiner();
    });
    dessiner();
  }


  // ---------------------------------------------------------------- dénombreur
  // Liste tous les cas (suites ou groupes, avec ou sans répétition),
  // organisés par premier élément, avec leur nombre et la formule ;
  // « Regrouper » range les suites sans répétition en paquets de p!.
  function listes(E, p, ordre, rep) {
    var res = [];
    (function rec(pref, debut) {
      if (pref.length === p) { res.push(pref.slice()); return; }
      for (var i = ordre ? 0 : debut; i < E.length; i++) {
        if (!rep && pref.indexOf(i) >= 0) continue;
        pref.push(i); rec(pref, rep ? i : i + 1); pref.pop();
      }
    })([], 0);
    return res;
  }
  function fact(n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; }
  var EXP = "⁰¹²³⁴⁵⁶⁷⁸⁹", IND = "₀₁₂₃₄₅₆₇₈₉";
  function sup(k) { return String(k).split("").map(function (d) { return EXP[+d]; }).join(""); }
  function sub(k) { return String(k).split("").map(function (d) { return IND[+d]; }).join(""); }
  function denombreur(div) {
    if (div.dataset.pret) return;
    div.dataset.pret = "1";
    var c = {};
    try { c = JSON.parse(div.dataset.cfg || "{}"); } catch (e) { c = {}; }
    var tous = c.elements || ["A", "B", "C", "D"];
    var n = tous.length, p = Math.min(c.p || 2, n), ordre = c.ordre !== false, rep = !!c.repetition, paquets = false;
    div.innerHTML = '<div class="pb-den-cmd">' +
      '<label>éléments : <select data-o="n"></select></label> ' +
      '<label>p = <select data-o="p"></select></label> ' +
      '<label><input type="checkbox" data-o="ordre"> l\'ordre compte</label> ' +
      '<label><input type="checkbox" data-o="rep"> répétition possible</label> ' +
      '<button type="button" data-o="paq">Regrouper</button></div>' +
      '<div class="pb-den-total"></div><div class="pb-den-liste"></div>';
    var selN = div.querySelector('[data-o="n"]'), selP = div.querySelector('[data-o="p"]');
    for (var k = 2; k <= tous.length; k++) selN.add(new Option(tous.slice(0, k).join(", "), k));
    selN.value = n;
    function majP() {
      while (selP.options.length) selP.remove(0);
      for (var k = 1; k <= Math.min(n, 5); k++) selP.add(new Option(k, k));
      if (p > n) p = n;
      selP.value = p;
    }
    majP();
    div.querySelector('[data-o="ordre"]').checked = ordre;
    div.querySelector('[data-o="rep"]').checked = rep;
    function dessiner() {
      var E = tous.slice(0, n), L = listes(E, p, ordre, rep);
      var b = div.querySelector('[data-o="paq"]');
      b.disabled = !(ordre && !rep && p > 1);
      if (b.disabled) paquets = false;
      b.textContent = paquets ? "Liste par premier élément" : "Regrouper en paquets (même groupe)";
      var f;
      if (ordre && rep) f = n + sup(p) + " = " + L.length;
      else if (ordre) f = "A" + sub(n) + sup(p) + " = " + E.map(function (x, i) { return n - i; }).slice(0, p).join(" · ") + " = " + L.length;
      else if (!rep) f = "C" + sub(n) + sup(p) + " = A" + sub(n) + sup(p) + " / " + p + "! = " + fact(n) / fact(n - p) + " / " + fact(p) + " = " + L.length;
      else f = L.length + " (groupes avec répétition : hors programme)";
      div.querySelector(".pb-den-total").innerHTML = "<strong>" + L.length + " cas</strong> — " +
        (ordre ? "suites" : "groupes") + (rep ? " avec" : " sans") + " répétition de " + p + " élément" + (p > 1 ? "s" : "") +
        " pris parmi " + n + " : " + f;
      var zone = div.querySelector(".pb-den-liste");
      zone.innerHTML = "";
      function ecrit(t) { return ordre ? t.map(function (i) { return E[i]; }).join("") : "{" + t.map(function (i) { return E[i]; }).join(", ") + "}"; }
      if (L.length > 720) { zone.textContent = "Trop de cas pour les afficher tous : diminue p ou le nombre d'éléments."; return; }
      var groupes = {}, ordreG = [];
      L.forEach(function (t) {
        var cle = paquets ? t.slice().sort().join(",") : String(t[0]);
        if (!groupes[cle]) { groupes[cle] = []; ordreG.push(cle); }
        groupes[cle].push(ecrit(t));
      });
      ordreG.forEach(function (cle) {
        var d = document.createElement("div");
        d.className = "pb-den-groupe" + (paquets ? " pb-den-paquet" : "");
        var titre = paquets ? "{" + cle.split(",").map(function (i) { return E[+i]; }).join(", ") + "} : " + groupes[cle].length + " suites"
                            : "commence par " + E[+cle] + " : " + groupes[cle].length;
        d.innerHTML = '<div class="pb-den-titre">' + titre + "</div>" + groupes[cle].map(function (x) { return "<span>" + x + "</span>"; }).join(" ");
        zone.appendChild(d);
      });
      if (paquets) {
        var r = document.createElement("div");
        r.className = "pb-den-bilan";
        r.textContent = ordreG.length + " paquets de " + fact(p) + " suites (" + p + "! façons d'ordonner un groupe) : " +
          L.length + " / " + fact(p) + " = " + ordreG.length + " groupes.";
        zone.appendChild(r);
      }
    }
    div.addEventListener("change", function (ev) {
      var o = ev.target.dataset.o;
      if (o === "n") { n = +ev.target.value; majP(); }
      if (o === "p") p = +ev.target.value;
      if (o === "ordre") ordre = ev.target.checked;
      if (o === "rep") rep = ev.target.checked;
      dessiner();
    });
    div.addEventListener("click", function (ev) {
      if (ev.target.dataset && ev.target.dataset.o === "paq") { paquets = !paquets; dessiner(); }
    });
    dessiner();
  }

  // ---------------------------------------------------------------- lancement
  function tout() {
    document.querySelectorAll(".pb-arbre").forEach(function (f) { try { arbre(f); } catch (e) { console.error(e); } });
    document.querySelectorAll(".pb-double").forEach(function (f) { try { double(f); } catch (e) { console.error(e); } });
    document.querySelectorAll(".pb-venn").forEach(function (f) { try { venn(f); } catch (e) { console.error(e); } });
    document.querySelectorAll(".pb-denombreur").forEach(function (f) { try { denombreur(f); } catch (e) { console.error(e); } });
    document.querySelectorAll(".pb-sim").forEach(function (f) { try { simulation(f); } catch (e) { console.error(e); } });
  }
  var attente = null;
  function plusTard() { clearTimeout(attente); attente = setTimeout(tout, 60); }
  function demarrer() {
    tout();
    if (window.MathJax && MathJax.startup && MathJax.startup.promise) MathJax.startup.promise.then(tout);
    [600, 1500, 3000].forEach(function (t) { setTimeout(tout, t); });
    window.addEventListener("resize", plusTard);
    // une réponse dévoilée change la taille d'une étiquette : on replace
    document.addEventListener("click", function (ev) {
      if (ev.target.closest && ev.target.closest(".pb-fig")) plusTard();
    });
  }
  if (document.readyState !== "loading") demarrer();
  else document.addEventListener("DOMContentLoaded", demarrer);
})();
