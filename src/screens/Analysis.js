import { SB_URL, SB_KEY, SB_USER } from '../lib/supabase.js';
import { feelLog, sched } from '../lib/storage.js';
import { splitSlots, getDate, fmtD } from '../data/schedule.js';

export async function fetchGarminData(){
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/garmin_data?user_id=eq.${SB_USER}&order=date.asc&limit=500`,
      { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }}
    );
    if(!res.ok) return [];
    return await res.json();
  } catch(e){ return []; }
}

function rollingAvg(data, key, window=7){
  return data.map((_, i) => {
    const slice = data.slice(Math.max(0, i-window+1), i+1).map(d => d[key]).filter(v => v !== null && v !== undefined);
    if(!slice.length) return null;
    return Math.round(slice.reduce((a,b) => a+b, 0) / slice.length * 10) / 10;
  });
}

let chartJsLoaded = false;
async function loadChartJs(){
  if(chartJsLoaded || window.Chart){ chartJsLoaded = true; return; }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.onload = () => { chartJsLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

const activeCharts = [];
function destroyCharts(){
  activeCharts.forEach(c => c.destroy());
  activeCharts.length = 0;
}

function makeChart(id, config){
  const canvas = document.getElementById(id);
  if(!canvas) return;
  const chart = new Chart(canvas, config);
  activeCharts.push(chart);
  return chart;
}

const FONT = "'DM Mono', monospace";
const gridColor = 'rgba(255,255,255,0.05)';
const tickColor = '#6b6b70';

function lineDefaults(labels, datasets){
  return {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: datasets.length > 1, labels: { color: tickColor, font: { family: FONT, size: 10 }, boxWidth: 12 }}},
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: FONT, size: 9 }, maxTicksLimit: 8, maxRotation: 0 }},
        y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { family: FONT, size: 9 }}}
      }
    }
  };
}

function computeFeelHrvCorrelation(garminData){
  const byDate = {};
  garminData.forEach(d => { byDate[d.date] = d; });
  const feelGroups = { Easy: [], Solid: [], Hard: [], Skipped: [] };
  Object.entries(feelLog).forEach(([dk, fl]) => {
    const parts = dk.split('-');
    const w = parseInt(parts[0]), d = parseInt(parts[1]);
    const dt = getDate(w, d);
    const ds = dt.toISOString().slice(0, 10);
    const garmin = byDate[ds];
    if(!garmin || garmin.hrv_last_night === null) return;
    if(feelGroups[fl.feel]) feelGroups[fl.feel].push(garmin.hrv_last_night);
  });
  return Object.entries(feelGroups).map(([feel, vals]) => ({
    feel,
    avg: vals.length ? Math.round(vals.reduce((a,b) => a+b,0) / vals.length) : null,
    count: vals.length
  })).filter(g => g.count > 0);
}

function computeHeatmap(){
  const cells = [];
  for(let w=0; w<6; w++){
    for(let d=0; d<7; d++){
      const slots = splitSlots(sched[w][d]).filter(Boolean);
      const load = slots.reduce((sum, key) => {
        if(key.includes('hill')) return sum + 3;
        if(key.includes('liam') || key.includes('kdv') || key.includes('singles')) return sum + 2;
        if(key.includes('legs') || key.includes('pronation') || key.includes('legday')) return sum + 2;
        if(key.includes('cardio')) return sum + 1;
        if(key.includes('hotel')) return sum + 1;
        return sum;
      }, 0);
      cells.push({ w, d, load, date: getDate(w,d) });
    }
  }
  return cells;
}

function drawCharts(validData, windowDays){
  destroyCharts();
  const recent = validData.slice(-windowDays);
  const labels = recent.map(d => {
  const [year, m, day] = d.date.split('-');
  const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(day)} ${months[parseInt(m)]} ${year}`;
});
  const hrvRolling = rollingAvg(recent, 'hrv_last_night');
  const sleepRolling = rollingAvg(recent, 'sleep_score');

  makeChart('chart-hrv', lineDefaults(labels, [
    { label: 'HRV', data: recent.map(d => d.hrv_last_night), borderColor: 'var(--accent)', backgroundColor: 'rgba(200,245,90,.08)', borderWidth: 1.5, pointRadius: 2, tension: 0.3, fill: true },
    { label: '7d avg', data: hrvRolling, borderColor: 'var(--a2)', borderWidth: 2, pointRadius: 0, tension: 0.4, borderDash: [4,3] },
  ]));
  makeChart('chart-sleep', lineDefaults(labels, [
    { label: 'Sleep score', data: recent.map(d => d.sleep_score), borderColor: 'var(--a2)', backgroundColor: 'rgba(90,245,200,.08)', borderWidth: 1.5, pointRadius: 2, tension: 0.3, fill: true },
    { label: '7d avg', data: sleepRolling, borderColor: 'var(--gym)', borderWidth: 2, pointRadius: 0, tension: 0.4, borderDash: [4,3] },
  ]));
  makeChart('chart-hr', lineDefaults(labels, [
    { label: 'Resting HR', data: recent.map(d => d.resting_hr), borderColor: 'var(--a3)', backgroundColor: 'rgba(245,200,90,.08)', borderWidth: 1.5, pointRadius: 2, tension: 0.3, fill: true },
  ]));
  makeChart('chart-stress', lineDefaults(labels, [
    { label: 'Stress', data: recent.map(d => d.avg_stress), borderColor: 'var(--a4)', backgroundColor: 'rgba(245,90,122,.08)', borderWidth: 1.5, pointRadius: 2, tension: 0.3, fill: true },
  ]));
}

