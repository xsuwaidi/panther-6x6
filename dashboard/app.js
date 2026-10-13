/* Incident Command dashboard — one screen per role; every key action within three taps.
   Shared state: the artifact `db` document "ops/state" when available (all devices), else localStorage +
   BroadcastChannel (tabs on one device). Water, foam, SCBA air and arrivals are derived from timestamps,
   so nothing needs to be written on a timer. */
(function () {
'use strict';
const { T, VTYPES, TYPES, AREAS, ROLES, HAZ, SIDES, SECTORS, MISSIONS, misKind, REQ_KINDS, SUPPORT, AIR_CAP, seed } = window.ICD;
const KEY = 'icd.state.v2', UKEY = 'icd.ui.v2', DEMO = 10, WATER_X = 2, SCBA_X = 3;
const TAB = Math.random().toString(36).slice(2, 8);
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked: memory only */ } }
};
let S = store.get(KEY); if (!S || S.v !== 2) S = seed();
const UI = Object.assign({ role: null, me: null, lang: 'ar', theme: null, inc: null }, store.get(UKEY) || {});
UI.modal = null; UI.sector = null; UI.pickOff = false;
let bc = null; try { bc = new BroadcastChannel('icd2'); bc.onmessage = () => { const d = store.get(KEY); if (d && d.v === 2) { S = d; render(); } }; } catch (e) { /* none */ }
addEventListener('storage', e => { if (e.key === KEY) { const d = store.get(KEY); if (d && d.v === 2) { S = d; render(); } } });
let docRef = null, synced = false;
(async () => {
  try {
    if (!window.claude || !window.claude.use) return;
    const db = await window.claude.use('db'); if (!db) return;
    docRef = db.doc('ops/state');
    docRef.onSnapshot(snap => {
      if (snap.exists) { const d = snap.data(); if (d && d.v === 2 && d.rev !== S.rev) { S = d; store.set(KEY, S); render(); } }
      else docRef.set(S).catch(() => {});
      if (!synced) { synced = true; render(); }
    }, () => { docRef = null; synced = false; render(); });
  } catch (e) { docRef = null; }
})();
function save() {
  trim(); S.rev = Date.now() + '-' + TAB; store.set(KEY, S); if (bc) bc.postMessage(1);
  if (docRef) docRef.set(S).catch(() => toast(t('syncLocal')));
  render();
}
function trim() { S.incidents.forEach(i => { if (i.log.length > 80) i.log = i.log.slice(-80); }); S.reports = S.reports.filter(r => r.status === 'new').concat(S.reports.filter(r => r.status !== 'new').slice(-20)); }
function saveUI() { store.set(UKEY, { role: UI.role, me: UI.me, lang: UI.lang, theme: UI.theme, inc: UI.inc }); }

/* ---------- helpers ---------- */
const t = k => (T[UI.lang] && T[UI.lang][k]) || k;
const nm = o => o ? (o[UI.lang] || o.ar || o.en || o.cs || '') : '';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('en-US');
const now = () => Date.now();
const veh = id => S.vehicles.find(v => v.id === id);
const person = id => S.people.find(p => p.id === id);
const stn = id => S.stations.find(s => s.id === id);
const incOf = id => S.incidents.find(i => i.id === id);
const activeIncs = () => S.incidents.filter(i => i.status !== 'closed');
const who = w => nm(S.staff[w] || person(w)) || w;
const hhmm = ms => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
function dur(ms) { const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + String(x).padStart(2, '0'); }
const uid = p => p + Math.random().toString(36).slice(2, 8);
const areaName = k => nm(AREAS[k]);
const secName = s => nm(SECTORS[s.key]);
// live values derived from timestamps
const vSt = v => v.status === 'out' ? 'out' : v.status === 'enroute' && now() < (v.arriveAt || 0) ? 'enroute' : v.status === 'available' ? 'available' : v.pumping ? 'pump' : 'onscene';
const used = v => v.pumping ? v.flow * WATER_X * (now() - (v.pumpAt || now())) / 60000 : 0;
const vWater = v => Math.max(0, v.water - used(v));
const vFoam = v => Math.max(0, v.foam - used(v) * .03);
const vPct = v => VTYPES[v.type].water ? vWater(v) / VTYPES[v.type].water * 100 : 0;
const pAir = p => p.air == null ? null : Math.max(0, p.air - p.rate * SCBA_X * (now() - p.airAt) / 60000);
const airPct = p => { const a = pAir(p); return a == null ? null : a / AIR_CAP * 100; };
const incSt = i => i.status === 'dispatched' && S.vehicles.some(v => v.inc === i.id && vSt(v) !== 'enroute') ? 'onscene' : i.status;
const incVeh = i => S.vehicles.filter(v => v.inc === i.id);
const incPeople = i => S.people.filter(p => p.inc === i.id);
function addLog(inc, w, ar, en, k, ch) { inc.log.push({ t: now(), w, ar, en, k: k || '', ch: ch || 'CMD' }); }
const sevPill = s => `<span class="pill ${s === 'crit' || s === 'high' ? 'crit' : s === 'med' ? 'warn' : 'info'}">${t('sev_' + s)}</span>`;
const stPill = s => `<span class="pill ${s === 'control' || s === 'closed' ? 'ok' : s === 'onscene' ? 'crit' : 'info'}">${t('st_' + s)}</span>`;
const uCls = s => ({ available: 'ok', enroute: 'warn', onscene: 'crit', pump: 'info', out: '' }[s]);
const ssCls = s => ({ crit: 'crit', active: 'warn', stable: 'info', ctrl: 'ok' }[s]);
let toastT = 0; function toast(msg) { UI.toast = msg; clearTimeout(toastT); toastT = setTimeout(() => { UI.toast = null; render(); }, 2400); render(); }
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const etaMin = (st, area) => Math.max(2, Math.round(1.5 + dist(stn(st).pos, AREAS[area].pos) * .07 * 1.33));

const IC = {
  shield: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/>',
  fire: '<path d="M12 22c4 0 7-2.7 7-7 0-3.6-2.4-5.6-3.6-8.4-.4 1.9-1.4 3-2.6 3.4.4-3-1-5.8-3.8-8 .2 3-1.6 5-3 6.8C4.8 10.4 5 12 5 15c0 4.3 3 7 7 7z"/>',
  factory: '<path d="M3 21V10l6 4V10l6 4V5h6v16z"/><path d="M7 17h2M12 17h2M17 17h2"/>',
  car: '<path d="M5 16l1.5-5h11L19 16"/><rect x="3" y="16" width="18" height="3" rx="1"/><circle cx="7" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>',
  gas: '<rect x="7" y="7" width="10" height="14" rx="3"/><path d="M10 7V4h4v3M10 12h4"/>',
  hazmat: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  wave: '<path d="M2 16c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/><circle cx="12" cy="8" r="3"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/>',
  rescue: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6"/>',
  truck: '<path d="M2 15V7h11v8M13 10h4l4 4v1h-8"/><circle cx="6.5" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  radio: '<rect x="5" y="8" width="14" height="13" rx="2"/><path d="M8 8l7-5M9 13h6M9 17h3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.8 0 5 2 5 5"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', check: '<path d="M5 12l5 5 9-10"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"/>',
  swap: '<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>', alert: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', arrow: '<path d="M15 6l-6 6 6 6"/>', wind: '<path d="M3 8h11a3 3 0 10-3-3M3 12h15a3 3 0 11-3 3M3 16h8"/>',
  pump: '<circle cx="12" cy="12" r="8"/><path d="M12 4v8l5 3"/>', lung: '<path d="M12 3v8M12 11c-2-1-5 0-6 4s0 6 2 6 4-2 4-6M12 11c2-1 5 0 6 4s0 6-2 6-4-2-4-6"/>', thermo: '<path d="M10 14V5a2 2 0 014 0v9a4 4 0 11-4 0z"/>'
};
const ico = (n, cls) => `<svg class="i ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ''}</svg>`;
// placeholder emblem in the brand colours until the real logo file is supplied
const EMBLEM = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3l17 6v12c0 11-7.4 19.4-17 24C14.4 40.4 7 32 7 21V9z" fill="#1554C0" stroke="#F6B800" stroke-width="2.5"/><path d="M24 37c5 0 8.5-3.3 8.5-8.4 0-4.4-2.9-6.8-4.4-10.2-.5 2.3-1.7 3.6-3.2 4.1.5-3.6-1.2-7-4.6-9.7.2 3.6-1.9 6-3.6 8.2-1.4 1.8-1.2 3.7-1.2 7.6 0 5.1 3.5 8.4 8.5 8.4z" fill="#F6B800"/><path d="M24 34c2.2 0 3.8-1.5 3.8-3.8 0-2-1.4-3-2-4.6-.6 1.4-1.6 2-2.6 2.2.1-1.6-.5-3-1.6-4-.2 1.6-1.4 2.6-1.4 4.6 0 3 1.6 5.6 3.8 5.6z" fill="#0A2E6E"/></svg>`;

