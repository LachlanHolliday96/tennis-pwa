export const EXERCISE_LIBRARY = {
  bulgarian_split_squat: {
    name: 'Bulgarian split squat',
    defaultSets: '4×8 each · 3-1-1 tempo',
    cue: 'Back foot on bench, front foot far enough forward that knee stays over toes. Drive through front heel.',
    how: 'Place rear foot on a bench behind you. Lower until front thigh is parallel to floor. Keep torso upright.',
    trains: '<strong>Quads, glutes, hip flexor stability.</strong> Tennis is single-leg dominant — every explosive first step comes from this pattern.',
    injury: [
      'Keep front knee tracking over second toe — no valgus collapse',
      'Do not let rear knee slam the floor',
      'If hip flexor of rear leg cramps, elevate bench lower or stretch hip flexors pre-session',
    ],
  },
  lateral_bound: {
    name: 'Lateral bound + stick',
    defaultSets: '3×6 each · hold 2s',
    cue: 'Push hard off one leg, land softly on the other, stick it — no wobble, no second hop.',
    how: 'Stand on one leg. Explode laterally, land on opposite leg, absorb and hold for 2 seconds. Reset fully before next rep.',
    trains: '<strong>Explosive lateral push and single-leg landing stability.</strong> The cross-court recovery step in isolation.',
    injury: [
      'Land with soft knee — never lock out on landing',
      'If ankle rolls, reduce distance and focus on landing mechanics first',
    ],
  },
  single_leg_rdl: {
    name: 'Romanian deadlift (single-leg)',
    defaultSets: '3×10 each leg',
    cue: 'Hinge at the hip, not the spine. Keep the raised leg and torso moving as one long lever.',
    how: 'Stand on one leg, soft knee. Hinge forward pushing free leg back until torso is parallel. Drive hip forward to stand.',
    trains: '<strong>Hamstring loading and hip stability.</strong> Prevents hip collapse on low balls and wide forehands.',
    injury: [
      'Keep spine neutral — do not round the lower back',
      'If balance fails, use a light fingertip touch on a wall, not a grip',
    ],
  },
  romanian_deadlift: {
    name: 'Romanian deadlift',
    defaultSets: '3×10 · 1kg barbell',
    cue: 'Push hips back, not down. Bar stays in contact with legs the whole way.',
    how: 'Hinge at hips with soft knees, lowering bar along shins. Feel hamstring stretch, then drive hips forward to stand.',
    trains: '<strong>Bilateral hamstring and glute loading.</strong> Builds the posterior chain needed for explosive hip extension.',
    injury: [
      'Do not round the lower back — brace before every rep',
      'Bar should stay close to legs throughout — prevents lower back loading',
    ],
  },
  cossack_squat: {
    name: 'Cossack squat',
    defaultSets: '3×8 each side',
    cue: 'Sit into the bent leg, keep heel down. Extended leg stays straight with toes pointing up.',
    how: 'Feet wide, toes slightly out. Shift weight to one side and squat deep, keeping other leg straight. Return to centre.',
    trains: '<strong>Lateral hip mobility and adductor strength.</strong> Opens the range needed for a wide forehand stance.',
    injury: [
      'Do not force depth — go only as low as heel stays on floor',
      'If knee pain, check toes are turned out enough to match knee tracking',
    ],
  },
  band_lateral_walk: {
    name: 'Band lateral walk',
    defaultSets: '3×20 each way',
    cue: 'Stay in a half-squat the whole time. Steps are small and controlled — this is not a race.',
    how: 'Band around ankles or above knees. Half-squat position. Step laterally maintaining constant tension on the band.',
    trains: '<strong>Glute medius activation.</strong> Stabilises your stance leg during groundstrokes and prevents knee valgus.',
    injury: [
      'Do not let knees cave inward — if they do, raise the band higher (above knee)',
      'Keep hips level — avoid hiking one hip up with each step',
    ],
  },
  box_jump: {
    name: 'Box jump (reactive)',
    defaultSets: '4×5 · full reset',
    cue: 'Land as quietly as possible — that is the cue for absorbing force correctly.',
    how: 'Stand in front of box. Dip, swing arms, jump explosively. Land softly with both feet, step down — do not jump down.',
    trains: '<strong>Alactic power output.</strong> Trains the same energy system as the split step — short, maximal explosive effort.',
    injury: [
      'Always step down, never jump down — Achilles and patellar tendon risk',
      'Full reset between reps — this is power training, not cardio',
      'If fatigued, stop — form breakdown on box jumps causes injury',
    ],
  },
  crab_walk: {
    name: 'Crab walks',
    defaultSets: '3×10 · yellow band',
    cue: 'Stay low throughout. The moment you stand up, the glutes switch off.',
    how: 'Band around feet. Quarter-squat position. Step laterally keeping toes forward and constant band tension.',
    trains: '<strong>Glute medius and hip abductor endurance.</strong> Injury prevention for the knee and hip under lateral load.',
    injury: [
      'Keep toes pointing forward — turning out reduces glute activation',
      'Do not let knees track inward',
    ],
  },
  hip_abduction_cable: {
    name: 'Hip abduction (cable)',
    defaultSets: '3×10 each · 1kg cable',
    cue: 'Lift from the hip, not the waist. No leaning — keep torso upright.',
    how: 'Stand side-on to cable machine, ankle cuff on outer leg. Keeping leg straight, lift out to the side. Slow return.',
    trains: '<strong>Glute medius and TFL.</strong> Direct hip abductor strengthening for lateral stability on court.',
    injury: [
      'Do not hike the hip to get more range — that is the lower back compensating',
      'Keep the movement plane true lateral — not forward or back',
    ],
  },
  hip_abduction_sitting: {
    name: 'Hip abduction in sitting',
    defaultSets: '3×10 · yellow band',
    cue: 'Push knees out against the band, not forward. Sit tall.',
    how: 'Seated, band around knees. Feet flat on floor. Push knees apart against band resistance, hold 1s, return.',
    trains: '<strong>Glute medius in a shortened range.</strong> Targets the seated hip position relevant to low ball stances.',
    injury: [
      'Do not let the band snap knees together — control the return',
      'Sit on a firm surface — soft surface reduces activation',
    ],
  },
  single_leg_calf_raise: {
    name: 'Single leg calf raise',
    defaultSets: '3×10 each',
    cue: 'Full range — all the way up, all the way down past neutral. No half reps.',
    how: 'Stand on one leg on the edge of a step. Lower heel below step level, then rise up onto toes. Slow and controlled.',
    trains: '<strong>Soleus and gastrocnemius strength and tendon loading.</strong> Achilles injury prevention — essential for a tennis player.',
    injury: [
      'Do not skip the bottom range — that eccentric load is the injury prevention part',
      'If Achilles is sore, do on flat ground first before adding range',
    ],
  },
  pallof_press: {
    name: 'Pallof press',
    defaultSets: '3×10 each side · 1kg cable',
    cue: 'The goal is to resist rotation, not create it. Your core fights the cable pulling you sideways.',
    how: 'Stand side-on to cable, hands at chest. Press hands straight out, hold 2s, return. Keep hips square throughout.',
    trains: '<strong>Anti-rotation core stability.</strong> Trains the obliques and transverse abdominis to resist rotational forces — directly relevant to groundstroke follow-through.',
    injury: [
      'Do not let hips rotate toward the cable — that defeats the purpose',
      'Keep shoulders packed down — do not shrug under load',
    ],
  },
  shoulder_internal_rotation_cable: {
    name: 'Shoulder internal rotation (cable)',
    defaultSets: '3×10 each · 1kg cable',
    cue: 'Elbow pinned to side at 90 degrees. Only the forearm moves.',
    how: 'Stand with elbow bent 90 degrees, upper arm against side. Rotate forearm inward across body against cable resistance.',
    trains: '<strong>Subscapularis and internal rotator strength.</strong> Directly trains serve pronation mechanics and protects the rotator cuff.',
    injury: [
      'Do not let the elbow drift forward — upper arm stays pinned',
      'Light weight only — this is a small muscle group',
    ],
  },
  shoulder_internal_rotation_135: {
    name: 'Shoulder internal rotation at 135°',
    defaultSets: '3×10 each · yellow band',
    cue: 'Arm at 135 degrees — halfway between straight out and overhead. Rotate down and in.',
    how: 'Band anchored high. Arm elevated to 135 degrees. Internally rotate against band resistance, keeping elbow angle constant.',
    trains: '<strong>Rotator cuff in the serve position range.</strong> Trains internal rotation specifically at the arm position used during serve follow-through.',
    injury: [
      'Do not go heavy — shoulder is in a vulnerable position at this angle',
      'If shoulder impingement symptoms, stop and consult a physio',
    ],
  },
  forearm_pronation_curl: {
    name: 'Forearm pronation curl',
    defaultSets: '3×15 each · 3–4 kg',
    cue: 'Palm starts up, finishes down. Slow on the way back — that eccentric is the training.',
    how: 'Hold dumbbell with forearm supported on a surface, palm up. Rotate to palm-down position. Slow return.',
    trains: '<strong>Pronator teres.</strong> Directly trains the serve pronation movement.',
    injury: [
      'Do not grip too tight — finger flexors will fatigue before the target muscle',
      'If elbow pain at the lateral epicondyle, reduce weight immediately',
    ],
  },
  motorcycle_revs: {
    name: 'Motorcycle revs',
    defaultSets: '3×15 each · 2–3 kg',
    cue: 'Think doorknob turn. Fast rotation, controlled return.',
    how: 'Hold dumbbell with arm extended in front, thumb up. Rotate rapidly to thumb-down (pronation), slow return to supination.',
    trains: '<strong>Pronator teres at speed.</strong> Builds the doorknob-turn finish that Feel Tennis describes for the serve.',
    injury: [
      'Start light — speed is the stimulus, not load',
    ],
  },
  supination_pronation_band: {
    name: 'Supination-to-pronation (band)',
    defaultSets: '3×12 each · light band',
    cue: 'Full range — full supination before exploding to full pronation.',
    how: 'Band anchored in front. Hold band with elbow at 90 degrees. Supinate fully, then rapidly pronate against band resistance.',
    trains: '<strong>Eccentric supination to explosive pronation pattern.</strong> Exact movement pattern of the serve.',
    injury: [
      'Do not let elbow flare — keep upper arm stable',
    ],
  },
  med_ball_slam: {
    name: 'Med ball rotational slam',
    defaultSets: '4×6 each side · 4–6 kg',
    cue: 'Hips lead, arms follow. If your arms are leading, start over.',
    how: 'Stand side-on to wall. Load rotation away from wall, then drive hips toward wall and slam ball into it.',
    trains: '<strong>Hip-led rotational power.</strong> Same kinetic chain as the forehand — hip drives shoulder drives arm.',
    injury: [
      'Do not twist the lower back — the rotation comes from the hips',
      'Keep core braced throughout',
    ],
  },
  face_pulls: {
    name: 'Face pulls (cable)',
    defaultSets: '4×15 · light, squeeze',
    cue: 'Pull to forehead, not chin. Elbows finish high and wide — thumbs to ears.',
    how: 'Cable at face height with rope attachment. Pull toward forehead, spreading the rope, elbows high. Squeeze rear delts at end.',
    trains: '<strong>Posterior rotator cuff and rear deltoid.</strong> Non-negotiable shoulder health for a serving player.',
    injury: [
      'Never go heavy on this — it is a health exercise, not a strength exercise',
      'Elbows must stay high — dropping them turns it into a row',
    ],
  },
  cable_row: {
    name: 'Single-arm cable row',
    defaultSets: '3×10 each arm',
    cue: 'Elbow to back pocket. Think about pulling your shoulder blade toward your spine.',
    how: 'Single-arm cable at chest height. Pull elbow back and down, rotating torso slightly. Squeeze at end position.',
    trains: '<strong>Scapular retraction, lats, and mid-back.</strong> Counterbalances the internal rotation load from serving.',
    injury: [
      'Do not shrug the shoulder up during the pull',
      'Control the return — do not let cable yank the shoulder forward',
    ],
  },
  wrist_roller: {
    name: 'Wrist roller',
    defaultSets: '3× full cycle · 2–4 kg',
    cue: 'Arms parallel to floor the whole time. The moment they drop, the forearms get a rest — do not let them.',
    how: 'Hold roller with arms extended in front at shoulder height. Roll weight up by alternating wrist curls, then lower.',
    trains: '<strong>Forearm endurance.</strong> Ensures grip and pronation hold up late in a match when fatigue sets in.',
    injury: [
      'If elbow pain, reduce weight or lower arms slightly',
    ],
  },
};

