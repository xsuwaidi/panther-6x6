/* Incident Command dashboard — one screen per role, every key action within three taps.
   State lives in localStorage and is broadcast to other tabs, so the roles can be demoed side by side. */
(function () {
'use strict';
const { T, TYPES, LOCS, KINDS, SECTORS, REQ_KINDS, SUPPORT, seed } = window.ICD;
const KEY = 'icd.state.v1', UKEY = 'icd.ui.v1';
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked: keep in memory */ } }
};
let S = store.get(KEY); if (!S || S.v !== 1) S = seed();
const UI = Object.assign({ role: null, me: null, lang: 'ar', theme: null, inc: null, modal: null, sector: null, confirmMay: 0 }, store.get(UKEY) || {});
UI.modal = null; UI.sector = null;
let bc = null; try { bc = new BroadcastChannel('icd'); bc.onmessage = () => { S = store.get(KEY) || S; render(); }; } catch (e) { /* no BroadcastChannel */ }
addEventListener('storage', e => { if (e.key === KEY) { S = store.get(KEY) || S; render(); } });
function save() { store.set(KEY, S); if (bc) bc.postMessage(1); render(); }
function saveUI() { store.set(UKEY, { role: UI.role, me: UI.me, lang: UI.lang, theme: UI.theme, inc: UI.inc }); }

/* ---------- helpers ---------- */
const t = k => (T[UI.lang] && T[UI.lang][k]) || k;
const nm = o => o ? (o[UI.lang] || o.ar || o.en || o.cs || '') : '';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const unit = id => S.units.find(u => u.id === id);
const off = id => S.officers.find(o => o.id === id);
const stn = id => S.stations.find(s => s.id === id);
const incOf = id => S.incidents.find(i => i.id === id);
const activeIncs = () => S.incidents.filter(i => i.status !== 'closed');
const who = w => nm(S.staff[w] || off(w)) || w;
const hhmm = ms => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
function dur(ms) { const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + String(x).padStart(2, '0'); }
const uid = p => p + Math.random().toString(36).slice(2, 8);
const crewOf = uids => S.people.filter(p => uids.includes(p.unit));
function addLog(inc, w, ar, en, kind) { inc.log.push({ t: Date.now(), w, ar, en, k: kind || '' }); }
const lvlPill = l => `<span class="pill ${l === 3 ? 'crit' : l === 2 ? 'warn' : 'info'}">${t('level')}: ${t('l' + l)}</span>`;
const stPill = s => `<span class="pill ${s === 'new' ? 'warn' : s === 'control' || s === 'closed' ? 'ok' : s === 'onscene' ? 'crit' : 'info'}">${t('st_' + s)}</span>`;
const uDot = s => s === 'available' ? 'ok' : s === 'enroute' ? 'warn' : s === 'onscene' ? 'crit' : '';
let toastT = 0; function toast(msg) { UI.toast = msg; clearTimeout(toastT); toastT = setTimeout(() => { UI.toast = null; render(); }, 2200); }

const IC = {
  shield: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/>',
  fire: '<path d="M12 22c4 0 7-2.7 7-7 0-3.6-2.4-5.6-3.6-8.4-.4 1.9-1.4 3-2.6 3.4.4-3-1-5.8-3.8-8 .2 3-1.6 5-3 6.8C4.8 10.4 5 12 5 15c0 4.3 3 7 7 7z"/>',
  plane: '<path d="M10.5 21l1.5-1 1.5 1v-2l-1-1V13l8 3v-2l-8-5V4a1 1 0 00-2 0v5l-8 5v2l8-3v5l-1 1z"/>',
  hazmat: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/>',
  rescue: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6"/>',
  medical: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
  truck: '<path d="M2 15V7h11v8M13 10h4l4 4v1h-8"/><circle cx="6.5" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  radio: '<rect x="5" y="8" width="14" height="13" rx="2"/><path d="M8 8l7-5M9 13h6M9 17h3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.8 0 5 2 5 5"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', check: '<path d="M5 12l5 5 9-10"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"/>',
  swap: '<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>', alert: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', arrow: '<path d="M15 6l-6 6 6 6"/>'
};
const ico = (n, cls) => `<svg class="i ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ''}</svg>`;
// generic emblem (placeholder until the real logo file is provided): blue shield, yellow flame
const EMBLEM = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3l17 6v12c0 11-7.4 19.4-17 24C14.4 40.4 7 32 7 21V9z" fill="#1554C0" stroke="#F6B800" stroke-width="2.5"/><path d="M24 37c5 0 8.5-3.3 8.5-8.4 0-4.4-2.9-6.8-4.4-10.2-.5 2.3-1.7 3.6-3.2 4.1.5-3.6-1.2-7-4.6-9.7.2 3.6-1.9 6-3.6 8.2-1.4 1.8-1.2 3.7-1.2 7.6 0 5.1 3.5 8.4 8.5 8.4z" fill="#F6B800"/><path d="M24 34c2.2 0 3.8-1.5 3.8-3.8 0-2-1.4-3-2-4.6-.6 1.4-1.6 2-2.6 2.2.1-1.6-.5-3-1.6-4-.2 1.6-1.4 2.6-1.4 4.6 0 3 1.6 5.6 3.8 5.6z" fill="#0A2E6E"/></svg>`;

/* ---------- theme ---------- */
function applyTheme() {
  const r = document.documentElement;
  if (UI.theme) r.setAttribute('data-theme', UI.theme);
  r.lang = UI.lang; r.dir = UI.lang === 'ar' ? 'rtl' : 'ltr';
  document.title = t('app');
}
const isDark = () => { const a = UI.theme || document.documentElement.getAttribute('data-theme'); return a ? a === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };

/* ---------- views ---------- */
function header() {
  const roleName = UI.role === 'ops' ? t('rOps') : UI.role === 'ic' ? t('rIC') : UI.role === 'off' ? nm(off(UI.me)) : '';
  return `<header class="bar"><div class="bar-in">
    <div class="brand">${EMBLEM}<div><b>${t('app')}</b><small>${t('appSub')}</small></div></div>
    <div class="sp"></div>
    ${UI.role ? `<div class="role-chip"><i>${ico(UI.role === 'ops' ? 'radio' : UI.role === 'ic' ? 'star' : 'user')}</i>${esc(roleName)}</div>` : ''}
    <span class="clock" data-clock>${hhmm(Date.now())}</span>
    <button class="ib" data-a="theme" aria-label="${isDark() ? t('day') : t('night')}">${ico(isDark() ? 'sun' : 'moon')}<span>${isDark() ? t('day') : t('night')}</span></button>
    <button class="ib" data-a="lang">${ico('globe')}<span>${t('lang')}</span></button>
    ${UI.role ? `<button class="ib" data-a="logout">${ico('swap')}<span>${t('switchUser')}</span></button>` : ''}
  </div></header>`;
}
function maydayBanner() {
  if (UI.role === 'off' || !UI.role) return '';
  return activeIncs().filter(i => i.mayday && !i.mayday.ack).map(i => { const sec = i.sectors.find(s => s.id === i.mayday.sector);
    return `<div class="mayday" role="alert">${ico('alert')}<span>${t('maydayFrom')} ${esc(nm(off(i.mayday.officer)))} — ${t('sectorOf')} ${esc(nm(SECTORS[sec ? sec.key : 'attack']))} · ${i.id}</span><span class="sp"></span><span class="mono" data-since="${i.mayday.at}"></span>${UI.role === 'ic' ? `<button class="btn sm" data-a="mayAck" data-i="${i.id}">${t('maydayAck')}</button>` : ''}</div>`; }).join('');
}

function viewPick() {
  if (UI.pickOff) {
    return `<section class="hero"><h1>${t('whoAreYou')}</h1><p class="muted">${t('rOffD')}</p></section>
    <div class="people">${S.officers.map(o => `<button class="person" data-a="me" data-id="${o.id}"><span class="av">${ico('user')}</span><span><b>${esc(nm(o))}</b><small>${esc(nm(stn(o.st)))}</small></span></button>`).join('')}</div>
    <div><button class="btn ghost" data-a="pickBack">${ico('arrow')} ${t('back')}</button></div>`;
  }
  const card = (r, icon, title, d) => `<button class="role" data-a="role" data-r="${r}"><span class="ic">${ico(icon)}</span><h2>${title}</h2><p>${d}</p><span class="go">${t('open')} ${ico('arrow')}</span></button>`;
  return `<section class="hero"><h1>${t('pickRole')}</h1><p class="muted">${t('pickRoleSub')}</p></section>
  <div class="roles">${card('ops', 'radio', t('rOps'), t('rOpsD'))}${card('ic', 'star', t('rIC'), t('rICD'))}${card('off', 'users', t('rOff'), t('rOffD'))}</div>
  <p class="muted">${ico('swap')} ${t('syncNote')} · <button class="btn sm ghost" data-a="reset">${t('reset')}</button></p>`;
}