/* ---------- theme ---------- */
function applyTheme() { const r = document.documentElement; if (UI.theme) r.setAttribute('data-theme', UI.theme); r.lang = UI.lang; r.dir = UI.lang === 'ar' ? 'rtl' : 'ltr'; document.title = t('app'); }
const isDark = () => { const a = UI.theme || document.documentElement.getAttribute('data-theme'); return a ? a === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };

/* ---------- shared pieces ---------- */
function header() {
  const roleName = UI.role === 'ops' ? t('rOps') : UI.role === 'ic' ? t('rIC') : UI.role === 'off' ? nm(person(UI.me)) : '';
  return `<header class="bar"><div class="bar-in">
    <div class="brand">${EMBLEM}<div><b>${t('app')}</b><small>${t('appSub')}</small></div></div><div class="sp"></div>
    ${UI.role ? `<div class="role-chip"><i>${ico(UI.role === 'ops' ? 'radio' : UI.role === 'ic' ? 'star' : 'user')}</i>${esc(roleName)}</div>` : ''}
    <span class="clock" data-clock>${hhmm(now())}</span>
    <button class="ib" data-a="theme">${ico(isDark() ? 'sun' : 'moon')}<span>${isDark() ? t('day') : t('night')}</span></button>
    <button class="ib" data-a="lang">${ico('globe')}<span>${t('lang')}</span></button>
    ${UI.role ? `<button class="ib" data-a="logout">${ico('swap')}<span>${t('switchUser')}</span></button>` : ''}
  </div></header>`;
}
function maydayBanner() {
  if (UI.role === 'off' || !UI.role) return '';
  return activeIncs().filter(i => i.mayday && !i.mayday.ack).map(i => { const s = i.sectors.find(x => x.id === i.mayday.sector);
    return `<div class="mayday" role="alert">${ico('alert')}<span>${t('maydayFrom')} ${esc(who(i.mayday.officer))} · ${esc(s ? secName(s) : '')} · ${i.no}</span><span class="sp"></span><span class="mono" data-since="${i.mayday.at}"></span>${UI.role === 'ic' ? `<button class="btn sm" data-a="mayAck" data-i="${i.id}">${t('maydayAck')}</button>` : ''}</div>`; }).join('');
}
function tank(v) {
  const cap = VTYPES[v.type].water, w = vWater(v), p = cap ? w / cap * 100 : 0, f = vFoam(v), fc = VTYPES[v.type].foam;
  const left = v.pumping && v.flow ? dur(w / v.flow * 60000) : '—';
  return `<div class="tankrow"><small class="muted">${t('water')}</small><span class="mono">${fmt(w)} / ${fmt(cap)} L</span></div><div class="meter ${p < 10 ? 'crit' : p < 25 ? 'warn' : ''} ${v.pumping ? 'flowing' : ''}"><i style="width:${p}%"></i></div>
    <div class="tankrow"><small class="muted">${t('foam')}</small><span class="mono">${fmt(f)} L</span></div><div class="meter foam"><i style="width:${fc ? f / fc * 100 : 0}%"></i></div>
    ${v.pumping ? `<div class="tankrow"><small>${ico('pump')} ${fmt(v.flow)} L/min</small><span class="mono">${t('toEmpty')} ${left}</span></div>` : ''}`;
}
function unitCard(v, controls) {
  const s = vSt(v);
  return `<div class="unit ${s}"><div class="row"><b class="mono">${esc(v.cs)}</b><span class="sp"></span><span class="pill ${uCls(s)}">${t('us_' + s)}</span></div>
    <small class="muted">${esc(nm(VTYPES[v.type]))} · ${esc(nm(stn(v.st)))}${s === 'enroute' ? ` · ${t('eta')} <span class="mono" data-until="${v.arriveAt}"></span>` : ''}</small>
    ${tank(v)}${controls || ''}</div>`;
}
function logBlock(inc) {
  return `<span class="lbl">${t('log')}</span><div class="log">${inc.log.slice().reverse().slice(0, 40).map(e => `<div class="ent ${e.k || ''}"><span class="t">${hhmm(e.t)}</span><span><b>${esc(who(e.w))}</b> <span class="ch">${esc(e.ch || 'CMD')}</span><br>${esc(nm(e))}</span></div>`).join('')}</div>
  <form class="note" data-f="note" data-i="${inc.id}"><input id="note-${inc.id}" placeholder="${t('addNote')}" autocomplete="off" aria-label="${t('addNote')}"><button class="btn sm blue">${t('send')}</button></form>`;
}
const syncBadge = () => `<span class="sync ${synced ? 'on' : ''}"><i></i>${synced ? t('syncOn') : t('syncLocal')}</span>`;

/* ---------- role picker ---------- */
function viewPick() {
  if (UI.pickOff) {
    const leaders = S.people.filter(p => p.role === 'leader');
    return `<section class="hero"><h1>${t('whoAreYou')}</h1><p class="muted">${t('rOffD')}</p></section>
    <div class="people">${leaders.map(o => { const s = stn(o.st); return `<button class="person" data-a="me" data-id="${o.id}"><span class="av" style="background:${s.color};color:#fff">${ico('user')}</span><span><b>${esc(nm(o))}</b><small>${esc(nm(s))} · ${t('group')} ${s.duty}</small></span></button>`; }).join('')}</div>
    <div><button class="btn ghost" data-a="pickBack">${ico('arrow')} ${t('back')}</button></div>`;
  }
  const card = (r, icon, title, d) => `<button class="role" data-a="role" data-r="${r}"><span class="ic">${ico(icon)}</span><h2>${title}</h2><p>${d}</p><span class="go">${t('open')} ${ico('arrow')}</span></button>`;
  return `<section class="hero"><h1>${t('pickRole')}</h1><p class="muted">${t('pickRoleSub')}</p></section>
  <div class="roles">${card('ops', 'radio', t('rOps'), t('rOpsD'))}${card('ic', 'star', t('rIC'), t('rICD'))}${card('off', 'users', t('rOff'), t('rOffD'))}</div>
  <div class="row muted">${syncBadge()}<span>· ${t('speedNote')}</span><span class="sp"></span><button class="btn sm ghost" data-a="reset">${t('reset')}</button></div>`;
}

