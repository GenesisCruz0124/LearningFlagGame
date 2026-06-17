/**
 * Core game engine: pools, question generation, answer checking, scoring.
 * Pure logic only — no DOM. The UI layer (ui.js) drives it.
 */

const QUESTIONS_PER_ROUND = 10; // for non-timed modes
const TIMED_SECONDS = 60;

/** Normalize a string for forgiving text comparison. */
function normalize(str) {
  return str
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[.'’\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fisher–Yates shuffle (returns a new array). */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Filter the country list to the selected regions (array of region names). */
function buildPool(regions) {
  return COUNTRIES.filter((c) => regions.includes(c.region));
}

/**
 * Build one question. For choice/find/timed we need distractors; we prefer
 * same-region picks, then other countries in the selected pool, and only fall
 * back to the full list if the pool is too small — so a restricted round stays
 * on-theme.
 */
function makeQuestion(pool, mode) {
  const target = randomItem(pool);
  const question = { target, mode };

  if (mode === "type") return question; // no options needed

  const optionCount = 4;
  const sameRegion = pool.filter((c) => c.code !== target.code && c.region === target.region);
  const poolOther = pool.filter((c) => c.code !== target.code && c.region !== target.region);
  const anyOther = COUNTRIES.filter((c) => c.code !== target.code);

  const distractors = [];
  const used = new Set([target.code]);
  for (const group of [sameRegion, poolOther, anyOther]) {
    for (const c of shuffle(group)) {
      if (distractors.length >= optionCount - 1) break;
      if (!used.has(c.code)) {
        used.add(c.code);
        distractors.push(c);
      }
    }
    if (distractors.length >= optionCount - 1) break;
  }
  question.options = shuffle([target, ...distractors]);
  return question;
}

/** Check an answer. For "type" mode, input is text; otherwise it's a country code. */
function checkAnswer(input, target, mode) {
  if (mode === "type") {
    const guess = normalize(input);
    if (!guess) return false;
    const accepted = [target.name, ...(target.aliases || [])].map(normalize);
    return accepted.includes(guess);
  }
  return input === target.code;
}

/**
 * Game state machine. Construct with options, then call start() and read
 * .current for the active question. Report answers via answer().
 */
class FlagGame {
  constructor({ mode, regions, questionCount }) {
    this.mode = mode;
    this.regions = regions.slice();
    this.pool = buildPool(regions);
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.answered = 0;
    this.current = null;
    this.isTimed = mode === "timed";
    this.questionCount = questionCount || QUESTIONS_PER_ROUND;
    this.totalQuestions = this.isTimed ? Infinity : this.questionCount;
  }

  start() {
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.answered = 0;
    this.next();
    return this.current;
  }

  next() {
    this.current = makeQuestion(this.pool, this.mode);
    return this.current;
  }

  /** Record an answer; returns { correct, target }. */
  answer(input) {
    const correct = checkAnswer(input, this.current.target, this.mode);
    if (correct) {
      this.score += 1;
      this.streak += 1;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
    } else {
      this.streak = 0;
    }
    this.answered += 1;
    return { correct, target: this.current.target };
  }

  /** True when a non-timed round is over. */
  isOver() {
    return !this.isTimed && this.answered >= this.totalQuestions;
  }
}
