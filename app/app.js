// Leonida Vice Bureau — forensic platinum casefile.
// Static, offline: loads only local JSON. Progress lives in localStorage.
const KEY = 'leonida-vice-bureau.progress.v1';
const PMA_ID = 28;

const doc = await (await fetch('data/trophies.json')).json();
const guides = await (await fetch('data/guides.json')).json();
const sources = await (await fetch('data/sources.json')).json();
const trophies = doc.trophies;
const byId = Object.fromEntries(trophies.map(t => [t.id, t]));

const defaultState = () => ({ earned: [], counts: {}, track: '18', spoiler: true, revealed: [], selected: PMA_ID });
let state = defaultState();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) state = { ...defaultState(), ...JSON.parse(raw) };
} catch { /* corrupted save: start fresh */ }
if (!byId[state.selected]) state.selected = PMA_ID;

let filter = 'all';
let gradeFilter = 'all';
let query = '';

const $ = id => document.getElementById(id);
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const srcRef = ids => ids.map(n => `<span class="cite">[${n}]</span>`).join(' ');
const srcName = n => sources.find(s => s.id === n)?.name ?? `Source ${n}`;

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
  $('savedNote').textContent = 'Saved in this browser';
}
function earnedSet() { return new Set(state.earned); }
function pmaTarget() { return state.track === '15' ? 15 : 18; }
function hoursEstimate() { return state.track === '15' ? '≈199 h' : '≈200 h'; }
function countOf(t) {
  if (t.id === PMA_ID) return { value: state.counts[PMA_ID] ?? 0, target: pmaTarget() };
  if (t.count == null) return null;
  return { value: state.counts[t.id] ?? 0, target: t.count };
}

function renderHeader() {
  const e = earnedSet();
  $('earnedCount').textContent = e.size;
  const gc = g => trophies.filter(t => t.grade === g && e.has(t.id)).length;
  $('gradeCounts').textContent = `P ${gc('platinum')}/1 · G ${gc('gold')}/2 · S ${gc('silver')}/6 · B ${gc('bronze')}/46`;
  $('progressFill').style.width = `${(e.size / 55) * 100}%`;
  $('progressBar').setAttribute('aria-valuenow', String(e.size));
  $('spoilerToggle').textContent = state.spoiler
    ? 'Spoiler Shield: ON — 28 hidden trophies masked'
    : 'Spoiler Shield: OFF — all names shown';
  $('spoilerToggle').setAttribute('aria-pressed', String(state.spoiler));
}

function renderAudit() {
  const totalSteps = Object.values(guides).reduce((n, g) => n + g.steps.length, 0);
  const citedSteps = Object.values(guides).reduce((n, g) => n + g.steps.filter(s => s.s?.length).length, 0);
  const items = [
    ['Official names / descriptions / grades', '55/55'],
    ['Grades', '1P · 2G · 6S · 46B'],
    ['PSN-hidden', '28'],
    ['Guide steps cited', `${citedSteps}/${totalSteps}`],
    ['Sources read 21 Nov 2026', String(sources.length)],
    ['Possibly missable', '1'],
    ['Watch (story windows)', '5'],
    ['Unconfirmed', '5'],
    ['Disputes shown both ways', '4'],
  ];
  $('auditList').innerHTML = items.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
}