/* ===== Operations room ===== */
function viewOps() {
  const incs = activeIncs().sort((a, b) => b.created - a.created);
  if (!UI.inc || !incOf(UI.inc) || incOf(UI.inc).status === 'closed') UI.inc = incs[0] && incs[0].id;
  const sel = incOf(UI.inc), avail = S.vehicles.filter(v => vSt(v) === 'available'), news = S.reports.filter(r => r.status === 'new');
  const reqs = []; incs.forEach(i => i.requests.filter(r => r.status === 'open').forEach(r => reqs.push([i, r])));
  const stat = (n, l, c) => `<div class="cell"><span class="lbl">${l}</span><b class="mono" style="color:var(--${c})">${n}</b></div>`;
  return `<div class="hint"><span class="n">1</span>${t('hintOps')}</div>
  <div class="ibanner"><div class="body four">${stat(news.length, t('stats_reports'), 'crit')}${stat(incs.length, t('stats_active'), 'warn')}${stat(avail.length + '/' + S.vehicles.filter(v => v.status !== 'out').length, t('stats_avail'), 'ok')}${stat(reqs.length, t('stats_req'), 'brand')}</div></div>
  <div class="cols l">
    <div class="stack">
      <section class="panel"><div class="ph">${ico('plus')}<h2>${t('quick')}</h2></div>
        <div class="pb"><div class="tiles">${Object.entries(TYPES).map(([k, ty]) => `<button class="tile" data-a="new" data-type="${k}">${ico(ty.icon)}<span>${nm(ty)}</span></button>`).join('')}</div></div></section>
      <section class="panel"><div class="ph">${ico('radio')}<h2>${t('incoming')}</h2>${news.length ? `<span class="count">${news.length}</span>` : ''}</div><div class="pb">
        ${news.map(r => `<div class="rcard"><div class="row"><b>${esc(nm(TYPES[r.type]))}</b>${sevPill(r.sev)}<span class="sp"></span><span class="mono muted">${r.no}</span></div>
          <small class="muted">${esc(areaName(r.area))} · ${esc(r.location)} · <span class="mono" data-since="${r.at}"></span></small><p>${esc(nm(r))}</p>
          <div class="row">${(r.haz || []).map(h => `<span class="pill warn">${esc(nm(HAZ[h]))}</span>`).join('')}${r.trapped ? `<span class="pill crit">${t('trapped')}</span>` : ''}<span class="sp"></span>
          <button class="btn sm ghost" data-a="rRej" data-r="${r.id}">${t('reject')}</button><button class="btn sm pri" data-a="rOpen" data-r="${r.id}">${ico('truck')} ${t('dispatchRep')}</button></div></div>`).join('') || `<div class="empty">${t('noReports')}</div>`}
      </div></section>
      <section class="panel"><div class="ph">${ico('star')}<h2>${t('requests')}</h2></div><div class="pb">
        ${reqs.length ? reqs.map(([i, r]) => { const v = nearest(r.kind, i.area);
          return `<div class="mis"><span class="tx">${esc(nm(VTYPES[r.kind]))}<br><small class="muted">${i.no} · ${esc(who(r.from))} · <span class="mono" data-since="${r.at}"></span></small></span>${v ? `<button class="btn sm pri" data-a="fulfil" data-i="${i.id}" data-q="${r.id}" data-u="${v.id}">${t('fulfil')} ${esc(v.cs)}</button>` : `<span class="pill">${t('noneAvail')}</span>`}</div>`; }).join('') : `<div class="empty">${t('noReq')}</div>`}
      </div></section>
    </div>
    <div class="stack">
      <section class="panel"><div class="ph">${ico('alert')}<h2>${t('incidents')}</h2><span class="sp"></span>${syncBadge()}</div><div class="pb">
        ${incs.map(i => `<button class="icard ${i.id === UI.inc ? 'sel' : ''}" data-a="selInc" data-i="${i.id}"><span class="lv ${i.sev}"></span><span class="tx"><span class="row"><b>${esc(nm(i))}</b><span class="sp"></span>${stPill(incSt(i))}</span><span class="row muted">${ico(TYPES[i.type].icon)} <span class="mono">${i.no}</span> · <span class="mono" data-since="${i.created}"></span> · ${incVeh(i).length} ${t('unitsOn')} · ${incPeople(i).length} ${t('personnel')}</span></span></button>`).join('') || `<div class="empty">${t('noActive')}</div>`}
      </div></section>
      ${sel ? `<section class="panel"><div class="ph"><h2>${esc(nm(sel))}</h2><span class="sp"></span>${sevPill(sel.sev)}</div><div class="pb">
        <span class="lbl">${t('assigned')}</span>
        <div class="chips">${incVeh(sel).map(v => { const s = vSt(v); return `<span class="chip"><span class="dot ${uCls(s)}"></span><b class="mono">${esc(v.cs)}</b> ${t('us_' + s)}${s === 'enroute' ? ` · <span class="mono" data-until="${v.arriveAt}"></span>` : ''}</span>`; }).join('') || '—'}</div>
        <span class="lbl">${t('dispatchMore')}</span>
        <div class="chips">${avail.sort((a, b) => etaMin(a.st, sel.area) - etaMin(b.st, sel.area)).slice(0, 8).map(v => `<button class="chip" data-a="dispatch" data-i="${sel.id}" data-u="${v.id}">${ico('plus')}<b class="mono">${esc(v.cs)}</b><small class="muted">${esc(nm(VTYPES[v.type]))} · ${etaMin(v.st, sel.area)} ${t('min')}</small></button>`).join('') || `<span class="muted">${t('noneAvail')}</span>`}</div>
        ${logBlock(sel)}</div></section>` : ''}
      <section class="panel"><div class="ph">${ico('truck')}<h2>${t('units')}</h2></div><div class="pb">
        <div class="stmini-grid">${S.stations.map(s => { const vs = S.vehicles.filter(v => v.st === s.id), av = vs.filter(v => vSt(v) === 'available').length;
          return `<div class="stmini" style="--sc:${s.color}"><div class="row"><span class="sdot"></span><b>${esc(nm(s))}</b><span class="sp"></span><small class="muted">${t('group')} ${s.duty}</small></div>
            <div class="meter ok"><i style="width:${vs.length ? av / vs.length * 100 : 0}%"></i></div><div class="chips">${vs.map(v => `<span class="vchip ${vSt(v)}"><span class="dot ${uCls(vSt(v))}"></span>${esc(v.cs)}</span>`).join('')}</div></div>`; }).join('')}</div>
      </div></section>
    </div>
  </div>`;
}
function nearest(type, area, skip) {
  return S.vehicles.filter(v => v.type === type && vSt(v) === 'available' && !(skip || []).includes(v.id)).sort((a, b) => etaMin(a.st, area) - etaMin(b.st, area))[0];
}
function recommend(type, area) { const out = []; TYPES[type].plan.forEach(k => { const v = nearest(k, area, out); if (v) out.push(v.id); }); return out; }
function modalNew() {
  const m = UI.newInc, ty = TYPES[m.type];
  return `<div class="scrim" data-a="closeModal" data-self="1"><div class="modal" role="dialog" aria-modal="true" aria-label="${t('newIncident')}">
    <div class="ph"><h2>${t('newIncident')}${m.report ? ` · <span class="mono">${esc(m.report.no)}</span>` : ''}</h2><span class="sp"></span><button class="x" data-a="closeModal" aria-label="${t('cancel')}">${ico('x')}</button></div>
    <div class="pb" style="gap:16px">
      <div class="mstep"><span class="lbl"><i>1</i>${t('step1')}</span><div class="chips">${Object.entries(TYPES).map(([k, x]) => `<button class="chip ${k === m.type ? 'on' : ''}" data-a="mType" data-type="${k}">${ico(x.icon)}${nm(x)}</button>`).join('')}</div></div>
      <div class="mstep"><span class="lbl"><i>2</i>${t('step2')}</span><div class="tiles areas">${Object.entries(AREAS).map(([k, a]) => `<button class="tile ${m.area === k ? 'on' : ''}" data-a="mArea" data-k="${k}">${esc(nm(a))}</button>`).join('')}</div></div>
      <div class="mstep"><span class="lbl"><i>3</i>${t('step3')}</span><div class="seg four">${['low', 'med', 'high', 'crit'].map(s => `<button class="${m.sev === s ? 'on s-' + s : ''}" data-a="mSev" data-s="${s}">${t('sev_' + s)}</button>`).join('')}</div></div>
      ${m.area ? `<div class="mstep"><span class="lbl"><i>4</i>${t('step4')}</span><div class="chips">${S.vehicles.filter(v => vSt(v) === 'available').sort((a, b) => etaMin(a.st, m.area) - etaMin(b.st, m.area)).map(v => `<button class="chip ${m.units.includes(v.id) ? 'on' : ''}" data-a="mUnit" data-u="${v.id}">${m.units.includes(v.id) ? ico('check') : ico('plus')}<b class="mono">${esc(v.cs)}</b><small class="muted">${esc(nm(VTYPES[v.type]))} · ${etaMin(v.st, m.area)} ${t('min')}</small></button>`).join('') || `<span class="muted">${t('noneAvail')}</span>`}</div></div>` : ''}
      <details class="mstep" ${m.report ? 'open' : ''}><summary class="lbl">${t('more')}</summary><div class="frow">
        <label class="f" for="m-loc">${t('location')}<input id="m-loc" value="${esc(m.location || '')}"></label>
        <label class="f" for="m-caller">${t('caller')}<input id="m-caller" value="${esc(m.caller || '')}"></label></div>
        <div class="chips" style="margin-top:8px"><button class="chip ${m.trapped ? 'on' : ''}" data-a="mTrap">${t('trapped')}</button>
          <span class="chip">${t('injuries')} <button class="mini" data-a="mInj" data-d="-1" aria-label="-">${ico('minus')}</button><b class="mono">${m.injuries || 0}</b><button class="mini" data-a="mInj" data-d="1" aria-label="+">${ico('plus')}</button></span>
          ${Object.entries(HAZ).map(([k, h]) => `<button class="chip ${m.haz.includes(k) ? 'on' : ''}" data-a="mHaz" data-k="${k}">${esc(nm(h))}</button>`).join('')}</div></details>
    </div>
    <div class="mfoot"><button class="btn pri big" style="flex:1" data-a="mSend" ${m.area ? '' : 'disabled'}>${ico(ty.icon)} ${m.area ? t('sendReport') : t('chooseLoc')}</button><button class="btn ghost" data-a="closeModal">${t('cancel')}</button></div>
  </div></div>`;
}

