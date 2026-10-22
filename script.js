const initialState = {
  day: 1, life: 78, shield: 65, power: 72, food: 54, water: 82,
  score: 720, crew: 4, choice: null, gameOver: false, history: []
};
let state = {...initialState};
const $ = (id) => document.getElementById(id);
const clamp = (n, min=0, max=100) => Math.max(min, Math.min(max, Math.round(n)));
const choiceButtons = [...document.querySelectorAll(".choice")];

const choices = {
  shield: {
    label: "Shielding upgraded",
    feedback: "Smart protection: the crew is safer from radiation, but the extra shielding draws power from the grid.",
    apply() { state.shield += 18; state.power -= 12; state.score += 18; }
  },
  power: {
    label: "Power conserved",
    feedback: "Your power reserves last longer. The trade-off: greenhouse lights dim, so food production slows for now.",
    apply() { state.power += 10; state.food -= 5; state.score += 10; }
  },
  food: {
    label: "Greenhouse boosted",
    feedback: "More light and careful growing improve the food outlook, but the greenhouse needs a big burst of energy.",
    apply() { state.food += 16; state.power -= 15; state.score += 12; }
  },
  skip: {
    label: "No system changes",
    feedback: "You saved resources today, but left the outpost exposed. If a system is already weak, the next sol could be risky.",
    apply() { state.score -= 4; }
  }
};

function render() {
  ["life", "shield", "power", "food"].forEach(key => {
    $(key + "-value").textContent = state[key] + "%";
    $(key + "-bar").style.width = state[key] + "%";
  });
  $("water-value").textContent = state.water + "%";
  $("air-quality").textContent = state.life >= 60 ? "Good" : state.life >= 35 ? "Fair" : "Low";
  $("radiation-risk").textContent = state.shield >= 75 ? "Low" : state.shield >= 50 ? "Medium" : "High";
  $("storm-status").textContent = state.day >= 4 && state.shield < 70 ? "Storm watch" : "Monitoring";
  $("solar-value").textContent = clamp(state.power - 4) + "%";
  $("usage-value").textContent = state.power < 25 ? "Critical" : state.power < 45 ? "Conserve" : "Normal";
  $("ration-days").textContent = Math.max(0, Math.round(state.food / 4.5)) + " days";
  $("growth-value").textContent = clamp(state.food + 4) + "%";
  $("day-label").textContent = `DAY ${state.day} / 30`;
  $("phase-label").textContent = `SOL ${String(state.day).padStart(3, "0")}`;
  $("sol-stat").innerHTML = `${String(state.day).padStart(3, "0")} <small>/ 030</small>`;
  $("day-progress").style.width = (state.day / 30 * 100) + "%";
  $("crew-count").textContent = `${state.crew} / 4`;
  $("crew-health").textContent = state.crew === 4 ? "Happy & healthy" : state.crew >= 2 ? "Needs attention" : "Critical condition";
  $("crew-face").textContent = state.crew === 4 ? "☺" : state.crew >= 2 ? "◔" : "!";
  $("crew-face").style.color = state.crew === 4 ? "#25e4ad" : "#ffb15c";
  $("score-value").textContent = clamp(state.score, 0, 1000);
  $("score-bar").style.width = clamp(state.score, 0, 1000) / 10 + "%";
  $("rank-value").textContent = state.score >= 900 ? "Mission Ace" : state.score >= 800 ? "Commander" : state.score >= 650 ? "Cadet" : "Trainee";
  const risk = state.life < 30 || state.power < 15 || state.food < 15 || state.shield < 20 || state.crew < 2;
  $("mission-status").textContent = state.gameOver ? (state.day >= 30 && !risk ? "● COMPLETE" : "● MISSION LOST") : risk ? "● AT RISK" : "● NOMINAL";
  $("mission-status").style.color = risk ? "#ff8c98" : "#30e5a4";
  $("achievement-title").textContent = state.day >= 30 && !risk ? "Mission accomplished!" : state.gameOver ? "Mission ended" : "Your mission awaits";
  $("achievement-copy").textContent = state.day >= 30 && !risk ? "Outpost Alpha survived 30 sols. Outstanding work, commander." : state.gameOver ? "Review the report, learn from the trade-offs, and try again." : `Can you keep your crew safe for ${30-state.day} more sols?`;
  $("achievement-card").classList.toggle("complete", state.day >= 30 && !risk);
  $("results-button").textContent = state.gameOver ? "View mission report →" : "View current report →";
  $("next-day").disabled = !state.choice || state.gameOver;
  $("decision-title").textContent = state.gameOver ? "Mission debrief" : `Sol ${String(state.day).padStart(3,"0")}: choose your strategy`;
  if (state.gameOver) {
    $("decision-prompt").textContent = state.day >= 30 ? "Thirty sols are complete. See how your engineering choices shaped the mission." : "A critical system failed. Review the mission report and try a different strategy.";
  } else if (state.day >= 3) {
    $("decision-prompt").textContent = "A dust storm may arrive soon. Your systems are connected: choose what to prioritize this sol.";
  } else {
    $("decision-prompt").textContent = "Your outpost is settling in. Which system will you strengthen before conditions change?";
  }
  choiceButtons.forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.choice === state.choice);
    btn.disabled = state.gameOver;
  });
}

function addLog(title, detail, color="yellow-dot") {
  const log = $("mission-log");
  const entry = document.createElement("div");
  entry.className = "log-entry";
  const dot = document.createElement("i");
  dot.className = color;
  const content = document.createElement("div");
  const b = document.createElement("b");
  b.textContent = `Sol ${String(state.day).padStart(3,"0")} · ${title}`;
  const p = document.createElement("p");
  p.textContent = detail;
  content.append(b,p); entry.append(dot,content); log.prepend(entry);
  while (log.children.length > 5) log.lastElementChild.remove();
}

