/**
 * UI layer: screen navigation, per-mode rendering, event wiring, and
 * persistence of best scores in localStorage.
 */
(function () {
  "use strict";

  const screens = {
    menu: document.getElementById("screen-menu"),
    play: document.getElementById("screen-play"),
    result: document.getElementById("screen-result"),
  };

  const el = {
    promptArea: document.getElementById("prompt-area"),
    answerArea: document.getElementById("answer-area"),
    feedback: document.getElementById("feedback"),
    btnNext: document.getElementById("btn-next"),
    btnQuit: document.getElementById("btn-quit"),
    score: document.getElementById("stat-score"),
    streak: document.getElementById("stat-streak"),
    timerWrap: document.getElementById("stat-timer-wrap"),
    timer: document.getElementById("stat-timer"),
    progressWrap: document.getElementById("stat-progress-wrap"),
    progress: document.getElementById("stat-progress"),
    total: document.getElementById("stat-total"),
    continentInputs: Array.from(
      document.querySelectorAll('.continent-list input[type="checkbox"]')
    ),
    countInputs: Array.from(document.querySelectorAll('input[name="qcount"]')),
    settingsHint: document.getElementById("settings-hint"),
    resultScore: document.getElementById("result-score"),
    resultOutof: document.getElementById("result-outof"),
    resultBest: document.getElementById("result-best"),
    resultNewBest: document.getElementById("result-newbest"),
    btnAgain: document.getElementById("btn-again"),
    btnHome: document.getElementById("btn-home"),
  };

  let game = null;
  let timerId = null;
  let timeLeft = 0;
  let locked = false; // prevents double-answering while feedback shows

  // ---------------- Navigation ----------------
  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove("is-active"));
    screens[name].classList.add("is-active");
  }

  // ---------------- Settings (read from menu controls) ----------------
  function getSelectedRegions() {
    return el.continentInputs
      .filter((c) => c.checked)
      .map((c) => c.dataset.region);
  }
  function getQuestionCount() {
    const checked = el.countInputs.find((r) => r.checked);
    return checked ? parseInt(checked.value, 10) : QUESTIONS_PER_ROUND;
  }

  // ---------------- Persistence ----------------
  // Best score is scoped to the mode + chosen regions + question count so each
  // distinct setup keeps its own high score.
  function bestKey() {
    const regions = game.regions.slice().sort().join("+");
    const countPart = game.isTimed ? "timed" : game.questionCount;
    return `flagquest_best_${game.mode}_${regions}_${countPart}`;
  }
  function getBest() {
    return parseInt(localStorage.getItem(bestKey()) || "0", 10);
  }
  function setBest(value) {
    localStorage.setItem(bestKey(), String(value));
  }

  // Remember the player's menu selections across reloads.
  const SETTINGS_KEY = "flagquest_settings";
  function saveSettings() {
    const data = { regions: getSelectedRegions(), count: getQuestionCount() };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
  }
  function restoreSettings() {
    let data;
    try {
      data = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    } catch (e) {
      data = null;
    }
    if (!data) return;
    if (Array.isArray(data.regions)) {
      el.continentInputs.forEach((c) => {
        c.checked = data.regions.includes(c.dataset.region);
      });
    }
    if (data.count) {
      el.countInputs.forEach((r) => {
        r.checked = parseInt(r.value, 10) === data.count;
      });
    }
  }

  // ---------------- Stats bar ----------------
  function updateStats() {
    el.score.textContent = game.score;
    el.streak.textContent = game.streak;
    if (game.isTimed) {
      el.timerWrap.hidden = false;
      el.progressWrap.hidden = true;
    } else {
      el.timerWrap.hidden = true;
      el.progressWrap.hidden = false;
      el.progress.textContent = Math.min(game.answered + 1, game.questionCount);
      el.total.textContent = game.questionCount;
    }
  }

  // ---------------- Rendering a question ----------------
  function renderQuestion() {
    locked = false;
    el.feedback.textContent = "";
    el.feedback.className = "feedback";
    el.btnNext.hidden = true;
    el.promptArea.innerHTML = "";
    el.answerArea.innerHTML = "";
    updateStats();

    const q = game.current;
    if (q.mode === "find") {
      renderFindMode(q);
    } else if (q.mode === "type") {
      renderTypeMode(q);
    } else {
      renderChoiceMode(q); // choice + timed
    }
  }

  function renderFlag(code) {
    const wrap = document.createElement("div");
    wrap.className = "flag-frame";
    wrap.appendChild(createFlagElement(code, { width: 320 }));
    return wrap;
  }

  // Multiple choice + timed: show flag, pick country name.
  function renderChoiceMode(q) {
    el.promptArea.appendChild(renderFlag(q.target.code));
    q.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.type = "button";
      btn.dataset.code = opt.code;
      btn.textContent = opt.name;
      btn.addEventListener("click", () => handleChoice(opt.code, btn));
      el.answerArea.appendChild(btn);
    });
  }

  // Find the flag: show country name, pick the flag.
  function renderFindMode(q) {
    const name = document.createElement("div");
    name.className = "find-name";
    name.textContent = q.target.name;
    el.promptArea.appendChild(name);

    el.answerArea.classList.add("flag-options");
    q.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "flag-option-btn";
      btn.type = "button";
      btn.dataset.code = opt.code;
      btn.appendChild(createFlagElement(opt.code, { width: 320 }));
      btn.addEventListener("click", () => handleChoice(opt.code, btn));
      el.answerArea.appendChild(btn);
    });
  }

  // Type the country: show flag, free-text input.
  function renderTypeMode(q) {
    el.promptArea.appendChild(renderFlag(q.target.code));
    const form = document.createElement("form");
    form.className = "type-form";
    const input = document.createElement("input");
    input.type = "text";
    input.className = "type-input";
    input.placeholder = "Type the country name…";
    input.autocomplete = "off";
    input.autocapitalize = "off";
    input.spellcheck = false;
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "btn-primary";
    submit.textContent = "Guess";
    form.appendChild(input);
    form.appendChild(submit);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      handleType(input.value, input);
    });
    el.answerArea.appendChild(form);
    input.focus();
  }

  // ---------------- Answer handling ----------------
  function handleChoice(code, clickedBtn) {
    if (locked) return;
    locked = true;
    const { correct, target } = game.answer(code);
    const buttons = el.answerArea.querySelectorAll("button");
    buttons.forEach((b) => (b.disabled = true));

    // Always highlight the correct flag/option; mark the wrong pick in red.
    buttons.forEach((b) => {
      if (b.dataset.code === target.code) b.classList.add("is-correct");
    });
    if (!correct) clickedBtn.classList.add("is-wrong");

    finishQuestion(correct, target);
  }

  function handleType(value, input) {
    if (locked) return;
    locked = true;
    const { correct, target } = game.answer(value);
    input.disabled = true;
    input.classList.add(correct ? "is-correct" : "is-wrong");
    finishQuestion(correct, target);
  }

  function finishQuestion(correct, target) {
    if (correct) {
      el.feedback.textContent = "✅ Correct!";
      el.feedback.className = "feedback is-correct";
    } else {
      el.feedback.textContent = `❌ It was ${target.name}`;
      el.feedback.className = "feedback is-wrong";
    }
    updateStats();

    if (game.isTimed) {
      // Auto-advance quickly in timed mode.
      setTimeout(() => {
        if (game && game.isTimed && timeLeft > 0) {
          game.next();
          renderQuestion();
        }
      }, 550);
    } else if (game.isOver()) {
      setTimeout(endRound, 700);
    } else {
      el.btnNext.hidden = false;
      el.btnNext.focus();
    }
  }

  // ---------------- Round lifecycle ----------------
  function startRound(mode) {
    const regions = getSelectedRegions();
    if (regions.length === 0) {
      el.settingsHint.hidden = false;
      return;
    }
    el.settingsHint.hidden = true;
    game = new FlagGame({ mode, regions, questionCount: getQuestionCount() });
    el.answerArea.classList.remove("flag-options");
    game.start();
    showScreen("play");
    renderQuestion();
    if (game.isTimed) startTimer();
  }

  function startTimer() {
    timeLeft = TIMED_SECONDS;
    el.timer.textContent = timeLeft;
    timerId = setInterval(() => {
      timeLeft -= 1;
      el.timer.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timerId);
        timerId = null;
        endRound();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function endRound() {
    stopTimer();
    const best = getBest();
    const isNewBest = game.score > best;
    if (isNewBest) setBest(game.score);

    el.resultScore.textContent = game.score;
    el.resultOutof.textContent = game.isTimed ? "" : `/ ${game.questionCount}`;
    el.resultBest.textContent = isNewBest ? game.score : best;
    el.resultNewBest.hidden = !isNewBest;
    showScreen("result");
  }

  // ---------------- Event wiring ----------------
  restoreSettings();

  document.querySelectorAll(".mode-card").forEach((card) => {
    card.addEventListener("click", () => startRound(card.dataset.mode));
  });

  // Persist settings whenever a toggle or count changes; clear the hint once a
  // region is re-enabled.
  el.continentInputs.concat(el.countInputs).forEach((input) => {
    input.addEventListener("change", () => {
      saveSettings();
      if (getSelectedRegions().length > 0) el.settingsHint.hidden = true;
    });
  });

  el.btnNext.addEventListener("click", () => {
    game.next();
    renderQuestion();
  });

  el.btnQuit.addEventListener("click", () => {
    stopTimer();
    game = null;
    showScreen("menu");
  });

  el.btnAgain.addEventListener("click", () => {
    const mode = game.mode;
    startRound(mode);
  });

  el.btnHome.addEventListener("click", () => {
    game = null;
    showScreen("menu");
  });
})();