/* ===== Incident commander ===== */
function alertsOf(inc) {
  const out = [];
  if (inc.mayday && !inc.mayday.ack) out.push(['crit', `MAYDAY · ${who(inc.mayday.officer)}`]);
  incPeople(inc).forEach(p => { const a = airPct(p); if (a != null && a < 33) out.push([a < 15 ? 'crit' : 'warn', `${nm(p)} · ${t('air')} ${Math.round(a)}%${a < 15 ? ' · ' + t('withdraw') : ''}`]); if (p.status === 'injured') out.push(['crit', `${nm(p)} · ${t('ps_injured')}`]); });
  incVeh(inc).forEach(v => { const p = vPct(v); if (vSt(v) !== 'enroute' && VTYPES[v.type].water && p < 25) out.push([p < 10 ? 'crit' : 'warn', `${v.cs} · ${t('water')} ${Math.round(p)}%`]); });
  return out;
}
function viewIC() {
  const incs = activeIncs();
  let inc = incOf(UI.inc); if (!inc || inc.status === 'closed' || inc.commander !== 'IC1') { inc = incs.find(i => i.commander === 'IC1') || null; UI.inc = inc && inc.id; }
  if (!inc) return `<div class="hint"><span class="n">1</span>${t('pickInc')}</div><div class="grid">${incs.map(i => `<div class="panel"><div class="pb"><b>${esc(nm(i))}</b><div class="row">${stPill(incSt(i))}${sevPill(i.sev)}<span class="mono muted" data-since="${i.created}"></span></div><button class="btn pri wide" data-a="take" data-i="${i.id}">${ico('star')} ${t('takeCmd')}</button></div></div>`).join('') || `<div class="empty">${t('noActive')}</div>`}</div>`;
  const st = incSt(inc), vs = incVeh(inc), men = incPeople(inc), open = inc.sectors.reduce((a, s) => a + s.missions.filter(m => m.s !== 'done').length, 0);
  const flow = ['dispatched', 'onscene', 'control', 'closed'], ci = flow.indexOf(st), next = flow[ci + 1];
  const water = vs.filter(v => vSt(v) !== 'enroute').reduce((a, v) => a + vWater(v), 0), fl = vs.filter(v => v.pumping).reduce((a, v) => a + v.flow, 0);
  const staging = vs.filter(v => !v.sector), al = alertsOf(inc), others = incs.filter(i => i.id !== inc.id);
  const node = s => { const o = person(s.officer), d = s.missions.filter(m => m.s === 'done').length, P = SECTORS[s.key];
    return `<button class="node ss-${s.status} ${P.side ? 'n-' + P.side : ''}" data-a="secOpen" data-s="${s.id}"><span class="row"><span class="sdot"></span><b>${esc(secName(s))}</b><span class="sp"></span><span class="ch">${P.ch}</span></span>
      <small>${o ? esc(nm(o)) : `<span class="need-t">${t('assignOff')}</span>`}</small>
      <span class="chips">${vs.filter(v => v.sector === s.id).map(v => `<span class="vchip ${vSt(v)}"><span class="dot ${uCls(vSt(v))}"></span>${esc(v.cs)}</span>`).join('')}</span>
      <span class="row"><small class="muted">${t('missions')} ${d}/${s.missions.length} · ${men.filter(p => p.sector === s.id).length} ${t('personnel')}</small><span class="sp"></span><span class="pill ${ssCls(s.status)}">${t('ss_' + s.status)}</span>${inc.par ? `<span class="pill ${inc.par.ack[s.id] ? 'ok' : 'warn'}">PAR</span>` : ''}</span></button>`; };
  const sides = inc.sectors.filter(s => SECTORS[s.key].side), rest = inc.sectors.filter(s => !SECTORS[s.key].side);
  return `<div class="hint"><span class="n">1</span>${t('hintIC')}</div>
  <div class="ibanner"><div class="top ${st === 'control' ? 'ctl' : ''}">${ico('alert')}<span>${t('active')}</span><span class="mono">${inc.no}</span><span class="sp"></span>${ico('clock')}<span class="mono" data-since="${inc.created}"></span>${sevPill(inc.sev)}</div>
    <div class="body"><div class="cell"><span class="lbl">${esc(areaName(inc.area))}</span><h2>${esc(nm(inc))}</h2></div>
      <div class="cell"><span class="lbl">${t('unitsOn')}</span><b class="mono">${vs.length}</b></div><div class="cell"><span class="lbl">${t('personnel')}</span><b class="mono">${men.length}</b></div>
      <div class="cell"><span class="lbl">${t('flow')}</span><b class="mono">${fmt(fl)}</b><small class="muted">L/min</small></div><div class="cell"><span class="lbl">${t('waterOn')}</span><b class="mono">${fmt(water)}</b><small class="muted">L</small></div></div></div>
  <div class="panel"><div class="pb envrow">
    <div class="steps">${flow.map((f, k) => `<span class="step ${k < ci ? 'done' : k === ci ? 'cur' : ''}"><i>${k < ci ? '✓' : k + 1}</i>${t('st_' + f)}</span>`).join('')}</div><span class="sp"></span>
    <span class="env">${ico('shield')} ${t('contain')} <button class="mini" data-a="contain" data-d="-10" aria-label="-10">${ico('minus')}</button><b class="mono">${inc.contain}%</b><button class="mini" data-a="contain" data-d="10" aria-label="+10">${ico('plus')}</button></span>
    ${inc.wind ? `<span class="env">${ico('wind')} ${t('wind')} <b class="mono">${esc(inc.wind)}</b></span>` : ''}
    <button class="env ${inc.hazmat ? 'hz' : ''}" data-a="hazmat">${ico('hazmat')} ${t('hazmat')} <b class="mono">${inc.hazmat}</b></button>
    ${inc.temp ? `<span class="env">${ico('thermo')} ${t('temp')} <b class="mono">${inc.temp}°C</b></span>` : ''}
    ${next ? `<button class="btn ${next === 'closed' ? 'blue' : 'pri'}" data-a="incNext" data-i="${inc.id}">${t('nextStatus')}: ${t('st_' + next)}</button>` : ''}
    ${others.map(i => i.commander === 'IC1' ? `<button class="chip" data-a="icSwitch" data-i="${i.id}">${i.no}</button>` : `<button class="chip" data-a="take" data-i="${i.id}">${ico('star')} ${i.no}</button>`).join('')}
  </div></div>
  <div class="cols">
    <div class="stack">
      <div class="map360"><span class="axis ax-v"></span><span class="axis ax-h"></span>
        <div class="core">${ico(TYPES[inc.type].icon)}<b>${inc.no}</b><small>${t('contain')} ${inc.contain}%</small></div>
        ${sides.map(node).join('')}</div>
      <div class="grid">${rest.map(node).join('')}<button class="addsector" data-a="addSecOpen">${ico('plus')} ${t('addSector')}</button></div>
      ${staging.length ? `<div class="panel"><div class="pb"><span class="lbl">${t('freeUnits')}</span><div class="chips">${staging.map(v => { const s = vSt(v); return `<span class="chip"><span class="dot ${uCls(s)}"></span><b class="mono">${esc(v.cs)}</b> ${t('us_' + s)}${s === 'enroute' ? ` · <span class="mono" data-until="${v.arriveAt}"></span>` : ''}</span>`; }).join('')}</div></div></div>` : ''}
    </div>
    <div class="stack">
      <section class="panel"><div class="ph">${ico('star')}<h2>${t('actions')}</h2></div><div class="pb">
        <button class="btn pri wide" data-a="reqOpen">${ico('truck')} ${t('reqUnits')}</button>
        <button class="btn wide" data-a="par" data-i="${inc.id}">${ico('users')} ${t('par')}</button>
        ${inc.par ? `<div class="chips">${inc.sectors.filter(s => s.officer).map(s => `<span class="chip ${inc.par.ack[s.id] ? 'on' : ''}"><span class="dot ${inc.par.ack[s.id] ? 'ok' : 'warn'}"></span>${esc(secName(s))}: ${inc.par.ack[s.id] ? t('parOk') : t('parWait')}</span>`).join('')}</div>` : ''}
        ${inc.requests.filter(r => r.status === 'open').map(r => `<div class="row"><span class="pill warn">${esc(nm(VTYPES[r.kind]))}</span><span class="muted">${t('parWait')}</span><span class="sp"></span><span class="mono muted" data-since="${r.at}"></span></div>`).join('')}
      </div></section>
      <section class="panel"><div class="ph">${ico('lung')}<h2>${t('alerts')}</h2>${al.length ? `<span class="count">${al.length}</span>` : ''}</div><div class="pb">${al.length ? `<ul class="alerts">${al.map(([c, x]) => `<li class="${c}">${ico('alert')}<span>${esc(x)}</span></li>`).join('')}</ul>` : `<div class="empty">${t('noAlerts')}</div>`}</div></section>
      <section class="panel"><div class="pb">${logBlock(inc)}</div></section>
    </div>
  </div>`;
}
const misPill = s => `<span class="pill ${s === 'done' ? 'ok' : s === 'doing' ? 'warn' : ''}">${t('ms_' + s)}</span>`;
function modalSector(inc) {
  const s = inc.sectors.find(x => x.id === UI.sector); if (!s) return '';
  const P = SECTORS[s.key], busy = inc.sectors.filter(x => x.id !== s.id).map(x => x.officer), leaders = S.people.filter(p => p.role === 'leader');
  const presets = MISSIONS[misKind(s.key)].filter(([ar]) => !s.missions.some(m => m.ar === ar));
  return `<div class="scrim" data-a="closeModal" data-self="1"><div class="modal" role="dialog" aria-modal="true">
    <div class="ph">${ico(P.icon)}<h2>${esc(secName(s))}</h2><span class="ch">${P.ch}</span><span class="sp"></span><button class="x" data-a="closeModal" aria-label="${t('cancel')}">${ico('x')}</button></div>
    <div class="pb" style="gap:16px">
      <div class="mstep"><span class="lbl"><i>1</i>${t('assignOff')}</span><div class="people">${leaders.map(o => { const st = stn(o.st), on = s.officer === o.id, dis = busy.includes(o.id) || (o.inc && o.inc !== inc.id);
        return `<button class="person ${on ? 'sel' : ''}" data-a="secOff" data-o="${o.id}" ${dis ? 'disabled' : ''}><span class="av" style="background:${st.color};color:#fff">${on ? ico('check') : ico('user')}</span><span><b>${esc(nm(o))}</b><small>${esc(nm(st))} · ${t('group')} ${st.duty}</small></span></button>`; }).join('')}</div></div>
      <div class="mstep"><span class="lbl"><i>2</i>${t('sectorUnits')}</span><div class="chips">${incVeh(inc).filter(v => !v.sector || v.sector === s.id).map(v => `<button class="chip ${v.sector === s.id ? 'on' : ''}" data-a="secUnit" data-u="${v.id}">${v.sector === s.id ? ico('check') : ico('plus')}<b class="mono">${esc(v.cs)}</b></button>`).join('') || '—'}</div></div>
      <div class="mstep"><span class="lbl"><i>3</i>${t('addMission')}</span><div class="chips">${presets.map(([ar, en], k) => `<button class="chip" data-a="secMis" data-k="${k}">${ico('plus')}${esc(UI.lang === 'ar' ? ar : en)}</button>`).join('')}</div>
        ${s.missions.map(m => `<div class="mis ${m.s}"><span class="tx">${esc(nm(m))}</span>${misPill(m.s)}</div>`).join('')}</div>
      <div class="mstep"><span class="lbl"><i>4</i>${t('status')}</span><div class="seg four">${['crit', 'active', 'stable', 'ctrl'].map(x => `<button class="${s.status === x ? 'on ss-' + x : ''}" data-a="secSt" data-s="${x}">${t('ss_' + x)}</button>`).join('')}</div></div>
    </div>
    <div class="mfoot"><button class="btn pri" style="flex:1" data-a="closeModal">${ico('check')} ${t('done')}</button><button class="btn ghost" data-a="secDel">${t('remove')}</button></div>
  </div></div>`;
}
function modalAddSector(inc) {
  const have = inc.sectors.map(s => s.key);
  return `<div class="scrim" data-a="closeModal" data-self="1"><div class="modal" role="dialog" aria-modal="true"><div class="ph"><h2>${t('addSector')}</h2><span class="sp"></span><button class="x" data-a="closeModal" aria-label="${t('cancel')}">${ico('x')}</button></div>
    <div class="pb"><div class="tiles areas">${Object.entries(SECTORS).filter(([k]) => !have.includes(k)).map(([k, P]) => `<button class="tile" data-a="addSec" data-k="${k}">${ico(P.icon)}<span>${nm(P)}</span></button>`).join('')}</div></div></div></div>`;
}
const modalPick = (title, items) => `<div class="scrim" data-a="closeModal" data-self="1"><div class="modal" role="dialog" aria-modal="true"><div class="ph"><h2>${title}</h2><span class="sp"></span><button class="x" data-a="closeModal" aria-label="${t('cancel')}">${ico('x')}</button></div><div class="pb"><div class="tiles">${items}</div></div></div></div>`;