function selectChoice(key) {
  if (state.gameOver) return;
  state.choice = key;
  $("decision-feedback").textContent = choices[key].feedback + " Click “Advance one sol” to see what happens next.";
  $("decision-feedback").className = "decision-feedback " + (key === "skip" ? "warn" : "good");
  choiceButtons.forEach(btn => btn.classList.toggle("selected", btn.dataset.choice === key));
  $("next-day").disabled = false;
}

function advanceDay() {
  if (!state.choice || state.gameOver) return;
  const selected = choices[state.choice];
  selected.apply();
  state.life -= 2;
  state.water -= 3;
  state.food -= 2;
  state.power -= 2;
  state.day += 1;

  // The simulation makes trade-offs visible: storms raise exposure and reduce solar input.
  if (state.day === 5 || state.day === 12 || state.day === 19 || state.day === 25) {
    state.power -= 8;
    state.shield -= 3;
    state.score -= 8;
    addLog("Dust storm", "Dust reduced solar generation and increased exposure risk.", "yellow-dot");
    $("weather-pill").innerHTML = '<span>☁</span><div><b>Dust storm</b><small>Solar output reduced</small></div>';
  } else {
    $("weather-pill").innerHTML = '<span>☀</span><div><b>Clear skies</b><small>Solar generation nominal</small></div>';
  }
  // Basic system feedback and consequences.
  if (state.power < 30) { state.life -= 4; state.food -= 3; }
  if (state.shield < 35) { state.crew = Math.max(0, state.crew - 1); state.score -= 25; }
  if (state.life < 25 || state.food < 10 || state.power < 8 || state.crew < 2) state.gameOver = true;
  if (state.day >= 30) { state.day = 30; state.gameOver = true; }
  state.life = clamp(state.life); state.shield = clamp(state.shield); state.power = clamp(state.power);
  state.food = clamp(state.food); state.water = clamp(state.water); state.score = clamp(state.score, 0, 1000);
  state.history.push({day: state.day, choice: state.choice, score: state.score});
  addLog(selected.label, selected.feedback, state.choice === "skip" ? "yellow-dot" : "green-dot");
  $("decision-feedback").textContent = state.gameOver
    ? (state.day >= 30 ? "Thirty sols complete! Your mission report is ready." : "A critical system has failed. Open the mission report to review what happened.")
    : `Sol advanced. ${selected.label} — watch the updated system levels before your next decision.`;
  $("decision-feedback").className = "decision-feedback " + (state.gameOver ? "warn" : "good");
  state.choice = null;
  render();
}

function openReport() {
  const survived = state.day >= 30 && state.crew >= 2 && state.life > 0 && state.food > 0 && state.power > 0;
  $("report-title").textContent = survived ? "Outpost survived!" : state.gameOver ? "Mission ended" : "Mission in progress";
  $("report-summary").textContent = survived
    ? "Your crew made it through 30 sols on Mars. Every decision contributed to the outcome."
    : state.gameOver ? "One or more systems reached a critical level. That's part of engineering: use the data and try a new strategy."
    : "Your mission is still underway. This report reflects your current status; keep making decisions to complete all 30 sols.";
  $("report-days").textContent = `${state.day} / 30`;
  $("report-score").textContent = clamp(state.score, 0, 1000);
  $("report-crew").textContent = state.crew === 4 ? "Healthy" : state.crew >= 2 ? "At risk" : "Critical";
  $("report-lesson").textContent = state.shield < 35
    ? "Radiation shielding matters: weak protection can endanger the crew even when other resources look healthy."
    : state.power < 30
    ? "Power is the backbone of the habitat. Saving energy can protect one system, but may slow food growth or life support."
    : state.food < 25
    ? "Food production takes energy and time. A colony needs enough reserves to survive while crops grow."
    : "Every system is connected. Strengthening one resource can put pressure on another, so plan for the next sol—not just today.";
  $("report-modal").classList.add("open");
  $("report-modal").setAttribute("aria-hidden","false");
}
function closeReport() { $("report-modal").classList.remove("open"); $("report-modal").setAttribute("aria-hidden","true"); }
function restart() {
  state = {...initialState, history: []};
  $("mission-log").innerHTML = '<div class="log-entry"><i class="yellow-dot"></i><div><b>Sol 001</b><p>Mission systems checked in</p></div></div><div class="log-entry"><i class="green-dot"></i><div><b>Sol 000</b><p>Outpost Alpha established</p></div></div><div class="log-entry"><i class="blue-dot"></i><div><b>Pre-launch</b><p>Crew arrived safely on Mars</p></div></div>';
  $("weather-pill").innerHTML = '<span>☀</span><div><b>Clear skies</b><small>Solar generation nominal</small></div>';
  $("decision-feedback").textContent = "Choose a strategy to see its consequences. Your choices change the mission.";
  $("decision-feedback").className = "decision-feedback";
  closeReport(); render();
}
choiceButtons.forEach(btn => btn.addEventListener("click", () => selectChoice(btn.dataset.choice)));
$("next-day").addEventListener("click", advanceDay);
$("results-button").addEventListener("click", openReport);
$("modal-close").addEventListener("click", closeReport);
$("restart-button").addEventListener("click", restart);
$("report-modal").addEventListener("click", e => { if (e.target === $("report-modal")) closeReport(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeReport(); });
render();