// GYM_A and GYM_B now reference library keys
export const GYM_A = [
  { id: 'bulgarian_split_squat', s: '4×8 each · 3-1-1 tempo' },
  { id: 'single_leg_rdl',        s: '3×10 each leg' },
  { id: 'shoulder_internal_rotation_cable',  s: '3×10 each · 1kg cable' },
  { id: 'shoulder_internal_rotation_135',    s: '3×10 each · yellow band' },
  { id: 'wrist_roller',               s: '3× full cycle · 2–4 kg' },
];

export const GYM_B = [
  { id: 'romanian_deadlift',                 s: '3×10 · 1kg barbell' },
  { id: 'supination_pronation_band',  s: '3×12 each · light band' },
  { id: 'forearm_pronation_curl',     s: '3×15 each · 3–4 kg' },
  { id: 'crab_walk',                         s: '3×10 · yellow band' },
  { id: 'box_jump',              s: '4×5 · full reset' },
  { id: 'lateral_bound',         s: '3×6 each · hold 2s' },
];

export const GYM_C = [
  { id: 'cossack_squat',         s: '3×8 each side' },
  { id: 'band_lateral_walk',     s: '3×20 each way' },
  { id: 'face_pulls',                 s: '4×15 · light, squeeze' },
  { id: 'hip_abduction_sitting',             s: '3×10 · yellow band' },
  { id: 'pallof_press',                      s: '3×10 each side · 1kg cable' },
  { id: 'single_leg_calf_raise',             s: '3×10 each' },
];

export const GYM_D = [
  { id: 'bulgarian_split_squat',             s: '3×10 · 1kg barbell' },
  { id: 'single_leg_calf_raise',             s: '3×10 each' },
  { id: 'motorcycle_revs',            s: '3×15 each · 2–3 kg' },
  { id: 'med_ball_slam',              s: '4×6 each side · 4–6 kg' },
  { id: 'cable_row',                  s: '3×10 each arm' },
];

// Helper: resolve a gym array entry to its full display object
export function resolveEx(entry) {
  const lib = EXERCISE_LIBRARY[entry.id];
  if (!lib) return { n: entry.id, w: '', s: entry.s };
  return { n: lib.name, w: lib.trains.replace(/<[^>]+>/g, ''), s: entry.s, id: entry.id };
}