/* ===== Sector / station officer ===== */
function viewOff() {
  const me = person(UI.me); if (!me) { UI.role = null; return viewPick(); }
  const st = stn(me.st); let inc = null, sec = null;
  activeIncs().forEach(i => i.sectors.forEach(s => { if (s.officer === me.id) { inc = i; sec = s; } }));
  const men = S.people.filter(p => p.st === me.st && p.id !== me.id);
  const vs = S.vehicles.filter(v => v.st === me.st || (sec && v.sector === sec.id));
  const parReq = inc && inc.par && !inc.par.ack[sec.id];
  const roleOrder = ['vice', 'breacher', 'water', 'driver'];
  return `<div class="hint"><span class="n">1</span>${t('hintOff')}</div>
  ${sec ? `<div class="assign"><span class="lbl">${t('yourSector')} · ${SECTORS[sec.key].ch}</span><h1>${ico(SECTORS[sec.key].icon)} ${esc(secName(sec))} <span class="pill ${ssCls(sec.status)}">${t('ss_' + sec.status)}</span></h1>
     <div class="row">${t('incident')}: <b>${esc(nm(inc))}</b> · <span class="mono">${inc.no}</span> · ${t('commander')}: ${esc(who(inc.commander || 'IC1'))} · <span class="mono" data-since="${inc.created}"></span></div></div>
     <div class="actbar"><button class="btn big ${parReq ? 'pri pulse' : ''}" data-a="parAck" ${parReq ? '' : 'disabled'}>${ico('check')} ${t('parOk')}</button>
     <button class="btn big blue" data-a="supOpen">${ico('radio')} ${t('support')}</button>
     <button class="btn big red" data-a="mayday">${ico('alert')} ${UI.confirmMay > now() ? t('maydayConfirm') : t('mayday')}</button></div>`
   : `<div class="assign none"><h1>${t('noAssign')}</h1><p class="muted" style="margin:0">${t('noAssignD')}</p><div class="row">${ico('shield')} ${esc(nm(st))} · ${t('group')} ${st.duty}</div></div>`}
  <div class="cols">
    <div class="stack">
      ${sec ? `<section class="panel"><div class="ph">${ico('check')}<h2>${t('myMissions')}</h2></div><div class="pb">${sec.missions.map(m => `<div class="mis ${m.s}"><span class="tx">${esc(nm(m))}</span>${misPill(m.s)}<button class="btn sm ${m.s === 'todo' ? 'pri' : m.s === 'doing' ? 'blue' : 'ghost'}" data-a="mis" data-m="${m.id}">${m.s === 'todo' ? t('ms_doing') : m.s === 'doing' ? t('ms_done') : '↺'}</button></div>`).join('') || `<div class="empty">${t('noMissions')}</div>`}</div></section>` : ''}
      <section class="panel"><div class="ph">${ico('users')}<h2>${t('myMen')}</h2><span class="sp"></span><span class="pill ok">${men.filter(p => p.status !== 'injured').length}/${men.length}</span></div><div class="pb">
        ${roleOrder.map(r => { const g = men.filter(p => p.role === r); if (!g.length) return '';
          return `<span class="lbl">${esc(nm(ROLES[r]))}</span><div class="crew">${g.map(p => { const a = airPct(p);
            return `<div class="man ${p.status}"><button class="manb" data-a="person" data-p="${p.id}"><span class="av">${ico(p.role === 'breacher' ? 'lung' : 'user')}</span><span><b>${esc(nm(p))}</b><small>${t('ps_' + p.status)}</small></span></button>
              ${a != null ? `<div class="tankrow"><small>${t('air')}</small><span class="mono">${Math.round(a)}%</span></div><div class="meter air ${a < 15 ? 'crit' : a < 33 ? 'warn' : ''}"><i style="width:${a}%"></i></div>${a < 50 ? `<button class="btn sm wide ${a < 33 ? 'pri' : ''}" data-a="swapAir" data-p="${p.id}">${ico('swap')} ${t('swap')}</button>` : ''}` : ''}</div>`; }).join('')}</div>`; }).join('')}
      </div></section>
    </div>
    <div class="stack">
      <section class="panel"><div class="ph">${ico('truck')}<h2>${t('myVehicles')}</h2></div><div class="pb">${vs.map(v => { const s = vSt(v);
        const ctl = (s === 'onscene' || s === 'pump') ? `<button class="btn sm wide ${v.pumping ? 'red' : 'blue'}" data-a="pump" data-u="${v.id}">${ico('pump')} ${v.pumping ? t('pumpOff') : t('pumpOn')}</button>`
          : (s === 'available' || s === 'out') && !sec ? `<div class="chips"><button class="chip ${s === 'available' ? 'on' : ''}" data-a="uSt" data-u="${v.id}" data-s="available">${t('us_available')}</button><button class="chip ${s === 'out' ? 'on' : ''}" data-a="uSt" data-u="${v.id}" data-s="out">${t('us_out')}</button></div>` : '';
        return unitCard(v, ctl); }).join('') || `<div class="empty">—</div>`}</div></section>
      ${inc ? `<section class="panel"><div class="pb">${logBlock(inc)}</div></section>` : ''}
    </div>
  </div>`;
}