/* ===== Operations room ===== */
function viewOps() {
  const incs = S.incidents.filter(i => i.status !== 'closed').sort((a, b) => b.created - a.created);
  if (!UI.inc || !incOf(UI.inc)) UI.inc = incs[0] && incs[0].id;
  const sel = incOf(UI.inc);
  const avail = S.units.filter(u => u.status === 'available');
  const reqs = []; activeIncs().forEach(i => i.requests.filter(r => r.status === 'open').forEach(r => reqs.push([i, r])));
  const stat = (n, l, c) => `<div class="cell"><span class="lbl">${l}</span><b class="mono" style="color:var(--${c})">${n}</b></div>`;
  return `<div class="hint"><span class="n">1</span>${t('hintOps')}</div>
  <div class="ibanner"><div class="body" style="grid-template-columns:repeat(4,minmax(0,1fr))">${stat(incs.length, t('stats_active'), 'crit')}${stat(avail.length, t('stats_avail'), 'ok')}${stat(S.units.filter(u => u.status === 'enroute' || u.status === 'onscene').length, t('stats_busy'), 'warn')}${stat(reqs.length, t('stats_req'), 'brand')}</div></div>
  <div class="cols l">
    <div style="display:flex;flex-direction:column;gap:16px;min-width:0">
      <section class="panel"><div class="ph">${ico('plus')}<h2>${t('quick')}</h2></div>
        <div class="pb"><div class="tiles">${Object.entries(TYPES).map(([k, ty]) => `<button class="tile" data-a="new" data-type="${k}">${ico(ty.icon)}<span>${nm(ty)}</span></button>`).join('')}</div></div></section>
      <section class="panel"><div class="ph">${ico('radio')}<h2>${t('requests')}</h2></div><div class="pb">
        ${reqs.length ? reqs.map(([i, r]) => { const u = avail.find(x => x.kind === r.kind);
          return `<div class="mis"><span class="tx">${esc(nm(KINDS[r.kind]))}<br><small class="muted">${i.id} · ${esc(who(r.from))} · <span class="mono" data-since="${r.at}"></span></small></span>${u ? `<button class="btn sm pri" data-a="fulfil" data-i="${i.id}" data-q="${r.id}" data-u="${u.id}">${t('fulfil')} ${esc(u.cs)}</button>` : `<span class="pill">${t('noneAvail')}</span>`}</div>`; }).join('') : `<div class="empty">${t('noReq')}</div>`}
      </div></section>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;min-width:0">
      <section class="panel"><div class="ph">${ico('alert')}<h2>${t('incidents')}</h2></div><div class="pb">
        ${incs.map(i => `<button class="icard ${i.id === UI.inc ? 'sel' : ''}" data-a="selInc" data-i="${i.id}"><span class="lv l${i.level}"></span><span class="tx"><span class="row"><b>${esc(nm(i))}</b><span class="sp"></span>${stPill(i.status)}</span><span class="row muted">${ico(TYPES[i.type].icon)} ${esc(nm(LOCS.find(l => l.id === i.loc)))} · <span class="mono">${i.id}</span> · <span class="mono" data-since="${i.created}"></span> · ${i.units.length} ${t('unitsOn')}</span></span></button>`).join('') || `<div class="empty">${t('noActive')}</div>`}
      </div></section>
      ${sel ? `<section class="panel"><div class="ph"><h2>${esc(nm(sel))}</h2><span class="sp"></span>${lvlPill(sel.level)}</div><div class="pb">
        <span class="lbl">${t('assigned')}</span>
        <div class="chips">${sel.units.map(id => { const u = unit(id); return `<span class="chip"><span class="dot ${uDot(u.status)}"></span>${esc(u.cs)} · ${t('us_' + u.status)}</span>`; }).join('') || `<span class="muted">—</span>`}</div>
        <span class="lbl">${t('dispatchMore')}</span>
        <div class="chips">${avail.map(u => `<button class="chip" data-a="dispatch" data-i="${sel.id}" data-u="${u.id}">${ico('plus')}${esc(u.cs)} <small class="muted">${esc(nm(KINDS[u.kind]))}</small></button>`).join('') || `<span class="muted">${t('noneAvail')}</span>`}</div>
        ${logBlock(sel)}
      </div></section>` : ''}
      <section class="panel"><div class="ph">${ico('truck')}<h2>${t('units')}</h2></div><div class="pb"><div class="ugrid">${S.units.map(unitCard).join('')}</div></div></section>
    </div>
  </div>`;
}
function unitCard(u) {
  return `<div class="unit ${u.status}"><div class="row"><b>${esc(u.cs)}</b><span class="sp"></span><span class="pill ${uDot(u.status) === 'ok' ? 'ok' : uDot(u.status) === 'warn' ? 'warn' : uDot(u.status) === 'crit' ? 'crit' : ''}">${t('us_' + u.status)}</span></div>
    <small class="muted">${esc(nm(KINDS[u.kind]))} · ${esc(nm(stn(u.st)))}</small>
    ${u.cap ? `<div class="row"><small class="muted">${t('water')}</small><span class="sp"></span><small class="mono">${Math.round(u.cap * u.water / 100).toLocaleString('en-US')} L</small></div><div class="meter"><i style="width:${u.water}%"></i></div>` : ''}</div>`;
}
function logBlock(inc) {
  return `<span class="lbl">${t('log')}</span><div class="log">${inc.log.slice().reverse().map(e => `<div class="ent ${e.k || ''}"><span class="t">${hhmm(e.t)}</span><span><b>${esc(who(e.w))}</b><br>${esc(nm(e))}</span></div>`).join('')}</div>
  <form class="note" data-f="note" data-i="${inc.id}"><input id="note-${inc.id}" placeholder="${t('addNote')}" autocomplete="off"><button class="btn sm blue">${t('send')}</button></form>`;
}
function modalNew() {
  const m = UI.newInc; const ty = TYPES[m.type];
  return `<div class="scrim" data-a="closeModal" data-self="1"><div class="modal" role="dialog" aria-modal="true" aria-label="${t('newIncident')}">
    <div class="ph"><h2>${t('newIncident')}</h2><span class="sp"></span><button class="x" data-a="closeModal" aria-label="${t('cancel')}">${ico('x')}</button></div>
    <div class="pb" style="gap:16px">
      <div class="mstep"><span class="lbl"><i>1</i>${t('step1')}</span><div class="chips">${Object.entries(TYPES).map(([k, x]) => `<button class="chip ${k === m.type ? 'on' : ''}" data-a="mType" data-type="${k}">${ico(x.icon)}${nm(x)}</button>`).join('')}</div></div>
      <div class="mstep"><span class="lbl"><i>2</i>${t('step2')}</span><div class="tiles" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${LOCS.map(l => `<button class="tile ${m.loc === l.id ? 'on' : ''}" style="min-height:62px" data-a="mLoc" data-l="${l.id}">${esc(nm(l))}</button>`).join('')}</div></div>
      <div class="mstep"><span class="lbl"><i>3</i>${t('step3')}</span><div class="seg">${[1, 2, 3].map(n => `<button class="${m.level === n ? 'on l' + n : ''}" data-a="mLvl" data-n="${n}">${t('l' + n)}</button>`).join('')}</div></div>
      <div class="mstep"><span class="lbl"><i>4</i>${t('step4')}</span><div class="chips">${S.units.filter(u => u.status === 'available').map(u => `<button class="chip ${m.units.includes(u.id) ? 'on' : ''}" data-a="mUnit" data-u="${u.id}">${m.units.includes(u.id) ? ico('check') : ico('plus')}${esc(u.cs)} <small class="muted">${esc(nm(KINDS[u.kind]))}</small></button>`).join('') || `<span class="muted">${t('noneAvail')}</span>`}</div></div>
      <div class="mstep"><label class="lbl" for="m-notes">${t('notes')}</label><input id="m-notes" class="note" style="height:44px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--ink);padding:0 12px;font:inherit" value="${esc(m.notes || '')}"></div>
    </div>
    <div class="mfoot"><button class="btn pri big" style="flex:1" data-a="mSend" ${m.loc ? '' : 'disabled'}>${ico(ty.icon)} ${m.loc ? t('sendReport') : t('chooseLoc')}</button><button class="btn ghost" data-a="closeModal">${t('cancel')}</button></div>
  </div></div>`;
}
function recommend(type) {
  const pool = S.units.filter(u => u.status === 'available'), out = [];
  TYPES[type].kinds.forEach(k => { const u = pool.find(x => x.kind === k && !out.includes(x.id)); if (u) out.push(u.id); });
  return out;
}

