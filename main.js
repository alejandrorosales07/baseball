/* ============================================================
   162-0 — UI CONTROLLER
   Renders the three screens (hero, draft, results) and wires
   up interactions including the flip-scoreboard spin animation.
   ============================================================ */

const App = (() => {
  const root = document.getElementById("app");
  let screen = "hero"; // hero | draft | results
  let lastResult = null;

  function init() {
    render();
  }

  function render() {
    if (screen === "hero") renderHero();
    else if (screen === "draft") renderDraft();
    else if (screen === "results") renderResults();
  }

  /* ---------------- HERO ---------------- */
  function renderHero() {
    root.innerHTML = `
      <div class="topbar">
        <div class="brand"><span>162<span class="dash">&ndash;</span>0</span><span class="tag">Baseball Builder</span></div>
      </div>
      <div class="hero">
        <div class="scoreboard-hero" aria-hidden="true">
          <div class="scoreboard-row">
            ${["1","6","2","\u2013","0"].map((c,i) => `<div class="bulb-cell ${c==="\u2013" ? "dim" : ""}" style="animation-delay:${i*0.3}s">${c}</div>`).join("")}
          </div>
        </div>
        <h1 class="hero-title">CAN YOUR ALL-TIME LINEUP<br>GO <span class="zero">162&ndash;0</span>?</h1>
        <p class="hero-sub">Draft a roster from <strong>every era of baseball history</strong> &mdash; one decade per round, one player per team &mdash; then let the simulator run your team through a full 162-game season.</p>
        <div class="cta-row">
          <button class="btn btn-primary" id="start-btn">Step Up to the Plate</button>
          <button class="btn btn-ghost" id="rules-btn">How It Works</button>
        </div>
        <div class="rules-strip">
          <div class="rule-card"><div class="num">01</div><p>Each round locks in a <strong>decade</strong>. The reel spins a random <strong>team</strong> from that era &mdash; pick one eligible player for an open roster spot.</p></div>
          <div class="rule-card"><div class="num">02</div><p>Fill all <strong>11 spots</strong>: 9 batters, a starter, and a closer. Stats are era-adjusted, so a .280 hitter in 1968 isn't the same as .280 today.</p></div>
          <div class="rule-card"><div class="num">03</div><p>You get <strong>1 team re-spin</strong> and <strong>1 era swap</strong> for the whole game. Use them on the rounds that matter.</p></div>
        </div>
        <p class="fine-print">An independent, fan-made project for entertainment purposes &mdash; not affiliated with MLB or any team. Player stats are approximate, decade-representative figures, not exact season box scores.</p>
      </div>
    `;
    document.getElementById("start-btn").addEventListener("click", startGame);
    document.getElementById("rules-btn").addEventListener("click", () => {
      document.querySelector(".rules-strip").scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function startGame() {
    Game.newGame();
    screen = "draft";
    render();
  }

  /* ---------------- DRAFT ---------------- */
  function renderDraft() {
    const state = Game.getState();
    const spin = state.currentSpin;
    const openSlotKeys = Game.openSlots();
    const currentRoundNum = state.round + 1;

    root.innerHTML = `
      <div class="topbar">
        <div class="brand"><span>162<span class="dash">&ndash;</span>0</span><span class="tag">Round ${currentRoundNum} of ${ROSTER_SLOTS.length}</span></div>
        <div class="topbar-actions"><button id="restart-btn">Start Over</button></div>
      </div>
      <div class="draft-layout">
        ${renderLineupCard(state)}
        <div class="draft-main">
          <div class="round-banner">
            <div><span class="round-label">Now drafting</span><span class="open-slot-title">${spin.decade}</span></div>
            <div class="skip-row">
              <button class="skip-btn" id="skip-team-btn" ${state.teamSkipsLeft <= 0 ? "disabled" : ""}>
                Re-spin team <span class="count">${state.teamSkipsLeft}</span>
              </button>
              <button class="skip-btn" id="skip-era-btn" ${state.eraSkipsLeft <= 0 ? "disabled" : ""}>
                Swap era <span class="count">${state.eraSkipsLeft}</span>
              </button>
            </div>
          </div>

          <div class="reel-board">
            <div class="reel-row">
              <div class="reel-unit">
                <div class="reel-label">Era</div>
                <div class="flip-window landed" id="era-window"><div class="flip-text">${spin.decade}</div></div>
              </div>
              <div class="reel-unit">
                <div class="reel-label">Team</div>
                <div class="flip-window landed" id="team-window"><div class="flip-text">${spin.team}</div></div>
              </div>
            </div>
          </div>

          <div class="picker-panel">
            <h4>Available for: ${openSlotKeys.join(" &middot; ")}</h4>
            <div id="player-list">${renderPlayerCards(spin.players)}</div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("restart-btn").addEventListener("click", () => {
      screen = "hero"; render();
    });
    document.getElementById("skip-team-btn").addEventListener("click", () => {
      if (Game.skipTeam()) animateSpinThenRender();
    });
    document.getElementById("skip-era-btn").addEventListener("click", () => {
      if (Game.skipEra()) animateSpinThenRender();
    });
    wirePlayerPickButtons();
  }

  function animateSpinThenRender() {
    const eraWin = document.getElementById("era-window");
    const teamWin = document.getElementById("team-window");
    if (!eraWin || !teamWin) { render(); return; }
    eraWin.classList.add("spinning");
    teamWin.classList.add("spinning");
    const decadesPool = DECADES;
    const teamsPool = Object.keys(TEAMS[Game.getState().currentSpin.decade] || TEAMS["2020s"]);
    let ticks = 0;
    const interval = setInterval(() => {
      eraWin.querySelector(".flip-text").textContent = decadesPool[Math.floor(Math.random() * decadesPool.length)];
      teamWin.querySelector(".flip-text").textContent = teamsPool[Math.floor(Math.random() * teamsPool.length)];
      ticks++;
      if (ticks > 10) {
        clearInterval(interval);
        render();
      }
    }, 70);
  }

  function renderLineupCard(state) {
    const filledCount = Object.keys(state.roster).length;
    const pct = Math.round((filledCount / ROSTER_SLOTS.length) * 100);
    return `
      <div class="lineup-card">
        <h3>Your Roster</h3>
        <div class="progress-text">${filledCount} / ${ROSTER_SLOTS.length} spots filled</div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        ${ROSTER_SLOTS.map(slot => {
          const entry = state.roster[slot.key];
          return `
            <div class="slot-row ${entry ? "filled" : ""}">
              <span class="slot-pos">${slot.key}</span>
              <span class="slot-name">${entry ? entry.player.name : slot.label}</span>
              <span class="slot-meta">${entry ? entry.decade : ""}</span>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderPlayerCards(players) {
    if (!players.length) {
      return `<p style="color:var(--chalk-dim);font-size:13px;">No eligible players from this roster for the open spots. Try re-spinning.</p>`;
    }
    return players.map((p, idx) => {
      const eligibleSlots = Game.eligibleSlotsForPlayer(p);
      const statLine = p.batting
        ? `AVG ${fmt(p.batting.avg)} &middot; HR ${p.batting.hr} &middot; RBI ${p.batting.rbi} &middot; OPS ${fmt(p.batting.ops)} &middot; SB ${p.batting.sb}`
        : `ERA ${fmtEra(p.pitching.era)} &middot; W ${p.pitching.w} &middot; K/9 ${fmtEra(p.pitching.k9)} &middot; WHIP ${fmtEra(p.pitching.whip)}${p.pitching.sv > 1 ? ` &middot; SV ${p.pitching.sv}` : ""}`;
      return `
        <div class="player-card" data-idx="${idx}">
          <div>
            <div class="pname">${p.name} <span class="pos-chip">${p.pos}</span></div>
            ${p.note ? `<div class="pnote">${p.note}</div>` : ""}
            <div class="stat-line">${statLine}</div>
          </div>
          <div class="pick-actions">
            ${eligibleSlots.map(slot => `<button class="pick-btn" data-idx="${idx}" data-slot="${slot}">Draft &rarr; ${slot}</button>`).join("")}
          </div>
        </div>
      `;
    }).join("");
  }

  function wirePlayerPickButtons() {
    document.querySelectorAll(".pick-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const slot = btn.dataset.slot;
        const player = Game.getState().currentSpin.players[idx];
        Game.assignPlayer(player, slot);
        const newState = Game.getState();
        if (newState.finished) {
          lastResult = Game.simulateSeason();
          screen = "results";
          render();
        } else {
          render();
        }
      });
    });
  }

  function fmt(n) { return n.toFixed(3).replace(/^0/, ""); }
  function fmtEra(n) { return n.toFixed(2); }

  /* ---------------- RESULTS ---------------- */
  function renderResults() {
    const state = Game.getState();
    const r = lastResult;
    const tagline = taglineFor(r);

    root.innerHTML = `
      <div class="topbar">
        <div class="brand"><span>162<span class="dash">&ndash;</span>0</span><span class="tag">Final Projection</span></div>
      </div>
      <div class="results-wrap">
        <div class="result-grade">${r.grade}</div>
        <div class="result-record"><span class="w">${r.wins}</span><span class="sep">&ndash;</span><span class="l">${r.losses}</span></div>
        <p class="result-tagline">${tagline}</p>

        <div class="result-grid">
          <div class="result-box">
            <div class="label">Strength Rating</div>
            <div class="value">${r.rating} / 100</div>
            <div class="sub">Blended era-adjusted composite across all 11 roster spots.</div>
          </div>
          <div class="result-box">
            <div class="label">Best Pick</div>
            <div class="value">${state.roster[r.strongestSlot].player.name} <span style="color:var(--chalk-dim);font-weight:400;">(${r.strongestSlot})</span></div>
            <div class="sub">${state.roster[r.strongestSlot].decade} ${state.roster[r.strongestSlot].team} &mdash; era-adjusted score ${r.strongest}</div>
          </div>
          <div class="result-box">
            <div class="label">Biggest Weakness</div>
            <div class="value">${state.roster[r.weakestSlot].player.name} <span style="color:var(--chalk-dim);font-weight:400;">(${r.weakestSlot})</span></div>
            <div class="sub">${state.roster[r.weakestSlot].decade} ${state.roster[r.weakestSlot].team} &mdash; era-adjusted score ${r.weakest}</div>
          </div>
          <div class="result-box">
            <div class="label">Share This</div>
            <div class="value">${r.wins}&ndash;${r.losses}, Grade ${r.grade}</div>
            <div class="sub" id="share-text">Copy your record and challenge a friend to beat it.</div>
          </div>
        </div>

        <table class="lineup-table">
          <thead><tr><th>Pos</th><th>Player</th><th>Era / Team</th><th class="stat-cell">Stat Line</th><th>Score</th></tr></thead>
          <tbody>
            ${ROSTER_SLOTS.map(slot => {
              const entry = state.roster[slot.key];
              const score = r.slotScores[slot.key];
              const cls = slot.key === r.weakestSlot ? "weak" : (slot.key === r.strongestSlot ? "strong" : "");
              const statLine = entry.player.batting
                ? `${fmt(entry.player.batting.avg)} / ${entry.player.batting.hr}HR / ${entry.player.batting.ops.toFixed(3)} OPS`
                : `${entry.player.pitching.era.toFixed(2)} ERA / ${entry.player.pitching.k9.toFixed(1)} K9`;
              return `
                <tr class="${cls}">
                  <td class="pos">${slot.key}</td>
                  <td>${entry.player.name}</td>
                  <td>${entry.decade} ${entry.team}</td>
                  <td class="stat-cell" style="font-family:var(--font-mono);font-size:12px;color:var(--chalk-dim);">${statLine}</td>
                  <td><div class="score-bar-wrap"><div class="score-bar" style="width:${Math.min(100, score / 1.6)}%"></div></div></td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>

        <div class="cta-row">
          <button class="btn btn-primary" id="play-again-btn">Build Another Lineup</button>
          <button class="btn btn-ghost" id="copy-result-btn">Copy Result</button>
        </div>
        <p class="fine-print">Projection from an entertainment simulation engine, not a real probability model. Player stats are approximate decade-representative figures.</p>
      </div>
    `;

    document.getElementById("play-again-btn").addEventListener("click", startGame);
    document.getElementById("copy-result-btn").addEventListener("click", () => {
      const summary = buildShareText(state, r);
      navigator.clipboard?.writeText(summary).then(() => {
        const btn = document.getElementById("copy-result-btn");
        const original = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = original; }, 1400);
      }).catch(() => {});
    });
  }

  function buildShareText(state, r) {
    const lines = ROSTER_SLOTS.map(slot => {
      const e = state.roster[slot.key];
      return `${slot.key}: ${e.player.name} (${e.decade} ${e.team})`;
    });
    return `162-0 Baseball Builder\nFinal record: ${r.wins}-${r.losses} (Grade ${r.grade})\n\n${lines.join("\n")}`;
  }

  function taglineFor(r) {
    if (r.wins >= 150) return "A historic juggernaut. This lineup belongs in Cooperstown.";
    if (r.wins >= 120) return "An absolute powerhouse \u2014 a near-perfect season.";
    if (r.wins >= 100) return "A genuine contender. Strong across the board.";
    if (r.wins >= 81) return "A respectable .500-or-better club. Room to grow.";
    if (r.wins >= 60) return "A rebuilding year. The front office has work to do.";
    return "A historically rough season. Better luck on the next spin.";
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);