const CHIPS = [
  ['all', 'All'], ['story', 'Story'], ['missable', 'Missable'], ['collectibles', 'Collectibles'],
  ['activities', 'Activities'], ['side', 'Side'], ['crime', 'Crime'], ['world', 'World'],
  ['online', 'Online'], ['hidden', 'PSN-hidden'], ['disputed', 'Disputed'], ['unconfirmed', 'Unconfirmed'],
  ['notearned', 'Not earned'],
];
function chipCount(name) {
  switch (name) {
    case 'all': return 55;
    case 'online': return 0;
    case 'hidden': return trophies.filter(t => t.hidden).length;
    case 'missable': return trophies.filter(t => t.missable === 'missable').length;
    case 'disputed': return trophies.filter(t => t.disputed).length;
    case 'unconfirmed': return trophies.filter(t => t.unconfirmed).length;
    case 'notearned': return trophies.filter(t => !earnedSet().has(t.id)).length;
    default: return trophies.filter(t => t.kind === name).length;
  }
}
function renderChips() {
  $('chips').innerHTML = '';
  for (const [name, label] of CHIPS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = `${label} ${chipCount(name)}`;
    b.classList.toggle('active', filter === name);
    b.addEventListener('click', () => { filter = name; renderChips(); renderList(); });
    $('chips').append(b);
  }
}
function trophyMatches(t) {
  const e = earnedSet();
  if (gradeFilter !== 'all' && t.grade !== gradeFilter) return false;
  if (query && !(t.name + ' ' + t.description).toLowerCase().includes(query)) return false;
  switch (filter) {
    case 'all': return true;
    case 'online': return false;
    case 'hidden': return t.hidden;
    case 'missable': return t.missable === 'missable';
    case 'disputed': return t.disputed;
    case 'unconfirmed': return t.unconfirmed;
    case 'notearned': return !e.has(t.id);
    default: return t.kind === filter;
  }
}
function masked(t) {
  return state.spoiler && t.hidden && !earnedSet().has(t.id) && !state.revealed.includes(t.id);
}
function renderList() {
  const list = $('trophyList');
  list.replaceChildren();
  const shown = trophies.filter(trophyMatches);
  $('listCount').textContent = `${shown.length} of 55 trophies shown`;
  const e = earnedSet();
  for (const t of shown) {
    const li = document.createElement('li');
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'trophy-row' + (state.selected === t.id ? ' selected' : '');
    row.addEventListener('click', () => { state.selected = t.id; save(); renderList(); renderDetail(); });
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = e.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('click', ev => {
      ev.stopPropagation();
      if (box.checked) state.earned.push(t.id); else state.earned = state.earned.filter(x => x !== t.id);
      save(); renderHeader(); renderChips(); renderList(); renderDetail(); renderRoadmap(); renderNextUp();
    });
    const mid = document.createElement('span');
    if (masked(t)) {
      mid.innerHTML = `<span class="trophy-name">Hidden trophy — hidden on PSN</span><span class="trophy-sub">Name and guide stay masked until earned or revealed. Grade: ${esc(t.grade)}.</span>`;
    } else {
      const c = countOf(t);
      mid.innerHTML = `<span class="trophy-name">${esc(t.name)}</span><span class="trophy-sub">${esc(t.description)}${c ? ` · ${c.value}/${c.target} ${esc(t.countLabel)}` : ''}</span>`;
    }
    const tags = document.createElement('span');
    tags.innerHTML = `<span class="badge ${esc(t.grade)}">${esc(t.grade)}</span>` +
      (t.hidden ? '<span class="badge hidden">PSN-hidden</span>' : '') +
      (t.missable === 'missable' ? '<span class="badge missable">Possibly missable</span>' : '') +
      (t.missable === 'watch' ? '<span class="badge watch">Watch</span>' : '') +
      (t.disputed ? '<span class="badge disputed">Sources disagree</span>' : '') +
      (t.unconfirmed ? '<span class="badge unconfirmed">Unconfirmed</span>' : '');
    row.append(box, mid, tags);
    li.append(row);
    list.append(li);
  }
}
function renderNextUp() {
  const order = [...STAGES.flatMap(s => s.ids)];
  const next = order.map(id => byId[id]).find(t => !earnedSet().has(t.id) && t.id !== 1)
    ?? trophies.find(t => !earnedSet().has(t.id));
  if (!next) { $('nextUp').innerHTML = '<strong>Case closed:</strong> all 55 trophies earned. The platinum is yours.'; return; }
  const suffix = next.missable === 'missable' ? ' Do it before the story moves on — it is the one possibly missable trophy.'
    : next.missable === 'watch' ? ' Finish this chain before its chapter closes.'
    : ' Next in roadmap order.';
  $('nextUp').innerHTML = `<strong>Next up:</strong> ${esc(next.name)} — ${esc(next.description)}${suffix}`;
}

