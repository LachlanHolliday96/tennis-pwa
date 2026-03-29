export const DEFS = {
  morningcardio: {
    type: 's-cardio', pill: 'Cardio AM', name: 'Morning cardio', short: 'Cardio AM', icon: '🏃',
    blocks: [
      { c: 'cb', t: 'Easy aerobic run or bike', tm: '20–30 min', d: 'Zone 2 only — you should be able to hold a conversation. Gold Coast: Surfers foreshore or Southport to Main Beach. 3–5 km easy pace.' },
      { c: 'cb', t: 'Why this, not more hills', tm: '', d: 'Hill sprints hit the alactic system. This is deliberate aerobic base — helps you recover between rallies in long matches.' },
    ],
  },
  afternoonlegs: {
    type: 's-gym', pill: 'Legs PM', name: 'Legs (PM)', short: 'Legs PM', icon: '🏋️',
    blocks: [
      { c: 'gb', t: 'Session A — Full leg day', tm: '55 min', d: 'Bulgarian split squat, lateral bound, single-leg RDL, Cossack squat, band lateral walk, box jumps.' },
      { c: 'gb', t: 'Why PM not AM', tm: '', d: 'Neuromuscular strength work performs better when core temperature is elevated.' },
    ],
  },
  liam: {
    type: 's-tennis', pill: 'Tennis', name: 'Hitting Partner Session', short: 'Partner', icon: '🎾',
    blocks: [
      { c: 'tb', t: 'Warm-up + shadow swings', tm: '10 min', d: 'Dynamic activation. Closed-stance shadow: split step → pivot on heel → ONE step in. Not three shuffles.' },
      { c: 'tb', t: 'Bounce-hit drill', tm: '20 min', d: 'Rally at 50% pace. Say "bounce" and "hit" aloud every shot. Moment you stop, pace crept — slow back down.' },
      { c: 'tb', t: 'Cross-court forehand sets', tm: '25 min', d: 'Slow cooperative cross-court only. Focus: arrive at ball with pivot-and-one-step. Count your longest clean rally.' },
      { c: 'tb', t: 'Serve: toss isolation + placement', tm: '15 min', d: '10 toss-only reps. Then 20 serves to cone at T. Placement only, no pace. Film 5 from side-on.' },
    ],
  },
  kdv: {
    type: 's-tennis', pill: 'Drills', name: 'KDV drills', short: 'KDV', icon: '🎾',
    blocks: [
      { c: 'tb', t: 'Pre-session focus', tm: '', d: 'Pick ONE thing: either pivot-and-step footwork OR bounce-hit timing. Not both.' },
      { c: 'tb', t: 'During drills', tm: '', d: 'Notice when technique breaks down — under pace, under pressure, or when tired?' },
      { c: 'tb', t: 'Post-session note', tm: '5 min', d: 'One sentence: "Footwork held / broke down when ___."' },
    ],
  },
  singles: {
    type: 's-tennis', pill: 'Match', name: 'Singles', short: 'Singles', icon: '🎾',
    blocks: [
      { c: 'tb', t: 'Serve warm-up', tm: '10 min', d: 'Toss isolation first — 10 tosses, catch at peak. 10 first serves, 10 second serves.' },
      { c: 'tb', t: 'Match play', tm: '60 min', d: "Apply week's footwork focus under match pressure." },
      { c: 'tb', t: 'Court sprint block', tm: '15 min', d: 'Post-match: 10× baseline-to-net-and-back, 20s rest. Build to 15 reps by week 6.' },
    ],
  },
  legday: {
    type: 's-gym', pill: 'Gym A', name: 'Leg day', short: 'Legs', icon: '🏋️',
    blocks: [
      { c: 'gb', t: 'Session A — full details in Gym tab', tm: '55 min', d: 'Bulgarian split squat, lateral bound, single-leg RDL, Cossack squat, band lateral walk, box jumps.' },
    ],
  },
  pronation: {
    type: 's-gym', pill: 'Gym B', name: 'Pronation gym', short: 'Gym B', icon: '💪',
    blocks: [
      { c: 'gb', t: 'Session B — full details in Gym tab', tm: '50 min', d: 'Forearm pronation curl, motorcycle revs, band rotation, med ball slam, face pulls, cable row, wrist roller.' },
    ],
  },
  injuryprev: {
    type: 's-gym', pill: 'Gym C', name: 'Injury prevention', short: 'Gym C', icon: '🛡️',
    blocks: [
      { c: 'gb', t: 'Session C — Injury prevention', tm: '45 min', d: 'Romanian deadlift, Bulgarian split squat, crab walks, hip abduction (cable + sitting), single leg calf raise, Pallof press, shoulder internal rotation.' },
    ],
  },
  hill: {
    type: 's-hill', pill: 'Hills', name: 'Hill sprints', short: 'Hills', icon: '⛰️',
    blocks: [
      { c: 'hb', t: 'Protocol — increases by week', tm: '6–12 reps', d: '8–15% grade. Sprint hard for 30–45s. Walk back down — full recovery. Alactic, NOT cardio.' },
      { c: 'hb', t: 'Post-hill mobility', tm: '5 min', d: 'Hip flexor stretch, calf, thoracic rotation.' },
    ],
  },
  hotel15: {
    type: 's-hotel', pill: 'Hotel 15m', name: 'Hotel 15min', short: 'H-15', icon: '🏨',
    blocks: [
      { c: 'xb', t: 'Movement primer', tm: '15 min', d: 'Split step hops, lateral bounds, Cossack squats, shadow forehand, serve toss × 30, forearm pronation × 20 each arm.' },
    ],
  },
  hotel30: {
    type: 's-hotel', pill: 'Hotel 30m', name: 'Hotel 30min', short: 'H-30', icon: '🏨',
    blocks: [
      { c: 'xb', t: 'Bodyweight session', tm: '30 min', d: 'Bulgarian SS on bed, lateral bounds, rotational swings, single-leg RDL, shadow serve × 20, bounce-hit visualisation.' },
    ],
  },
  travel: {
    type: 's-travel', pill: 'Away', name: 'Away', short: 'Away', icon: '✈️',
    blocks: [
      { c: 'xb', t: 'Travel day', tm: '', d: 'If arriving at a reasonable hour, do the 15-min hotel session before bed.' },
    ],
  },
  rest: {
    type: 's-rest', pill: 'Rest', name: 'Rest day', short: 'Rest', icon: '😴',
    blocks: [
      { c: '', t: 'Rest or light walk', tm: '', d: 'Motor patterns consolidate during rest. 10 min gentle walk if restless.' },
    ],
  },
};