/* ===== Incident commander ===== */
function viewIC() {
  const incs = activeIncs();
  let inc = incOf(UI.inc); if (!inc || inc.status === 'closed') { inc = incs.find(i => i.commander === 'IC1') || null; UI.inc = inc && inc.id; }
  if (!inc) return `<div class="hint"><span class="n">1</span>${t('pickInc')}</div><div class="grid">${incs.map(i => `<div class="panel"><div class="pb"><div class="row"><b>${esc(nm(i))}</b></div><div class="row">${stPill(i.status)}${lvlPill(i.level)}<span class="mono muted" data-since="${i.created}"></span></div><button class="btn pri wide" data-a="take" data-i="${i.id}">${ico('star')} ${t('takeCmd')}</button></div></div>`).join('') || `<div class="empty">${t('noActive')}</div>`}</div>`;
  const men = crewOf(inc.units.filter(id => unit(id).status === 'onscene'));
  const open = inc.sectors.reduce((a, s) => a + s.missions.filter(m => m.s !== 'done').length, 0);
  const flow = ['dispatched', 'onscene', 'control', 'closed'], ci = flow.indexOf(inc.status === 'new' ? 'dispatched' : inc.status);
  const next = flow[ci + 1];
  const placed = inc.sectors.flatMap(s => s.units), free = inc.units.filter(id => !placed.includes(id));
  return `<div class="hint"><span class="n">1</span>${t('hintIC')}</div>
  <div class="ibanner"><div class="top ${inc.status === 'control' ? 'ctl' : ''}">${ico('alert')}<span>${t('active')}</span><span class="mono">${inc.id}</span><span class="sp"></span>${ico('clock')}<span class="mono" data-since="${inc.created}"></span>${lvlPill(inc.level)}</div>
    <div class="body"><div class="cell"><span class="lbl">${esc(nm(LOCS.find(l => l.id === inc.loc)))}</span><h2>${esc(nm(inc))}</h2></div>
      <div class="cell"><span class="lbl">${t('unitsOn')}</span><b class="mono">${inc.units.length}</b></div><div class="cell"><span class="lbl">${t('personnel')}</span><b class="mono">${men.length}</b></div>
      <div class="cell"><span class="lbl">${t('sectors')}</span><b class="mono">${inc.sectors.length}</b></div><div class="cell"><span class="lbl">${t('openMis')}</span><b class="mono">${open}</b></div></div></div>
  <div class="panel"><div class="pb" style="flex-direction:row;align-items:center;flex-wrap:wrap;gap:12px">
    <div class="steps">${flow.map((f, k) => `<span class="step ${k < ci ? 'done' : k === ci ? 'cur' : ''}"><i>${k < ci ? '✓' : k + 1}</i>${t('st_' + f)}</span>`).join('')}</div><span class="sp" style="flex:1"></span>
    ${next ? `<button class="btn ${next === 'closed' ? 'blue' : 'pri'}" data-a="incNext" data-i="${inc.id}">${t('nextStatus')}: ${t('st_' + next)}</button>` : ''}
    ${incs.length > 1 ? `<span class="chips">${incs.filter(i => i.id !== inc.id).map(i => `<button class="chip" data-a="icSwitch" data-i="${i.id}">${i.id} ${stPill(i.status)}</button>`).join('')}</span>` : ''}
  </div></div>
  <div class="cols">
    <div style="display:flex;flex-direction:column;gap:16px;min-width:0">
      <div class="grid">${inc.sectors.map(s => sectorCard(inc, s)).join('')}<button class="addsector" data-a="addSecOpen">${ico('plus')} ${t('addSector')}</button></div>
      ${free.length ? `<div class="panel"><div class="pb"><span class="lbl">${t('freeUnits')}</span><div class="chips">${free.map(id => { const u = unit(id); return `<span class="chip"><span class="dot ${uDot(u.status)}"></span>${esc(u.cs)} · ${t('us_' + u.status)}</span>`; }).join('')}</div></div></div>` : ''}
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;min-width:0">
      <section class="panel"><div class="ph">${ico('star')}<h2>${t('actions')}</h2></div><div class="pb">
        <button class="btn pri wide" data-a="reqOpen">${ico('truck')} ${t('reqUnits')}</button>
        <button class="btn wide" data-a="par" data-i="${inc.id}">${ico('users')} ${t('par')}</button>
        ${inc.par ? `<div class="chips">${inc.sectors.filter(s => s.officer).map(s => `<span class="chip ${inc.par.ack[s.id] ? 'on' : ''}"><span class="dot ${inc.par.ack[s.id] ? 'ok' : 'warn'}"></span>${esc(nm(SECTORS[s.key]))}: ${inc.par.ack[s.id] ? t('parOk') : t('parWait')}</span>`).join('')}</div>` : ''}
        ${inc.requests.filter(r => r.status === 'open').map(r => `<div class="row"><span class="pill warn">${esc(nm(KINDS[r.kind]))}</span><span class="muted">${t('st_dispatched') === r.status ? '' : t('parWait')}</span><span class="sp"></span><span class="mono muted" data-since="${r.at}"></span></div>`).join('')}
      </div></section>
      <section class="panel"><div class="pb">${logBlock(inc)}</div></section>
    </div>
  </div>`;
}
function sectorCard(inc, s) {
  const P = SECTORS[s.key], d = s.missions.filter(m => m.s === 'done').length, n = s.missions.length, o = off(s.officer);
  const men = crewOf(s.units);
  return `<button class="sector" data-a="secOpen" data-s="${s.id}">
    <div class="hd"><span class="ic">${ico(P.icon)}</span><div><h3>${esc(nm(P))}</h3><small class="muted">${t('sectorOf')} ${s.id.slice(1)}</small></div></div>
    ${o ? `<div class="row">${ico('user')}<b>${esc(nm(o))}</b></div>` : `<div class="need">${ico('user')} ${t('assignOff')}</div>`}
    <div class="chips">${s.units.map(id => `<span class="chip"><span class="dot ${uDot(unit(id).status)}"></span>${esc(unit(id).cs)}</span>`).join('') || `<span class="muted">—</span>`}</div>
    <div class="row"><small class="muted">${t('missions')} ${d}/${n} · ${men.length} ${t('personnel')}</small><span class="sp"></span>${inc.par ? `<span class="pill ${inc.par.ack[s.id] ? 'ok' : 'warn'}">PAR</span>` : ''}</div>
    <div class="prog"><i style="width:${n ? d / n * 100 : 0}%"></i></div></button>`;
}
function modalSector(inc) {
  const s = inc.sectors.find(x => x.id === UI.sector); if (!s) return '';
  const P = SECTORS[s.key];
  const used = inc.sectors.filter(x => x.id !== s.id).flatMap(x => x.units);
  const busy = inc.sectors.filter(x => x.id !== s.id).map(x => x.officer);
  return `<div class="scrim" data-a="closeModal" data-self="1"><div class="modal" role="dialog" aria-modal="true">
    <div class="ph">${ico(P.icon)}<h2>${t('sectorOf')} ${esc(nm(P))}</h2><span class="sp"></span><button class="x" data-a="closeModal">${ico('x')}</button></div>
    <div class="pb" style="gap:16px">
      <div class="mstep"><span class="lbl"><i>1</i>${t('assignOff')}</span><div class="people">${S.officers.map(o => `<button class="person ${s.officer === o.id ? 'sel' : ''}" style="${s.officer === o.id ? 'border-color:var(--brand);background:var(--info-soft)' : ''}" data-a="secOff" data-o="${o.id}" ${busy.includes(o.id) ? 'disabled' : ''}><span class="av">${s.officer === o.id ? ico('check') : ico('user')}</span><span><b>${esc(nm(o))}</b><small>${esc(nm(stn(o.st)))}</small></span></button>`).join('')}</div></div>
      <div class="mstep"><span class="lbl"><i>2</i>${t('sectorUnits')}</span><div class="chips">${inc.units.filter(id => !used.includes(id)).map(id => `<button class="chip ${s.units.includes(id) ? 'on' : ''}" data-a="secUnit" data-u="${id}">${s.units.includes(id) ? ico('check') : ico('plus')}${esc(unit(id).cs)}</button>`).join('')}</div></div>
      <div class="mstep"><span class="lbl"><i>3</i>${t('addMission')}</span><div class="chips">${P.missions.filter(([ar]) => !s.missions.some(m => m.ar === ar)).map(([ar, en], k) => `<button class="chip" data-a="secMis" data-k="${k}">${ico('plus')}${esc(UI.lang === 'ar' ? ar : en)}</button>`).join('')}</div>
        ${s.missions.map(m => `<div class="mis ${m.s}"><span class="tx">${esc(nm(m))}</span>${misPill(m.s)}</div>`).join('')}</div>
    </div>
    <div class="mfoot"><button class="btn pri" style="flex:1" data-a="closeModal">${ico('check')} ${t('done')}</button><button class="btn ghost" data-a="secDel">${t('remove')}</button></div>
  </div></div>`;
}
const misPill = s => `<span class="pill ${s === 'done' ? 'ok' : s === 'doing' ? 'warn' : ''}">${t('ms_' + s)}</span>`;
function modalAddSector(inc) {
  const have = inc.sectors.map(s => s.key);
  return `<div class="scrim" data-a="closeModal" data-self="1"><div class="modal" role="dialog" aria-modal="true"><div class="ph"><h2>${t('addSector')}</h2><span class="sp"></span><button class="x" data-a="closeModal">${ico('x')}</button></div>
    <div class="pb"><div class="tiles" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${Object.entries(SECTORS).filter(([k]) => !have.includes(k)).map(([k, P]) => `<button class="tile" data-a="addSec" data-k="${k}">${ico(P.icon)}<span>${nm(P)}</span></button>`).join('')}</div></div></div></div>`;
}
function modalReq() {
  return `<div class="scrim" data-a="closeModal" data-self="1"><div class="modal" role="dialog" aria-modal="true"><div class="ph"><h2>${t('reqKind')}</h2><span class="sp"></span><button class="x" data-a="closeModal">${ico('x')}</button></div>
    <div class="pb"><div class="tiles" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${REQ_KINDS.map(k => `<button class="tile" data-a="req" data-k="${k}">${ico('truck')}<span>${nm(KINDS[k])}</span></button>`).join('')}</div></div></div></div>`;
}

