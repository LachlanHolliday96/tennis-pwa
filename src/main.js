import '/src/styles/main.css';
import { loadAll, saveAll, sched, doneSet, feelLog, customDefs } from './lib/storage.js';
import { DEFS } from './data/sessions.js';
import { EXERCISE_LIBRARY, GYM_A, GYM_B, GYM_C, resolveEx } from './data/exercises.js';
import { EX_INFO } from './lib/exinfo.js';
import { countDone, calcStreak, toggleDone, logFeel } from './lib/state.js';
import {
  getDate, fmtD, fmtDow, today, getWeekDay,
  splitSlots, joinSlots, dotColor, inTravel,
  PLAN_START, WEEK_LABELS, IS_CP
} from './data/schedule.js';
import { renderAnalysis } from './screens/Analysis.js';
import { loadWorkoutLogs, saveWorkoutLog } from './lib/supabase.js';
import { startRestTimer, stopRestTimer, requestNotificationPermission, getRestDuration } from './lib/timer.js';
// ── Merged defs ──
function allDefs(){ return Object.assign({}, DEFS, customDefs); }

// ── App state ──
let currentScreen = 'today';
let schedWeek = 0;
let sheetCtx = null;
let drawerOpen = false;
let feelCtx = null;
let selectedFeel = null;
let editCtx = null;
let wlState = {};
let wlActive = false;

// ── Nav update ──
function updateNav(){
  const {total, done} = countDone();
  const pct = total > 0 ? Math.round(done/total*100) : 0;
  document.getElementById('nb-pfill').style.width = pct + '%';
  document.getElementById('nb-ptxt').textContent = `${done}/${total}`;
  const streak = calcStreak();
  document.getElementById('streak-num').textContent = streak;
  document.getElementById('streak-badge').style.display = streak > 0 ? 'flex' : 'none';
}

// ── Screen switching ──
function switchScreen(name){
  currentScreen = name;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tbtn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
  if(name === 'today') renderToday();
  else if(name === 'schedule') renderSchedule();
  else if(name === 'progress') renderProgress();
  else if(name === 'gym') renderGym();
  else if(name === 'analysis') renderAnalysis();
}

function renderCurrentScreen(){
  updateNav();
  if(currentScreen === 'today') renderToday();
  else if(currentScreen === 'schedule') renderWeekView();
  else if(currentScreen === 'progress') renderProgress();
}

// ── Tab bar events ──
document.getElementById('tab-today').onclick = () => switchScreen('today');
document.getElementById('tab-schedule').onclick = () => switchScreen('schedule');
document.getElementById('tab-progress').onclick = () => switchScreen('progress');
document.getElementById('tab-gym').onclick = () => switchScreen('gym');
document.getElementById('tab-analysis').onclick = () => switchScreen('analysis');

// ── Toast ──
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.style.opacity = '1';
  setTimeout(() => t.style.opacity = '0', 2600);
}

// ── TODAY SCREEN ──
function renderToday(){
  const el = document.getElementById('screen-today');
  const wd = getWeekDay();
  const td = today();
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const dow = days[td.getDay()===0?6:td.getDay()-1];
  const dateStr = td.toLocaleDateString('en-AU',{day:'numeric',month:'long'});
  const defs = allDefs();

  let html = `<div class="screen-pad"><div class="today-date">${dow}, ${dateStr}</div>`;

  if(!wd){
    html += `<div class="today-headline">Plan complete 🎉</div>
    <div class="today-rest"><div class="ri">🏆</div><p>You've finished the 6-week plan.<br><strong>Time to set new goals.</strong></p></div>`;
  } else {
    const {w, d} = wd;
    const slots = splitSlots(sched[w][d]).filter(Boolean);
    const activeSessions = slots.filter(k => k !== 'rest' && k !== 'travel');
    const isRest = activeSessions.length === 0 || slots[0] === 'rest';

    const weekSlots = [];
    for(let dd=0; dd<7; dd++){
      const ss = splitSlots(sched[w][dd]).filter(k => k && k !== 'rest' && k !== 'travel');
      weekSlots.push({dd, slots: ss});
    }
    const weekDone = weekSlots.reduce((n,{dd,slots:ss}) => n + ss.filter(k => doneSet.has(`${w}-${dd}-${k}`)).length, 0);
    const weekTotal = weekSlots.reduce((n,{slots:ss}) => n + ss.length, 0);

    html += `<div class="week-banner">
      <div>
        <div class="wb-left">Week ${w+1} of 6</div>
        <div class="wb-sub">${weekDone}/${weekTotal} sessions this week</div>
      </div>
      <div class="wb-pips">
        ${weekSlots.map(({dd,slots:ss}) => {
          const hasSessions = ss.length > 0;
          const allDone = hasSessions && ss.every(k => doneSet.has(`${w}-${dd}-${k}`));
          const isToday = dd === d;
          return `<div class="wb-pip${allDone?' done':''}${isToday&&!allDone?' today-pip':''}"></div>`;
        }).join('')}
      </div>
    </div>`;

    if(isRest){
      html += `<div class="today-headline">Rest day <span class="rest-txt">💤</span></div>
      <div class="today-rest"><div class="ri">😴</div><p>Motor patterns consolidate during rest.<br><strong>The week's technique work is being processed.</strong></p></div>`;
    } else {
      const headline = activeSessions.length === 1
        ? (defs[activeSessions[0]]?.name || 'Session')
        : `${activeSessions.length} sessions today`;
      html += `<div class="today-headline">${headline}</div>`;
      activeSessions.forEach(key => {
        const def = defs[key]; if(!def) return;
        const isDone = doneSet.has(`${w}-${d}-${key}`);
        const feel = feelLog[`${w}-${d}-${key}`];
        html += `<div class="today-card${isDone?' done-card':''}" data-key="${key}" data-w="${w}" data-d="${d}">
          <div class="tc-top">
            <div class="tc-icon" style="background:${dotColor(def.type)}22">${def.icon||'📋'}</div>
            <div class="tc-info">
              <div class="tc-name" style="color:${dotColor(def.type)}">${def.name}</div>
              <div class="tc-sub">${def.blocks[0]?.tm||def.pill} · ${def.blocks.length} block${def.blocks.length!==1?'s':''}</div>
            </div>
          </div>
          <div class="tc-done-row">
            <button class="tc-done-btn${isDone?' done':''}" data-action="quick-done" data-key="${key}" data-w="${w}" data-d="${d}">
              ${isDone?'✓ Done':'○ Mark done'}
            </button>
            <div class="tc-feel">${feel?`${feel.feel}${feel.note?' · '+feel.note.slice(0,24):''}`:'Tap to log feel'}</div>
          </div>
        </div>`;
      });
    }
  }
  html += '</div>';
  el.innerHTML = html;

  // Event delegation
  el.querySelectorAll('.today-card').forEach(card => {
    card.onclick = (e) => {
      if(e.target.closest('[data-action="quick-done"]')) return;
      openSheet(card.dataset.key, +card.dataset.w, +card.dataset.d, 0);
    };
  });
  el.querySelectorAll('[data-action="quick-done"]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      quickDone(btn.dataset.key, +btn.dataset.w, +btn.dataset.d);
    };
  });
}

function quickDone(key, w, d){
  const dk = `${w}-${d}-${key}`;
  if(doneSet.has(dk)){
    doneSet.delete(dk);
    saveAll(); renderToday(); updateNav();
  } else {
    doneSet.add(dk);
    saveAll(); renderToday(); updateNav();
    openFeelSheet(key, w, d);
  }
}

// ── SCHEDULE SCREEN ──
let swipeStartX = 0, swipeStartY = 0, isSwiping = false;

function renderSchedule(){
  const sc = document.getElementById('screen-schedule');
  sc.innerHTML = `
    <div class="week-nav" id="week-nav" style="position:sticky;top:calc(var(--safe-top) + var(--nav-h));z-index:10">
      <button class="wn-btn" id="wn-prev">‹</button>
      <div>
        <div class="week-nav-lbl" id="wn-lbl"></div>
        <div class="week-nav-sub" id="wn-sub"></div>
      </div>
      <button class="wn-btn" id="wn-next">›</button>
    </div>
    <div class="sched-wrap" id="sched-wrap">
      <div id="sched-inner"></div>
    </div>`;

  document.getElementById('wn-prev').onclick = () => changeWeek(-1);
  document.getElementById('wn-next').onclick = () => changeWeek(1);

  const wrap = sc.querySelector('#sched-wrap');
  wrap.addEventListener('touchstart', e => {
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
    isSwiping = false;
  }, {passive:true});
  wrap.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - swipeStartX;
    const dy = e.touches[0].clientY - swipeStartY;
    if(!isSwiping && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) isSwiping = true;
    if(isSwiping) e.preventDefault();
  }, {passive:false});
  wrap.addEventListener('touchend', e => {
    if(!isSwiping) return;
    const dx = e.changedTouches[0].clientX - swipeStartX;
    if(Math.abs(dx) > 50){
      if(dx < 0 && schedWeek < 5) changeWeek(1);
      else if(dx > 0 && schedWeek > 0) changeWeek(-1);
    }
    isSwiping = false;
  }, {passive:true});

  renderWeekView();
}