/* ---------- render ---------- */
const app = document.getElementById('app');
function render() {
  applyTheme();
  const keep = document.activeElement && document.activeElement.id ? { id: document.activeElement.id } : null;
  const vals = {}; document.querySelectorAll('input[id]').forEach(i => { vals[i.id] = i.value; });
  const openDet = document.querySelector('details[open]') ? true : false;
  const body = !UI.role ? viewPick() : UI.role === 'ops' ? viewOps() : UI.role === 'ic' ? viewIC() : viewOff();
  let modal = '';
  const inc = incOf(UI.inc);
  if (UI.modal === 'new') modal = modalNew();
  else if (UI.modal === 'sector' && inc) modal = modalSector(inc);
  else if (UI.modal === 'addSec' && inc) modal = modalAddSector(inc);
  else if (UI.modal === 'req') modal = modalPick(t('reqKind'), REQ_KINDS.map(k => `<button class="tile" data-a="req" data-k="${k}">${ico('truck')}<span>${nm(VTYPES[k])}</span></button>`).join(''));
  else if (UI.modal === 'sup') modal = modalPick(t('reqKind'), SUPPORT.map(x => `<button class="tile" data-a="sup" data-k="${x.id}">${ico(x.id === 'water' ? 'drop' : x.id === 'men' ? 'users' : x.id === 'air' ? 'lung' : 'shield')}<span>${nm(x)}</span></button>`).join(''));
  app.innerHTML = header() + `<main class="wrap">${maydayBanner()}${body}</main>` + modal + (UI.toast ? `<div class="toast" role="status">${esc(UI.toast)}</div>` : '');
  Object.entries(vals).forEach(([id, v]) => { const el = document.getElementById(id); if (el && v) el.value = v; });
  if (openDet) { const d = document.querySelector('.modal details'); if (d) d.open = true; }
  if (keep) { const el = document.getElementById(keep.id); if (el) el.focus(); }
  tick();
}
function tick() {
  const n = now();
  document.querySelectorAll('[data-since]').forEach(el => { el.textContent = dur(n - +el.dataset.since); });
  document.querySelectorAll('[data-until]').forEach(el => { el.textContent = dur((+el.dataset.until - n) * DEMO); });
  document.querySelectorAll('[data-clock]').forEach(el => { el.textContent = hhmm(n); });
}
// redraw live values (tanks, air, arrivals) every 2 s unless the viewer is typing or a dialog is open
setInterval(() => { const a = document.activeElement; if (UI.modal || (a && a.tagName === 'INPUT')) tick(); else render(); }, 2000);
setInterval(tick, 1000);