/* ===== Sector / station officer ===== */
function viewOff() {
  const me = off(UI.me); if (!me) { UI.role = null; return viewPick(); }
  let inc = null, sec = null;
  activeIncs().forEach(i => i.sectors.forEach(s => { if (s.officer === me.id) { inc = i; sec = s; } }));
  const myUnits = sec ? sec.units : S.units.filter(u => u.st === me.st).map(u => u.id);
  const men = crewOf(myUnits);
  const parReq = inc && inc.par && !inc.par.ack[sec.id];
  return `<div class="hint"><span class="n">1</span>${t('hintOff')}</div>
  ${sec ? `<div class="assign"><span class="lbl" style="color:#CFE0FF">${t('yourSector')}</span><h1>${ico(SECTORS[sec.key].icon)} ${esc(nm(SECTORS[sec.key]))}</h1>
     <div class="row">${t('incident')}: <b>${esc(nm(inc))}</b> · <span class="mono">${inc.id}</span> · ${t('commander')}: ${esc(who(inc.commander || 'IC1'))} · <span class="mono" data-since="${inc.created}"></span></div></div>`
   : `<div class="assign none"><h1>${t('noAssign')}</h1><p class="muted" style="margin:0">${t('noAssignD')}</p><div class="row">${ico('shield')} ${esc(nm(stn(me.st)))}</div></div>`}
  ${sec ? `<div class="actbar">
     <button class="btn big ${parReq ? 'pri pulse' : ''}" data-a="parAck" ${parReq ? '' : 'disabled'}>${ico('check')} ${t('parOk')}</button>
     <button class="btn big blue" data-a="supOpen">${ico('radio')} ${t('support')}</button>
     <button class="btn big red" data-a="mayday">${ico('alert')} ${UI.confirmMay > Date.now() ? t('maydayConfirm') : t('mayday')}</button></div>` : ''}
  <div class="cols">
    <div style="display:flex;flex-direction:column;gap:16px;min-width:0">
      ${sec ? `<section class="panel"><div class="ph">${ico('check')}<h2>${t('myMissions')}</h2></div><div class="pb">${sec.missions.map(m => `<div class="mis ${m.s}"><span class="tx">${esc(nm(m))}</span>${misPill(m.s)}<button class="btn sm ${m.s === 'todo' ? 'pri' : m.s === 'doing' ? 'blue' : 'ghost'}" data-a="mis" data-m="${m.id}">${m.s === 'todo' ? t('ms_doing') : m.s === 'doing' ? t('ms_done') : '↺'}</button></div>`).join('') || `<div class="empty">${t('noMissions')}</div>`}</div></section>` : ''}
      <section class="panel"><div class="ph">${ico('users')}<h2>${t('myMen')}</h2><span class="sp"></span><span class="pill ok">${men.filter(p => p.status === 'ok').length}/${men.length}</span></div><div class="pb">${men.length ? '' : `<div class="empty">—</div>`}<div class="crew">${men.map(p => `<button class="man ${p.status}" data-a="person" data-p="${p.id}"><span class="av">${esc(nm(p).split(' ').pop()[0])}</span><span><b>${esc(nm(p))}</b><small>${esc(unit(p.unit).cs)} · ${t('ps_' + p.status)}</small></span></button>`).join('')}</div></div></section>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;min-width:0">
      <section class="panel"><div class="ph">${ico('truck')}<h2>${t('myVehicles')}</h2></div><div class="pb">${myUnits.length ? '' : `<div class="empty">—</div>`}${myUnits.map(id => { const u = unit(id); return `${unitCard(u)}${sec ? '' : `<div class="chips"><button class="chip ${u.status === 'available' ? 'on' : ''}" data-a="uSt" data-u="${u.id}" data-s="available">${t('us_available')}</button><button class="chip ${u.status === 'out' ? 'on' : ''}" data-a="uSt" data-u="${u.id}" data-s="out">${t('us_out')}</button></div>`}`; }).join('')}</div></section>
      ${inc ? `<section class="panel"><div class="pb">${logBlock(inc)}</div></section>` : ''}
    </div>
  </div>`;
}
function modalSupport() {
  return `<div class="scrim" data-a="closeModal" data-self="1"><div class="modal" role="dialog" aria-modal="true"><div class="ph"><h2>${t('reqKind')}</h2><span class="sp"></span><button class="x" data-a="closeModal">${ico('x')}</button></div>
    <div class="pb"><div class="tiles">${SUPPORT.map(x => `<button class="tile" data-a="sup" data-k="${x.id}">${ico(x.id === 'water' ? 'drop' : x.id === 'men' ? 'users' : x.id === 'med' ? 'medical' : 'shield')}<span>${nm(x)}</span></button>`).join('')}</div></div></div></div>`;
}