function renderDetail() {
  const t = byId[state.selected];
  const g = guides[t.id];
  const d = $('detail');
  const e = earnedSet();
  if (masked(t)) {
    d.innerHTML = `<h3>Hidden story trophy</h3>
      <p><span class="badge ${esc(t.grade)}">${esc(t.grade)}</span> <span class="badge hidden">PSN-hidden</span></p>
      <p>This trophy is hidden on PSN, so its name and guide stay hidden here while the Spoiler Shield is on. Earn it in the game, or tap Reveal to see its guide now.</p>
      <p><button type="button" id="revealBtn">Reveal this trophy</button></p>
      <p class="detail-sources">Spoiler Shield hides all 28 hidden trophies until they are earned or revealed one by one.</p>`;
    $('revealBtn').addEventListener('click', () => { state.revealed.push(t.id); save(); renderList(); renderDetail(); });
    return;
  }
  const c = countOf(t);
  const guideSources = [...new Set(g.steps.flatMap(s => s.s))].sort((a, b) => a - b);
  let html = `<h3>#${t.id} — ${esc(t.name)}</h3>
    <p><span class="badge ${esc(t.grade)}">${esc(t.grade)}</span>${t.hidden ? ' <span class="badge hidden">PSN-hidden</span>' : ''}${t.missable === 'missable' ? ' <span class="badge missable">Possibly missable</span>' : ''}${t.missable === 'watch' ? ' <span class="badge watch">Watch</span>' : ''}${t.disputed ? ' <span class="badge disputed">Sources disagree</span>' : ''}${t.unconfirmed ? ' <span class="badge unconfirmed">Unconfirmed</span>' : ''}</p>
    <blockquote class="official">“${esc(t.description)}”<cite>Official description, as published on PlayStation (checked against Exophase [7]).</cite></blockquote>`;
  if (c) {
    html += `<div class="counter" role="group" aria-label="Progress counter">
      <span>Your count</span><strong id="counterText">${c.value} / ${c.target} ${esc(t.countLabel)}</strong>
      <button type="button" id="countDown" aria-label="Decrease count">−</button>
      <button type="button" id="countUp" aria-label="Increase count">+</button>
      <span>${c.target - c.value > 0 ? `${c.target - c.value} to go · saved` : 'Complete'}</span></div>`;
  }
  if (t.id === PMA_ID) {
    const d0 = g.dispute;
    html += `<div class="diff-card" id="diffCard">
      <h4>Conflict Diff Card — both versions shown, you choose the track</h4>
      <p>Sources disagree on how many meditations the trophy needs. Pick a track: the counter above and the roadmap hours change with it.</p>
      <div class="diff-toggle" role="group" aria-label="Choose meditation track">
        <button type="button" id="track18" class="${state.track === '18' ? 'active' : ''}">Track Conservative (18)</button>
        <button type="button" id="track15" class="${state.track === '15' ? 'active' : ''}">Track Minimum (15)</button>
      </div>
      <div class="diff-versions">
        <div class="${state.track === '18' ? 'chosen' : ''}"><strong>A — Conservative · 18 spots.</strong> ${esc(d0.a.text)} ${srcRef(d0.a.src)}</div>
        <div class="${state.track === '15' ? 'chosen' : ''}"><strong>B — Minimum · 15 spots.</strong> ${esc(d0.b.text)} ${srcRef(d0.b.src)}</div>
        <div><strong>C — Does the Chapter 1 balcony count?</strong> ${esc(d0.c.text)} ${srcRef(d0.c.src)}</div>
      </div>
      <p class="footnote">Tracking ${pmaTarget()} spots puts the platinum at ${hoursEstimate()} (3 fewer spots × ~15 min each, our estimate). The safe play is 18: do the balcony meditation in Chapter 1 either way.</p>
    </div>`;
  } else if (g.dispute) {
    const d0 = g.dispute;
    html += `<div class="diff-card"><h4>Sources disagree — both versions shown</h4>
      <div class="diff-versions">
        <div><strong>A.</strong> ${esc(d0.a.text)} ${srcRef(d0.a.src)}</div>
        <div><strong>B.</strong> ${esc(d0.b.text)} ${srcRef(d0.b.src)}</div>
        ${d0.c ? `<div><strong>Also.</strong> ${esc(d0.c.text)} ${srcRef(d0.c.src)}</div>` : ''}
      </div></div>`;
  }
  html += `<h4>How to earn it — in our own words</h4><ol class="steps">` +
    g.steps.map(s => `<li>${esc(s.t)} ${srcRef(s.s)}</li>`).join('') + `</ol>`;
  html += `<p class="window ${t.missable === 'safe' ? 'safe' : ''}"><strong>${t.missable === 'missable' ? 'Missable window: ' : t.missable === 'watch' ? 'Watch: ' : 'Window: '}</strong>${esc(g.window)}</p>`;
  html += `<p class="detail-sources"><strong>Sources for this guide:</strong> ${guideSources.map(n => `[${n}] ${esc(srcName(n))}`).join(' · ')}</p>`;
  html += `<p><button type="button" id="markBtn">${e.has(t.id) ? 'Mark as not earned' : 'Mark as earned'}</button></p>`;
  d.innerHTML = html;
  $('markBtn').addEventListener('click', () => {
    if (e.has(t.id)) state.earned = state.earned.filter(x => x !== t.id);
    else state.earned.push(t.id);
    save(); renderHeader(); renderChips(); renderList(); renderDetail(); renderRoadmap(); renderNextUp();
  });
  const down = $('countDown'), up = $('countUp');
  if (down && up) {
    const bump = delta => {
      const cur = state.counts[t.id] ?? 0;
      const target = countOf(t).target;
      state.counts[t.id] = Math.max(0, Math.min(target, cur + delta));
      save(); renderDetail(); renderList();
    };
    down.addEventListener('click', () => bump(-1));
    up.addEventListener('click', () => bump(1));
  }
  const t18 = $('track18'), t15 = $('track15');
  if (t18 && t15) {
    t18.addEventListener('click', () => { state.track = '18'; save(); renderDetail(); renderRoadmap(); });
    t15.addEventListener('click', () => { state.track = '15'; save(); renderDetail(); renderRoadmap(); });
  }
}