export async function renderAnalysis(){
  const el = document.getElementById('screen-analysis');
  el.innerHTML = `<div class="analysis-section"><div class="analysis-loading">Loading Garmin data...</div></div>`;

  await loadChartJs();
  destroyCharts();

  const data = await fetchGarminData();
  const validData = data.filter(d => 
  d.sleep_score !== null || 
  d.hrv_last_night !== null || 
  d.resting_hr !== null ||
  d.avg_stress !== null ||
  d.steps !== null
);

  if(!validData.length){
    el.innerHTML = `<div class="analysis-section">
      <div class="analysis-card" style="text-align:center;padding:2rem">
        <div style="font-size:1.5rem;margin-bottom:.5rem">📡</div>
        <div style="font-size:.85rem;font-weight:700;margin-bottom:.35rem">No Garmin data yet</div>
        <div style="font-family:'DM Mono',monospace;font-size:.65rem;color:var(--muted)">Run the backfill script to load your history</div>
      </div>
    </div>`;
    return;
  }

  let windowDays = Math.min(parseInt(localStorage.getItem('analysis_window') || '30'), validData.length);
  if(windowDays > validData.length) windowDays = validData.length;
  const last7 = validData.slice(-7);

  function avg7(key){
    const vals = last7.map(d => d[key]).filter(v => v !== null && v !== undefined && v !== 0);
    return vals.length ? Math.round(vals.reduce((a,b) => a+b,0) / vals.length * 10) / 10 : null;
  }
  function avg7prev(key){
    const prev7 = validData.slice(-14,-7);
    const vals = prev7.map(d => d[key]).filter(v => v !== null && v !== undefined && v !== 0);
    return vals.length ? Math.round(vals.reduce((a,b) => a+b,0) / vals.length * 10) / 10 : null;
  }
  function trend(key, higherIsBetter=true){
    const curr = avg7(key), prev = avg7prev(key);
    if(curr === null || prev === null) return '';
    const diff = curr - prev;
    if(Math.abs(diff) < 2) return '<span style="font-size:.65rem;color:var(--muted);margin-left:4px">→</span>';
    const improving = higherIsBetter ? diff > 0 : diff < 0;
    const color = improving ? 'var(--accent)' : 'var(--a4)';
    return `<span style="font-size:.6rem;color:${color};margin-left:4px">${diff > 0 ? '▲' : '▼'}</span>`;
  }

  const avgSleep = avg7('sleep_hours');
  const avgHrv = avg7('hrv_last_night');
  const avgHr = avg7('resting_hr');
  const avgStress = avg7('avg_stress');

  const feelCorr = computeFeelHrvCorrelation(data);
  const maxHrv = Math.max(...feelCorr.map(f => f.avg || 0), 1);
  const scatterData = data.filter(d => d.sleep_hours && d.sleep_score).map(d => ({ x: d.sleep_hours, y: d.sleep_score }));
  const heatmap = computeHeatmap();

  function dateRangeLabel(days){
    const startIdx = Math.max(0, validData.length-days);
    const startDate = validData[startIdx]?.date || '';
    const endDate = validData[validData.length-1]?.date || '';
    const fmt = d => {
      const [,m,day] = d.split('-');
      const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${parseInt(day)} ${months[parseInt(m)]}`;
    };
    // Calculate actual calendar days between start and end
    if(startDate && endDate){
      const actualDays = Math.round((new Date(endDate) - new Date(startDate)) / 86400000);
      return `${fmt(startDate)} → ${fmt(endDate)} (${actualDays} days)`;
    }
    return '';
  }

  el.innerHTML = `<div class="analysis-section">

    <!-- Slider -->
    <div class="analysis-card" style="padding:.75rem 1rem">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">
        <div style="font-family:'DM Mono',monospace;font-size:.65rem;color:var(--soft)">Last <span id="window-label" style="color:var(--accent);font-weight:700">${windowDays} days</span></div>
        <div id="date-range-label" style="font-family:'DM Mono',monospace;font-size:.62rem;color:var(--muted)">${dateRangeLabel(windowDays)}</div>
      </div>
      <input type="range" id="window-slider" min="7" max="${validData.length}" value="${windowDays}" step="1"
      <div style="display:flex;justify-content:space-between;margin-top:3px">
        <span style="font-family:'DM Mono',monospace;font-size:.55rem;color:var(--muted)">7d</span>
        <span style="font-family:'DM Mono',monospace;font-size:.55rem;color:var(--muted)">30d</span>
        <span style="font-family:'DM Mono',monospace;font-size:.55rem;color:var(--muted)">90d</span>
      </div>
      <div style="margin-top:.6rem;padding:.5rem .75rem;background:rgba(200,245,90,.06);border:1px solid rgba(200,245,90,.15);border-radius:8px;display:flex;align-items:center;justify-content:space-between">
      <span style="font-family:'DM Mono',monospace;font-size:.62rem;color:var(--soft)">Most recent data</span>
      <span style="font-family:'DM Mono',monospace;font-size:.65rem;color:var(--accent);font-weight:700">${(() => {
        const last = validData[validData.length-1];
        if(!last) return '—';
        const [year,m,day] = last.date.split('-');
        const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const today = new Date().toISOString().slice(0,10);
        const daysAgo = Math.round((new Date(today) - new Date(last.date)) / 86400000);
        return `${parseInt(day)} ${months[parseInt(m)]} ${year}${daysAgo === 0 ? ' · today' : daysAgo === 1 ? ' · yesterday' : ` · ${daysAgo} days ago`}`;
      })()}</span>
    </div>
    </div>

    <!-- Stats -->
    <div class="stat-row">
      <div class="stat-box">
        <div class="stat-box-val" style="color:var(--a2);display:flex;align-items:center;justify-content:center">${avgSleep ? avgSleep.toFixed(1)+'h' : '—'}${trend('sleep_hours')}</div>
        <div class="stat-box-lbl">Avg sleep</div>
      </div>
      <div class="stat-box">
        <div class="stat-box-val" style="color:var(--accent);display:flex;align-items:center;justify-content:center">${avgHrv ? Math.round(avgHrv) : '—'}${trend('hrv_last_night')}</div>
        <div class="stat-box-lbl">Avg HRV</div>
      </div>
      <div class="stat-box">
        <div class="stat-box-val" style="color:var(--a3);display:flex;align-items:center;justify-content:center">${avgHr ? Math.round(avgHr) : '—'}${trend('resting_hr', false)}</div>
        <div class="stat-box-lbl">Resting HR</div>
      </div>
      <div class="stat-box">
        <div class="stat-box-val" style="color:var(--soft);display:flex;align-items:center;justify-content:center">${avgStress ? Math.round(avgStress) : '—'}${trend('avg_stress', false)}</div>
        <div class="stat-box-lbl">Avg stress</div>
      </div>
    </div>

    <!-- Charts -->
    <div class="analysis-card">
      <div class="analysis-card-title" id="title-hrv">HRV — ${windowDays} days</div>
      <div class="analysis-card-sub">Last night avg · 7-day rolling avg</div>
      <div class="chart-container"><canvas id="chart-hrv"></canvas></div>
    </div>
    <div class="analysis-card">
      <div class="analysis-card-title" id="title-sleep">Sleep score — ${windowDays} days</div>
      <div class="analysis-card-sub">Nightly score · 7-day rolling avg</div>
      <div class="chart-container"><canvas id="chart-sleep"></canvas></div>
    </div>
    <div class="analysis-card">
      <div class="analysis-card-title">Sleep duration vs score</div>
      <div class="analysis-card-sub">Does more sleep actually help your score?</div>
      <div class="chart-container scatter"><canvas id="chart-scatter"></canvas></div>
    </div>
    <div class="analysis-card">
      <div class="analysis-card-title" id="title-hr">Resting HR — ${windowDays} days</div>
      <div class="analysis-card-sub">Lower over time = better aerobic fitness</div>
      <div class="chart-container"><canvas id="chart-hr"></canvas></div>
    </div>

    ${feelCorr.length ? `<div class="analysis-card">
      <div class="analysis-card-title">Session feel vs morning HRV</div>
      <div class="analysis-card-sub">Average HRV on days you rated sessions this way</div>
      ${feelCorr.map(f => `<div class="corr-row">
        <div class="corr-feel feel-${f.feel}">${f.feel}</div>
        <div class="corr-bar-wrap"><div class="corr-bar" style="width:${Math.round((f.avg/maxHrv)*100)}%;background:${f.feel==='Easy'?'var(--a2)':f.feel==='Solid'?'var(--accent)':f.feel==='Hard'?'var(--a3)':'var(--a4)'}"></div></div>
        <div class="corr-val">HRV ${f.avg} <span style="color:var(--muted)">(${f.count})</span></div>
      </div>`).join('')}
    </div>` : ''}

    <div class="analysis-card">
      <div class="analysis-card-title" id="title-stress">Daily stress — ${windowDays} days</div>
      <div class="analysis-card-sub">Garmin stress score · lower is better</div>
      <div class="chart-container"><canvas id="chart-stress"></canvas></div>
    </div>

    <div class="analysis-card">
      <div class="analysis-card-title">6-week training load</div>
      <div class="analysis-card-sub">Each cell is one day · colour = session intensity</div>
      <div class="heatmap-grid">
        ${heatmap.map(cell => {
          const cls = cell.load >= 3 ? 'heavy' : cell.load >= 2 ? 'moderate' : cell.load >= 1 ? 'light' : 'rest';
          return `<div class="hm-cell ${cls}" title="${fmtD(cell.date)} · load ${cell.load}"></div>`;
        }).join('')}
      </div>
      <div class="hm-labels">
        <span class="hm-label">Week 1</span>
        <span class="hm-label">Week 3</span>
        <span class="hm-label">Week 6</span>
      </div>
      <div style="display:flex;gap:10px;margin-top:.75rem;flex-wrap:wrap">
        ${[['#222226','Rest'],['rgba(200,245,90,.25)','Light'],['rgba(200,245,90,.6)','Moderate'],['var(--accent)','Heavy']].map(([color,label]) =>
          `<div style="display:flex;align-items:center;gap:5px">
            <div style="width:10px;height:10px;border-radius:2px;background:${color}"></div>
            <span style="font-family:'DM Mono',monospace;font-size:.58rem;color:var(--muted)">${label}</span>
          </div>`
        ).join('')}
      </div>
    </div>

    <div style="height:1rem"></div>
  </div>`;

  // Draw initial charts
  drawCharts(validData, windowDays);

  // Scatter chart (not affected by slider)
  makeChart('chart-scatter', {
    type: 'scatter',
    data: { datasets: [{ label: 'Night', data: scatterData, backgroundColor: 'rgba(200,245,90,.5)', pointRadius: 5, pointHoverRadius: 7 }]},
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.parsed.x}h sleep → score ${ctx.parsed.y}` }}},
      scales: {
        x: { title: { display: true, text: 'Sleep hours', color: tickColor, font: { family: FONT, size: 9 }}, grid: { color: gridColor }, ticks: { color: tickColor, font: { family: FONT, size: 9 }}},
        y: { title: { display: true, text: 'Sleep score', color: tickColor, font: { family: FONT, size: 9 }}, grid: { color: gridColor }, ticks: { color: tickColor, font: { family: FONT, size: 9 }}}
      }
    }
  });

  // Slider
  document.getElementById('window-slider').oninput = function(){
    windowDays = parseInt(this.value);
    localStorage.setItem('analysis_window', windowDays.toString());
    document.getElementById('window-label').textContent = windowDays + ' days';
    document.getElementById('date-range-label').textContent = dateRangeLabel(windowDays);
    document.getElementById('title-hrv').textContent = `HRV — ${windowDays} days`;
    document.getElementById('title-sleep').textContent = `Sleep score — ${windowDays} days`;
    document.getElementById('title-hr').textContent = `Resting HR — ${windowDays} days`;
    document.getElementById('title-stress').textContent = `Daily stress — ${windowDays} days`;
    drawCharts(validData, windowDays);
  };
}