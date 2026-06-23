/* ============================================================
   162-0: GAME ENGINE
   Handles draft state, the team/decade randomizer, eligibility
   filtering, skip mechanics, and the season simulation + grading.
   ============================================================ */

const Game = (() => {

  let state = null;

  function newGame() {
    const decadeOrder = shuffle([...DECADES]);
    state = {
      decadeOrder,
      round: 0,                 // 0-indexed, 0..10
      roster: {},               // slotKey -> { player, team, decade }
      filledSlots: new Set(),
      teamSkipsLeft: 1,
      eraSkipsLeft: 1,
      currentSpin: null,        // { decade, team, players: [...] }
      history: [],              // log of picks for results screen
      finished: false,
    };
    rollSpin();
    return state;
  }

  function getState() {
    return state;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function openSlots() {
    return ROSTER_SLOTS.filter(s => !state.filledSlots.has(s.key)).map(s => s.key);
  }

  // Players from a given team/decade who are eligible for at least one open slot.
  function eligiblePlayersFor(decade, team) {
    const pool = (TEAMS[decade] && TEAMS[decade][team]) || [];
    const open = openSlots();
    const picked = new Set(Object.values(state.roster).map(r => r.player.name + r.team + r.decade));
    return pool.filter(p => {
      const key = p.name + team + decade;
      if (picked.has(key)) return false;
      return open.some(slot => SLOT_ELIGIBILITY[slot].includes(p.pos));
    });
  }

  function teamsWithEligiblePlayers(decade) {
    const teams = Object.keys(TEAMS[decade] || {});
    return teams.filter(t => eligiblePlayersFor(decade, t).length > 0);
  }

  // Roll a spin for the current round: decade is fixed by round order,
  // team is randomized among teams in that decade with eligible players.
  function rollSpin() {
    const decade = state.decadeOrder[state.round];
    const candidateTeams = teamsWithEligiblePlayers(decade);
    if (candidateTeams.length === 0) {
      // Shouldn't happen given dataset density, but guard anyway:
      // advance decade pointer defensively (swap with next round if any).
      for (let i = state.round + 1; i < state.decadeOrder.length; i++) {
        const altTeams = teamsWithEligiblePlayers(state.decadeOrder[i]);
        if (altTeams.length > 0) {
          const tmp = state.decadeOrder[state.round];
          state.decadeOrder[state.round] = state.decadeOrder[i];
          state.decadeOrder[i] = tmp;
          break;
        }
      }
      return rollSpin();
    }
    const team = candidateTeams[Math.floor(Math.random() * candidateTeams.length)];
    const players = eligiblePlayersFor(decade, team);
    state.currentSpin = { decade, team, players };
    return state.currentSpin;
  }

  // Player chosen this round may be eligible for multiple open slots
  // (e.g. an OF for LF/CF/RF, or any batter for DH). Caller resolves
  // which slot via assignPlayer once the user picks both player + slot.
  function eligibleSlotsForPlayer(player) {
    return openSlots().filter(slot => SLOT_ELIGIBILITY[slot].includes(player.pos));
  }

  function assignPlayer(player, slotKey) {
    const { decade, team } = state.currentSpin;
    state.roster[slotKey] = { player, team, decade };
    state.filledSlots.add(slotKey);
    state.history.push({ round: state.round + 1, decade, team, player, slot: slotKey });
    state.round += 1;
    if (state.round >= ROSTER_SLOTS.length) {
      state.finished = true;
      state.currentSpin = null;
    } else {
      rollSpin();
    }
    return state;
  }

  function skipTeam() {
    if (state.teamSkipsLeft <= 0) return false;
    state.teamSkipsLeft -= 1;
    rollSpin();
    return true;
  }

  function skipEra() {
    if (state.eraSkipsLeft <= 0) return false;
    state.eraSkipsLeft -= 1;
    // Swap current round's decade with a different unused (future) decade.
    const remaining = [];
    for (let i = state.round + 1; i < state.decadeOrder.length; i++) {
      if (teamsWithEligiblePlayers(state.decadeOrder[i]).length > 0) remaining.push(i);
    }
    if (remaining.length === 0) { rollSpin(); return true; }
    const swapIdx = remaining[Math.floor(Math.random() * remaining.length)];
    const tmp = state.decadeOrder[state.round];
    state.decadeOrder[state.round] = state.decadeOrder[swapIdx];
    state.decadeOrder[swapIdx] = tmp;
    rollSpin();
    return true;
  }

  /* ----------------------------------------------------------
     SIMULATION ENGINE
     Era-adjust each roster slot's contribution against decade
     baselines, blend into a composite rating, then run it
     through a non-linear win curve with a weak-link penalty.
     ---------------------------------------------------------- */

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // Returns 0-100ish score for a batter relative to era baseline.
  function battingScore(stat, baseline) {
    const avgScore = (stat.avg / baseline.avg) * 100;
    const hrScore  = (stat.hr  / baseline.hr)  * 100;
    const opsScore = (stat.ops / baseline.ops) * 100;
    const sbScore  = clamp((stat.sb / Math.max(baseline.sb, 1)) * 100, 0, 140);
    // OPS already captures most power contribution, so it carries the
    // most weight; HR is a smaller bonus so elite contact-and-OBP hitters
    // with modest power (e.g. a high-AVG slap hitter) aren't penalized
    // below a league-average player.
    const composite = (avgScore * 0.25) + (hrScore * 0.15) + (opsScore * 0.50) + (sbScore * 0.10);
    return clamp(composite, 10, 220);
  }

  // Returns 0-100ish score for a pitcher relative to era baseline.
  // Lower ERA/WHIP is better, so those are inverted.
  function pitchingScore(stat, baseline, isCloser) {
    const eraScore  = clamp((baseline.era / stat.era) * 100, 0, 220);
    const whipScore = clamp((baseline.whip / stat.whip) * 100, 0, 220);
    const k9Score   = clamp((stat.k9 / baseline.k9) * 100, 0, 220);
    if (isCloser) {
      const svScore = clamp((stat.sv / Math.max(baseline.sv, 1)) * 100, 0, 220);
      return clamp((eraScore * 0.35) + (whipScore * 0.25) + (k9Score * 0.15) + (svScore * 0.25), 10, 220);
    }
    return clamp((eraScore * 0.40) + (whipScore * 0.30) + (k9Score * 0.30), 10, 220);
  }

  function evaluateRoster() {
    const slotScores = {};
    ROSTER_SLOTS.forEach(({ key }) => {
      const entry = state.roster[key];
      if (!entry) return;
      const baseline = ERA_BASELINES[entry.decade];
      if (entry.player.pitching) {
        slotScores[key] = pitchingScore(entry.player.pitching, baseline, key === "CL");
      } else {
        slotScores[key] = battingScore(entry.player.batting, baseline);
      }
    });
    return slotScores;
  }

  function simulateSeason() {
    const slotScores = evaluateRoster();
    const values = Object.values(slotScores);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const weakest = Math.min(...values);
    const weakestSlot = Object.keys(slotScores).find(k => slotScores[k] === weakest);
    const strongest = Math.max(...values);
    const strongestSlot = Object.keys(slotScores).find(k => slotScores[k] === strongest);

    // Composite rating 0-100, blending team average with a weak-link
    // gate: one glaring hole drags the ceiling down hard.
    const normalizedAvg = clamp(((avg - 60) / (160 - 60)) * 100, 0, 100);
    const normalizedWeak = clamp(((weakest - 40) / (140 - 40)) * 100, 0, 100);
    const rating = clamp((normalizedAvg * 0.65) + (normalizedWeak * 0.35), 0, 100);

    // Non-linear win curve via logistic function. Centered at ~58 (not 50) —
    // that's roughly where a randomly-drafted roster lands, so careless
    // picks land near .500 ball while deliberate, weak-link-aware drafting
    // is what pushes a team toward an elite, near-undefeated season.
    const k = 0.115;
    const pivot = 58;
    const logistic = 1 / (1 + Math.exp(-k * (rating - pivot)));
    let wins = Math.round(6 + logistic * 154); // floor ~6, ceiling ~160
    if (rating >= 95) wins = Math.min(162, wins + Math.round((rating - 95) * 1.4));
    wins = clamp(wins, 3, 162);
    const losses = 162 - wins;

    const grade = letterGrade(rating);

    return {
      rating: Math.round(rating),
      wins, losses,
      grade,
      slotScores,
      weakestSlot, strongestSlot,
      weakest: Math.round(weakest),
      strongest: Math.round(strongest),
    };
  }

  function letterGrade(rating) {
    if (rating >= 97) return "A+";
    if (rating >= 92) return "A";
    if (rating >= 85) return "A-";
    if (rating >= 78) return "B+";
    if (rating >= 70) return "B";
    if (rating >= 62) return "B-";
    if (rating >= 54) return "C+";
    if (rating >= 46) return "C";
    if (rating >= 38) return "C-";
    if (rating >= 28) return "D";
    return "F";
  }

  return {
    newGame, getState, openSlots, eligibleSlotsForPlayer,
    assignPlayer, skipTeam, skipEra, rollSpin, simulateSeason,
  };
})();
