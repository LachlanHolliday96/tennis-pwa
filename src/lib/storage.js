import { loadAppState, saveAppState } from './supabase.js';
import { DEFAULT_SCHED, inTravel, getDate } from '../data/schedule.js';

const LS = {
  SCHED: 'tp_sched',
  DONE: 'tp_done',
  FEEL: 'tp_feel',
  CUST: 'tp_cust',
  UPDATED: 'tp_updated',
};

export let sched = DEFAULT_SCHED.map(w => [...w]);
export let doneSet = new Set();
export let feelLog = {};
export let customDefs = {};

function applyTravel() {
  for (let w = 0; w < 6; w++) {
    for (let d = 0; d < 7; d++) {
      const dt = getDate(w, d);
      if (inTravel(dt)) {
        const cur = sched[w][d];
        if (cur.includes('liam') || cur.includes('kdv') || cur.includes('singles')) {
          sched[w][d] = 'hotel30';
        } else if (cur === '' || cur === 'rest') {
          sched[w][d] = 'hotel15';
        }
      }
    }
  }
}

export async function loadAll() {
  // Load localStorage first — instant
  try {
    const s = localStorage.getItem(LS.SCHED);
    if (s) {
      const p = JSON.parse(s);
      if (Array.isArray(p) && p.length === 6) {
        for (let w = 0; w < 6; w++)
          for (let d = 0; d < 7; d++)
            sched[w][d] = p[w][d];
      }
    }
    const dn = localStorage.getItem(LS.DONE);
    if (dn) doneSet = new Set(JSON.parse(dn));
    const fl = localStorage.getItem(LS.FEEL);
    if (fl) feelLog = JSON.parse(fl) || {};
    const cu = localStorage.getItem(LS.CUST);
    if (cu) customDefs = JSON.parse(cu) || {};
  } catch(e) {}

  // Then try Supabase for newer data
  try {
    const row = await loadAppState();
    if (row) {
      const localUpdated = localStorage.getItem(LS.UPDATED) || '0';
      if (row.updated_at > localUpdated) {
        const remote = row.app_state;
        if (remote.sched) {
          const p = JSON.parse(remote.sched);
          if (Array.isArray(p) && p.length === 6)
            for (let w = 0; w < 6; w++)
              for (let d = 0; d < 7; d++)
                sched[w][d] = p[w][d];
        }
        if (remote.done) doneSet = new Set(JSON.parse(remote.done));
        if (remote.feel) feelLog = JSON.parse(remote.feel) || {};
        if (remote.custom) customDefs = JSON.parse(remote.custom) || {};
        try {
          localStorage.setItem(LS.SCHED, remote.sched);
          localStorage.setItem(LS.DONE, remote.done);
          localStorage.setItem(LS.FEEL, remote.feel || '{}');
          localStorage.setItem(LS.CUST, remote.custom || '{}');
          localStorage.setItem(LS.UPDATED, row.updated_at);
        } catch(e) {}
      }
    }
  } catch(e) {}

  applyTravel();
}

export function saveAll() {
  const schedJSON = JSON.stringify(sched);
  const doneJSON = JSON.stringify([...doneSet]);
  const feelJSON = JSON.stringify(feelLog);
  const custJSON = JSON.stringify(customDefs);

  try {
    localStorage.setItem(LS.SCHED, schedJSON);
    localStorage.setItem(LS.DONE, doneJSON);
    localStorage.setItem(LS.FEEL, feelJSON);
    localStorage.setItem(LS.CUST, custJSON);
  } catch(e) {}

  const state = { sched: schedJSON, done: doneJSON, feel: feelJSON, custom: custJSON };
  saveAppState(state).catch(() => {});
}