function changeWeek(dir){
  const nw = schedWeek + dir;
  if(nw < 0 || nw > 5) return;
  schedWeek = nw;
  renderWeekView();
}

function renderWeekView(){
  if(!document.getElementById('wn-lbl')) return;
  document.getElementById('wn-lbl').textContent = `Week ${schedWeek+1} of 6${IS_CP[schedWeek]?' ✓':''}`;
  document.getElementById('wn-sub').textContent = WEEK_LABELS[schedWeek];
  document.getElementById('wn-prev').disabled = schedWeek === 0;
  document.getElementById('wn-next').disabled = schedWeek === 5;

  const td = today();
  const defs = allDefs();
  let html = '';

  for(let d=0; d<7; d++){
    const dt = getDate(schedWeek, d);
    const isToday = dt.getTime() === td.getTime();
    const slots = splitSlots(sched[schedWeek][d]).filter(Boolean);
    if(!slots.length && !isToday) continue;
    const hasContent = slots.length > 0;
    if(!hasContent && !isToday) continue;
    html += `<div class="sday${isToday?' today-row':''}" data-w="${schedWeek}" data-d="${d}">
      <div class="sd-left">
        <div class="sd-dow">${fmtDow(dt)}</div>
        <div class="sd-date-row">
          <div class="sd-add" data-action="add-slot" data-w="${schedWeek}" data-d="${d}">+</div>
          ${isToday
            ? `<div class="sd-num today-num">${dt.getDate()}</div>`
            : `<div class="sd-num">${dt.getDate()}</div>`}
        </div>
      </div>
      <div class="sd-right">
        ${slots.length ? slots.map((key,si) => {
          const def = defs[key]; if(!def) return '';
          const isDone = doneSet.has(`${schedWeek}-${d}-${key}`);
          return `<div class="sd-chip${isDone?' is-done':''}" data-key="${key}" data-w="${schedWeek}" data-d="${d}" data-si="${si}">
            <div class="sdc-dot" style="background:${dotColor(def.type)}"></div>
            <div class="sdc-name" style="color:${dotColor(def.type)}">${def.name}</div>
            <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">
              <div class="sdc-check${isDone?' checked':''}" data-action="toggle-done" data-key="${key}" data-w="${schedWeek}" data-d="${d}">${isDone?'✓':''}</div>
              <div class="sdc-delete" data-action="delete-slot" data-w="${schedWeek}" data-d="${d}" data-si="${si}">✕</div>
            </div>
          </div>`;
        }).join('') : `<div class="sd-empty">Rest</div>`}
      </div>
    </div>`;
  }

  const inner = document.getElementById('sched-inner');
  inner.innerHTML = html;
  inner.querySelectorAll('.sd-chip').forEach(chip => {
    chip.onclick = e => {
      if(e.target.closest('[data-action="toggle-done"]')) return;
      openSheet(chip.dataset.key, +chip.dataset.w, +chip.dataset.d, 0);
    };
  });
  inner.querySelectorAll('[data-action="toggle-done"]').forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      const {key, w, d} = btn.dataset;
      toggleDone(key, +w, +d);
      updateNav();
      renderWeekView();
      if(!doneSet.has(`${w}-${d}-${key}`)) return;
      openFeelSheet(key, +w, +d);
    };
  });

  inner.querySelectorAll('[data-action="delete-slot"]').forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      const {w, d, si} = btn.dataset;
      const slots = splitSlots(sched[+w][+d]);
      slots.splice(+si, 1);
      sched[+w][+d] = joinSlots(slots);
      saveAll();
      renderWeekView();
      showToast('Session removed');
    };
  });

  inner.querySelectorAll('[data-action="add-slot"]').forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      const {w, d} = btn.dataset;
      const slots = splitSlots(sched[+w][+d]);
      editCtx = {key: null, w: +w, d: +d, si: slots.length};
      swapTab = 'swap';
      renderEditModal();
      document.getElementById('edit-bg').classList.add('open');
    };
  });
}