const STAGES = [
  { n: 1, title: 'Story spine — Chapters 1–2', hours: 'Part of 60–80 h', text: 'Play the story and take optional missions as they appear. Do the Chapter 1 balcony meditation for Positive Mental Attitude before Chapter 1 ends, and keep a manual save at the start of each chapter — there is no mission replay.', ids: [2, 3, 4, 8, 9, 10] },
  { n: 2, title: 'Story spine — Chapters 3–5 & finale', hours: 'Part of 60–80 h', text: 'Finish the story. The final mission pops the gold “You Gotta Know When to Get Off”. Check for new stranger icons before each chapter closes.', ids: [5, 6, 7, 11, 12, 13] },
  { n: 3, title: '100% Completion Checklist', hours: 'About 100 h', text: 'After the credits the checklist appears under Progress > Stats. Work it line by line: robberies, bank vaults, gang operations, shooting ranges, drone races, card sets and 70 of the 80 challenges. Progress from the story already counts.', ids: [14, 15, 17, 31, 32, 40, 43] },
  { n: 4, title: 'Strangers & side chains', hours: 'About 10 h', text: 'Finish the stranger mission strands and the named chains (Andy, Kenton, Billy, Randy, Tyrone) plus Bret’s hunt. Five of these finals have story-linked windows, so do not leave them all to the very end.', ids: [22, 23, 24, 25, 26, 27, 29] },
  { n: 5, title: 'Activities & collectibles', hours: 'Inside the ~100 h grind', text: 'Meditations, drone races, fishing, arcade games, bowling, cards, vehicles and the WAiNK scans. Most of this is already half done if you scanned and explored during the story.', ids: [16, 18, 19, 20, 21, 28, 30, 35, 42, 46, 51] },
  { n: 6, title: 'Money, crime & cleanup', hours: 'Inside the ~100 h grind', text: 'Partner robberies, vaults, trucks, jewelry stores, laundering $250,000, spending $100,000, garages and the Scooter Bros registrations. The platinum pops when the last trophy lands.', ids: [1, 33, 34, 36, 37, 38, 39, 41, 44, 45, 47, 48, 49, 50, 52, 53, 54, 55] },
];
function renderRoadmap() {
  const e = earnedSet();
  $('roadmapLede').innerHTML = `Roadmap to the platinum — <strong>${e.size}/55 earned</strong> · ${hoursEstimate()} to the platinum at the current meditation track · difficulty 4/10 · 1 playthrough · 0 online · 0 glitched.`;
  $('statCards').innerHTML = [
    [hoursEstimate(), 'hours to platinum'],
    ['4/10', 'difficulty (PowerPyx, KeenGamer)'],
    ['1', 'playthrough needed'],
    ['0', 'online trophies'],
    ['0', 'glitched trophies confirmed'],
    ['5', 'story chapters'],
    ['91', 'story missions (tracking brief)'],
    ['15+', 'manual save slots (tracking brief)'],
  ].map(([n, l]) => `<div class="stat-card"><span class="num">${esc(n)}</span><span class="lbl">${esc(l)}</span></div>`).join('');
  $('stages').innerHTML = STAGES.map(s => {
    const done = s.ids.filter(id => e.has(id)).length;
    return `<div class="stage"><h3>Stage ${s.n} — ${esc(s.title)}</h3>
      <p><strong>${esc(s.hours)}</strong> · ${done}/${s.ids.length} earned in this stage</p>
      <p>${esc(s.text)}</p>
      <div class="chips-row">${s.ids.map(id => `<span class="chip-trophy">${e.has(id) ? '✓ ' : ''}${esc(byId[id].name)}</span>`).join('')}</div></div>`;
  }).join('');
}