/* ---------- render ---------- */
const app = document.getElementById('app');
function render() {
  applyTheme();
  const keep = document.activeElement && document.activeElement.id ? { id: document.activeElement.id, v: document.activeElement.value } : null;
  const notes = {}; document.querySelectorAll('input[id]').forEach(i => { notes[i.id] = i.value; });
  let body = !UI.role ? viewPick() : UI.role === 'ops' ? viewOps() : UI.role === 'ic' ? viewIC() : viewOff();
  let modal = '';
  if (UI.modal === 'new') modal = modalNew();
  else if (UI.modal === 'sector') modal = modalSector(incOf(UI.inc));
  else if (UI.modal === 'addSec') modal = modalAddSector(incOf(UI.inc));
  else if (UI.modal === 'req') modal = modalReq();
  else if (UI.modal === 'sup') modal = modalSupport();
  app.innerHTML = header() + `<main class="wrap">${maydayBanner()}${body}</main>` + modal + (UI.toast ? `<div class="toast" role="status">${esc(UI.toast)}</div>` : '');
  Object.entries(notes).forEach(([id, v]) => { const el = document.getElementById(id); if (el && v) el.value = v; });
  if (keep) { const el = document.getElementById(keep.id); if (el) { el.focus(); if (keep.v != null) el.value = keep.v; } }
  tick();
}
function tick() {
  const now = Date.now();
  document.querySelectorAll('[data-since]').forEach(el => { el.textContent = dur(now - +el.dataset.since); });
  document.querySelectorAll('[data-clock]').forEach(el => { el.textContent = hhmm(now); });
}
setInterval(() => {
  tick();
  // units en route arrive after ~40 s (demo pacing)
  let changed = false;
  S.units.forEach(u => { if (u.status === 'enroute' && Date.now() - (u.since || 0) > 40000) { u.status = 'onscene'; const i = activeIncs().find(x => x.units.includes(u.id)); if (i) { addLog(i, 'ops', `${u.cs} وصلت إلى الموقع.`, `${u.cs} arrived on scene.`); if (i.status === 'dispatched') i.status = 'onscene'; } changed = true; } });
  if (changed) save();
}, 1000);

