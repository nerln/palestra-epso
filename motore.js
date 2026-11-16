// Motore delle prove: genera numerico e astratto con regole note, e mescola il verbale.
// Nessun accesso al DOM: si può provare con node.
(function (root) {
  'use strict';

  // ---------- caso riproducibile ----------
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const between = (r, lo, hi) => lo + r() * (hi - lo);
  function shuffle(r, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const mod = (n, m) => ((n % m) + m) % m;

  // ---------- numeri all'italiana ----------
  const NF = {};
  function fx(v, d) {
    d = d || 0;
    if (!NF[d]) NF[d] = new Intl.NumberFormat('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' });
    return NF[d].format(v);
  }
  const delPct = n => (n === 1 || n === 8 || n === 11 || n === 18 || (n >= 80 && n < 90) ? "dell'" : 'del ') + n + '%';
  const signed = (v, d) => (v > 0 ? '+' : '') + fx(v, d);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- opzioni ----------
  // Cinque opzioni in ordine crescente, come nei test EPSO. A volte l'ultima è
  // "Nessuna delle precedenti", e qualche volta è proprio quella giusta.
  function numChoice(r, correct, cands, f) {
    const list = [{ v: correct, s: f(correct) }];
    const seen = new Set([list[0].s]);
    for (const c of cands) {
      if (!isFinite(c)) continue;
      const s = f(c);
      if (seen.has(s)) continue;
      seen.add(s); list.push({ v: c, s });
    }
    let guard = 0;
    while (list.length < 6 && guard++ < 80) {
      const delta = Math.max(Math.abs(correct) * (0.04 + r() * 0.22), 0.3 + r() * 1.5);
      const c = correct + (r() < 0.5 ? -1 : 1) * delta;
      const s = f(c);
      if (seen.has(s)) continue;
      seen.add(s); list.push({ v: c, s });
    }
    const distr = shuffle(r, list.slice(1));
    const useNone = r() < 0.3;
    const noneRight = useNone && r() < 0.35;
    let items;
    if (!useNone) items = [list[0], ...distr.slice(0, 4)];
    else if (noneRight) items = distr.slice(0, 4);
    else items = [list[0], ...distr.slice(0, 3)];
    items.sort((a, b) => a.v - b.v);
    const opts = items.map(x => x.s);
    if (useNone) opts.push('Nessuna delle precedenti');
    return { opts, correct: noneRight ? 4 : opts.indexOf(list[0].s) };
  }
  function textChoice(r, correct, others) {
    const opts = shuffle(r, [correct, ...others.filter(o => o !== correct)].slice(0, 5));
    return { opts, correct: opts.indexOf(correct) };
  }

  // ---------- tabelle ----------
  function table(caption, head, rows, note) {
    let h = '<div class="tbl-wrap"><table class="data"><caption>' + esc(caption) + '</caption><thead><tr>';
    head.forEach((c, i) => { h += '<th scope="col"' + (i ? ' class="n"' : '') + '>' + c + '</th>'; });
    h += '</tr></thead><tbody>';
    rows.forEach(row => {
      h += '<tr>';
      row.forEach((c, i) => { h += i ? '<td class="n">' + c + '</td>' : '<th scope="row">' + esc(c) + '</th>'; });
      h += '</tr>';
    });
    h += '</tbody></table></div>';
    if (note) h += '<p class="tbl-note">' + note + '</p>';
    return h;
  }
  const FITTIZI = 'Dati fittizi, costruiti per l\'esercitazione.';

  // Popolazioni approssimate (milioni) per dare ai dati ordini di grandezza credibili.
  const POP = {
    'Austria': 9.2, 'Belgio': 11.8, 'Cechia': 10.9, 'Croazia': 3.9, 'Danimarca': 6.0, 'Estonia': 1.4,
    'Finlandia': 5.6, 'Grecia': 10.4, 'Irlanda': 5.3, 'Lettonia': 1.9, 'Lituania': 2.9, 'Paesi Bassi': 17.9,
    'Polonia': 36.6, 'Portogallo': 10.6, 'Romania': 19.1, 'Slovacchia': 5.4, 'Slovenia': 2.1,
    'Svezia': 10.6, 'Ungheria': 9.6, 'Bulgaria': 6.4
  };
  const PAESI = Object.keys(POP);
  const ART = {
    'Austria': "l'", 'Belgio': 'il ', 'Cechia': 'la ', 'Croazia': 'la ', 'Danimarca': 'la ', 'Estonia': "l'",
    'Finlandia': 'la ', 'Grecia': 'la ', 'Irlanda': "l'", 'Lettonia': 'la ', 'Lituania': 'la ', 'Paesi Bassi': 'i ',
    'Polonia': 'la ', 'Portogallo': 'il ', 'Romania': 'la ', 'Slovacchia': 'la ', 'Slovenia': 'la ',
    'Svezia': 'la ', 'Ungheria': "l'", 'Bulgaria': 'la '
  };
  const DI = { "l'": "dell'", 'il ': 'del ', 'la ': 'della ', 'i ': 'dei ' };
  const il = p => ART[p] + p;
  const della = p => DI[ART[p]] + p;
  const inP = p => (p === 'Paesi Bassi' ? 'nei ' : 'in ') + p;
  const ANNI = [2022, 2023, 2024];

  const TEMI_A = [
    { t: 'Esportazioni di prodotti agroalimentari', u: 'milioni di €', base: p => p * between0(300, 1500), per: 'euro per abitante', perF: (v, p) => v / p, d: 0 },
    { t: 'Spesa pubblica per la ricerca', u: 'milioni di €', base: p => p * between0(120, 800), per: 'euro per abitante', perF: (v, p) => v / p, d: 0 },
    { t: 'Produzione di energia eolica', u: 'GWh', base: p => p * between0(250, 2500), per: 'kWh per abitante', perF: (v, p) => v / p, d: 0 },
    { t: 'Studenti in partenza con Erasmus+', u: 'studenti', base: p => p * 1000 * between0(0.7, 3.0), per: 'studenti ogni 1.000 abitanti', perF: (v, p) => v / (p * 1000), d: 2 },
    { t: 'Domande di brevetto depositate', u: 'domande', base: p => p * 10 * between0(6, 40), per: 'domande ogni 100.000 abitanti', perF: (v, p) => v / (p * 10), d: 1 }
  ];
  let R0 = Math.random; // sostituito dal generatore corrente
  function between0(lo, hi) { return lo + R0() * (hi - lo); }

  function dataA(r) {
    R0 = r;
    const tema = pick(r, TEMI_A);
    const paesi = shuffle(r, PAESI).slice(0, 5);
    const rows = paesi.map(p => {
      let v = tema.base(POP[p]);
      const vals = [Math.round(v)];
      for (let k = 1; k < 3; k++) { v = v * (1 + between(r, -0.11, 0.2)); vals.push(Math.round(v)); }
      return { p, v: vals, pop: POP[p] };
    });
    return { tema, rows };
  }
  function tableA(T, withPop) {
    const head = ['Paese', ...ANNI.map(String)];
    if (withPop) head.push('Popolazione 2024<br><span class="u">milioni</span>');
    const rows = T.rows.map(x => {
      const r = [x.p, ...x.v.map(v => fx(v))];
      if (withPop) r.push(fx(x.pop, 1));
      return r;
    });
    return table(T.tema.t + ' (' + T.tema.u + ')', head, rows, FITTIZI);
  }

  // ---------- generatori di domande numeriche ----------
  const GEN = {};

  GEN.pct = r => {
    const T = dataA(r), row = pick(r, T.rows);
    const [i, j] = pick(r, [[0, 1], [1, 2], [0, 2]]);
    const a = row.v[i], b = row.v[j], ans = (b - a) / a * 100;
    const f = v => signed(v, 1) + '%';
    const c = numChoice(r, ans, [(b - a) / b * 100, -ans, (row.v[2] - row.v[0]) / row.v[0] * 100,
      (row.v[1] - row.v[0]) / row.v[0] * 100, (row.v[2] - row.v[1]) / row.v[1] * 100, ans + (ans > 0 ? 2.5 : -2.5)], f);
    return {
      stim: tableA(T, false),
      q: 'Di quanto è variato, in percentuale, il valore ' + della(row.p) + ' tra il ' + ANNI[i] + ' e il ' + ANNI[j] + '?',
      ...c,
      why: '(' + fx(b) + ' − ' + fx(a) + ') ÷ ' + fx(a) + ' × 100 = ' + f(ans) + '. La base è sempre il valore di partenza, quello del ' + ANNI[i] + '.'
    };
  };

  GEN.share = r => {
    const T = dataA(r), row = pick(r, T.rows), k = pick(r, [0, 1, 2]);
    const tot = T.rows.reduce((s, x) => s + x.v[k], 0), ans = row.v[k] / tot * 100;
    const f = v => fx(v, 1) + '%';
    const other = T.rows.reduce((s, x) => s + x.v[(k + 1) % 3], 0);
    const c = numChoice(r, ans, [row.v[k] / (tot - row.v[k]) * 100, row.v[(k + 1) % 3] / other * 100, 20, ans * 1.1, ans - 1.5], f);
    return {
      stim: tableA(T, false),
      q: 'Nel ' + ANNI[k] + ', quale percentuale del totale dei cinque paesi rappresenta ' + il(row.p) + '?',
      ...c,
      why: 'Totale ' + ANNI[k] + ' = ' + fx(tot) + '. Quota = ' + fx(row.v[k]) + ' ÷ ' + fx(tot) + ' × 100 = ' + f(ans) + '.'
    };
  };

  GEN.percap = r => {
    const T = dataA(r), row = pick(r, T.rows), other = pick(r, T.rows.filter(x => x !== row));
    const t = T.tema, ans = t.perF(row.v[2], row.pop);
    const f = v => fx(v, t.d);
    const c = numChoice(r, ans, [ans * 10, ans / 10, t.perF(row.v[1], row.pop), t.perF(row.v[2], other.pop), ans * 1.15], f);
    return {
      stim: tableA(T, true),
      q: 'Nel 2024, quanti ' + t.per + ' ha registrato ' + il(row.p) + '?',
      ...c,
      why: 'Valore 2024 ' + della(row.p) + ' = ' + fx(row.v[2]) + ' ' + t.u + '; popolazione = ' + fx(row.pop, 1) + ' milioni. Risultato: ' + f(ans) + ' ' + t.per + '. L\'errore tipico è di unità: la popolazione è espressa in milioni.'
    };
  };

  GEN.proj = r => {
    const T = dataA(r), row = pick(r, T.rows);
    const [, v2, v3] = row.v, ans = v3 * v3 / v2;
    const f = v => fx(v, 0);
    const c = numChoice(r, ans, [2 * v3 - v2, v3 * row.v[1] / row.v[0], v3 * (v3 - v2) / v2, ans * 1.03, ans * 0.97], f);
    return {
      stim: tableA(T, false),
      q: 'Se tra il 2024 e il 2025 il valore ' + della(row.p) + ' variasse della stessa percentuale registrata tra il 2023 e il 2024, quale sarebbe il valore nel 2025?',
      ...c,
      why: 'Fattore 2023→2024 = ' + fx(v3) + ' ÷ ' + fx(v2) + ' = ' + fx(v3 / v2, 4) + '. Valore 2025 = ' + fx(v3) + ' × ' + fx(v3 / v2, 4) + ' ≈ ' + f(ans) + '. Sommare la stessa differenza assoluta (' + fx(2 * v3 - v2) + ') è l\'errore tipico.'
    };
  };

  GEN.maxpct = r => {
    const T = dataA(r);
    const pc = T.rows.map(x => ({ p: x.p, g: (x.v[2] - x.v[0]) / x.v[0] * 100, d: x.v[2] - x.v[0] }));
    const best = pc.reduce((a, b) => (b.g > a.g ? b : a));
    const bestAbs = pc.reduce((a, b) => (b.d > a.d ? b : a));
    const allDown = best.g <= 0;
    const c = textChoice(r, best.p, T.rows.map(x => x.p));
    const lista = pc.map(x => x.p + ' ' + signed(x.g, 1) + '%').join('; ');
    return {
      stim: tableA(T, false),
      q: allDown ? 'Quale paese ha registrato il calo percentuale più contenuto tra il 2022 e il 2024?' : 'Quale paese ha registrato l\'aumento percentuale più alto tra il 2022 e il 2024?',
      ...c,
      why: 'Variazioni 2022→2024: ' + lista + '.' + (bestAbs.p !== best.p && !allDown ? ' Attenzione: l\'aumento più grande in valore assoluto è di ' + bestAbs.p + ', ma la domanda chiede la percentuale.' : '')
    };
  };

  GEN.combo = r => {
    const T = dataA(r);
    const [A, B] = shuffle(r, T.rows).slice(0, 2).sort((x, y) => y.v[2] - x.v[2]);
    const pa = pick(r, [4, 5, 6, 8, 10, 12, 15]), pb = pick(r, [2, 3, 4, 5, 6, 8]);
    const a = A.v[2], b = B.v[2], ans = a * (1 + pa / 100) - b * (1 - pb / 100);
    const f = v => fx(v, 0);
    const c = numChoice(r, ans, [(a - b) * (1 + (pa - pb) / 100), a * (1 + pa / 100) - b * (1 + pb / 100), a * (1 + pa / 100) - b, (a - b) * (1 + pa / 100), ans * 1.04], f);
    return {
      stim: tableA(T, false),
      q: 'Se nel 2025 il valore ' + della(A.p) + ' aumentasse ' + delPct(pa) + ' e quello ' + della(B.p) + ' diminuisse ' + delPct(pb) + ' rispetto al 2024, di quanto il primo supererebbe il secondo?',
      ...c,
      why: fx(a) + ' × ' + fx(1 + pa / 100, 2) + ' = ' + fx(a * (1 + pa / 100), 1) + '; ' + fx(b) + ' × ' + fx(1 - pb / 100, 2) + ' = ' + fx(b * (1 - pb / 100), 1) + '. Differenza ≈ ' + f(ans) + '.'
    };
  };

  // Tabella in stile EPSO: molte colonne, alcune inutili, e grandezze da ricavare.
  function dataB(r) {
    const paesi = shuffle(r, PAESI).slice(0, 5);
    return paesi.map(p => {
      const rd1 = Math.round(between(r, 0.8, 3.6) * 100) / 100;
      const rd2 = Math.round(rd1 * between(r, 0.9, 1.12) * 100) / 100;
      const g1 = Math.round(between(r, 18, 45) * 10) / 10;
      const g2 = Math.round((g1 + between(r, -3, 3)) * 10) / 10;
      const pat = Math.round(between(r, 40, 380) * 10) / 10;
      const pc = Math.round(between(r, 9000, 58000) / 10) * 10;
      const gdp = POP[p] * pc; // milioni di €
      const rdm = Math.round(gdp * rd1 / 100 / 5) * 5;
      return { p, rd1, rd2, g1, g2, pat, pc, rdm };
    });
  }
  function tableB(rows) {
    const head = ['Paese', 'R&amp;S<br><span class="u">% del PIL, 2021</span>', 'R&amp;S<br><span class="u">% del PIL, 2024</span>',
      'Finanziata dallo Stato<br><span class="u">% della R&amp;S, 2021</span>', 'Finanziata dallo Stato<br><span class="u">% della R&amp;S, 2024</span>',
      'Brevetti<br><span class="u">per milione di abitanti, 2021</span>', 'Spesa in R&amp;S<br><span class="u">milioni di €, 2021</span>', 'PIL pro capite<br><span class="u">€, 2021</span>'];
    return table('Ricerca e sviluppo (R&S) per paese', head,
      rows.map(x => [x.p, fx(x.rd1, 2), fx(x.rd2, 2), fx(x.g1, 1), fx(x.g2, 1), fx(x.pat, 1), fx(x.rdm), fx(x.pc)]), FITTIZI);
  }
  const gdpOf = x => x.rdm / (x.rd1 / 100);       // milioni di €
  const popOf = x => gdpOf(x) / x.pc;              // milioni di abitanti

  GEN.rdRatio = r => {
    const rows = dataB(r), [X, Y] = shuffle(r, rows).slice(0, 2);
    const ans = gdpOf(X) / gdpOf(Y), f = v => fx(v, 2);
    const c = numChoice(r, ans, [X.rdm / Y.rdm, X.rd1 / Y.rd1, 1 / ans, X.pc / Y.pc, ans * 1.1], f);
    return {
      stim: tableB(rows),
      q: 'Nel 2021, qual era il rapporto tra il PIL ' + della(X.p) + ' e quello ' + della(Y.p) + '?',
      ...c,
      why: 'PIL = spesa in R&S ÷ (quota di R&S sul PIL). ' + X.p + ': ' + fx(X.rdm) + ' ÷ ' + fx(X.rd1 / 100, 4) + ' = ' + fx(gdpOf(X), 0) + '; ' + Y.p + ': ' + fx(Y.rdm) + ' ÷ ' + fx(Y.rd1 / 100, 4) + ' = ' + fx(gdpOf(Y), 0) + '. Rapporto = ' + f(ans) + '.'
    };
  };

  GEN.rdGov = r => {
    const rows = dataB(r), X = pick(r, rows), g = pick(r, [1, 2, 3, 4, 5]);
    const fac = (1 + g / 100) * (X.rd2 * X.g2) / (X.rd1 * X.g1), ans = (fac - 1) * 100;
    const f = v => fx(v, 2) + '%';
    const c = numChoice(r, ans, [((X.rd2 * X.g2) / (X.rd1 * X.g1) - 1) * 100,
      g + (X.rd2 - X.rd1) / X.rd1 * 100 + (X.g2 - X.g1) / X.g1 * 100, ((1 + g / 100) * X.rd2 / X.rd1 - 1) * 100, ans + 1], f);
    return {
      stim: tableB(rows),
      q: 'Se il PIL ' + della(X.p) + ' fosse cresciuto ' + delPct(g) + ' tra il 2021 e il 2024, di quanto sarebbe variata la spesa pubblica in R&S nello stesso periodo?',
      ...c,
      why: 'Spesa pubblica in R&S = PIL × quota R&S × quota statale. Fattore = ' + fx(1 + g / 100, 2) + ' × (' + fx(X.rd2, 2) + ' × ' + fx(X.g2, 1) + ') ÷ (' + fx(X.rd1, 2) + ' × ' + fx(X.g1, 1) + ') = ' + fx(fac, 4) + ', cioè ' + f(ans) + '. I tre fattori si moltiplicano, non si sommano.'
    };
  };

  GEN.rdPop = r => {
    const rows = dataB(r), X = pick(r, rows), ans = popOf(X), f = v => fx(v, 1);
    const c = numChoice(r, ans, [ans / 100, ans * 10, X.rdm / X.pc, ans * 1.12], f);
    return {
      stim: tableB(rows),
      q: 'Quanti abitanti aveva ' + il(X.p) + ' nel 2021, in milioni?',
      ...c,
      why: 'PIL = ' + fx(X.rdm) + ' ÷ ' + fx(X.rd1 / 100, 4) + ' = ' + fx(gdpOf(X), 0) + ' milioni di €. Abitanti = PIL ÷ PIL pro capite = ' + fx(gdpOf(X), 0) + ' ÷ ' + fx(X.pc) + ' ≈ ' + f(ans) + ' milioni.'
    };
  };

  GEN.rdPat = r => {
    const rows = dataB(r), X = pick(r, rows), ans = X.pat * popOf(X), f = v => fx(v, 0);
    const c = numChoice(r, ans, [X.pat * 10, ans / 100, X.pat * X.rdm / X.pc, ans * 1.1], f);
    return {
      stim: tableB(rows),
      q: 'Quante domande di brevetto sono state depositate ' + inP(X.p) + ' nel 2021?',
      ...c,
      why: 'Prima gli abitanti: PIL (' + fx(gdpOf(X), 0) + ' milioni di €) ÷ PIL pro capite (' + fx(X.pc) + ') ≈ ' + fx(popOf(X), 2) + ' milioni. Poi ' + fx(X.pat, 1) + ' × ' + fx(popOf(X), 2) + ' ≈ ' + f(ans) + '.'
    };
  };

  GEN.rdState = r => {
    const rows = dataB(r), X = pick(r, rows), ans = X.rdm * X.g1 / 100, f = v => fx(v, 0) + ' milioni di €';
    const c = numChoice(r, ans, [X.rdm * X.g2 / 100, X.rdm * (1 - X.g1 / 100), X.rdm * X.g1 / 10, ans * 1.08], f);
    return {
      stim: tableB(rows),
      q: 'Nel 2021, quanto ha speso lo Stato in R&S ' + inP(X.p) + '?',
      ...c,
      why: fx(X.rdm) + ' × ' + fx(X.g1, 1) + '% = ' + f(ans) + '. Occhio all\'anno: la colonna giusta è quella del 2021.'
    };
  };

  // Quote percentuali: punti percentuali contro variazione percentuale.
  const TEMI_C = [
    { t: 'Quota di energia rinnovabile sul consumo finale lordo', lo: 8, hi: 62 },
    { t: 'Tasso di occupazione delle persone tra 20 e 64 anni', lo: 62, hi: 82 },
    { t: 'Persone con competenze digitali almeno di base', lo: 28, hi: 80 }
  ];
  GEN.pp = r => {
    const tema = pick(r, TEMI_C), paesi = shuffle(r, PAESI).slice(0, 5), Y = [2020, 2022, 2024];
    const rows = paesi.map(p => {
      let v = between(r, tema.lo, tema.hi); const vals = [Math.round(v * 10) / 10];
      for (let k = 1; k < 3; k++) { v = Math.min(95, v + between(r, -1.5, 5)); vals.push(Math.round(v * 10) / 10); }
      return { p, v: vals };
    });
    const vis = rows.filter(x => Math.abs(x.v[2] - x.v[0]) >= 1);
    const row = pick(r, vis.length ? vis : rows), a = row.v[0], b = row.v[2], rel = r() < 0.5;
    const stim = table(tema.t + ' (%)', ['Paese', ...Y.map(String)], rows.map(x => [x.p, ...x.v.map(v => fx(v, 1))]), FITTIZI);
    if (!rel) {
      const ans = b - a, f = v => signed(v, 1) + ' punti';
      const c = numChoice(r, ans, [(b - a) / a * 100, row.v[1] - a, b - row.v[1], -ans], f);
      return { stim, q: 'Di quanti punti percentuali è cambiato il valore ' + della(row.p) + ' tra il 2020 e il 2024?', ...c,
        why: fx(b, 1) + ' − ' + fx(a, 1) + ' = ' + f(ans) + '. I punti percentuali sono una semplice differenza tra due percentuali.' };
    }
    const ans = (b - a) / a * 100, f = v => signed(v, 1) + '%';
    const c = numChoice(r, ans, [b - a, (b - a) / b * 100, (row.v[1] - a) / a * 100, ans * 1.2], f);
    return { stim, q: 'Di quanto è cambiato in termini percentuali (non in punti) il valore ' + della(row.p) + ' tra il 2020 e il 2024?', ...c,
      why: '(' + fx(b, 1) + ' − ' + fx(a, 1) + ') ÷ ' + fx(a, 1) + ' × 100 = ' + f(ans) + '. La differenza in punti sarebbe ' + signed(b - a, 1) + ': è la trappola.' };
  };

  // Tassi di cambio.
  const VALUTE = [
    { c: 'SEK', n: 'corone svedesi', p: 'Svezia', r: 11.3 }, { c: 'DKK', n: 'corone danesi', p: 'Danimarca', r: 7.46 },
    { c: 'PLN', n: 'zloty polacchi', p: 'Polonia', r: 4.28 }, { c: 'HUF', n: 'fiorini ungheresi', p: 'Ungheria', r: 395 },
    { c: 'CZK', n: 'corone ceche', p: 'Cechia', r: 25.1 }, { c: 'RON', n: 'lei rumeni', p: 'Romania', r: 5.0 }
  ];
  GEN.fx = r => {
    const vs = shuffle(r, VALUTE).slice(0, 4).map(v => {
      const rate = v.r * between(r, 0.96, 1.04);
      const d = rate > 100 ? 1 : rate > 20 ? 2 : 3;
      return { ...v, rate: Number(rate.toFixed(d)), d };
    });
    const stim = table('Tassi di cambio: unità di valuta nazionale per 1 euro', ['Valuta', '1 € ='],
      vs.map(v => [v.n + ' (' + v.c + ')', fx(v.rate, v.d)]), FITTIZI);
    const kind = pick(r, ['toEur', 'cross', 'compare']);
    const [A, B] = vs;
    if (kind === 'toEur') {
      const X = Math.round(between(r, 20, 900) * A.rate / 10) * 10, ans = X / A.rate, f = v => fx(v, 2) + ' €';
      const c = numChoice(r, ans, [X * A.rate, X / B.rate, ans * 1.1, ans * 0.95], f);
      return { stim, q: 'Una fattura è di ' + fx(X) + ' ' + A.n + '. A quanti euro corrisponde?', ...c,
        why: 'Dalla valuta all\'euro si divide: ' + fx(X) + ' ÷ ' + fx(A.rate, A.d) + ' = ' + f(ans) + '.' };
    }
    if (kind === 'cross') {
      const X = Math.round(between(r, 50, 2000) * A.rate / 10) * 10, ans = X / A.rate * B.rate, f = v => fx(v, 2);
      const c = numChoice(r, ans, [X * A.rate / B.rate, X * B.rate, X / A.rate, ans * 1.06], f);
      return { stim, q: 'Quanti ' + B.n + ' si ottengono cambiando ' + fx(X) + ' ' + A.n + ' (passando per l\'euro)?', ...c,
        why: fx(X) + ' ÷ ' + fx(A.rate, A.d) + ' = ' + fx(X / A.rate, 2) + ' €; poi × ' + fx(B.rate, B.d) + ' = ' + f(ans) + ' ' + B.c + '.' };
    }
    const eA = between(r, 40, 400), eB = eA * between(r, 0.8, 1.25);
    const XA = Math.round(eA * A.rate), XB = Math.round(eB * B.rate);
    const ans = Math.abs(XA / A.rate - XB / B.rate), f = v => fx(v, 2) + ' €';
    const c = numChoice(r, ans, [Math.abs(XA * A.rate - XB * B.rate) / 1000, Math.abs(XA - XB) / ((A.rate + B.rate) / 2), ans * 1.25, ans * 0.8], f);
    return { stim, q: 'Lo stesso servizio costa ' + fx(XA) + ' ' + A.n + ' ' + inP(A.p) + ' e ' + fx(XB) + ' ' + B.n + ' ' + inP(B.p) + '. Quanto costa in più, in euro, dove è più caro?', ...c,
      why: fx(XA) + ' ÷ ' + fx(A.rate, A.d) + ' = ' + fx(XA / A.rate, 2) + ' €; ' + fx(XB) + ' ÷ ' + fx(B.rate, B.d) + ' = ' + fx(XB / B.rate, 2) + ' €. Differenza = ' + f(ans) + '.' };
  };

  const NUM_MOCK = ['pct', 'percap', 'proj', 'maxpct', 'combo', 'rdGov', 'rdRatio', 'pp', 'fx', 'rdPop'];
  const NUM_EXTRA = ['share', 'rdPat', 'rdState'];
  function buildNum(seed, n) {
    const r = rng(seed);
    let kinds = shuffle(r, NUM_MOCK);
    while (kinds.length < n) kinds = kinds.concat(shuffle(r, NUM_MOCK.concat(NUM_EXTRA)));
    // un po' di varietà fra una prova e l'altra
    kinds = kinds.slice(0, n).map(k => (r() < 0.25 ? pick(r, NUM_EXTRA) : k));
    return kinds.map((k, i) => ({ kind: 'num', type: k, id: 'n' + seed + '-' + i, ...GEN[k](r) }));
  }

  // ---------- astratto ----------
  const FILLS = ['vuoto', 'grigio', 'nero'];
  const FILL_NAME = { vuoto: 'vuoto', grigio: 'grigio', nero: 'nero' };
  const POS8 = [[16, 16], [60, 16], [104, 16], [104, 60], [104, 104], [60, 104], [16, 104], [16, 60]];

  function absParams(r, level) {
    const P = { main: r() < 0.5 ? 'arrow' : 'poly', rules: [] };
    const mainRule = P.main === 'arrow' ? (level >= 3 && r() < 0.35 ? 'accel' : 'rot') : 'sides';
    const pool = shuffle(r, ['fill', 'size', 'dot', 'count']);
    const n = level === 1 ? 2 : level === 2 ? 3 : 4;
    P.rules = [mainRule, ...pool.slice(0, n - 1)];
    const has = k => P.rules.includes(k);
    P.a0 = pick(r, [0, 45, 90, 135, 180, 225, 270, 315]);
    P.da = pick(r, [45, 90, 135, -45, -90, -135]);
    P.dir = r() < 0.5 ? 1 : -1;
    P.up = r() < 0.6;
    P.s0 = P.up ? 3 : 8;
    P.fseq = r() < 0.5 ? shuffle(r, FILLS) : shuffle(r, FILLS).slice(0, 2);
    P.f0 = Math.floor(r() * 3);
    P.fconst = pick(r, FILLS);
    P.big0 = r() < 0.5;
    P.p0 = Math.floor(r() * 8);
    P.k = pick(r, [1, 2, 3, -1, -2, -3]);
    if (r() < 0.6) { P.cs = r() < 0.5 ? 1 : -1; P.n0 = P.cs > 0 ? pick(r, [1, 2]) : pick(r, [6, 7]); }
    else { P.alt = shuffle(r, [1, 2, 3, 4, 5]).slice(0, 2); }
    // a livello alto aggiungo un elemento fermo che fa da rumore
    if (!has('dot') && level >= 2 && r() < 0.5) P.dotStatic = Math.floor(r() * 8);
    if (!has('count') && level >= 2 && r() < 0.4) P.countStatic = pick(r, [2, 3, 4]);
    if (!has('sides') && P.main === 'poly') P.sConst = pick(r, [3, 4, 5, 6]);
    return P;
  }
  function absState(P, i) {
    const has = k => P.rules.includes(k);
    return {
      main: P.main,
      angle: P.main === 'arrow' ? mod(has('rot') ? P.a0 + P.da * i : has('accel') ? P.a0 + P.dir * 45 * i * (i + 1) / 2 : P.a0, 360) : 0,
      sides: P.main === 'poly' ? (has('sides') ? P.s0 + (P.up ? i : -i) : P.sConst) : 0,
      fill: has('fill') ? P.fseq[(P.f0 + i) % P.fseq.length] : P.fconst,
      big: has('size') ? (i % 2 === 0 ? P.big0 : !P.big0) : true,
      dot: has('dot') ? mod(P.p0 + P.k * i, 8) : (P.dotStatic != null ? P.dotStatic : null),
      count: has('count') ? (P.alt ? P.alt[i % 2] : P.n0 + P.cs * i) : (P.countStatic || 0)
    };
  }
  const keyOf = s => JSON.stringify(s);

  function figSVG(s, label) {
    let g = '<svg viewBox="0 0 120 120" class="fig" role="img" aria-label="' + esc(label || 'figura') + '"><rect x="1.5" y="1.5" width="117" height="117" rx="6" class="fig-box"/>';
    const fc = 'f-' + s.fill;
    if (s.main === 'arrow') {
      const sc = s.big ? 1 : 0.62;
      g += '<g transform="translate(60 54) rotate(' + s.angle + ') scale(' + sc + ')"><path d="M0 -27 L15 -6 L5.5 -6 L5.5 25 L-5.5 25 L-5.5 -6 L-15 -6 Z" class="' + fc + ' st"/></g>';
    } else {
      const R = s.big ? 25 : 15, n = s.sides, pts = [];
      for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + k * 2 * Math.PI / n; pts.push((60 + R * Math.cos(a)).toFixed(2) + ',' + (54 + R * Math.sin(a)).toFixed(2)); }
      g += '<polygon points="' + pts.join(' ') + '" class="' + fc + ' st"/>';
    }
    if (s.dot != null) { const [x, y] = POS8[s.dot]; g += '<circle cx="' + x + '" cy="' + y + '" r="6" class="f-nero"/>'; }
    if (s.count) {
      const w = 7, gap = 4, tot = s.count * w + (s.count - 1) * gap, x0 = 60 - tot / 2;
      for (let k = 0; k < s.count; k++) g += '<rect x="' + (x0 + k * (w + gap)).toFixed(1) + '" y="86" width="' + w + '" height="' + w + '" class="f-nero"/>';
    }
    return g + '</svg>';
  }

  function absExplain(P) {
    const has = k => P.rules.includes(k), out = [];
    if (has('rot')) out.push('La freccia ruota di ' + Math.abs(P.da) + '° in senso ' + (P.da > 0 ? 'orario' : 'antiorario') + ' a ogni passaggio.');
    if (has('accel')) out.push('La freccia ruota in senso ' + (P.dir > 0 ? 'orario' : 'antiorario') + ' di 45°, poi 90°, poi 135°: la rotazione cresce di 45° a ogni passaggio.');
    if (has('sides')) out.push('Il poligono ' + (P.up ? 'guadagna' : 'perde') + ' un lato a ogni passaggio.');
    if (has('fill')) out.push('Il riempimento segue il ciclo ' + P.fseq.map(f => FILL_NAME[f]).join(' → ') + '.');
    if (has('size')) out.push('La figura centrale alterna grande e piccola.');
    if (has('dot')) out.push('Il punto avanza di ' + Math.abs(P.k) + (Math.abs(P.k) > 1 ? ' posizioni' : ' posizione') + ' in senso ' + (P.k > 0 ? 'orario' : 'antiorario') + ' lungo il bordo.');
    if (has('count')) out.push(P.alt ? 'I quadratini si alternano fra ' + P.alt[0] + ' e ' + P.alt[1] + '.' : 'I quadratini ' + (P.cs > 0 ? 'aumentano' : 'diminuiscono') + ' di uno a ogni passaggio.');
    if (P.dotStatic != null) out.push('Il punto resta fermo: non fa parte della regola.');
    if (P.countStatic) out.push('Il numero di quadratini non cambia: non fa parte della regola.');
    return out.join(' ');
  }

  function absDistractors(r, P, ans) {
    const has = k => P.rules.includes(k);
    const near = [], far = [];
    const add = (bucket, ch) => bucket.push({ ...ans, ...ch });
    if (ans.main === 'arrow') {
      const prev = absState(P, 4).angle;
      [45, -45, 90, 180].forEach(d => add(has('rot') || has('accel') ? near : far, { angle: mod(ans.angle + d, 360) }));
      if (has('rot') || has('accel')) add(near, { angle: prev });
    } else {
      [1, -1].forEach(d => { const s = ans.sides + d; if (s >= 3 && s <= 9) add(has('sides') ? near : far, { sides: s }); });
    }
    FILLS.filter(f => f !== ans.fill).forEach(f => add(has('fill') ? near : far, { fill: f }));
    add(has('size') ? near : far, { big: !ans.big });
    if (ans.dot != null) {
      [1, -1, 4].forEach(d => add(has('dot') ? near : far, { dot: mod(ans.dot + d, 8) }));
      if (has('dot')) add(near, { dot: absState(P, 4).dot });
    }
    if (ans.count) [1, -1].forEach(d => { const c = ans.count + d; if (c >= 1 && c <= 8) add(has('count') ? near : far, { count: c }); });
    const out = [], seen = new Set([keyOf(ans)]);
    for (const c of shuffle(r, near).concat(shuffle(r, far))) {
      const k = keyOf(c);
      if (seen.has(k)) continue;
      seen.add(k); out.push(c);
      if (out.length === 4) break;
    }
    return out;
  }

  function buildAbs(seed, n, levels) {
    const r = rng(seed);
    const lv = levels || [1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
    const items = [];
    for (let i = 0; i < n; i++) {
      const level = lv[i % lv.length];
      const P = absParams(r, level);
      const series = [0, 1, 2, 3, 4].map(k => absState(P, k));
      const ans = absState(P, 5);
      const opts = shuffle(r, [ans, ...absDistractors(r, P, ans)]);
      items.push({
        kind: 'abs', id: 'a' + seed + '-' + i, level,
        stim: '<div class="series">' + series.map((s, k) => figSVG(s, 'figura ' + (k + 1))).join('') + '<div class="fig fig-q" aria-label="figura da trovare">?</div></div>',
        q: 'Quale figura completa la serie?',
        opts: opts.map((s, k) => figSVG(s, 'opzione ' + 'ABCDE'[k])),
        correct: opts.findIndex(s => keyOf(s) === keyOf(ans)),
        why: absExplain(P)
      });
    }
    return items;
  }

  // ---------- verbale ----------
  function buildVerbal(seed, n, bank, seen) {
    const r = rng(seed);
    const visti = new Set(seen || []);
    const nuovi = shuffle(r, bank.filter(v => !visti.has(v.id)));
    const vecchi = shuffle(r, bank.filter(v => visti.has(v.id)));
    return nuovi.concat(vecchi).slice(0, n).map(v => {
      const order = shuffle(r, [0, 1, 2, 3]);
      return {
        kind: 'verbal', id: v.id, tema: v.tema,
        stim: '<p class="passage">' + esc(v.testo) + '</p>',
        q: 'Quale delle seguenti affermazioni è corretta?',
        opts: order.map(i => esc(v.opzioni[i])),
        correct: order.indexOf(0),
        why: esc(v.perche)
      };
    });
  }

  root.MOTORE = { rng, buildNum, buildAbs, buildVerbal, GEN, fx, absParams, absState, keyOf, absDistractors };
})(typeof window !== 'undefined' ? window : globalThis);