/* ---------- actions ---------- */
function dispatch(inc, id) {
  const v = veh(id); if (!v || vSt(v) !== 'available') return;
  Object.assign(v, { status: 'enroute', inc: inc.id, sector: null, arriveAt: now() + etaMin(v.st, inc.area) * 60000 / DEMO });
  addLog(inc, 'ops', `إرسال ${v.cs} من ${stn(v.st).ar} · الوصول خلال ${etaMin(v.st, inc.area)} د.`, `Dispatched ${v.cs} from ${stn(v.st).en} · ETA ${etaMin(v.st, inc.area)} min.`);
}
function mySector() { let r = null; activeIncs().forEach(i => i.sectors.forEach(s => { if (s.officer === UI.me) r = [i, s]; })); return r; }
function stopPump(v) { if (v.pumping) { const u = used(v); v.water = Math.max(0, v.water - u); v.foam = Math.max(0, v.foam - u * .03); const i = incOf(v.inc); if (i) i.waterUsed = (i.waterUsed || 0) + u; v.pumping = false; v.flow = 0; } }
const A = {
  role(d) { if (d.r === 'off') UI.pickOff = true; else { UI.role = d.r; UI.inc = null; } saveUI(); render(); },
  me(d) { UI.role = 'off'; UI.me = d.id; UI.pickOff = false; saveUI(); render(); },
  pickBack() { UI.pickOff = false; render(); },
  logout() { UI.role = null; UI.pickOff = false; UI.modal = null; saveUI(); render(); },
  theme() { UI.theme = isDark() ? 'light' : 'dark'; saveUI(); render(); },
  lang() { UI.lang = UI.lang === 'ar' ? 'en' : 'ar'; saveUI(); render(); },
  reset() { S = seed(); UI.inc = null; save(); toast(t('reset')); },
  closeModal() { UI.modal = null; UI.sector = null; render(); },
  // operations room
  new(d) { UI.modal = 'new'; UI.newInc = { type: d.type, area: null, sev: TYPES[d.type].sev, units: [], haz: [], injuries: 0, trapped: false }; render(); },
  rOpen(d) { const r = S.reports.find(x => x.id === d.r); UI.modal = 'new'; UI.newInc = { report: r, type: r.type, area: r.area, sev: r.sev, units: recommend(r.type, r.area), haz: (r.haz || []).slice(), injuries: r.injuries, trapped: r.trapped, location: r.location, caller: r.caller }; render(); },
  rRej(d) { const r = S.reports.find(x => x.id === d.r); r.status = 'rejected'; save(); },
  mType(d) { Object.assign(UI.newInc, { type: d.type, sev: TYPES[d.type].sev, units: UI.newInc.area ? recommend(d.type, UI.newInc.area) : [] }); render(); },
  mArea(d) { Object.assign(UI.newInc, { area: d.k, units: recommend(UI.newInc.type, d.k) }); render(); },
  mSev(d) { UI.newInc.sev = d.s; render(); },
  mUnit(d) { const a = UI.newInc.units, k = a.indexOf(d.u); k < 0 ? a.push(d.u) : a.splice(k, 1); render(); },
  mTrap() { UI.newInc.trapped = !UI.newInc.trapped; render(); },
  mInj(d) { UI.newInc.injuries = Math.max(0, (UI.newInc.injuries || 0) + +d.d); render(); },
  mHaz(d) { const a = UI.newInc.haz, k = a.indexOf(d.k); k < 0 ? a.push(d.k) : a.splice(k, 1); render(); },
  mSend() {
    const m = UI.newInc; if (!m.area) return; const ty = TYPES[m.type], ar = AREAS[m.area];
    const loc = (document.getElementById('m-loc') || {}).value || m.location || '', caller = (document.getElementById('m-caller') || {}).value || m.caller || '';
    const no = 'ح-' + (S.seq++), side = ty.fire ? ['A', 'water'] : ['work'];
    const inc = { id: 'I' + no.slice(2), no, type: m.type, area: m.area, sev: m.sev, status: 'dispatched', created: now(), ar: `${ty.ar} · ${ar.ar}`, en: `${ty.en} · ${ar.en}`, location: loc,
      commander: null, contain: 0, hazmat: m.haz.includes('chem') ? 2 : 0, temp: null, wind: '', waterUsed: 0, requests: [], par: null, mayday: null, log: [],
      sectors: side.map((k, j) => ({ id: uid('s'), key: k, officer: null, status: j ? 'stable' : 'active', missions: [] })) };
    const rno = m.report ? m.report.no : 'ب-' + (S.rseq++);
    addLog(inc, 'ops', `البلاغ ${rno} → فتح الحادث ${no}: ${ty.ar} في ${ar.ar}${m.trapped ? ' · يوجد محتجزون' : ''}${m.injuries ? ' · إصابات ' + m.injuries : ''}${caller ? ' · المبلّغ: ' + caller : ''}.`,
      `Call ${rno} → incident ${no}: ${ty.en} at ${ar.en}${m.trapped ? ' · people trapped' : ''}${m.injuries ? ' · injuries ' + m.injuries : ''}.`, m.sev === 'crit' ? 'crit' : '');
    S.incidents.push(inc); m.units.forEach(id => dispatch(inc, id));
    if (m.report) { const r = S.reports.find(x => x.id === m.report.id); if (r) r.status = 'dispatched'; }
    UI.inc = inc.id; UI.modal = null; save(); toast(`${t('sent')} · ${no}`);
  },
  selInc(d) { UI.inc = d.i; saveUI(); render(); },
  dispatch(d) { const i = incOf(d.i); dispatch(i, d.u); save(); toast(`${d.u} ${t('dispatchedTo')} ${i.no}`); },
  fulfil(d) { const i = incOf(d.i), r = i.requests.find(x => x.id === d.q); dispatch(i, d.u); r.status = 'done'; save(); toast(`${d.u} ${t('dispatchedTo')} ${i.no}`); },
  // incident commander
  take(d) { const i = incOf(d.i); i.commander = 'IC1'; UI.inc = i.id; addLog(i, 'IC1', 'استلام قيادة الحادث.', 'Took command of the incident.'); saveUI(); save(); },
  icSwitch(d) { UI.inc = d.i; saveUI(); render(); },
  contain(d) { const i = incOf(UI.inc); i.contain = Math.max(0, Math.min(100, i.contain + +d.d)); save(); },
  hazmat() { const i = incOf(UI.inc); i.hazmat = (i.hazmat + 1) % 5; save(); },
  incNext(d) { const i = incOf(d.i), f = ['dispatched', 'onscene', 'control', 'closed'], n = f[f.indexOf(incSt(i)) + 1]; if (!n) return; i.status = n;
    addLog(i, 'IC1', `تحديث حالة الحادث: ${T.ar['st_' + n]}.`, `Incident status: ${T.en['st_' + n]}.`, n === 'control' || n === 'closed' ? 'ok' : '');
    if (n === 'control') i.contain = Math.max(i.contain, 90);
    if (n === 'closed') { incVeh(i).forEach(v => { stopPump(v); Object.assign(v, { status: v.status === 'out' ? 'out' : 'available', inc: null, sector: null, water: VTYPES[v.type].water, foam: VTYPES[v.type].foam }); });
      incPeople(i).forEach(p => { Object.assign(p, { status: p.status === 'injured' ? 'injured' : 'duty', inc: null, sector: null, air: null }); }); UI.inc = null; }
    save(); },
  secOpen(d) { UI.sector = d.s; UI.modal = 'sector'; render(); },
  secOff(d) { const i = incOf(UI.inc), s = i.sectors.find(x => x.id === UI.sector), o = person(d.o);
    if (s.officer) S.people.filter(p => p.sector === s.id).forEach(p => Object.assign(p, { status: 'duty', inc: null, sector: null, air: null }));
    s.officer = d.o;
    // one less tap: the officer's duty group moves into the sector, breachers start on full cylinders,
    // and the station's vehicles already on this incident join the sector
    S.people.filter(p => p.st === o.st && p.status !== 'injured').forEach(p => { Object.assign(p, { status: 'field', inc: i.id, sector: s.id });
      if (p.role === 'breacher') Object.assign(p, { air: AIR_CAP, airAt: now(), rate: 50 + Math.round(Math.random() * 20) }); });
    incVeh(i).filter(v => v.st === o.st && !v.sector).forEach(v => { v.sector = s.id; });
    addLog(i, 'IC1', `تكليف ${o.ar} (${stn(o.st).ar}) بـ${SECTORS[s.key].ar}.`, `${o.en} (${stn(o.st).en}) assigned to ${SECTORS[s.key].en}.`, '', SECTORS[s.key].ch); save(); },
  secUnit(d) { const v = veh(d.u); v.sector = v.sector === UI.sector ? null : UI.sector; save(); },
  secMis(d) { const s = incOf(UI.inc).sectors.find(x => x.id === UI.sector), [ar, en] = MISSIONS[misKind(s.key)].filter(([a]) => !s.missions.some(m => m.ar === a))[+d.k]; s.missions.push({ id: uid('m'), ar, en, s: 'todo' }); save(); },
  secSt(d) { const i = incOf(UI.inc), s = i.sectors.find(x => x.id === UI.sector); s.status = d.s; addLog(i, 'IC1', `${SECTORS[s.key].ar}: ${T.ar['ss_' + d.s]}.`, `${SECTORS[s.key].en}: ${T.en['ss_' + d.s]}.`, d.s === 'crit' ? 'warn' : d.s === 'ctrl' ? 'ok' : '', SECTORS[s.key].ch); save(); },
  secDel() { const i = incOf(UI.inc); S.people.filter(p => p.sector === UI.sector).forEach(p => Object.assign(p, { status: 'duty', inc: null, sector: null, air: null })); incVeh(i).filter(v => v.sector === UI.sector).forEach(v => { v.sector = null; });
    i.sectors = i.sectors.filter(x => x.id !== UI.sector); UI.modal = null; UI.sector = null; save(); },
  addSecOpen() { UI.modal = 'addSec'; render(); },
  addSec(d) { const i = incOf(UI.inc), s = { id: uid('s'), key: d.k, officer: null, status: 'active', missions: [] }; i.sectors.push(s);
    addLog(i, 'IC1', `إنشاء ${SECTORS[d.k].ar}.`, `Created ${SECTORS[d.k].en}.`); UI.sector = s.id; UI.modal = 'sector'; save(); },
  reqOpen() { UI.modal = 'req'; render(); },
  req(d) { const i = incOf(UI.inc); i.requests.push({ id: uid('q'), kind: d.k, from: 'IC1', at: now(), status: 'open' }); addLog(i, 'IC1', `طلب آلية إضافية: ${VTYPES[d.k].ar}.`, `Requested an extra vehicle: ${VTYPES[d.k].en}.`); UI.modal = null; save(); toast(t('sent')); },
  par(d) { const i = incOf(d.i); i.par = { at: now(), ack: {} }; addLog(i, 'IC1', 'طلب حصر الأفراد من جميع القطاعات.', 'Personnel check requested from all sectors.'); save(); toast(t('parSent')); },
  mayAck(d) { const i = incOf(d.i); i.mayday.ack = now(); addLog(i, 'IC1', 'تم استلام نداء الاستغاثة. فريق التدخل السريع يتحرك.', 'Mayday acknowledged. Rapid intervention team moving in.', 'crit'); save(); },
  // officer
  mis(d) { const [i, s] = mySector(), m = s.missions.find(x => x.id === d.m); m.s = m.s === 'todo' ? 'doing' : m.s === 'doing' ? 'done' : 'todo';
    if (m.s === 'done') addLog(i, UI.me, `تم إنجاز: ${m.ar}.`, `Completed: ${m.en}.`, 'ok', SECTORS[s.key].ch); save(); },
  person(d) { const p = person(d.p), ms = mySector(); p.status = p.status === 'injured' ? (p.inc ? 'field' : 'duty') : 'injured';
    if (p.status === 'injured' && ms) addLog(ms[0], UI.me, `إصابة: ${p.ar}.`, `Injury: ${p.en}.`, 'crit', SECTORS[ms[1].key].ch); save(); },
  swapAir(d) { const p = person(d.p); Object.assign(p, { air: AIR_CAP, airAt: now() }); const ms = mySector(); if (ms) addLog(ms[0], UI.me, `تبديل أسطوانة: ${p.ar}.`, `Cylinder swapped: ${p.en}.`, '', SECTORS[ms[1].key].ch); save(); },
  pump(d) { const v = veh(d.u), i = incOf(v.inc);
    if (v.pumping) { stopPump(v); if (i) addLog(i, UI.me, `${v.cs} أوقف الضخ.`, `${v.cs} stopped pumping.`); }
    else { Object.assign(v, { pumping: true, pumpAt: now(), flow: VTYPES[v.type].flow }); if (i) addLog(i, UI.me, `${v.cs} يضخ ${v.flow} لتر/دقيقة.`, `${v.cs} pumping ${v.flow} L/min.`); }
    save(); },
  uSt(d) { const v = veh(d.u); v.status = d.s; save(); },
  parAck() { const [i, s] = mySector(); i.par.ack[s.id] = now(); const n = S.people.filter(p => p.sector === s.id).length;
    addLog(i, UI.me, `حصر الأفراد: ${n} — الكل بخير.`, `Personnel check: ${n} — all accounted for.`, 'ok', SECTORS[s.key].ch); save(); toast(t('parOk')); },
  supOpen() { UI.modal = 'sup'; render(); },
  sup(d) { const [i, s] = mySector(), x = SUPPORT.find(y => y.id === d.k); addLog(i, UI.me, `طلب دعم: ${x.ar}.`, `Support request: ${x.en}.`, 'warn', SECTORS[s.key].ch); UI.modal = null; save(); toast(t('sent')); },
  mayday() { if (UI.confirmMay > now()) { const [i, s] = mySector(); i.mayday = { sector: s.id, officer: UI.me, at: now() }; addLog(i, UI.me, 'MAYDAY — نداء استغاثة!', 'MAYDAY — firefighter emergency!', 'crit', SECTORS[s.key].ch); UI.confirmMay = 0; save(); toast(t('sent')); }
    else { UI.confirmMay = now() + 4000; render(); setTimeout(render, 4100); } }
};

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]'); if (!el || el.disabled) return;
  const d = Object.assign({}, el.dataset);
  if (d.self && ev.target !== el) return;   // clicks inside a dialog don't close it
  const f = A[d.a]; if (f) { ev.preventDefault(); f(d, ev); }
});
document.addEventListener('submit', ev => {
  const f = ev.target.closest('[data-f="note"]'); if (!f) return; ev.preventDefault();
  const inp = f.querySelector('input'), v = inp.value.trim(); if (!v) return; const i = incOf(f.dataset.i);
  addLog(i, UI.role === 'ops' ? 'ops' : UI.role === 'ic' ? 'IC1' : UI.me, v, v); inp.value = ''; save();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && UI.modal) { UI.modal = null; render(); } });
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render); } catch (e) { /* old browsers */ }
render();
})();