/* ---------- actions ---------- */
const A = {
  role(d) { if (d.r === 'off') { UI.pickOff = true; } else { UI.role = d.r; UI.inc = null; } saveUI(); render(); },
  me(d) { UI.role = 'off'; UI.me = d.id; UI.pickOff = false; saveUI(); render(); },
  pickBack() { UI.pickOff = false; render(); },
  logout() { UI.role = null; UI.pickOff = false; UI.modal = null; saveUI(); render(); },
  theme() { UI.theme = isDark() ? 'light' : 'dark'; saveUI(); render(); },
  lang() { UI.lang = UI.lang === 'ar' ? 'en' : 'ar'; saveUI(); render(); },
  reset() { S = seed(); UI.inc = null; save(); toast(t('reset')); },
  closeModal(d, ev) { if (d.self && ev.target !== ev.currentTarget && ev.target.closest('.modal')) return; UI.modal = null; UI.sector = null; render(); },
  // ops
  new(d) { UI.modal = 'new'; UI.newInc = { type: d.type, loc: null, level: d.type === 'aircraft' || d.type === 'hazmat' ? 3 : 2, units: recommend(d.type) }; render(); },
  mType(d) { Object.assign(UI.newInc, { type: d.type, units: recommend(d.type) }); render(); },
  mLoc(d) { UI.newInc.loc = d.l; render(); },
  mLvl(d) { UI.newInc.level = +d.n; render(); },
  mUnit(d) { const a = UI.newInc.units, k = a.indexOf(d.u); k < 0 ? a.push(d.u) : a.splice(k, 1); render(); },
  mSend() {
    const m = UI.newInc; if (!m.loc) return; const ty = TYPES[m.type], loc = LOCS.find(l => l.id === m.loc);
    const notes = (document.getElementById('m-notes') || {}).value || '';
    const inc = { id: 'INC-0' + (S.seq++), type: m.type, loc: m.loc, level: m.level, status: m.units.length ? 'dispatched' : 'new', created: Date.now(),
      ar: `${ty.ar} — ${loc.ar}${notes ? ' · ' + notes : ''}`, en: `${ty.en} — ${loc.en}${notes ? ' · ' + notes : ''}`, commander: null, units: [], sectors: [], requests: [], par: null, mayday: null, log: [] };
    addLog(inc, 'ops', `بلاغ جديد: ${ty.ar} في ${loc.ar}.`, `New call: ${ty.en} at ${loc.en}.`);
    m.units.forEach(id => dispatch(inc, id));
    S.incidents.push(inc); UI.inc = inc.id; UI.modal = null; save(); toast(t('sent') + ' · ' + inc.id);
  },
  selInc(d) { UI.inc = d.i; saveUI(); render(); },
  dispatch(d) { const i = incOf(d.i); dispatch(i, d.u); if (i.status === 'new') i.status = 'dispatched'; save(); toast(`${unit(d.u).cs} ${t('dispatchedTo')} ${i.id}`); },
  fulfil(d) { const i = incOf(d.i), r = i.requests.find(x => x.id === d.q); dispatch(i, d.u); r.status = 'done'; save(); toast(`${unit(d.u).cs} ${t('dispatchedTo')} ${i.id}`); },
  // commander
  take(d) { const i = incOf(d.i); i.commander = 'IC1'; if (i.status === 'new') i.status = 'dispatched'; UI.inc = i.id; addLog(i, 'IC1', 'استلام قيادة الحادث.', 'Took command of the incident.'); saveUI(); save(); },
  icSwitch(d) { UI.inc = d.i; saveUI(); render(); },
  incNext(d) { const i = incOf(d.i), f = ['dispatched', 'onscene', 'control', 'closed'], n = f[f.indexOf(i.status === 'new' ? 'dispatched' : i.status) + 1]; if (!n) return; i.status = n;
    addLog(i, 'IC1', `تحديث حالة الحادث: ${T.ar['st_' + n]}.`, `Incident status: ${T.en['st_' + n]}.`, n === 'control' || n === 'closed' ? 'ok' : '');
    if (n === 'closed') { i.units.forEach(id => { const u = unit(id); if (u.status !== 'out') u.status = 'available'; }); UI.inc = null; }
    save(); },
  secOpen(d) { UI.sector = d.s; UI.modal = 'sector'; render(); },
  secOff(d) { const i = incOf(UI.inc), s = i.sectors.find(x => x.id === UI.sector), o = off(d.o); s.officer = d.o;
    // one less tap: bring the officer's own station units already on this incident into the sector
    const used = i.sectors.flatMap(x => x.units); i.units.filter(id => unit(id).st === o.st && !used.includes(id)).forEach(id => s.units.push(id));
    addLog(i, 'IC1', `تكليف ${o.ar} بقطاع ${SECTORS[s.key].ar}.`, `${o.en} assigned to the ${SECTORS[s.key].en} sector.`); save(); },
  secUnit(d) { const s = incOf(UI.inc).sectors.find(x => x.id === UI.sector), k = s.units.indexOf(d.u); k < 0 ? s.units.push(d.u) : s.units.splice(k, 1); save(); },
  secMis(d) { const s = incOf(UI.inc).sectors.find(x => x.id === UI.sector), [ar, en] = SECTORS[s.key].missions.filter(([a]) => !s.missions.some(m => m.ar === a))[+d.k]; s.missions.push({ id: uid('m'), ar, en, s: 'todo' }); save(); },
  secDel() { const i = incOf(UI.inc); i.sectors = i.sectors.filter(x => x.id !== UI.sector); UI.modal = null; UI.sector = null; save(); },
  addSecOpen() { UI.modal = 'addSec'; render(); },
  addSec(d) { const i = incOf(UI.inc), n = i.sectors.length; const s = { id: 's' + 'ABCDEFGH'[n], key: d.k, officer: null, units: [], missions: [] }; i.sectors.push(s);
    addLog(i, 'IC1', `إنشاء قطاع ${SECTORS[d.k].ar}.`, `Created the ${SECTORS[d.k].en} sector.`); UI.sector = s.id; UI.modal = 'sector'; save(); },
  reqOpen() { UI.modal = 'req'; render(); },
  req(d) { const i = incOf(UI.inc); i.requests.push({ id: uid('q'), kind: d.k, from: 'IC1', at: Date.now(), status: 'open' }); addLog(i, 'IC1', `طلب وحدة إضافية: ${KINDS[d.k].ar}.`, `Requested an extra unit: ${KINDS[d.k].en}.`); UI.modal = null; save(); toast(t('sent')); },
  par(d) { const i = incOf(d.i); i.par = { at: Date.now(), ack: {} }; addLog(i, 'IC1', 'طلب حصر الأفراد من جميع القطاعات.', 'Personnel check requested from all sectors.'); save(); toast(t('parSent')); },
  mayAck(d) { const i = incOf(d.i); i.mayday.ack = Date.now(); addLog(i, 'IC1', 'تم استلام نداء الاستغاثة. فريق التدخل السريع في الطريق.', 'Mayday acknowledged. Rapid intervention team moving in.', 'crit'); save(); },
  // officer
  mis(d) { const [i, s] = mySector(); const m = s.missions.find(x => x.id === d.m); m.s = m.s === 'todo' ? 'doing' : m.s === 'doing' ? 'done' : 'todo';
    if (m.s === 'done') addLog(i, UI.me, `تم إنجاز: ${m.ar}.`, `Completed: ${m.en}.`, 'ok'); save(); },
  person(d) { const p = S.people.find(x => x.id === d.p); p.status = p.status === 'ok' ? 'rest' : p.status === 'rest' ? 'injured' : 'ok';
    const ms = mySector(); if (p.status === 'injured' && ms) addLog(ms[0], UI.me, `إصابة: ${p.ar} (${unit(p.unit).cs}).`, `Injury: ${p.en} (${unit(p.unit).cs}).`, 'crit'); save(); },
  uSt(d) { unit(d.u).status = d.s; save(); },
  parAck() { const [i, s] = mySector(); i.par.ack[s.id] = Date.now(); const men = crewOf(s.units);
    addLog(i, UI.me, `حصر الأفراد: ${men.length} — الكل بخير.`, `Personnel check: ${men.length} — all accounted for.`, 'ok'); save(); toast(t('parOk')); },
  supOpen() { UI.modal = 'sup'; render(); },
  sup(d) { const [i] = mySector(), x = SUPPORT.find(y => y.id === d.k); addLog(i, UI.me, `طلب دعم: ${x.ar}.`, `Support request: ${x.en}.`, 'crit'); UI.modal = null; save(); toast(t('sent')); },
  mayday() { if (UI.confirmMay > Date.now()) { const [i, s] = mySector(); i.mayday = { sector: s.id, officer: UI.me, at: Date.now() }; addLog(i, UI.me, 'MAYDAY — نداء استغاثة!', 'MAYDAY — firefighter emergency!', 'crit'); UI.confirmMay = 0; save(); toast(t('sent')); }
    else { UI.confirmMay = Date.now() + 4000; render(); setTimeout(render, 4100); } }
};
function dispatch(inc, id) { const u = unit(id); if (!u || inc.units.includes(id)) return; u.status = 'enroute'; u.since = Date.now(); inc.units.push(id); addLog(inc, 'ops', `إرسال ${u.cs}.`, `Dispatched ${u.cs}.`); }
function mySector() { let r = null; activeIncs().forEach(i => i.sectors.forEach(s => { if (s.officer === UI.me) r = [i, s]; })); return r; }

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]'); if (!el || el.disabled) return;
  const d = Object.assign({}, el.dataset); if (d.self) { if (ev.target !== el) return; }
  const f = A[d.a]; if (f) { ev.preventDefault(); f(d, ev); }
});
document.addEventListener('submit', ev => {
  const f = ev.target.closest('[data-f="note"]'); if (!f) return; ev.preventDefault();
  const inp = f.querySelector('input'), v = inp.value.trim(); if (!v) return; const i = incOf(f.dataset.i);
  const w = UI.role === 'ops' ? 'ops' : UI.role === 'ic' ? 'IC1' : UI.me; addLog(i, w, v, v); inp.value = ''; save();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && UI.modal) { UI.modal = null; render(); } });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render);
render();
})();