// ── PROGRESS SCREEN ──
function renderProgress(){
  const {total, done} = countDone();
  const pct = total > 0 ? Math.round(done/total*100) : 0;
  const streak = calcStreak();
  const R = 44, C = 2*Math.PI*R;
  const offset = C - (pct/100)*C;

  const weeklyDone = Array.from({length:6}, (_,w) => {
    let n=0;
    for(let d=0;d<7;d++) splitSlots(sched[w][d]).filter(k=>k&&k!=='rest'&&k!=='travel').forEach(k=>{
      if(doneSet.has(`${w}-${d}-${k}`)) n++;
    });
    return n;
  });
  const weeklyTotal = Array.from({length:6}, (_,w) => {
    let n=0; for(let d=0;d<7;d++) n+=splitSlots(sched[w][d]).filter(k=>k&&k!=='rest'&&k!=='travel').length; return n;
  });
  const maxBar = Math.max(...weeklyTotal, 1);
  const wd = getWeekDay();
  const currentW = wd ? wd.w : -1;
  const feelEntries = Object.entries(feelLog).slice(-8).reverse();

  document.getElementById('screen-progress').innerHTML = `<div class="screen-pad">
    <div class="prog-hero">
      <div>
        <svg class="prog-ring" width="100" height="100" viewBox="0 0 100 100">
          <circle class="prog-ring-bg" cx="50" cy="50" r="${R}"/>
          <circle class="prog-ring-fill" cx="50" cy="50" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${offset}"/>
        </svg>
      </div>
      <div class="prog-hero-right">
        <div class="prog-pct">${pct}%</div>
        <div class="prog-label">6-week completion</div>
        <div class="prog-detail">${done} of ${total} sessions done</div>
      </div>
    </div>
    <div class="streak-card">
      <div class="streak-icon">🔥</div>
      <div>
        <div class="streak-num">${streak}</div>
        <div class="streak-lbl">day streak</div>
      </div>
      <div style="flex:1;margin-left:.5rem;font-size:.75rem;color:var(--soft);line-height:1.6">
        ${streak===0?'Complete a session today to start your streak.':streak===1?'Good start — keep it going tomorrow.':streak<5?'Building momentum. Don\'t break the chain.':'Strong consistency. This is where adaptation happens.'}
      </div>
    </div>
    <div class="chart-card">
      <div class="chart-title">Sessions per week</div>
      <div class="chart-bars">
        ${weeklyTotal.map((tot,w) => {
          const dn = weeklyDone[w];
          const h = tot > 0 ? Math.round((dn/maxBar)*72) : 3;
          return `<div class="chart-bar-wrap">
            <div class="chart-bar-val">${dn>0?dn:''}</div>
            <div class="chart-bar${dn>0?' has-data':''}${w===currentW?' current-week':''}" style="height:${Math.max(h,3)}px"></div>
            <div class="chart-bar-lbl">W${w+1}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
    ${feelEntries.length ? `<div class="feel-log-card">
      <div class="chart-title" style="margin-bottom:.5rem">Recent session feels</div>
      ${feelEntries.map(([dk,fl]) => {
        const parts = dk.split('-');
        const w=parseInt(parts[0]), d=parseInt(parts[1]), key=parts.slice(2).join('-');
        const def = allDefs()[key];
        const dt = getDate(w,d);
        return `<div class="feel-row">
          <div class="feel-date">${fmtD(dt)}</div>
          <div class="feel-name">${def?.name||key}</div>
          <div class="feel-badge feel-${fl.feel}">${fl.feel}</div>
        </div>`;
      }).join('')}
    </div>` : ''}
  </div>`;
}

// ── GYM SCREEN ──
// ── GYM EDIT STATE ──
let gymEditMode = false;
let gymOrders = null;

function getGymOrder(key, arr){
  if(!gymOrders){
    try { gymOrders = JSON.parse(localStorage.getItem('gym_orders')||'{}'); } catch(e){ gymOrders = {}; }
  }
  if(gymOrders[key]) return gymOrders[key].map(id => arr.find(e => e.id === id)).filter(Boolean);
  return arr;
}

function saveGymOrder(key, arr){
  if(!gymOrders) gymOrders = {};
  gymOrders[key] = arr.map(e => e.id);
  localStorage.setItem('gym_orders', JSON.stringify(gymOrders));
  gymOrders = null; // force re-read on next getGymOrder call
}

function renderGym(){
  const ordA = getGymOrder('a', GYM_A);
  const ordB = getGymOrder('b', GYM_B);
  const ordC = getGymOrder('c', GYM_C);

  const exRow = (e, color, sessionKey) => {
    const lib = EXERCISE_LIBRARY[e.id];
    const name = lib ? lib.name : (e.n || e.id || '');
    const why = lib ? lib.trains.replace(/<[^>]+>/g,'') : (e.w||'');
    const sets = e.s || '';
    return `<div class="gym-ex${gymEditMode?' edit-mode':''}" data-id="${e.id}" data-session="${sessionKey}" draggable="${gymEditMode}">
      ${gymEditMode ? '<div class="gym-ex-drag">⠿</div>' : ''}
      <div class="gym-ex-dot" style="background:${color}"></div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px">
          <div class="gym-ex-name">${name}</div>
          ${lib && !gymEditMode ? `<button class="wl-info-btn" data-ex="${e.id}" data-target="${sets}">i</button>` : ''}
        </div>
        <div class="gym-ex-why">${why}</div>
      </div>
      ${gymEditMode
        ? `<div class="gym-ex-swipe-wrap" data-id="${e.id}" data-session="${sessionKey}">
            <div class="gym-ex-sets" style="opacity:.4">${sets.replace(' · ','<br>')}</div>
            <div class="gym-ex-delete-btn" data-id="${e.id}" data-session="${sessionKey}">Delete</div>
           </div>`
        : `<div class="gym-ex-sets">${sets.replace(' · ','<br>')}</div>`
      }
    </div>`;
  };

  const el = document.getElementById('screen-gym');
  el.innerHTML = `
    <div class="gym-edit-bar">
      <div class="gym-edit-bar-title">Gym sessions</div>
      <button class="gym-edit-btn${gymEditMode?' active':''}" id="gym-edit-toggle">${gymEditMode?'Done':'Edit'}</button>
    </div>
    <div class="gym-section-head">Session A — Leg day · Tuesdays</div>
    <div class="gym-ex-list" id="gym-list-a">${ordA.map(e => exRow(e,'var(--gym)','a')).join('')}</div>
    <div class="gym-section-head" style="margin-top:.5rem">Session B — Pronation + serve power · Thursdays</div>
    <div class="gym-ex-list" id="gym-list-b">${ordB.map(e => exRow(e,'var(--accent)','b')).join('')}</div>
    <div class="gym-section-head" style="margin-top:.5rem">Session C — Injury prevention</div>
    <div class="gym-ex-list" id="gym-list-c">${ordC.map(e => exRow(e,'var(--a2)','c')).join('')}</div>
    <div style="height:1rem"></div>
    ${!gymEditMode ? `<div class="gym-add-btn-wrap">
      <button class="gym-add-btn" id="gym-add-btn">+ Create new gym session</button>
    </div>` : ''}
    <div style="height:2rem"></div>`;

  document.getElementById('gym-edit-toggle').onclick = () => { gymEditMode = !gymEditMode; renderGym(); };

  // Allow drag over entire screen so cross-session drags don't get cancelled
  el.addEventListener('dragover', e => e.preventDefault());
  el.querySelectorAll('.wl-info-btn').forEach(btn => {
    btn.onclick = e => { e.stopPropagation(); openInfoSheetById(btn.dataset.ex, btn.dataset.target); };
  });
  const addBtn = document.getElementById('gym-add-btn');
  if(addBtn) addBtn.onclick = () => openCreateGymSession();

  if(!gymEditMode) return;

  el.querySelectorAll('.gym-ex-swipe-wrap').forEach(wrap => {
    let startX = 0, deltaX = 0;
    const row = wrap.closest('.gym-ex');
    const delBtn = wrap.querySelector('.gym-ex-delete-btn');
    wrap.addEventListener('touchstart', e => { startX = e.touches[0].clientX; deltaX = 0; }, {passive:true});
    wrap.addEventListener('touchmove', e => {
      deltaX = e.touches[0].clientX - startX;
      if(deltaX < 0){ const c = Math.max(deltaX,-80); row.style.transform = `translateX(${c}px)`; delBtn.style.opacity = String(Math.min(Math.abs(c)/80,1)); }
    }, {passive:true});
    wrap.addEventListener('touchend', () => {
      if(deltaX < -60){ row.style.transform = 'translateX(-80px)'; delBtn.style.opacity = '1'; }
      else { row.style.transform = ''; delBtn.style.opacity = '0'; }
    }, {passive:true});
  });

  el.querySelectorAll('.gym-ex-delete-btn').forEach(btn => {
    btn.onclick = () => {
      const {id, session} = btn.dataset;
      const map = {a:[...getGymOrder('a',GYM_A)], b:[...getGymOrder('b',GYM_B)], c:[...getGymOrder('c',GYM_C)]};
      map[session] = map[session].filter(e => e.id !== id);
      saveGymOrder(session, map[session]);
      renderGym();
      showToast('Exercise removed');
    };
  });

  let dragSrc = null;
  let dragSrcId = null;
  let dragSrcSession = null;
  el.querySelectorAll('.gym-ex[draggable="true"]').forEach(row => {
    const handle = row.querySelector('.gym-ex-drag');
    if(handle){
      handle.addEventListener('mousedown', () => { row.draggable = true; });
      handle.addEventListener('touchstart', () => { row.draggable = true; }, {passive:true});
    }
    row.addEventListener('dragstart', e => {
      dragSrc = row;
      dragSrcId = row.dataset.id;
      dragSrcSession = row.dataset.session;
      setTimeout(()=>row.classList.add('dragging'),0);
      e.dataTransfer.effectAllowed='move';
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      el.querySelectorAll('.gym-ex').forEach(r=>r.classList.remove('drag-over'));
      const colorMap = {a:'var(--gym)', b:'var(--accent)', c:'var(--a2)'};
      const dot = row.querySelector('.gym-ex-dot');
      if(dot) dot.style.background = colorMap[row.dataset.session] || '';
      setTimeout(() => { dragSrc=null; dragSrcId=null; dragSrcSession=null; }, 100);
    });
    row.addEventListener('dragover', e => {
      e.preventDefault();
      if(row===dragSrc) return;
      el.querySelectorAll('.gym-ex').forEach(r=>r.classList.remove('drag-over'));
      row.classList.add('drag-over');
      if(dragSrc){
        const targetSession = row.dataset.session;
        const colorMap = {a:'var(--gym)', b:'var(--accent)', c:'var(--a2)'};
        const dot = dragSrc.querySelector('.gym-ex-dot');
        if(dot) dot.style.background = colorMap[targetSession] || '';
      }
    });
    row.addEventListener('drop', e => {
      e.preventDefault();
      if(!dragSrc||row===dragSrc) return;
      const fromSession = dragSrcSession || dragSrc.dataset.session;
      const toSession = row.dataset.session;
      const movedId = dragSrcId || dragSrc.dataset.id;
      const map = {
        a:[...getGymOrder('a',GYM_A)],
        b:[...getGymOrder('b',GYM_B)],
        c:[...getGymOrder('c',GYM_C)]
      };
      const fromArr = map[fromSession];
      const fromIdx = fromArr.findIndex(e=>e.id===movedId);
      if(fromIdx===-1) return;
      if(fromSession === toSession){
        const toIdx = fromArr.findIndex(e=>e.id===row.dataset.id);
        if(toIdx===-1) return;
        const [moved] = fromArr.splice(fromIdx, 1);
        const insertAt = fromIdx < toIdx ? toIdx - 1 : toIdx;
        fromArr.splice(insertAt, 0, moved);
        saveGymOrder(fromSession, fromArr);
      } else {
        const toArr = map[toSession];
        const toIdx = toArr.findIndex(e=>e.id===row.dataset.id);
        const [moved] = fromArr.splice(fromIdx, 1);
        saveGymOrder(fromSession, fromArr);
        if(toIdx===-1) toArr.push(moved);
        else toArr.splice(toIdx, 0, moved);
        saveGymOrder(toSession, toArr);
      }
      renderGym();
    });
  });
}

// ── DETAIL SHEET ──
const SHEET_EXERCISES = {
  afternoonlegs: { label:'Full exercise list — Session A', color:'var(--gym)', list: GYM_A },
  legday:        { label:'Full exercise list — Session A', color:'var(--gym)', list: GYM_A },
  pronation:     { label:'Full exercise list — Session B', color:'var(--accent)', list: GYM_B },
  hill: { label:'Hill sprint protocol', color:'var(--hill)', list:[
    {n:'Grade',w:'Find a hill at 8–15% incline.',s:'8–15%'},
    {n:'Effort duration',w:'Sprint hard 30s (wk1–3), 40s (wk4), 45s (wk5–6). Walk back down — full recovery.',s:'30–45s'},
    {n:'Rep count',w:'6 reps (wk1), 8 (wk2), 10 (wk3–4), 12 (wk5–6).',s:'6→12'},
    {n:'Rest',w:'Walk back down — typically 90–120s. Full recovery is non-negotiable.',s:'Full walk'},
    {n:'Hip flexor stretch',w:'60s kneeling hip flexor stretch each side post-session.',s:'Post ×60s'},
    {n:'Calf stretch',w:'30s each side on a step or kerb.',s:'Post ×30s'},
    {n:'Thoracic rotation',w:'×10 each side. Preps for the pronation gym session that follows.',s:'Post ×10'},
  ]},
  liam: { label:'Session tips — hitting with Liam', color:'var(--tennis)', list:[
    {n:'Bounce-hit drill',w:'Say "bounce" and "hit" aloud every shot.',s:'First 20 min'},
    {n:'Forehand footwork',w:'Closed stance: split step → pivot on heel → ONE step in.',s:'Every rally'},
    {n:'Serve toss',w:'10 toss-only reps before serving a single ball.',s:'Pre-serve'},
    {n:'Cone target',w:'Cone at T and one wide. 7/10 placement before adding pace.',s:'20 serves'},
    {n:'Rally count',w:'Wk1–2: 20+ balls. Wk5–6: 30+ without technique breakdown.',s:'Track it'},
  ]},
  kdv: { label:'KDV session tips', color:'var(--tennis)', list:[
    {n:'One focus only',w:'Pivot-and-step footwork OR bounce-hit timing. Not both.',s:'Pre-session'},
    {n:'When technique breaks',w:'Is it under pace? Under pressure? When tired?',s:'During'},
    {n:'Post-session note',w:'"Footwork held / broke down when ___."',s:'5 min after'},
  ]},
  singles: { label:'Match play tips', color:'var(--tennis)', list:[
    {n:'Serve routine',w:'Toss isolation first. 10 first serves, 10 second serves.',s:'Warm-up'},
    {n:'Serve + 1 pattern',w:'Wk5–6: serve to T, attack the short reply.',s:'Wk 5–6'},
    {n:'Court sprint block',w:'10× baseline-to-net-and-back, 20s rest. Build to 15 reps.',s:'Post-match'},
  ]},
};

function openSheet(key, w, d, si){
  const def = allDefs()[key]; if(!def) return;
  sheetCtx = {key, w, d, si};
  drawerOpen = false;
  const isDone = doneSet.has(`${w}-${d}-${key}`);
  const dt = getDate(w, d);

  document.getElementById('sheet-title').textContent = def.name;
  document.getElementById('sheet-date').textContent = `${fmtDow(dt)}, ${fmtD(dt)} · Week ${w+1}`;
  document.getElementById('sheet-body').innerHTML = def.blocks.map(b => `
    <div class="sheet-block ${b.c}">
      <div class="sheet-block-title">${b.t}${b.tm?` <span class="sheet-block-tm">${b.tm}</span>`:''}</div>
      <div class="sheet-block-desc">${b.d}</div>
    </div>`).join('');

  document.getElementById('sheet-actions').innerHTML = `
    <button class="s-btn done-btn${isDone?' done':''}" id="sheet-done-btn">${isDone?'✓ Done':'○ Mark done'}</button>
    <button class="s-btn edit-btn" id="sheet-edit-btn">✎ Edit</button>`;

  document.getElementById('sheet-done-btn').onclick = sheetToggleDone;
  document.getElementById('sheet-edit-btn').onclick = openEdit;

  // Remove old drawer
  const old = document.getElementById('sheet-drawer');
  if(old) old.remove();

  const exData = SHEET_EXERCISES[key];
  if(exData && exData.list.length){
    const drawer = document.createElement('div');
    drawer.id = 'sheet-drawer';
    drawer.className = 'ex-drawer';
    const isGym = key === 'afternoonlegs' || key === 'legday' || key === 'pronation';

    if(isGym){
      drawer.innerHTML = `
        <button class="ex-drawer-toggle" id="drawer-toggle">
          <div class="ex-drawer-toggle-left">
            <span class="ex-drawer-label" style="color:${exData.color}">📋 ${exData.label}</span>
            <span class="ex-drawer-count">${exData.list.length} exercises</span>
          </div>
          <span class="ex-drawer-arrow" id="drawer-arrow">▼</span>
        </button>
        <div class="ex-drawer-body" id="drawer-body"></div>`;
      document.getElementById('sheet').appendChild(drawer);
      document.getElementById('drawer-toggle').onclick = () => toggleDrawer(key);
      initWorkoutLogger(key, exData.list).then(() => {
        const body = document.getElementById('drawer-body');
        if(body){
          body.innerHTML = buildLoggerHTML(key);
          attachLoggerEvents(key);
        }
      });
    } else {
      drawer.innerHTML = `
        <button class="ex-drawer-toggle" id="drawer-toggle">
          <div class="ex-drawer-toggle-left">
            <span class="ex-drawer-label" style="color:${exData.color}">${exData.label}</span>
            <span class="ex-drawer-count">${exData.list.length} tips</span>
          </div>
          <span class="ex-drawer-arrow" id="drawer-arrow">▼</span>
        </button>
        <div class="ex-drawer-body" id="drawer-body">
          ${exData.list.map(e => `
            <div class="ex-item">
              <div class="ex-item-dot" style="background:${exData.color}"></div>
              <div style="flex:1;min-width:0">
                <div class="ex-item-name">${e.n}</div>
                <div class="ex-item-why">${e.w}</div>
              </div>
              <div class="ex-item-sets">${e.s.replace(' · ','<br>')}</div>
            </div>`).join('')}
        </div>`;
      document.getElementById('sheet').appendChild(drawer);
      document.getElementById('drawer-toggle').onclick = () => toggleDrawer(null);
    }
  }
  document.getElementById('sheet-bg').classList.add('open');
}

function toggleDrawer(sessionKey){
  drawerOpen = !drawerOpen;
  const body = document.getElementById('drawer-body');
  const arrow = document.getElementById('drawer-arrow');
  if(body) body.classList.toggle('open', drawerOpen);
  if(arrow) arrow.classList.toggle('open', drawerOpen);
  if(drawerOpen && sessionKey && body && !body.innerHTML.trim()){
    body.innerHTML = buildLoggerHTML(sessionKey);
    attachLoggerEvents(sessionKey);
  }
  if(drawerOpen){
    setTimeout(() => {
      const drawer = document.getElementById('sheet-drawer');
      if(drawer) drawer.scrollIntoView({behavior:'smooth', block:'nearest'});
    }, 100);
  }
}

function closeSheetNow(){
  document.getElementById('sheet-bg').classList.remove('open');
  const d = document.getElementById('sheet-drawer');
  if(d) d.remove();
  drawerOpen = false;
  sheetCtx = null;
}

function sheetToggleDone(){
  if(!sheetCtx) return;
  const {key, w, d} = sheetCtx;
  const dk = `${w}-${d}-${key}`;
  if(doneSet.has(dk)){
    doneSet.delete(dk);
    document.getElementById('sheet-done-btn').className = 's-btn done-btn';
    document.getElementById('sheet-done-btn').textContent = '○ Mark done';
    saveAll(); renderCurrentScreen();
  } else {
    doneSet.add(dk);
    document.getElementById('sheet-done-btn').className = 's-btn done-btn done';
    document.getElementById('sheet-done-btn').textContent = '✓ Done';
    saveAll(); renderCurrentScreen();
    closeSheetNow();
    openFeelSheet(key, w, d);
  }
}

// Sheet events
document.getElementById('sheet-bg').onclick = e => { if(e.target === document.getElementById('sheet-bg')) closeSheetNow(); };
document.getElementById('sheet-close').onclick = closeSheetNow;

// ── FEEL SHEET ──
function openFeelSheet(key, w, d){
  feelCtx = {key, w, d};
  selectedFeel = null;
  const def = allDefs()[key];
  document.getElementById('feel-title').textContent = `How did ${def?.name||'it'} go?`;
  document.getElementById('feel-note').value = '';
  document.querySelectorAll('.feel-opt').forEach(b => b.classList.remove('sel'));
  document.getElementById('feel-bg').classList.add('open');
}

['Easy','Solid','Hard','Skipped'].forEach(f => {
  document.getElementById(`feel-${f}`).onclick = () => {
    selectedFeel = f;
    document.querySelectorAll('.feel-opt').forEach(b => b.classList.remove('sel'));
    document.getElementById(`feel-${f}`).classList.add('sel');
  };
});

document.getElementById('feel-save').onclick = () => {
  if(!feelCtx) return;
  const {key, w, d} = feelCtx;
  const note = document.getElementById('feel-note').value.trim();
  if(selectedFeel) logFeel(key, w, d, selectedFeel, note);
  document.getElementById('feel-bg').classList.remove('open');
  feelCtx = null; selectedFeel = null;
  renderCurrentScreen();
  showToast(selectedFeel ? `Logged: ${selectedFeel}` : 'Skipped feel log');
};

// ── INFO SHEET ──
function openInfoSheet(exName, target){
  const info = EX_INFO[exName]; if(!info) return;
  document.getElementById('is-name').textContent = exName;
  document.getElementById('is-target').textContent = target || '';
  document.getElementById('is-how').innerHTML = info.how;
  document.getElementById('is-cue').textContent = info.cue;
  document.getElementById('is-trains').innerHTML = info.trains;
  document.getElementById('is-injury').innerHTML = info.injury.map(i => `
    <div class="is-injury-item">
      <div class="is-injury-dot"></div>
      <div class="is-injury-text">${i}</div>
    </div>`).join('');
  document.getElementById('info-sheet-bg').classList.add('open');
}

document.getElementById('info-sheet-bg').onclick = e => { if(e.target === document.getElementById('info-sheet-bg')) document.getElementById('info-sheet-bg').classList.remove('open'); };
document.getElementById('is-close').onclick = () => document.getElementById('info-sheet-bg').classList.remove('open');

// ── EDIT / SWAP MODAL ──
let swapTab = 'swap';

function openEdit(){
  if(!sheetCtx) return;
  const {key, w, d, si} = sheetCtx;
  const def = allDefs()[key]; if(!def) return;
  editCtx = {key, w, d, si};
  swapTab = 'swap';
  renderEditModal();
  document.getElementById('edit-bg').classList.add('open');
}

function renderEditModal(){
  if(!editCtx) return;
  const {key, w, d, si} = editCtx;
  const def = allDefs()[key];

  document.getElementById('edit-title').textContent = 'Edit session';

  // Build modal body dynamically
  const modal = document.querySelector('.edit-modal');

  // Remove old dynamic content below header
  modal.querySelectorAll('.swap-tabs,.swap-grid,.ef,.block-ed,.add-block-btn,.edit-btns').forEach(el => el.remove());

  // Tabs
  const tabs = document.createElement('div');
  tabs.className = 'swap-tabs';
  tabs.innerHTML = `
    <button class="swap-tab${swapTab==='swap'?' active':''}" id="tab-swap">Swap session</button>
    <button class="swap-tab${swapTab==='custom'?' active':''}" id="tab-custom">Customise</button>`;
  modal.appendChild(tabs);

  document.getElementById('tab-swap').onclick = () => { swapTab='swap'; renderEditModal(); };
  document.getElementById('tab-custom').onclick = () => { swapTab='custom'; renderEditModal(); };

  if(swapTab === 'swap'){
    renderSwapTab(modal, key, w, d, si);
  } else {
    renderCustomTab(modal, def);
  }
}

function renderSwapTab(modal, currentKey, w, d, si){
  const defs = allDefs();
  const grid = document.createElement('div');
  grid.className = 'swap-grid';

  const sessionOrder = ['liam','kdv','singles','morningcardio','afternoonlegs','legday','pronation','injuryprev','hill','hotel15','hotel30','travel','rest'];

  sessionOrder.forEach(key => {
    const def = defs[key]; if(!def) return;
    const isActive = key === currentKey;
    const card = document.createElement('div');
    card.className = `swap-card${isActive?' active-session':''}`;
    card.innerHTML = `
      <div class="swap-card-icon">${def.icon||'📋'}</div>
      <div class="swap-card-name" style="color:${dotColor(def.type)}">${def.name}</div>
      <div class="swap-card-type">${def.pill}</div>`;
    card.onclick = () => {
      const slots = splitSlots(sched[w][d]);
      slots[si] = key;
      sched[w][d] = joinSlots(slots);
      saveAll();
      document.getElementById('edit-bg').classList.remove('open');
      closeSheetNow();
      renderCurrentScreen();
      showToast(`Swapped to ${def.name}`);
    };
    grid.appendChild(card);
  });

  // Custom session types
  Object.entries(customDefs).forEach(([key, def]) => {
    const isActive = key === currentKey;
    const card = document.createElement('div');
    card.className = `swap-card${isActive?' active-session':''}`;
    card.innerHTML = `
      <div class="swap-card-icon">${def.icon||'📋'}</div>
      <div class="swap-card-name" style="color:${dotColor(def.type)}">${def.name}</div>
      <div class="swap-card-type">${def.pill} · custom</div>`;
    card.onclick = () => {
      const slots = splitSlots(sched[w][d]);
      slots[si] = key;
      sched[w][d] = joinSlots(slots);
      saveAll();
      document.getElementById('edit-bg').classList.remove('open');
      closeSheetNow();
      renderCurrentScreen();
      showToast(`Swapped to ${def.name}`);
    };
    grid.appendChild(card);
  });

  // Add new session type card
  const addCard = document.createElement('div');
  addCard.className = 'swap-card';
  addCard.style.borderStyle = 'dashed';
  addCard.innerHTML = `
    <div class="swap-card-icon">➕</div>
    <div class="swap-card-name" style="color:var(--a2)">New session type</div>
    <div class="swap-card-type">Create custom</div>`;
  addCard.onclick = () => openCreateSession(w, d, si);
  grid.appendChild(addCard);

  modal.appendChild(grid);
}

function openCreateSession(w, d, si){
  editCtx = {key: null, w, d, si};
  swapTab = 'custom';
  const modal = document.querySelector('.edit-modal');
  modal.querySelectorAll('.swap-tabs,.swap-grid,.ef,.block-ed,.add-block-btn,.edit-btns,.create-session-form').forEach(el => el.remove());

  document.getElementById('edit-title').textContent = 'New session type';

  const form = document.createElement('div');
  form.className = 'create-session-form';
  form.innerHTML = `
    <div class="ef"><label>Session name</label><input id="e-name" type="text" placeholder="e.g. Upper body gym"></div>
    <div class="ef"><label>Short label</label><input id="e-short" type="text" maxlength="12" placeholder="e.g. Gym C"></div>
    <div class="ef"><label>Icon (emoji)</label><input id="e-icon" type="text" maxlength="2" placeholder="💪"></div>
    <div class="ef"><label>Type</label>
      <select id="e-type">
        <option value="s-gym">Gym</option>
        <option value="s-tennis">Tennis</option>
        <option value="s-cardio">Cardio</option>
        <option value="s-hill">Hill sprints</option>
        <option value="s-hotel">Travel / Hotel</option>
        <option value="s-rest">Rest</option>
      </select>
    </div>
    <div class="ef"><label>Pill label</label><input id="e-pill" type="text" maxlength="14" placeholder="e.g. Gym C"></div>
    <div class="ef"><label>Session blocks</label>
      <div class="block-ed" id="block-ed"></div>
      <button class="add-block-btn" id="add-block-btn">+ Add block</button>
    </div>`;
  modal.appendChild(form);

  addBedRow(null);
  document.getElementById('add-block-btn').onclick = () => addBedRow(null);

  const btns = document.createElement('div');
  btns.className = 'edit-btns';
  btns.innerHTML = `<button class="eb save" id="edit-save">Create & schedule</button>`;
  modal.appendChild(btns);

  document.getElementById('edit-save').onclick = () => {
    const name = (document.getElementById('e-name').value||'').trim();
    if(!name){ showToast('Add a session name first'); return; }
    const short = (document.getElementById('e-short').value||'').trim()||name.slice(0,10);
    const icon = (document.getElementById('e-icon').value||'').trim()||'📋';
    const type = document.getElementById('e-type').value;
    const pill = (document.getElementById('e-pill').value||'').trim()||short;
    const blocks = [...document.querySelectorAll('#block-ed .bed-row')].map(row => {
      const ins = row.querySelectorAll('.bed-inp');
      const ta = row.querySelector('.bed-ta');
      return {c:'tb', t:(ins[0]?.value||'').trim(), tm:(ins[1]?.value||'').trim(), d:(ta?.value||'').trim()};
    }).filter(b => b.t||b.d);

    const key = 'custom_' + Date.now();
    customDefs[key] = {type, pill, name, short, icon, blocks};

    // Schedule it on the selected day
    const slots = splitSlots(sched[w][d]);
    slots[si] = key;
    sched[w][d] = joinSlots(slots);
    saveAll();

    document.getElementById('edit-bg').classList.remove('open');
    closeSheetNow();
    renderCurrentScreen();
    showToast(`"${name}" created and scheduled`);
  };
}
// cd ~/tennis-app/pwa && npm run build && open dist
function renderCustomTab(modal, def){
  // Name field
  const fields = document.createElement('div');
  fields.innerHTML = `
    <div class="ef"><label>Name</label><input id="e-name" type="text" value="${def.name||''}"></div>
    <div class="ef"><label>Short label</label><input id="e-short" type="text" maxlength="12" value="${def.short||''}"></div>
    <div class="ef"><label>Type</label>
      <select id="e-type">
        <option value="s-tennis"${def.type==='s-tennis'?' selected':''}>Tennis</option>
        <option value="s-cardio"${def.type==='s-cardio'?' selected':''}>Cardio</option>
        <option value="s-gym"${def.type==='s-gym'?' selected':''}>Gym</option>
        <option value="s-hill"${def.type==='s-hill'?' selected':''}>Hill sprints</option>
        <option value="s-hotel"${def.type==='s-hotel'?' selected':''}>Travel / Hotel</option>
        <option value="s-rest"${def.type==='s-rest'?' selected':''}>Rest</option>
      </select>
    </div>
    <div class="ef"><label>Pill label</label><input id="e-pill" type="text" maxlength="14" value="${def.pill||''}"></div>
    <div class="ef"><label>Session blocks</label>
      <div class="block-ed" id="block-ed"></div>
      <button class="add-block-btn" id="add-block-btn">+ Add block</button>
    </div>`;
  modal.appendChild(fields);

  buildBedRows(def.blocks || []);
  document.getElementById('add-block-btn').onclick = () => addBedRow(null);

  const btns = document.createElement('div');
  btns.className = 'edit-btns';
  btns.innerHTML = `
    <button class="eb save" id="edit-save">Save</button>
    <button class="eb del" id="edit-del">Remove</button>`;
  modal.appendChild(btns);

  document.getElementById('edit-save').onclick = () => {
    if(!editCtx) return;
    const name = (document.getElementById('e-name').value||'').trim()||'Session';
    const short = (document.getElementById('e-short').value||'').trim()||name.slice(0,10);
    const type = document.getElementById('e-type').value;
    const pill = (document.getElementById('e-pill').value||'').trim()||short;
    const blocks = [...document.querySelectorAll('#block-ed .bed-row')].map(row => {
      const ins = row.querySelectorAll('.bed-inp');
      const ta = row.querySelector('.bed-ta');
      return {c:'tb', t:(ins[0]?.value||'').trim(), tm:(ins[1]?.value||'').trim(), d:(ta?.value||'').trim()};
    }).filter(b => b.t||b.d);
    if(editCtx.key){
      customDefs[editCtx.key] = {type, pill, name, short, icon: allDefs()[editCtx.key]?.icon||'📋', blocks};
      saveAll();
      document.getElementById('edit-bg').classList.remove('open');
      openSheet(editCtx.key, editCtx.w, editCtx.d, editCtx.si);
    }
  };

  document.getElementById('edit-del').onclick = () => {
    if(!editCtx?.key) return;
    if(!confirm('Remove this session?')) return;
    const {key, w, d, si} = editCtx;
    const slots = splitSlots(sched[w][d]);
    slots.splice(si, 1);
    sched[w][d] = joinSlots(slots);
    saveAll();
    document.getElementById('edit-bg').classList.remove('open');
    closeSheetNow();
    renderCurrentScreen();
  };
}

function buildBedRows(blocks){
  const ed = document.getElementById('block-ed');
  ed.innerHTML = '';
  blocks.forEach(b => addBedRow(b));
}

function addBedRow(b){
  const ed = document.getElementById('block-ed');
  const row = document.createElement('div');
  row.className = 'bed-row';
  row.innerHTML = `<button class="bed-del">✕</button>
    <div class="bed-lbl">Title</div><input class="bed-inp" placeholder="e.g. Warm-up" value="${(b&&b.t)||''}">
    <div class="bed-lbl">Duration</div><input class="bed-inp" placeholder="e.g. 10 min" value="${(b&&b.tm)||''}">
    <div class="bed-lbl">Description</div><textarea class="bed-ta">${(b&&b.d)||''}</textarea>`;
  row.querySelector('.bed-del').onclick = () => row.remove();
  ed.appendChild(row);
}

document.getElementById('add-block-btn').onclick = () => addBedRow(null);

document.getElementById('edit-save').onclick = () => {
  if(!editCtx) return;
  const name = (document.getElementById('e-name').value||'').trim()||'Session';
  const short = (document.getElementById('e-short').value||'').trim()||name.slice(0,10);
  const type = document.getElementById('e-type').value;
  const pill = (document.getElementById('e-pill').value||'').trim()||short;
  const blocks = [...document.querySelectorAll('#block-ed .bed-row')].map(row => {
    const ins = row.querySelectorAll('.bed-inp');
    const ta = row.querySelector('.bed-ta');
    return {c:'tb', t:(ins[0]?.value||'').trim(), tm:(ins[1]?.value||'').trim(), d:(ta?.value||'').trim()};
  }).filter(b => b.t||b.d);

  if(editCtx.key){
    customDefs[editCtx.key] = {type, pill, name, short, icon:'📋', blocks};
    saveAll();
    document.getElementById('edit-bg').classList.remove('open');
    openSheet(editCtx.key, editCtx.w, editCtx.d, editCtx.si);
  }
};

document.getElementById('edit-del').onclick = () => {
  if(!editCtx?.key) return;
  if(!confirm('Remove this session?')) return;
  const {key, w, d, si} = editCtx;
  const slots = splitSlots(sched[w][d]);
  slots.splice(si, 1);
  sched[w][d] = joinSlots(slots);
  saveAll();
  document.getElementById('edit-bg').classList.remove('open');
  closeSheetNow();
  renderCurrentScreen();
};

document.getElementById('edit-close').onclick = () => document.getElementById('edit-bg').classList.remove('open');
document.getElementById('edit-bg').onclick = e => { if(e.target === document.getElementById('edit-bg')) document.getElementById('edit-bg').classList.remove('open'); };

// ── WORKOUT LOGGER ──
function parseDefaultSets(setsStr){
  const match = setsStr.match(/^(\d+)[×x](\d+)/);
  if(!match) return [{kg:'',reps:'',done:false}];
  return Array.from({length:parseInt(match[1])}, () => ({kg:'', reps:match[2], done:false}));
}

async function initWorkoutLogger(sessionKey, exercises){
  // Resolve any library-based exercises to {n, s} format
  exercises = exercises.map(e => {
    if(e.id){
      const lib = EXERCISE_LIBRARY[e.id];
      return { n: lib ? lib.name : e.id, s: e.s, id: e.id };
    }
    return e;
  });
  wlActive = false;
  let prev = {};
  try {
    const rows = await loadWorkoutLogs();
    rows.forEach(row => { if(!prev[row.exercise_name]) prev[row.exercise_name] = row; });
  } catch(e){}

  wlState[sessionKey] = {};
  exercises.forEach(ex => {
    const sets = parseDefaultSets(ex.s);
    const prevData = prev[ex.n] || null;
    if(prevData && Array.isArray(prevData.sets)){
      sets.forEach((set,i) => { if(prevData.sets[i]) set.kg = prevData.sets[i].kg||''; });
    }
    wlState[sessionKey][ex.n] = {sets, prev:prevData, exDef:ex};
  });
}

function buildLoggerHTML(sessionKey){
  const state = wlState[sessionKey]; if(!state) return '';
  let html = `<div class="wl-header">
    <span class="wl-header-left" style="color:var(--gym)">Workout logger</span>
    <button class="wl-start-btn${wlActive?' active':''}" id="wl-start-btn">${wlActive?'● In progress':'Start workout'}</button>
  </div>`;

  Object.entries(state).forEach(([exName, exState]) => {
    const {sets, prev, exDef} = exState;
    const prevStr = prev
      ? `Last: ${prev.logged_date} · ${prev.sets.map(s=>`${s.kg||'—'}kg×${s.reps||'—'}`).join(', ')}`
      : 'No previous data';

    html += `<div class="wl-exercise" id="wlex-${CSS.escape(exName)}">
      <div class="wl-ex-header">
        <div>
          <div class="wl-ex-name">${exName}</div>
          <div class="wl-ex-target">${exDef.s}</div>
        </div>
        ${EX_INFO[exName] ? `<button class="wl-info-btn" data-ex="${exName}" data-target="${exDef.s}">i</button>` : ''}
      </div>
      <div class="wl-ex-prev"><div class="wl-ex-prev-dot"></div>${prevStr}</div>`;

    html += `<div class="wl-set-row" style="padding-bottom:0">
      <div class="wl-set-num" style="font-size:.56rem;color:var(--muted)">SET</div>
      <div class="wl-set-prev" style="font-size:.56rem;color:var(--muted)">PREV</div>
      <div style="font-family:'DM Mono',monospace;font-size:.56rem;color:var(--muted);text-align:center">KG</div>
      <div style="font-family:'DM Mono',monospace;font-size:.56rem;color:var(--muted);text-align:center">REPS</div>
      <div></div>
    </div>`;

    sets.forEach((set, si) => {
      const prevSet = prev?.sets?.[si];
      const prevLabel = prevSet ? `${prevSet.kg||'—'}×${prevSet.reps||'—'}` : '—';
      html += `<div class="wl-set-row" id="wlrow-${CSS.escape(exName)}-${si}">
        <div class="wl-set-num">${si+1}</div>
        <div class="wl-set-prev">${prevLabel}</div>
        <input class="wl-set-input${set.done?' done-input':''}" type="number" inputmode="decimal" placeholder="kg" value="${set.kg||''}" data-ex="${exName}" data-si="${si}" data-field="kg" ${!wlActive?'disabled':''}>
        <input class="wl-set-input${set.done?' done-input':''}" type="number" inputmode="numeric" placeholder="reps" value="${set.reps||''}" data-ex="${exName}" data-si="${si}" data-field="reps" ${!wlActive?'disabled':''}>
        <button class="wl-set-tick${set.done?' ticked':''}" data-ex="${exName}" data-si="${si}" ${!wlActive?'disabled':''}>✓</button>
      </div>`;
    });

    html += `<button class="wl-add-set" data-ex="${exName}">+ Add set</button></div>`;
  });

  const anyDone = Object.values(state).some(ex => ex.sets.some(s => s.done));
  html += `<div class="wl-save-row">
    <button class="wl-save-btn" id="wl-save-btn" ${!anyDone?'disabled':''}>Save session</button>
  </div>
  <div class="wl-exercise-actions">
    <button class="wl-ex-action-btn" id="wl-add-exercise-btn">+ Add exercise</button>
    <button class="wl-ex-action-btn" id="wl-replace-exercise-btn">⇄ Swap exercise</button>
  </div>`;
  return html;
}
function removeTimerUI(){
  const existing = document.getElementById('wl-rest-timer');
  if(existing) existing.remove();
}

function startRestTimerInLogger(exName, sessionKey){
  removeTimerUI();
  const body = document.getElementById('drawer-body');
  if(!body) return;

  const duration = getRestDuration(exName);
  const R = 16, C = 2 * Math.PI * R;

  // Insert timer UI at top of drawer body
  const timerEl = document.createElement('div');
  timerEl.id = 'wl-rest-timer';
  timerEl.className = 'wl-timer wl-timer-sticky';
  timerEl.innerHTML = `
    <svg class="wl-timer-ring" width="40" height="40" viewBox="0 0 40 40">
      <circle class="wl-timer-ring-bg" cx="20" cy="20" r="${R}"/>
      <circle class="wl-timer-ring-fill" id="timer-ring-fill" cx="20" cy="20" r="${R}"
        stroke-dasharray="${C}" stroke-dashoffset="0"/>
    </svg>
    <div class="wl-timer-right">
      <div class="wl-timer-label">Rest — ${exName.split(' ')[0]}</div>
      <div class="wl-timer-count" id="timer-count">${duration}s</div>
    </div>
    <button class="wl-timer-dismiss" id="timer-dismiss">Skip</button>`;

  // Insert after the wl-header
  const header = body.querySelector('.wl-header');
  if(header) header.after(timerEl);
  else body.prepend(timerEl);

  document.getElementById('timer-dismiss').onclick = () => {
    stopRestTimer();
    removeTimerUI();
  };

  startRestTimer(exName,
    (remaining, total) => {
      const countEl = document.getElementById('timer-count');
      const fillEl = document.getElementById('timer-ring-fill');
      if(!countEl) return;
      const mins = Math.floor(remaining/60);
      const secs = remaining % 60;
      countEl.textContent = mins > 0 ? `${mins}:${secs.toString().padStart(2,'0')}` : `${remaining}s`;
      countEl.className = 'wl-timer-count' + (remaining <= 10 ? ' urgent' : '');
      if(fillEl){
        const offset = C - (remaining/total) * C;
        fillEl.style.strokeDashoffset = offset;
      }
    },
    () => {
      const countEl = document.getElementById('timer-count');
      if(countEl){ countEl.textContent = 'Go!'; countEl.className = 'wl-timer-count done'; }
      setTimeout(() => removeTimerUI(), 3000);
    }
  );
}


function attachLoggerEvents(sessionKey){
  const body = document.getElementById('drawer-body'); if(!body) return;
  const startBtn = document.getElementById('wl-start-btn');
  if(startBtn) startBtn.onclick = () => {
    wlActive = !wlActive;
    body.innerHTML = buildLoggerHTML(sessionKey);
    attachLoggerEvents(sessionKey);
    if(wlActive) showToast('Workout started');
  };

  body.querySelectorAll('.wl-set-input').forEach(inp => {
    inp.onfocus = () => inp.select();
    inp.onchange = () => {
      const {ex, si, field} = inp.dataset;
      if(wlState[sessionKey]?.[ex]?.sets[+si]) wlState[sessionKey][ex].sets[+si][field] = inp.value;
    };
  });

  body.querySelectorAll('.wl-set-tick').forEach(btn => {
    btn.onclick = () => {
      if(!wlActive) return;
      const {ex, si} = btn.dataset;
      const sets = wlState[sessionKey]?.[ex]?.sets; if(!sets) return;
      const row = document.getElementById('wlrow-' + CSS.escape(ex) + '-' + si);
      if(row){
        const inputs = row.querySelectorAll('.wl-set-input');
        sets[+si].kg = inputs[0]?.value||'';
        sets[+si].reps = inputs[1]?.value||'';
      }
      const wasDone = sets[+si].done;
      sets[+si].done = !sets[+si].done;
      body.innerHTML = buildLoggerHTML(sessionKey);
      body.classList.add('open');
      attachLoggerEvents(sessionKey);
      if(!wasDone && sets[+si].done){
        requestNotificationPermission();
        startRestTimerInLogger(ex, sessionKey);
      } else {
        stopRestTimer();
        removeTimerUI();
      }
    };
  });

  body.querySelectorAll('.wl-add-set').forEach(btn => {
    btn.onclick = () => {
      const {ex} = btn.dataset;
      const sets = wlState[sessionKey]?.[ex]?.sets; if(!sets) return;
      const last = sets[sets.length-1];
      sets.push({kg:last?.kg||'', reps:last?.reps||'', done:false});
      body.innerHTML = buildLoggerHTML(sessionKey);
      body.classList.add('open');
      attachLoggerEvents(sessionKey);
    };
  });

  body.querySelectorAll('.wl-info-btn').forEach(btn => {
    btn.onclick = e => { e.stopPropagation(); openInfoSheet(btn.dataset.ex, btn.dataset.target); };
  });

  const addExBtn = document.getElementById('wl-add-exercise-btn');
  if(addExBtn) addExBtn.onclick = () => openAddExerciseToLogger(sessionKey);

  const swapExBtn = document.getElementById('wl-replace-exercise-btn');
  if(swapExBtn) swapExBtn.onclick = () => openSwapExerciseInLogger(sessionKey);

  const saveBtn = document.getElementById('wl-save-btn');
  if(saveBtn) saveBtn.onclick = async () => {
    const state = wlState[sessionKey]; if(!state) return;
    saveBtn.disabled = true; saveBtn.textContent = 'Saving...';
    const results = Object.entries(state).map(([name,ex]) => ({
      name,
      sets: ex.sets.filter(s => s.done||s.kg||s.reps).map(s => ({kg:s.kg, reps:s.reps, done:s.done}))
    })).filter(r => r.sets.length);
    const ok = await saveWorkoutLog(sessionKey, results);
    if(ok){
      showToast('Session saved — ' + results.length + ' exercise' + (results.length !== 1 ? 's' : '') + ' logged');
      if(sheetCtx){ const {key,w,d}=sheetCtx; doneSet.add(w+'-'+d+'-'+key); saveAll(); renderCurrentScreen(); }
      wlActive = false;
      wlState[sessionKey] = undefined;
      closeSheetNow();
    } else {
      showToast('Save failed — check connection');
      saveBtn.disabled = false; saveBtn.textContent = 'Save session';
    }
  };
}

function openAddExerciseToLogger(sessionKey){
  const modal = document.getElementById('edit-bg');
  const modalInner = document.querySelector('.edit-modal');
  modalInner.querySelectorAll('.swap-tabs,.swap-grid,.ef,.block-ed,.add-block-btn,.edit-btns,.create-session-form,.ex-pick-grid').forEach(el => el.remove());
  document.getElementById('edit-title').textContent = 'Add exercise';
  const grid = document.createElement('div');
  grid.className = 'ex-pick-grid';
  grid.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-bottom:1rem';
  const allExercises = [...GYM_A, ...GYM_B];
  allExercises.forEach(ex => {
    const lib = EXERCISE_LIBRARY[ex.id];
    const name = lib ? lib.name : (ex.n || ex.id || '');
    const sets = ex.s || '';
    const alreadyAdded = wlState[sessionKey]?.[name];
    const row = document.createElement('div');
    const borderColor = alreadyAdded ? 'var(--accent)' : 'var(--border)';
    row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--card);border:1px solid ' + borderColor + ';border-radius:10px;cursor:pointer';
    row.innerHTML = '<div style="flex:1"><div style="font-size:.82rem;font-weight:700">' + name + '</div><div style="font-family:DM Mono,monospace;font-size:.62rem;color:var(--muted)">' + sets + '</div></div><div style="font-family:DM Mono,monospace;font-size:.65rem;color:' + (alreadyAdded ? 'var(--accent)' : 'var(--soft)') + '">' + (alreadyAdded ? 'Added' : '+ Add') + '</div>';
    if(alreadyAdded === undefined || alreadyAdded === null || alreadyAdded === false){
      row.onclick = () => {
        const parsedSets = parseDefaultSets(sets);
        wlState[sessionKey][name] = {sets: parsedSets, prev:null, exDef:{n:name, s:sets}};
        document.getElementById('edit-bg').classList.remove('open');
        const body = document.getElementById('drawer-body');
        if(body){ body.innerHTML = buildLoggerHTML(sessionKey); body.classList.add('open'); attachLoggerEvents(sessionKey); }
        showToast(name + ' added');
      };
    }
    grid.appendChild(row);
  });
  modalInner.appendChild(grid);
  modal.classList.add('open');
}

function openSwapExerciseInLogger(sessionKey){
  const modal = document.getElementById('edit-bg');
  const modalInner = document.querySelector('.edit-modal');
  modalInner.querySelectorAll('.swap-tabs,.swap-grid,.ef,.block-ed,.add-block-btn,.edit-btns,.create-session-form,.ex-pick-grid').forEach(el => el.remove());
  document.getElementById('edit-title').textContent = 'Manage exercises';
  const current = Object.keys(wlState[sessionKey] || {});
  const grid = document.createElement('div');
  grid.className = 'ex-pick-grid';
  grid.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-bottom:1rem';
  const currentLabel = document.createElement('div');
  currentLabel.style.cssText = 'font-family:DM Mono,monospace;font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px';
  currentLabel.textContent = 'Current — tap to remove';
  grid.appendChild(currentLabel);
  current.forEach(exName => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(245,90,122,.06);border:1px solid rgba(245,90,122,.2);border-radius:10px;cursor:pointer';
    row.innerHTML = '<div style="flex:1"><div style="font-size:.82rem;font-weight:700">' + exName + '</div></div><div style="font-family:DM Mono,monospace;font-size:.65rem;color:var(--a4)">Remove</div>';
    row.onclick = () => {
      delete wlState[sessionKey][exName];
      document.getElementById('edit-bg').classList.remove('open');
      const body = document.getElementById('drawer-body');
      if(body){ body.innerHTML = buildLoggerHTML(sessionKey); body.classList.add('open'); attachLoggerEvents(sessionKey); }
      showToast(exName + ' removed');
    };
    grid.appendChild(row);
  });
  const available = [...GYM_A, ...GYM_B].filter(ex => {
    const lib = EXERCISE_LIBRARY[ex.id];
    const name = lib ? lib.name : (ex.n || ex.id || '');
    return current.indexOf(name) === -1;
  });
  if(available.length){
    const addLabel = document.createElement('div');
    addLabel.style.cssText = 'font-family:DM Mono,monospace;font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin:8px 0 4px';
    addLabel.textContent = 'Available to add';
    grid.appendChild(addLabel);
    available.forEach(ex => {
      const lib = EXERCISE_LIBRARY[ex.id];
      const name = lib ? lib.name : (ex.n || ex.id || '');
      const sets = ex.s || '';
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--card);border:1px solid var(--border);border-radius:10px;cursor:pointer';
      row.innerHTML = '<div style="flex:1"><div style="font-size:.82rem;font-weight:700">' + name + '</div><div style="font-family:DM Mono,monospace;font-size:.62rem;color:var(--muted)">' + sets + '</div></div><div style="font-family:DM Mono,monospace;font-size:.65rem;color:var(--soft)">+ Add</div>';
      row.onclick = () => {
        const parsedSets = parseDefaultSets(sets);
        wlState[sessionKey][name] = {sets: parsedSets, prev:null, exDef:{n:name, s:sets}};
        document.getElementById('edit-bg').classList.remove('open');
        const body = document.getElementById('drawer-body');
        if(body){ body.innerHTML = buildLoggerHTML(sessionKey); body.classList.add('open'); attachLoggerEvents(sessionKey); }
        showToast(name + ' added');
      };
      grid.appendChild(row);
    });
  }
  modalInner.appendChild(grid);
  modal.classList.add('open');
}

// Patch toggleDrawer to attach events after build
const _origToggleDrawer = toggleDrawer;


// ── INFO SHEET BY LIBRARY ID ──
function openInfoSheetById(exId, target){
  const lib = EXERCISE_LIBRARY[exId];
  if(!lib){ openInfoSheet(exId, target); return; }
  document.getElementById('is-name').textContent = lib.name;
  document.getElementById('is-target').textContent = target || '';
  document.getElementById('is-how').innerHTML = lib.how;
  document.getElementById('is-cue').textContent = lib.cue;
  document.getElementById('is-trains').innerHTML = lib.trains;
  document.getElementById('is-injury').innerHTML = lib.injury.map(i => `
    <div class="is-injury-item">
      <div class="is-injury-dot"></div>
      <div class="is-injury-text">${i}</div>
    </div>`).join('');
  document.getElementById('info-sheet-bg').classList.add('open');
}

// ── CREATE GYM SESSION ──
function openCreateGymSession(){
  const bg = document.getElementById('edit-bg');
  const modal = document.querySelector('.edit-modal');
  modal.querySelectorAll('.swap-tabs,.swap-grid,.ef,.block-ed,.add-block-btn,.edit-btns,.create-session-form,.gym-create-form').forEach(el => el.remove());
  document.getElementById('edit-title').textContent = 'New gym session';

  const libEntries = Object.entries(EXERCISE_LIBRARY);
  let selected = [];
  let searchVal = '';

  const form = document.createElement('div');
  form.className = 'gym-create-form';
  modal.appendChild(form);

  function rebuild(){
    const lower = searchVal.toLowerCase();
    const nameVal = form._name || '';
    const iconVal = form._icon || '';
    form.innerHTML = `
      <div class="ef">
        <label>Session name</label>
        <input id="gc-name" type="text" placeholder="e.g. Upper body" value="${nameVal}">
      </div>
      <div class="ef">
        <label>Icon (emoji)</label>
        <input id="gc-icon" type="text" maxlength="2" placeholder="💪" value="${iconVal}">
      </div>
      <div class="ef">
        <label>Pick exercises (${selected.length} selected)</label>
        <input id="gc-search" type="text" placeholder="Search..." style="margin-bottom:.5rem" value="${searchVal}">
        <div class="gc-ex-list">
          ${libEntries
            .filter(([id,ex]) => !lower || ex.name.toLowerCase().includes(lower))
            .map(([id,ex]) => `
              <div class="gc-ex-item${selected.includes(id)?' selected':''}" data-id="${id}">
                <div class="gc-ex-item-name">${ex.name}</div>
                <div class="gc-ex-item-sets">${ex.defaultSets}</div>
              </div>`).join('')}
        </div>
      </div>
      ${selected.length ? `
        <div class="ef">
          <label>Selected</label>
          <div class="gc-selected">
            ${selected.map(id => `
              <div class="gc-sel-item" data-id="${id}">
                <span>${EXERCISE_LIBRARY[id]?.name||id}</span>
                <button class="gc-sel-remove" data-id="${id}">✕</button>
              </div>`).join('')}
          </div>
        </div>` : ''}
    `;

    form.querySelector('#gc-name').oninput = e => { form._name = e.target.value; };
    form.querySelector('#gc-icon').oninput = e => { form._icon = e.target.value; };
    form.querySelector('#gc-search').oninput = e => { searchVal = e.target.value; rebuild(); };
    form.querySelectorAll('.gc-ex-item').forEach(item => {
      item.onclick = () => {
        const id = item.dataset.id;
        if(selected.includes(id)) selected = selected.filter(s => s !== id);
        else selected.push(id);
        rebuild();
      };
    });
    form.querySelectorAll('.gc-sel-remove').forEach(btn => {
      btn.onclick = e => {
        e.stopPropagation();
        selected = selected.filter(s => s !== btn.dataset.id);
        rebuild();
      };
    });
  }

  rebuild();

  const btns = document.createElement('div');
  btns.className = 'edit-btns';
  btns.innerHTML = `<button class="eb save" id="gc-save">Create session</button>`;
  modal.appendChild(btns);

  document.getElementById('gc-save').onclick = () => {
    const name = (form.querySelector('#gc-name')?.value||'').trim();
    if(!name){ showToast('Add a session name'); return; }
    if(!selected.length){ showToast('Pick at least one exercise'); return; }
    const icon = (form.querySelector('#gc-icon')?.value||'').trim() || '💪';
    const key = 'custom_' + Date.now();
    const blocks = selected.map(id => {
      const ex = EXERCISE_LIBRARY[id];
      return { c:'gb', t:ex?.name||id, tm:ex?.defaultSets||'', d:ex?.trains.replace(/<[^>]+>/g,'')||'' };
    });
    customDefs[key] = { type:'s-gym', pill:name.slice(0,10), name, short:name.slice(0,10), icon, blocks, gymExercises:selected };
    saveAll();
    bg.classList.remove('open');
    renderGym();
    showToast(`"${name}" created`);
  };

  bg.classList.add('open');
}

// ── INIT ──
(async () => {
  await loadAll();
  const wd = getWeekDay();
  if(wd) schedWeek = wd.w;
  renderToday();
  renderGym();
  updateNav();
})();