const SCRUB_ROWS = [
  { id: 28, note: 'Balcony meditation, Chapter 1' },
  { id: 22, note: "Andy's final mission" }, { id: 23, note: "Kenton's final mission" },
  { id: 24, note: "Billy's final mission" }, { id: 26, note: "Randy's final mission" },
  { id: 27, note: "Tyrone's final mission" }, { id: 29, note: 'Unique animal hunt for Bret' },
  { id: 37, note: 'Unscheduled departure at VCIA' }, { id: 38, note: 'Rhino tank secret' },
];
function renderMissables() {
  const cols = ['Ch 1', 'Ch 2', 'Ch 3', 'Ch 4', 'Ch 5', 'Post'];
  let html = `<thead><tr><th>Trophy</th>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>`;
  for (const r of SCRUB_ROWS) {
    const t = byId[r.id];
    html += `<tr><td><strong>${esc(t.name)}</strong><br><span class="footnote">${esc(r.note)}</span></td>`;
    for (let i = 0; i < 6; i++) {
      if (t.id === PMA_ID) {
        html += i === 0 ? '<td class="last">LAST</td>' : i === 5 ? '<td class="safe">gone</td>' : '<td class="safe">gone</td>';
      } else if (t.missable === 'watch') {
        html += i === 4 ? '<td class="last">LAST</td>' : i === 5 ? '<td class="safe">safe</td>' : '<td class="open">open</td>';
      } else {
        html += '<td class="safe">safe</td>';
      }
    }
    html += '</tr>';
  }
  $('scrubber').innerHTML = html + '</tbody>';
  $('gates').innerHTML = [
    ['Chapter 1 — SAVE FIRST', 'Do Lucia’s balcony meditation at Jason’s house in the morning after Down to Earth, before Chapter 1 ends. Make a manual save at the start of Chapter 1 and another before leaving it. This is the only confirmed point of no return.', false],
    ['Chapters 2–4 — check stranger icons', 'Before each chapter closes, check the map for new stranger missions. The five stranger-final trophies are reported to have story-linked windows (eGamers). Save at the start of every chapter.', false],
    ['Chapter 5 & finale — last call', 'Finish any open stranger chain before the final mission. After the credits, free-roam opens and the rest of the list stays available.', false],
    ['After the credits — everything else is safe', 'The 100% checklist, collectibles, activities, robberies and money trophies can all be finished in free-roam. PowerPyx and OutputLag agree: nothing else is missable.', true],
  ].map(([h, p, safe]) => `<div class="gate ${safe ? 'safe-gate' : ''}"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('');
}

function renderSources() {
  $('sourceList').innerHTML = sources.map(s =>
    `<li><span class="src-name">[${s.id}] ${esc(s.name)}</span> — read ${esc(s.read)}<br>
     <span class="src-url">${esc(s.url)}</span><br>${esc(s.claims)}</li>`).join('');
  const disputes = [1, 7, 25, 28].map(id => {
    const d0 = guides[id].dispute;
    return `<li><strong>${esc(byId[id].name)} — ${esc(d0.title)}</strong><br>A: ${esc(d0.a.text)} ${srcRef(d0.a.src)}<br>B: ${esc(d0.b.text)} ${srcRef(d0.b.src)}${d0.c ? `<br>Also: ${esc(d0.c.text)} ${srcRef(d0.c.src)}` : ''}</li>`;
  }).join('');
  $('disputeList').innerHTML = disputes +
    `<li><strong>Platinum hours — 200 vs 300.</strong><br>A: about 200 hours (PowerPyx, KeenGamer, OutputLag, GTA Vibes) ${srcRef([1, 2, 3, 5])}<br>B: up to 300 hours or more (PushSquare) ${srcRef([6])}</li>`;
  $('hiddenRule').textContent = doc.hiddenRule + ' The rule is written here so it can be checked: 12 story/mission + 5 stranger finals + Fair Game + 2 VCIA + 8 secret-type = 28 exactly.';
  let html = '<thead><tr><th>Trophy</th>' + sources.map(s => `<th>[${s.id}]</th>`).join('') + '<th>Backed</th></tr></thead><tbody>';
  for (const t of trophies) {
    const used = new Set(guides[t.id].steps.flatMap(s => s.s));
    html += `<tr><td>${esc(t.name)}</td>` + sources.map(s => `<td class="${used.has(s.id) ? 'hit' : 'miss'}">${used.has(s.id) ? '●' : '·'}</td>`).join('') + `<td>${used.size}/7</td></tr>`;
  }
  $('heatmap').innerHTML = html + '</tbody>';
}

// Tabs
document.querySelectorAll('.tabs button').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(x => { x.classList.remove('active'); x.removeAttribute('aria-current'); });
    b.classList.add('active'); b.setAttribute('aria-current', 'page');
    document.querySelectorAll('.tab-panel').forEach(p => { p.hidden = true; });
    $(`tab-${b.dataset.tab}`).hidden = false;
  });
});

// Header actions
$('spoilerToggle').addEventListener('click', () => { state.spoiler = !state.spoiler; save(); renderHeader(); renderList(); renderDetail(); });
$('gradeFilter').addEventListener('change', e => { gradeFilter = e.target.value; renderList(); });
$('search').addEventListener('input', e => { query = e.target.value.trim().toLowerCase(); renderList(); });
$('exportBtn').addEventListener('click', () => {
  $('ioPanel').hidden = false;
  $('ioText').value = JSON.stringify(state, null, 2);
  $('ioStatus').textContent = 'Copy this JSON or download it. It holds only your progress — nothing else leaves the browser.';
});
$('importBtn').addEventListener('click', () => { $('ioPanel').hidden = false; $('ioText').value = ''; $('ioStatus').textContent = 'Paste progress JSON below, or choose a file.'; });
$('closeIoBtn').addEventListener('click', () => { $('ioPanel').hidden = true; });
$('downloadBtn').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  a.download = 'leonida-vice-bureau-progress.json';
  a.click();
  $('ioStatus').textContent = 'Downloaded leonida-vice-bureau-progress.json.';
});
$('copyBtn').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('ioText').value); $('ioStatus').textContent = 'Copied to clipboard.'; }
  catch { $('ioStatus').textContent = 'Copy failed — select the text and copy it by hand.'; }
});
$('applyImportBtn').addEventListener('click', () => {
  try {
    const data = JSON.parse($('ioText').value);
    if (!data || typeof data !== 'object' || !Array.isArray(data.earned)) throw new Error('bad shape');
    state = { ...defaultState(), ...data, earned: data.earned.filter(id => byId[id]) };
    save(); renderAll();
    $('ioStatus').textContent = `Imported: ${state.earned.length} trophies earned.`;
  } catch { $('ioStatus').textContent = 'That JSON did not parse as progress. Nothing was changed.'; }
});
$('importFile').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data || typeof data !== 'object' || !Array.isArray(data.earned)) throw new Error('bad shape');
    state = { ...defaultState(), ...data, earned: data.earned.filter(id => byId[id]) };
    save(); renderAll();
    $('ioStatus').textContent = `Imported from ${file.name}: ${state.earned.length} trophies earned.`;
  } catch { $('ioStatus').textContent = 'That file did not parse as progress. Nothing was changed.'; }
});
$('resetBtn').addEventListener('click', () => {
  state = defaultState();
  save(); renderAll();
  $('ioStatus').textContent = 'All progress reset.';
});

function renderAll() {
  renderHeader(); renderAudit(); renderChips(); renderList(); renderDetail(); renderNextUp();
  renderRoadmap(); renderMissables(); renderSources();
}
renderAll();
