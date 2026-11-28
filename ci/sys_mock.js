// СГЕНЕРИРОВАНО fn/mkcore.py: серверная логика v28 для тестов сайта
(() => {
const { makeCore } = (() => {
// СГЕНЕРИРОВАНО fn/mkcore.py из index.html (APP_VERSION 31). Не править руками: меняй index.html и пересобирай.
// Тот же код подсчёта опыта, что в браузере. Сервер (функция sys) и тесты считают им опыт игроков.
const CORE_VERSION = 31;
function makeCore(clock) {
  "use strict";
  const noop = () => {};
  const window = { addEventListener: noop, SISTEMA_CONFIG: { server: true } };
  const document = { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener: noop };
  const localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
  const location = { hash: "", pathname: "/", search: "" }, history = { replaceState: noop };
  const Date = class extends globalThis.Date { static now() { return clock(); } };
const BASE_PLAYERS = [
  { id: "aitbatyr", name: "Айтбатыр" },
  { id: "aldiyar", name: "Алдияр" },
  { id: "nursultan", name: "Нурсултан" },
];
let PLAYERS = BASE_PLAYERS.map((p) => ({ ...p }));
const MAX_ACTIVE = 12;
const STATS = [
  { k: "str", s: "СИЛ", n: "Тело", hint: "спорт, сон, питание", title: "Воин" },
  { k: "int", s: "ИНТ", n: "Разум", hint: "учёба, книги, навыки", title: "Мудрец" },
  { k: "wil", s: "ВОЛ", n: "Воля", hint: "режим, привычки, быт", title: "Аскет" },
  { k: "cha", s: "ХАР", n: "Харизма", hint: "люди, общение", title: "Лидер" },
  { k: "cre", s: "ТВР", n: "Творчество", hint: "музыка, проекты", title: "Творец" },
  { k: "fin", s: "ФИН", n: "Достаток", hint: "работа, деньги", title: "Торговец" },
];
const RANKS = {
  E: { xp: 5, big: false }, D: { xp: 10, big: false }, C: { xp: 20, big: false },
  B: { xp: 50, big: true }, A: { xp: 100, big: true }, S: { xp: 200, big: true },
};
// похожие квесты в истории пати: подсказка, сколько времени обычно ставят (timeSuggest)
const simWords = (t) => new Set(String(t).toLowerCase().replace(/ё/g, "е").split(/[^a-zа-я0-9]+/).filter((w) => w.length >= 3 && !/^\d+$/.test(w)).map((w) => w.slice(0, 5)));
// ---------- v18: опыт ежедневных квестов = время × сложность × «нравится», без букв ----------
const V18_FROM = "2026-11-14";
const STEPS_MIN = [0, 5, 10, 15, 20, 30, 45, 60, 90, 120, 150, 180, 240, 300, 360, 480, 600, 720, 840, 960];
const EFF = [{ n: "лёгкий", k: 0.5, h: 3 }, { n: "средний", k: 1, h: 5 }, { n: "сложный", k: 1.5, h: 10 }];
const LIKE = [{ n: "не нравится", k: 1.3 }, { n: "нейтрально", k: 1.15 }, { n: "нравится", k: 1 }];
const DAY_MIN = 960, HABITS_MAX = 5, ODD_MIN = 600, LEGEND_MIN = 6000;
const isNewQ = (t) => !!t && typeof t.m === "number";
const isPlan = (s) => !!s && s.kind === "plan"; // v22: сюжетный квест нового вида
const stCol = (st) => (st === "expired" || st === "rejected" ? "var(--bad)" : st === "approved" || st === "late" || st === "closed" ? "var(--ok)" : "var(--story)");
const okMEL = (m, e, l) => STEPS_MIN.includes(m) && [0, 1, 2].includes(e) && [0, 1, 2].includes(l);
const xpOf = (m, e, l) => (!okMEL(m, e, l) ? 0 : m === 0 ? Math.round(EFF[e].h * LIKE[l].k) : Math.max(1, Math.round(20 * (Math.min(m / 60, 3) + Math.max(0, m / 60 - 3) * 0.5) * EFF[e].k * LIKE[l].k)));
const taskXp = (t) => (isNewQ(t) ? xpOf(t.m, t.e, t.l) : RANKS[t.rank] ? RANKS[t.rank].xp : 0);
const taskBig = (t) => !isNewQ(t) && !!RANKS[t.rank] && RANKS[t.rank].big;
const taskMin = (t) => (isNewQ(t) ? t.m : 0);
const OLD_MEL = { E: [4, 1, 2], D: [5, 1, 2], C: [7, 1, 2] }; // старый повтор при правке: E = 15 мин, D = 30 мин, C = 1 ч, тот же опыт
const fmtMin = (m) => (m < 60 ? m + " мин" : String(Math.round((m / 60) * 100) / 100).replace(".", ",") + " ч");
const fmtHM = (m) => (m < 60 ? Math.max(0, m) + " мин" : Math.floor(m / 60) + " ч" + (m % 60 ? " " + (m % 60) + " мин" : ""));
const xpTier = (xp) => (xp <= 10 ? "E" : xp <= 20 ? "D" : xp <= 40 ? "C" : xp <= 80 ? "B" : xp <= 160 ? "A" : "S"); // только сила искр, нигде не показывается
const qCol = (t) => (isNewQ(t) && t.m === 0 ? "var(--ok)" : "var(--sys)");
const qFx = (t) => (isNewQ(t) ? (t.m === 0 ? "#49e3a0" : "#5ec8ff") : RCOL[t.rank] || RCOL.C);
const kindTag = (m) => '<span class="qk' + (m === 0 ? " hab" : "") + '">' + (m === 0 ? "ПРИВЫЧКА" : "ЗАДАЧА") + "</span>";
const qParams = (t) => (isNewQ(t) ? (t.m ? fmtMin(t.m) + " · " : "") + EFF[t.e].n + (t.l === 0 ? " · 👎" : "") : "");
const LIKE_ICO = ['<svg class="th" style="--r:180deg" viewBox="0 0 24 24"><path d="M7 11v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3a4 4 0 0 0 4-4V6a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1-2 2h-7a3 3 0 0 1-3-3"/></svg>', '<svg class="th" viewBox="0 0 24 24"><path d="M6 12h12" stroke-width="2.2"/></svg>', '<svg class="th" viewBox="0 0 24 24"><path d="M7 11v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3a4 4 0 0 0 4-4V6a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1-2 2h-7a3 3 0 0 1-3-3"/></svg>'];
// день игрока: сколько минут занято, сколько привычек, сколько выполнено
const dayTasks = (pid, d, except) => (tasksBy[pid] || []).filter((t) => t.date === d && t.id !== except && isNewQ(t) && !t.moved && !t.missed);
// v22: шаги сюжетов (kind plan) с этой датой тоже занимают день. except: id квеста или "sid~i" шага
function planStepsOn(pid, d, except, doneOnly) {
  let m = 0, h = 0;
  for (const s of storiesBy[pid] || []) if (isPlan(s)) s.steps.forEach((x, i) => {
    if (x.removed || x.old || x.d !== d || s.id + "~" + i === except) return;
    if (doneOnly ? !x.done : !(x.done || !s.closed)) return;
    m += x.m; if (x.m === 0) h++;
  });
  return { m, h };
}
const dayUsed = (pid, d, except) => dayTasks(pid, d, except).reduce((a, t) => a + t.m, 0) + planStepsOn(pid, d, except).m;
const dayHabits = (pid, d, except) => dayTasks(pid, d, except).filter((t) => t.m === 0).length + planStepsOn(pid, d, except).h;
const dayDoneMin = (pid, d, except) => dayTasks(pid, d, except).filter((t) => t.done).reduce((a, t) => a + t.m, 0) + planStepsOn(pid, d, except, true).m;
const sinceSix = () => Math.floor((now() - (toUTC(today()) - TZ + DAY_H * 3600e3)) / 6e4); // v30: минут с 4:00 игрового дня (честные часы)
// необычный день: больше 10 ч задач или опыт вдвое выше обычного за 14 дней
function oddDay(pid, d, p) {
  const doneMin = (tasksBy[pid] || []).filter((t) => t.date === d && isNewQ(t) && countsTask(t)).reduce((a, t) => a + t.m, 0);
  if (doneMin > ODD_MIN) return "больше 10 ч задач за день";
  const x = p.allByDay[d] || 0;
  let sum = 0, n = 0; for (let i = 1; i <= 14; i++) { const dd = addDays(d, -i); if (dd < joinedOf(pid)) break; sum += p.allByDay[dd] || 0; n++; }
  const avg = n >= 3 ? sum / n : 0;
  if (avg >= 10 && x >= 100 && x >= avg * 2) return "опыт вдвое выше обычного";
  return "";
}
const AUTO_MS = 48 * 3600e3;
const BUG_ST = [
  { k: "new", n: "🆕 Новое" }, { k: "check", n: "🔍 Проверяется" }, { k: "work", n: "🛠 В работе" }, { k: "fixed", n: "✅ Исправлено" },
  { k: "notbug", n: "❎ Не баг" }, { k: "norepro", n: "🔁 Не воспроизводится" }, { k: "dup", n: "📎 Дубликат" }, { k: "idea", n: "💡 Идея" },
];
const bugStName = (k) => (BUG_ST.find((x) => x.k === k) || BUG_ST[0]).n;
const SMALL_CAP_OLD = 100, SMALL_CAP_NEW = 150, CAP_FROM = "2026-10-22", STEP_XP = 10;
const capFor = (d) => (d >= V18_FROM ? Infinity : d >= CAP_FROM ? SMALL_CAP_NEW : SMALL_CAP_OLD); // с v18 лимита мелочи нет
const ACH = [
  { k: "first", n: "Первый шаг", d: "Выполнить первый квест", xp: 10 },
  { k: "s3", n: "Разгон", d: "Серия 3 дня", xp: 15 },
  { k: "s7", n: "Неделя в строю", d: "Серия 7 дней", xp: 30 },
  { k: "s14", n: "Две недели", d: "Серия 14 дней", xp: 60 },
  { k: "s30", n: "Железная воля", d: "Серия 30 дней", xp: 120 },
  { k: "perfect", n: "Идеальный день", d: "Закрыть все квесты дня, минимум 5", xp: 20 },
  { k: "clean7", n: "Без провалов", d: "7 дней подряд без единого провала", xp: 50 },
  { k: "bigB", n: "Крупная рыба", d: "Квест на 50+ XP (или подтверждённый крупный квест)", xp: 20 },
  { k: "bigS", n: "Легенда", d: "100 часов квестов за сезон (или подтверждённый S)", xp: 100 },
  { k: "habit", n: "Привычка сформирована", d: "Повтор с 👎 стал 👍 после 5+ выполнений", xp: 30 },
  { k: "story", n: "Сюжет пройден", d: "Завершить сюжетный квест", xp: 50 },
  { k: "q100", n: "Сотня", d: "100 выполненных квестов", xp: 50 },
];
const MEDALS = ["🥇", "🥈", "🥉"];
const SEASON_START = "2026-10-15", SEASON_END = "2027-01-01", LAST_DAY = "2026-12-31";
const TZ = 5 * 3600e3; // Казахстан, UTC+5

const $ = (id) => document.getElementById(id);
const STANDALONE = !!window.SISTEMA_CONFIG;
const legacyFree = () => (STANDALONE && Array.isArray(window.SISTEMA_LEGACY_FREE) ? window.SISTEMA_LEGACY_FREE.filter((l) => l && l.slot && l.uid) : []);
window.addEventListener("sistema-legacy", () => { lastHtml.admin = null; renderAdmin(); });
const blobUrl = (id) => (typeof window.SISTEMA_BLOB === "function" ? window.SISTEMA_BLOB(id) : "/_blob/" + id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
const TEST_MODE = false;
let offset = 0, clockOk = false, clockTried = false, testShift = 0;
const now = () => Date.now() + offset + testShift * 864e5;
// v30: игровой день начинается в 4:00 (кто засиделся после полуночи, ещё во вчерашнем дне). Действует с 23 ноя 04:00,
// всё раньше по-старому (календарная полночь), чтобы история не сдвинулась.
const DAY_H = 4, D4_FROM = Date.UTC(2026, 10, 22, 23);
const dayOf = (ms) => ymd(new Date(ms + TZ - (ms >= D4_FROM ? DAY_H * 3600e3 : 0)));
const calDayOf = (ms) => ymd(new Date(ms + TZ)); // календарный день: подписи в чате, «был в сети»
const calToday = () => calDayOf(now());
const today = () => dayOf(now());
const toUTC = (s) => { const [y, m, d] = s.split("-").map(Number); return Date.UTC(y, m - 1, d); };
const addDays = (s, n) => ymd(new Date(toUTC(s) + n * 864e5));
const daysTo = (s) => Math.round((toUTC(s) - toUTC(today())) / 864e5);
const pname = (id) => (PLAYERS.find((p) => p.id === id) || {}).name || "Игрок";
const isActive = (p) => !!(p && roster[p.id] && !p.archived);
const activePlayers = () => PLAYERS.filter(isActive);
const othersCount = (pid) => activePlayers().filter((p) => p.id !== pid).length;
const joinedOf = (pid) => { const p = PLAYERS.find((x) => x.id === pid); return p && typeof p.joined === "string" && p.joined > SEASON_START ? p.joined : SEASON_START; };
const MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const nice = (s) => { const [, m, d] = s.split("-").map(Number); return d + " " + MONTHS[m - 1]; };
const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);
const fmt = (x) => String(Math.round(x * 100) / 100).replace(".", ",");
const statOf = (k) => STATS.find((s) => s.k === k);
// иконки характеристик: свои линейные SVG 24×24 в стиле системы
const ICO = {
  // согнутая рука (бицепс)
  str: '<path d="M4 19v-5.3c2.3-3.9 7-4.5 9.8-1.9"/><path d="M13.8 11.8l.8-3.8"/><rect x="13.3" y="2.8" width="5.4" height="5.2" rx="1.7"/><path d="M18.4 7.8l2.2 6.3c.7 3.5-3.4 5.1-8 5.1H4"/><path d="M7.8 15.2c1.3.9 3.1.9 4.4 0"/>',
  // мозг
  int: '<path d="M12 5.2c-.9-1.3-2.9-1.6-4.2-.6-.9.6-1.3 1.6-1.2 2.6-1.5.4-2.4 1.9-2.1 3.4-.9.8-1.2 2.1-.7 3.2.4.9 1.2 1.5 2.1 1.6.1 1.6 1.4 2.9 3 2.9.9 0 1.6-.3 2.2-.9.5.5 1 .9 1.6.9"/><path d="M12 5.2c.9-1.3 2.9-1.6 4.2-.6.9.6 1.3 1.6 1.2 2.6 1.5.4 2.4 1.9 2.1 3.4.9.8 1.2 2.1.7 3.2-.4.9-1.2 1.5-2.1 1.6-.1 1.6-1.4 2.9-3 2.9-.9 0-1.6-.3-2.2-.9"/><path d="M12 5.2v14"/><path d="M8.6 9.2c.8.2 1.4.9 1.4 1.8M15.4 9.2c-.8.2-1.4.9-1.4 1.8M8 14c1 .1 1.8-.4 2.2-1.2M16 14c-1 .1-1.8-.4-2.2-1.2"/>',
  // пламя (воля, дух)
  wil: '<path d="M12 21c-3.9 0-6.5-2.7-6.5-6.2 0-3.4 2.3-5.4 3.8-7.5.3 1.7 1.1 2.8 2.2 3.4-.3-3 .8-5.9 3.4-7.7-.1 3.1 1.4 4.8 2.8 6.6 1.1 1.4 1.8 3 1.8 5.2 0 3.5-2.6 6.2-6.5 6.2z"/><path d="M12 21c-1.7 0-2.9-1.2-2.9-2.8 0-1.8 1.4-2.8 2.4-4.4.5 1.2 1.6 1.7 2.5 2.4.6.5.9 1.2.9 2 0 1.6-1.2 2.8-2.9 2.8z"/>',
  // два человека (харизма)
  cha: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.6 2.7-6.2 6-6.2s6 2.6 6 6.2"/><circle cx="16.8" cy="9" r="2.6"/><path d="M15.6 14.1c.4-.1.8-.1 1.2-.1 2.6 0 4.6 2.2 4.6 5.2"/>',
  // нота + искра (творчество)
  cre: '<path d="M9 18.5V6.8l10-2.3v11.6"/><circle cx="6.6" cy="18.5" r="2.4"/><circle cx="16.6" cy="16.1" r="2.4"/><path d="M9 10.2l10-2.3"/>',
  // стопка монет (достаток)
  fin: '<ellipse cx="12" cy="6.5" rx="6.5" ry="2.5"/><path d="M5.5 6.5v4c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-4"/><path d="M5.5 10.5v4c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-4"/><path d="M5.5 14.5v3c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-3"/>',
};
const statIco = (k) => (ICO[k] ? '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + ICO[k] + "</svg>" : "");
const statLbl = (st, full) => '<span class="sti">' + statIco(st.k) + esc(full ? st.s + " · " + st.n : st.s) + "</span>";
function statListHtml(act, sel) {
  return '<div class="rlist" role="listbox" aria-label="Характеристика">' + STATS.map((x) => '<button type="button" class="ropt sopt" role="option" data-act="' + act + '" data-k="' + x.k + '" aria-pressed="' + (x.k === sel) + '" aria-selected="' + (x.k === sel) + '">' +
    '<span class="si">' + statIco(x.k) + '</span><span class="sn"><b>' + x.s + "</b> · " + esc(x.n) + '</span><span class="sh">' + esc(x.hint) + "</span></button>").join("") + "</div>";
}
const WD = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const wdOf = (s) => ((new Date(toUTC(s)).getUTCDay() + 6) % 7) + 1; // 1 = Пн … 7 = Вс
const plDays = (n) => (n % 10 === 1 && n % 100 !== 11 ? "день" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "дня" : "дней");
function repOf(tp) {
  const r = tp && tp.rep;
  if (!r || r.type === "daily") return { type: "daily" };
  if (r.type === "every") { const n = Math.round(num(r.n)); return n >= 2 && n <= 30 ? { type: "every", n } : { type: "daily" }; }
  if (r.type === "weekdays" && Array.isArray(r.days)) { const days = [...new Set(r.days.map(num))].filter((d) => d >= 1 && d <= 7).sort(); if (days.length) return { type: "weekdays", days }; }
  return { type: "daily" };
}
const tplStart = (tp) => (typeof tp.start === "string" && DATE_RE.test(tp.start) ? tp.start : typeof tp.createdAt === "number" ? dayOf(tp.createdAt) : today());
function ruleDue(r, start, d) {
  if (d < start) return false;
  if (r.type === "every") return Math.round((toUTC(d) - toUTC(start)) / 864e5) % r.n === 0;
  if (r.type === "weekdays") return r.days.includes(wdOf(d));
  return true;
}
const histOf = (tp) => (Array.isArray(tp.hist) ? tp.hist.filter((h) => h && typeof h.start === "string" && typeof h.until === "string") : []);
function versionAt(tp, d) {
  if (d >= tplStart(tp)) return tp;
  for (const h of histOf(tp)) if (h.start <= d && d < h.until) return h;
  return null;
}
function isDue(tp, d) {
  const v = versionAt(tp, d);
  return v ? ruleDue(repOf(v), v === tp ? tplStart(tp) : v.start, d) : false;
}
const firstStart = (tp) => histOf(tp).reduce((m, h) => (h.start < m ? h.start : m), tplStart(tp));
function nextDue(tp, from) { for (let i = 0, d = from; i < 40; i++, d = addDays(d, 1)) if (isDue(tp, d)) return d; return null; }
// выполнение повторов: по созданным дневным квестам (пропущенные дни система дописывает сама как проваленные)
function repStats(pid) {
  const by = {}, t0 = today();
  for (const t of tasksBy[pid] || []) {
    const id = typeof t.fromDaily === "string" ? t.fromDaily : null;
    if (!id || typeof t.date !== "string" || t.date > t0 || t.date < SEASON_START) continue;
    const g = (by[id] = by[id] || { id, title: t.title, rank: t.rank, last: "", due: 0, done: 0 });
    if (t.date >= g.last) { g.last = t.date; g.title = t.title; g.rank = t.rank; g.lt = t; }
    if ((t.date === t0 || isOff(pid, t.date)) && !t.done) continue;
    g.due++; if (t.done) g.done++;
  }
  for (const k in by) by[k].pct = by[k].due ? Math.round((by[k].done / by[k].due) * 100) : null;
  return by;
}
// v20: строка повтора: название + метка, параметры мелко, опыт справа, выполнение полоской
const pctCls = (p) => (p >= 70 ? "" : p >= 40 ? " y" : " r");
function repRowHtml(o) {
  const q = o.q || {}, xp = taskXp(q), st = o.st;
  const params = [isNewQ(q) ? qParams(q) : "", o.sched || ""].filter(Boolean).join(" · ");
  return '<div class="rr' + (isNewQ(q) && q.m === 0 ? " hab" : "") + '"><div class="rrm"><div class="rrt"><b>' + esc(o.title) + "</b>" + (isNewQ(q) ? kindTag(q.m) : "") + "</div>" + (params ? '<div class="rrp">' + esc(params) + "</div>" : "") + "</div>" +
    (xp ? '<span class="rrx">+' + xp + " XP</span>" : "") + (o.acts ? '<span class="rra">' + o.acts + "</span>" : "") +
    (st && st.due ? '<div class="rrb" title="Выполнено дней из тех, когда квест был по расписанию"><span class="pbar' + pctCls(st.pct) + '"><i style="width:' + st.pct + '%"></i></span><span class="rrn">' + st.done + " из " + st.due + " · " + st.pct + "%</span></div>" : "") + "</div>";
}
function repListHtml(pid) {
  const st = repStats(pid), weekAgo = addDays(today(), -7);
  const list = Object.values(st).filter((g) => g.last >= weekAgo && g.due).sort((a, b) => b.pct - a.pct);
  if (!list.length) return "";
  return fold("frep:" + pid, "Повторы · " + list.length, '<div class="rrl">' + list.map((g) => repRowHtml({ title: g.title, q: g.lt, st: g })).join("") + "</div>");
}
function repLabel(tp) {
  const r = repOf(tp);
  if (r.type === "every") return "каждые " + r.n + " " + plDays(r.n);
  if (r.type === "weekdays") return r.days.length === 7 ? "каждый день" : r.days.map((d) => WD[d - 1]).join(", ");
  return "каждый день";
}

// ---------- state ----------
let db = null, user = null, uid = null, isOwner = false, canWrite = false;
let roster = Object.fromEntries(PLAYERS.map((p) => [p.id, null]));
let rosterLoaded = false, claimsLoaded = false;
let claims = [];
let me = null, viewId = PLAYERS[0].id;
const tasksBy = Object.fromEntries(PLAYERS.map((p) => [p.id, []]));
const storiesBy = Object.fromEntries(PLAYERS.map((p) => [p.id, []]));
const votesBy = Object.fromEntries(PLAYERS.map((p) => [p.id, []]));
const loadedBy = {}, storyLoadedBy = {}, defBy = {};
const sealsBy = Object.fromEntries(PLAYERS.map((p) => [p.id, {}])); // до v31: печати от браузеров друзей (больше не учитываются)
// v31: печати пишет сервер (ws/{uid}/seal/main, каждую ночь в 4:10): итог мелких квестов за день и число квестов. Подделать нельзя.
const ssealBy = {};
let rosterMain = {}, rosterMeta = null, metaLoaded = false;
// v28: данные участника в группе от сервера: gAt (когда вступил, мс), carry (опыт из прошлых групп), cach (ачивки, уже учтённые в carry)
let gm = {};
const setGm = (o) => { gm = o && typeof o === "object" ? o : {}; };
const gMeta = (pid) => { const g = gm[pid] || {}; return { gAt: num(g.gAt), carry: Math.max(0, Math.round(num(g.carry))), cach: Array.isArray(g.cach) ? g.cach : [] }; };
function ensureSlots() {
  for (const p of PLAYERS) {
    if (!(p.id in roster)) roster[p.id] = null;
    if (!tasksBy[p.id]) tasksBy[p.id] = [];
    if (!storiesBy[p.id]) storiesBy[p.id] = [];
    if (!votesBy[p.id]) votesBy[p.id] = [];
    if (!sealsBy[p.id]) sealsBy[p.id] = {};
  }
}
window.SISTEMA_PLAYERS = () => PLAYERS.map((p) => ({ id: p.id, name: p.name }));
function rebuildRoster() {
  const meta = rosterMeta && Array.isArray(rosterMeta.players) ? rosterMeta.players : [];
  const list = BASE_PLAYERS.map((p) => ({ ...p, joined: SEASON_START }));
  for (const m of meta) {
    if (!m || typeof m.id !== "string" || !/^[A-Za-z0-9_-]{1,40}$/.test(m.id)) continue;
    const ex = list.find((x) => x.id === m.id);
    const clean = { id: m.id, name: typeof m.name === "string" && m.name.trim() ? m.name.trim().slice(0, 24) : ex ? ex.name : "Игрок", joined: typeof m.joined === "string" && DATE_RE.test(m.joined) ? m.joined : SEASON_START, archived: !!m.archived };
    if (ex) Object.assign(ex, clean); else list.push(clean);
  }
  PLAYERS = list;
  roster = Object.fromEntries(PLAYERS.map((p) => [p.id, typeof rosterMain[p.id] === "string" ? rosterMain[p.id] : null]));
  ensureSlots();
}
const sealsLoaded = {}, votesLoaded = {};
// голоса всех активных друзей загружены: только тогда сравниваем ачивки и подтверждения, иначе при входе всплывают «новые» старые события
const votesReady = () => PLAYERS.every((p) => !isActive(p) || votesLoaded[p.id]);
const subs = {};
let templates = [], templatesLoaded = false, subDaily = null;
let selStat = "int", selT = 7, selE = 1, selL = 1, xpAuto = true;
let selDays = new Set();
let sStat = "int", sRank = "A", sKind = "steps";
let storyFormOpen = false, proofOpen = null, extendOpen = null, delConfirm = null, editOpen = null;
let pickDismissed = false, reclaiming = false, ensuring = false;
const lastLevel = {};
const lastHtml = {};
const APP_VERSION = 31;
let remEdit = null;
let tab = "today", friendId = null, verifyCount = 0, adminPend = 0;
let openGrp = "", editTask = null, tplEdit = null, linkAvail = false;
const tplDays = new Set();
let prefs = {}, prefsLoaded = false, subPrefs = null, markingSeen = false, clockNotice = false;
const prefsBy = {}, reportsBy = {};
// v31: «был N мин назад» живёт в маленьком документе q/{uid}/meta/seen, чтобы не гонять друзьям весь prefs каждые 10 минут.
// В prefs.lastSeen пишем только первый заход за игровой день (по нему вечернее напоминание понимает, заходил ли игрок)
const seenBy = {};
let mySeenAt = 0;
const seenOf = (pid) => Math.max(num((prefsBy[pid] || {}).lastSeen), num(seenBy[pid]));
let bugStatus = {}, assetsApi = null, gLvl = 1, gQuery = "", tourStep = -1, tourAuto = false;
const profCache = new Map();
// ---------- выходной (v17) ----------
// prefs.offDays = [{ d: "2026-11-12", at: время объявления }]. Засчитывается, только если объявлен заранее
// или в тот же день до первой отметки; не больше 2 в месяц (первые по времени объявления). Проверяет каждый клиент.
const OFF_PER_MONTH = 2;
const dayStart = (d) => { const b = toUTC(d) - TZ; return b >= D4_FROM ? b + DAY_H * 3600e3 : b; }; // v30: начало игрового дня
const offCache = new Map();
function offSet(pid) {
  if (offCache.has(pid)) return offCache.get(pid);
  const p = pid === me ? prefs : prefsBy[pid] || {};
  const raw = Array.isArray(p.offDays) ? p.offDays : [];
  const ts = tasksBy[pid] || [];
  const ok = raw.filter((x) => x && typeof x.d === "string" && DATE_RE.test(x.d) && typeof x.at === "number" && x.d >= SEASON_START)
    .filter((x) => x.at < dayStart(x.d) || (dayOf(x.at) === x.d && !ts.some((t) => t.date === x.d && t.done && num(t.doneAt) && num(t.doneAt) < x.at)))
    .sort((a, b) => a.at - b.at);
  const per = {}, set = new Set();
  for (const x of ok) { const m = x.d.slice(0, 7); if ((per[m] || 0) >= OFF_PER_MONTH || set.has(x.d)) continue; per[m] = (per[m] || 0) + 1; set.add(x.d); }
  offCache.set(pid, set);
  return set;
}
const isOff = (pid, d) => !!pid && offSet(pid).has(d);
const offLeft = (d) => OFF_PER_MONTH - [...offSet(me)].filter((x) => x.slice(0, 7) === d.slice(0, 7)).length;
const MONTHS_IN = ["январе", "феврале", "марте", "апреле", "мае", "июне", "июле", "августе", "сентябре", "октябре", "ноябре", "декабре"];
const lastAch = {}, achToasted = new Set(), maxLvSeen = {};
const openKeys = new Set();
try { const k0 = JSON.parse(localStorage.getItem("sys.open") || "[]"); if (Array.isArray(k0)) k0.forEach((k) => typeof k === "string" && k.startsWith("st:") && openKeys.add(k)); } catch {}
const saveOpen = () => { try { localStorage.setItem("sys.open", JSON.stringify([...openKeys].filter((k) => k.startsWith("st:")))); } catch {} };
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
const mainPid = () => me || viewId;
const fold = (key, sum, body) => '<details class="fold" data-key="' + key + '"' + (openKeys.has(key) ? " open" : "") + "><summary>" + sum + "</summary>" + body + "</details>";
const plQuest = (n) => (n % 10 === 1 && n % 100 !== 11 ? "квест" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "квеста" : "квестов");
const NEWS = [
  { v: 31, date: "2026-11-23", title: "Скорость и защита", items: [
    "Сайт быстрее загружается и меньше грузит телефон: живой фон рисуется в 2 раза легче, рамки и уборы двигаются только в профиле и магазине, окно друга строит только открытую вкладку.",
    "На слабых телефонах живой фон выключается сам. Включить обратно можно в ⚙ Настройках → «Оформление».",
    "Квесты и отметки друзей приходят сразу из живого обновления, без перечитывания всего списка. Меньше трафика и батареи.",
    "Честные часы на сервере теперь тоже считаются от 4:00. С 4 до 6 утра отметки больше не отклоняются, а шаги сюжета после полуночи отмечаются вчерашним днём.",
    "Печати дня ставит сервер каждую ночь в 4:10, а не браузеры друзей. Подделать или испортить их больше нельзя.",
    "Защита: почту игроков видит только сам игрок, фото до 5 МБ и только картинки.",
  ] },
  { v: 30, date: "2026-11-23", title: "Чат как в мессенджере", items: [
    "Новый день начинается в 4:00 утра: засиделся после полуночи, спокойно отмечай свои квесты. Честные часы тоже считаются от 4:00.",
    "Чат: сообщения как в Telegram (имя над серией, время внутри), фото (📎), смайлы (🙂) и реакции: нажми на сообщение друга. Там же удаление.",
    "Чат на телефоне занимает весь экран: листаются только сообщения, поле ввода внизу.",
    "Вкладки «Обсуждения» больше нет. Споры по квестам в «Проверке» (блок «Идут споры»), комментарии к дневнику и стене под записью: о новых скажут цифра на «Дневнике» и точка на «Профиле».",
    "Комментарии можно удалять: свои, лидер любые в группе, помощник комментарии участников. Защита от спама: не больше 8 в минуту.",
    "Окно друга: имя сверху появляется, когда листаешь профиль вниз. Шестерёнка в профиле ровно по высоте с кнопкой очков.",
    "Вечернее напоминание учитывает и этапы сюжетных квестов.",
  ] },
  { v: 29, date: "2026-11-22", title: "Удобная проверка", items: [
    "Группа → Проверка: сверху то, где нужен твой голос, ниже «Лента друзей»: все квесты друзей за сутки, пока их можно оспорить. «Оспорить» и комментарии прямо в ленте, заходить в профиль не нужно.",
    "Подсказки «на что посмотреть»: квест на несколько часов создан и отмечен за минуты, отметки пачкой, долгий квест без фото, необычно много за день. Это не обвинение, а повод глянуть внимательнее.",
    "Фильтры ленты: все, «на что посмотреть» и по каждому другу. Новое с прошлого захода помечено, цифра на «Проверке» показывает, сколько непросмотренного.",
    "Окно друга: сверху широкая кнопка «Профиль» (открыт по умолчанию), под ней «Квесты» и «Сюжет». Квесты с кнопками «Оспорить» в один клик.",
    "Обсуждения: у каждого кнопка «открыть →». Она ведёт к самой вещи (квест, этап, запись в дневнике или стена, свои или друга) и подсвечивает её.",
    "Управление группой: действия с участником (помощник, передать лидерство, исключить) спрятаны под кнопку «⋯», список стал компактнее.",
    "В чате у своих сообщений теперь твоё имя вместо «Ты», шапка сообщения прижата влево без пустого места.",
    "Настройки: убран отдельный блок «Аккаунт» (почта и «Выйти» есть внизу страницы). Итоги сезона откроются всем одновременно 31 декабря в 18:00.",
  ] },
  { v: 28, date: "2026-11-22", title: "Группы", items: [
    "Пати стала группой «Система». Вкладка теперь называется «Группа»: сверху шапка с эмблемой, ниже Участники, Чат, Проверка и Обсуждения.",
    "Любой может создать свою группу и стать лидером. Друзья вступают по ссылке-приглашению, лидер или помощник принимает заявку. Порядок в группе держат лидер и помощники, владелец сайта больше не подтверждает каждого.",
    "Чат группы: переписка за последние 2 недели, системные сообщения о вступлении и ролях.",
    "Опыт на сервере: время создания и выполнения квестов ставит сервер, покупки в магазине и награды проводит сервер и сам считает очки. Отметить квест задним числом или дописать себе фон через API больше нельзя.",
    "Опыт в группе отдельно от общего: общий опыт и уровень идут с тобой в любую группу, а неделя, места и итоги в группе считаются с момента вступления. Накрутка в одной группе в другую не переносится.",
  ] },
  { v: 27, date: "2026-11-22", title: "Уборы и цвет сайта", items: [
    "Новый раздел магазина «Уборы»: 10 головных уборов поверх аватарки. Колпак со снежинками, кошачьи ушки (иногда дёргаются), цилиндр, ковбойская шляпа, наушники с бегущим звуком, рожки с дымком, шляпа волшебника со звёздами. Трофеи: нимб за «Идеальный день», шлем викинга за «Железную волю», корона за «Легенду».",
    "Ещё 6 живых фонов: осенний лес, подводный мир, горы на закате, неоновый ливень, вулкан, кибер-туннель.",
    "Ещё 6 живых рамок: листва, дымка, песчаный вихрь, звёздная пыль, руны, дракон. И 4 формы значка: сердце, молния, корона, крылья.",
    "Цвет сайта по фону профиля: надел сакуру, и фон всего сайта у тебя плавно становится розовым. Открыл профиль друга, и фон на это время в гамме его фона, закрыл, и вернулся твой. Выключается в ⚙ Настройках → «Оформление».",
  ] },
  { v: 26, date: "2026-11-22", title: "Интерфейс и магазин", items: [
    "Профиль друга на ПК больше не ужимается в узкую колонку: витрины во всю ширину, на ПК в 2 колонки, без рамки в рамке.",
    "Пати: сверху сразу друзья, «Обсуждения» свёрнуты в одну строку и показывают, сколько новых. Открыл, и они прочитаны.",
    "У блоков больше нет уголков-скобок. На ПК блок мягко подсвечивается, когда наводишь на него курсор.",
    "Шапка профиля аккуратнее: «в сети» ровно под именем, строка с классом и рангом не обрезается. Часы с одним знаком после запятой.",
    "Магазин: 10 новых фонов (снегопад, ливень, звёздное небо, дюны, океан, туманный лес, ночной город, лава, синтвейв), 8 рамок (двойное кольцо, ледяная, пульс, электрическая, голограмма, синее пламя, золотое кольцо), 2 формы значка (октагон, кристалл).",
    "Новые трофеи: фон «Восход» за «Идеальный день» и рамка «Хрусталь» за «Без провалов».",
    "«Гроза» переделана: тучи плывут, идёт косой дождь, молнии бьют в разное время и в разных местах, иногда двойной вспышкой.",
    "Живые фоны: все 18 фонов профиля теперь рисуются кодом кадр за кадром. Снег на трёх глубинах с ветром, дождь с брызгами, падающие звёзды, лепестки сакуры, светлячки в лесу, огни города, волны с бликами, сияние, лава и космос на видеокарте. Молнии каждый раз новые, с ветками.",
    "Живые рамки: пламя из частиц, электрические разряды, иней, волны, комета по кругу, блик на золоте. Рамка теперь лежит прямо на краю аватарки, без зазора.",
    "Фон двигается за мышкой или пальцем, получается глубина. В магазине сверху «примерка»: нажми на картинку вещи и сразу видишь её на себе вживую.",
    "Выключатель «Живой фон» в ⚙ Настройках → «Оформление» останавливает и фон профиля.",
  ] },
  { v: 25, date: "2026-11-20", title: "Профиль как в Steam", items: [
    "Внизу теперь 5 вкладок с иконками: Сегодня, Сюжет, Дневник, Пати, Профиль. «Статус» стал «Профилем», а вкладка «Ещё» превратилась в ⚙ Настройки (шестерёнка в профиле).",
    "Профиль: фон, рамка аватарки, значок уровня как в Steam (цвет меняется каждые 10 уровней), статус и «О себе».",
    "Витрины: ачивки (выбери до 6), любимый квест, текущий сюжет, статистика, недавняя активность за 2 недели, дневник, награды и стена. В «✎ Изменить профиль» можно выключить любую и поменять порядок.",
    "Очки 💠: 1 XP = 1 очко. В магазине фоны, рамки и форма значка. Покупка не отнимает опыт и уровень. Пять вещей с 🏆 не продаются, они открываются ачивками.",
    "Профиль друга (нажми на него в «Пати»): стена, на которой можно писать, и награды 🔥 💪 🧠 🎯 🌙 🤝 за 100 очков, одному другу одна в день.",
  ] },
  { v: 24, date: "2026-11-20", title: "Итоги сезона", items: [
    "31 декабря в 18:00 на «Сегодня» появится плашка «Итоги сезона 1 готовы». Внутри сторис о твоём сезоне, листаются нажатием справа.",
    "В сторис: опыт по месяцам, процент выполнения, лучшая серия и самый мощный день, главный квест и тот, что так и не дался, твой ритм по дням и часам, рост характеристик, сюжеты, ачивки и роль в пати.",
    "В конце номинации пати (Чемпион сезона, Железная серия, Ночной житель, Судья, Король провалов и другие), карточка-итог для скриншота и таблица пати.",
    "Итоги друзей тоже можно посмотреть. Всё считается из ваших квестов, ничего заполнять не нужно. До 31 декабря раздел скрыт.",
  ] },
  { v: 23, date: "2026-11-19", title: "Дневник", items: [
    "Новая вкладка «Дневник». Каждая запись это событие дня: настроение (5 смайлов) и текст. Записать можно только за сегодня.",
    "Новая запись по умолчанию 🔒 «только мне»: её видишь только ты, сервер не отдаёт её друзьям. Нажми на замок, чтобы стало 👁 «друзьям», и обратно.",
    "Открытые записи друзей во вкладке «Дневник → Друзья» и в окне друга в «Пати». Можно ставить реакции 🔥 ❤️ 😂 😮 💪 и писать комментарии.",
    "Править запись можно только в её день, удалить в любой момент. Кнопка «👀 Как видят друзья» покажет твой дневник их глазами.",
    "Опыта за дневник нет: он для тебя, не для очков.",
    "Исправления после проверки: уведомление о комментарии к записи в дневнике теперь ведёт в «Дневник» и показывает начало записи; ссылки #diary открывают нужную вкладку; комментарии в окне друга больше не путаются с вкладкой «Дневник»; в обучении и гайде появился «Дневник»; сайт в фоне реже обращается к серверу.",
  ] },
  { v: 22, date: "2026-11-18", title: "Сюжетные квесты заново", items: [
    "Сюжетный квест теперь это цель + срок + шаги. Создание на одной странице: цель, срок кнопками (неделя, 2 недели, месяц… или своя дата), характеристика, шаги. Букв B, A, S и счётчика больше нет.",
    "Шаг как квест дня: время × сложность × «нравится», опыт по той же формуле. У шага кнопки «дата» (мини-календарь, «Без даты», повтор до срока) и «время · сложность».",
    "Дата у шага необязательна. Отметить можно любой несделанный шаг до срока: он засчитается сегодняшним днём.",
    "На вкладке «Сегодня» новый блок «Сюжет сегодня»: шаги на сегодня, отметка там = отметка в квесте, порядок перетаскиванием.",
    "Лимит дня общий: 16 часов и 5 привычек на квесты дня и шаги сюжетов вместе. Честные часы и замок 🔒 действуют и для шагов, сервер это проверяет.",
    "Карточка квеста: сколько дней осталось, опыт, бонус, одна строка статуса. Внутри шаги по группам: Пропущено, Сегодня, Дальше, Без даты, Сделано, Убрано. Шаги можно добавлять, менять и убирать на ходу.",
    "Все шаги сделаны → квест сам уходит друзьям на проверку → одобрили → бонус +50% от опыта шагов. Пока никто не голосовал, можно «Вернуть с проверки».",
    "Срок вышел: «Продлить» (бонус за уже сделанное вдвое меньше, за оставшееся полный, продлевать можно сколько угодно) или «Закрыть без бонуса» (опыт за шаги остаётся). Бросить и создать заново больше невыгодно.",
    "Старые сюжетные квесты переводятся окном «Сюжет по новым правилам»: сделанные этапы остаются по 10 XP, остальным ставишь день и время.",
    "Сверху вкладки «Сюжет» короткое «Как это работает?». Гайд обновлён.",
    "Онлайн как в Steam, три состояния: зелёная точка «онлайн» (сайт на экране), жёлтая «отошёл» (сайт открыт, но свёрнут или 5 минут без действий), без точки «был …» (не в сети).",
    "Цвет полосы слева у сюжетного квеста теперь всегда про состояние: фиолетовый идёт или на проверке, красный нужно внимание, зелёный завершён. У старых квестов цвет больше не зависит от буквы.",
  ] },
  { v: 21, date: "2026-11-15", title: "Исправления", items: [
    "Исправлено: тост ачивки (например «Две недели») и окно нового уровня больше не повторяются, если снять галочку и отметить квест снова.",
    "Исправлено: «Уже норм 👍» обещал ачивку «Привычка сформирована», даже когда у повтора не набралось 5 выполнений с 👎. Теперь пишет про неё только когда она правда откроется.",
  ] },
  { v: 20, date: "2026-11-15", title: "Аккуратнее и удобнее", items: [
    "Повторяющиеся квесты (свои и у друзей): каждая строка на всю ширину. Название с меткой, ниже время, сложность и расписание, справа опыт, а выполнение показано цветной полоской.",
    "Меньше красного: «Проваленные за неделю» и «плохо идут» с маленьким бейджем-числом, совет по плохо идущим повторам в спокойной плашке с ⚠.",
    "Плашки под полем «Новый квест» растянуты на всю ширину, на телефоне по две в ряд.",
    "Выходной на любой день: «выбрать день» открывает календарь на этот и следующий месяц. Запланированные выходные видны списком, × отменяет. Лимит 2 в месяц считается по месяцу самого дня.",
    "Роза характеристик рисуется по общей планке (50 или больше, если кто-то перерос), поэтому одна прокачанная характеристика больше не выглядит раздутой.",
    "Заголовок «Характеристики» без цифр: они и так есть в списке.",
    "Карта активности на весь год по всей ширине. На телефоне листается вбок и сразу открыта на сегодняшнем дне.",
    "Подсказка дня на карте короче: «выполнено 1 из 6 · +10 XP».",
    "Итоги недели: «12 из 33» с полоской вместо красного «/ 21✗», ровные полоски в прошлых неделях, лучший день и рост характеристик отдельными карточками.",
    "«Прошлые обновления»: каждая версия отдельной вкладкой.",
    "Закрытые сообщения о багах старше недели спрятаны (не удалены), есть «показать старые».",
    "Ссылка внизу теперь «Нашёл баг или есть пожелания?».",
    "Свой порядок квестов дня: зажми точки ⠿ слева от квеста и перетащи. Порядок повторов запоминается на все дни, друзья видят квесты в том же порядке.",
    "Исправлено: плашка «📊 Итоги недели» на «Сегодня» была сжата в узкий столбик.",
  ] },
  { v: 19, date: "2026-11-14", title: "Перевод старых квестов на новый опыт", items: [
    "При первом входе всплывает окно «Новая система опыта»: все повторы с буквой и сегодняшние невыполненные квесты с буквой в одном списке.",
    "У каждого три выбора (время, сложность, 👎 / — / 👍) и сразу видно старый и новый опыт. Значения подставлены так, чтобы опыт не изменился: E = 15 мин, D = 30 мин, C = 1 ч, 👍.",
    "Внизу считается день: не больше 16 часов и 5 привычек. Если не влезает, сохранить нельзя.",
    "«Сохранить все»: всё меняется сразу, в том числе сегодняшние квесты из повторов (расписание «каждые N дней» не сдвигается).",
    "Правка повтора (✎) теперь сразу меняет и сегодняшний квест этого повтора, если он ещё не отмечен. Отмеченный остаётся как был, новое с завтра.",
    "«Позже»: окно больше не всплывает, а на «Сегодня» остаётся плашка «Перевести на новый опыт» с кнопкой.",
    "Выполненные и прошлые квесты не меняются, опыт за них остаётся.",
  ] },
  { v: 18, date: "2026-11-14", title: "Новый опыт: время, сложность, «нравится»", items: [
    "Вместо букв E–S у ежедневных квестов три ползунка: время (от 5 минут до 16 часов или «без времени»), сложность (лёгкий, средний, сложный) и «нравится» (👎, —, 👍). Опыт считается сразу, крупной цифрой.",
    "Формула: 20 XP за час средней задачи. Лёгкий ×0,5, сложный ×1,5. После 3 часов каждый следующий час идёт за половину. За 👎 +30% (за дисциплину), за — +15%.",
    "«Без времени» это ПРИВЫЧКА (зелёная метка): 3, 5 или 10 XP по сложности, не больше 5 в день. С временем это ЗАДАЧА (голубая метка).",
    "У дня 16 часов: ползунок времени упирается в то, что осталось свободным. Лимит мелочи 150 XP убран.",
    "Букв у квестов больше нет, буква осталась только у ранга охотника (уровня). Крупные B, A, S в ежедневных убраны, сюжет пока без изменений. Уже отправленные на проверку доживут по старым правилам.",
    "Проверки друзьями у ежедневных нет, только «Оспорить» в течение суток.",
    "Защита от накрутки: «честные часы» (выполнить можно не больше часов, чем прошло с 6:00), замок 🔒 на выполненном квесте (сначала сними галочку), друзья видят время, сложность и 👎, метка «⚠ необычно много» на карточке, а сервер сам отклоняет невозможное.",
    "Повтор с 👎 раз в неделю спросит «всё ещё не нравится?». Перешёл на 👍 после 5+ выполнений: ачивка «Привычка сформирована».",
    "«Крупная рыба» теперь за квест на 50+ XP, «Легенда» за 100 часов квестов за сезон. Полученные раньше ачивки остаются.",
    "Подсказка от пати теперь про время: «похожие квесты обычно на 30 мин».",
    "Старые квесты и прошлый опыт не менялись. Старые повторы дают свои 5, 10 или 20 XP, при правке ✎ открываются новые настройки.",
  ] },
  { v: 17, date: "2026-11-11", title: "Карта активности, выходной и живой фон", items: [
    "Карта активности в «Статусе» и у друга вместо «Журнала · 14 дней»: квадратик на каждый день сезона, чем больше выполнено, тем ярче. Золотая рамка: все квесты дня закрыты. Наведи (на ПК) или нажми (на телефоне): «выполнено 5 из 8, +65 XP».",
    "Выходной: 2 дня в месяц. Бери заранее («на завтра») или сегодня до первой отметки. В выходной повторы не создаются, провалов нет, серия не сгорает. Друзья видят «🌙 выходной».",
    "Напоминания: плашка «⏰» при создании квеста или ⏰ в строке квеста. В выбранное время придёт уведомление, если квест ещё не отмечен. У повтора время запоминается на все дни.",
    "Живой фон: вернулись сетка и свечение, а ещё они медленно плывут, летают искры. Цвет фона зависит от ранга охотника (от синего на E до красного на S), ночью звёзды, в декабре снег. Выключается в «Ещё → Оформление».",
    "Экран загрузки с советами про Систему, тайм-менеджмент и дисциплину. «Ещё совет» показывает следующий.",
    "Списки и блоки плавно раскрываются и сворачиваются, окна плавно закрываются.",
    "Надёжность: сайт сам проверяется автотестами перед каждой публикацией, ошибки с телефонов игроков записываются, чтобы их чинить, бэкап раз в месяц проверяется на восстановление, закрыты мелкие дыры по аудиту безопасности.",
    "Исправлено: с переезда на свой сайт (v12) пропал фон с сеткой и свечением.",
  ] },
  { v: 16, date: "2026-11-10", title: "Анимации, «Пнуть друга» и иконки", items: [
    "Анимации: выполненный квест вспыхивает, галочка прорисовывается, разлетаются искры (чем выше ранг, тем больше), а «+XP» летит в полоску опыта, и она плавно заполняется. На Android ещё лёгкая вибрация.",
    "Закрыл все квесты дня (от трёх) — окно системы «Все квесты дня выполнены». Друзья подтвердили квест B/A/S или сюжет — отдельное окно с опытом. Новый уровень и ачивки теперь печатаются как сообщение системы.",
    "Кнопки мягко вжимаются, подсветка вкладки переезжает, содержимое вкладки въезжает сбоку, новые квесты появляются плавно. Если в телефоне включено «Уменьшить движение», анимаций нет.",
    "«Пнуть друга»: в профиле друга, который сегодня не заходил, кнопка «👊 Пнуть». Ему придёт уведомление, что ты напоминаешь. Одному другу раз в день.",
    "Уведомление «Итоги недели готовы» в понедельник в 9:00. Его и «Пнуть» можно выключить в «Ещё → Уведомления».",
    "Характеристика выбирается списком, как ранг: с иконкой и подсказкой. Иконки (бицепс, мозг, пламя, люди, нота, монеты) теперь у характеристик везде: в квестах, в «Статусе», на плашке.",
    "«Прошлые недели» в «Статусе»: ровный список, в строке даты, опыт, место и полоска выполнено/провалено. Нажми на неделю, чтобы раскрыть её итоги целиком.",
    "Исправлено: при входе на сайт иногда всплывала ачивка, которая уже была получена раньше.",
  ] },
  { v: 15, date: "2026-11-09", title: "Аватарка на весь экран", items: [
    "Нажми на чужую аватарку в пати, в профиле друга или в обсуждении, и она откроется крупно на весь экран. Свою можно открыть в «Статусе» кнопкой «открыть».",
    "Новые аватарки сохраняются в 2 раза чётче (512 px). Старую можно перезалить, чтобы крупно она не была размытой.",
    "Исправлено: уведомления приходили с задержкой, когда телефон спал (например, голос друга пришёл только при открытии сайта). Теперь они отправляются срочными и приходят сразу.",
    "Исправлено: в «Статусе» цифры характеристик и в «Повторяющихся квестах» красная подсказка вылезали за рамку. Теперь у всего содержимого свёрнутых блоков есть отступы.",
    "Исправлено: вечернее напоминание в 21:00 могло не дойти. Сервер теперь ждёт дольше и записывает, кому и что ушло, чтобы сбой было видно.",
  ] },
  { v: 14, date: "2026-11-09", title: "Уведомления, аватарки и итоги недели", items: [
    "Push-уведомления на телефон и компьютер: друг ждёт твоего голоса, твой квест оспорили или проголосовали, новый комментарий в твоём обсуждении, вечером в 21:00 напоминание про незакрытые квесты. Включаются в «Ещё» → «Уведомления», каждый тип можно выключить.",
    "Нажал на уведомление, и сайт откроется сразу на нужной вкладке.",
    "Аватарки: во вкладке «Статус» нажми на свою букву и выбери картинку. Она обрежется в квадрат и появится в пати, в профиле и в обсуждениях.",
    "Итоги недели: каждый понедельник во вкладке «Статус» карточка за прошлую неделю: опыт, место в пати, выполнено и провалено, повторы, лучший день, рост характеристик. Прошлые недели в архиве.",
    "На «Сегодня» появляется плашка «Итоги недели готовы», пока ты их не посмотрел.",
    "Исправлено: в итогах недели рост характеристик показывался в XP (+100 ИНТ), теперь в очках, как в «Статусе» (ИНТ +4).",
    "Исправлено: при равном опыте за неделю игроки делят место, а не получают разные.",
    "Исправлено: длинные названия повторов на узком телефоне вылезали за край экрана.",
    "Исправлено: при выходе из аккаунта уведомления на этом устройстве отключаются, чтобы следующий вошедший не получал чужие.",
  ] },
  { v: 13, date: "2026-11-09", title: "Честные ранги и компактный статус", items: [
    "Новый выбор ранга: сразу видны все шесть с временем, примерами и кто проверяет. Ничего не пропадает после нажатия, работает и на телефоне.",
    "Мелкие ранги теперь по времени: E ≈ 15 минут, D ≈ 30 минут, C ≈ 1 час. Так у всех ровно 20 XP за час, дробить задачи невыгодно. Дело на 3 часа = три квеста C.",
    "Примеры в рангах теперь общие для всех, а не личные.",
    "Подсказка от пати: пишешь название, и сайт показывает, какой ранг обычно ставят для похожих квестов, с кнопкой «Поставить».",
    "У повторяющихся квестов виден процент выполнения: «18 из 25 · 72%». Ниже 40% подсвечивается красным с подсказкой. Повторы друга видно в его профиле.",
    "Вкладка «Статус» компактнее: сводка в одну строку, а характеристики, ачивки и журнал раскрываются по нажатию.",
    "Гайд: вместо зелёных галочек синяя точка только у непрочитанных и изменённых разделов.",
    "После обновления «Что нового» подсвечивается меткой «НОВОЕ», чтобы не пропустить.",
    "В пати теперь до 12 активных игроков.",
    "Из «Управления пати» убраны блоки переезда: «Входы на сайт» и «Догрузить фото».",
    "Сайт реже пересверяет данные с базой: живые обновления приходят сами, а трафика стало в несколько раз меньше.",
  ] },
  { v: 12, date: "2026-11-05", title: "Свой сайт", items: [
    "«Система» переехала с claude.ai на свой сайт: aitbatyr.github.io/rpg-irl. Все квесты, опыт, серии, голоса и фото перенесены.",
    "Вход по почте и паролю: «Создать аккаунт» при первом входе, дальше «Войти». Внизу страницы твоя почта и кнопка «Выйти». Есть «Забыл пароль».",
    "Сайт можно поставить на телефон как приложение: Chrome → меню ⋮ → «Добавить на главный экран».",
    "Фото-доказательства теперь прикрепляются и с телефона: в Chrome выбор файлов работает.",
    "Каждую ночь делается резервная копия всей базы, к ней можно вернуться на любой день.",
    "Новый игрок пишет имя, владелец подтверждает. Если это кто-то из старых игроков, владелец привязывает вход к его старому профилю со всем опытом.",
    "Фото открывается на весь экран прямо на сайте, а не в новой вкладке.",
    "Исправлена сетка ачивок: полученные ачивки больше не сжимаются.",
    "Сообщения о багах: владелец может закрыть неактуальное. У автора оно помечается «закрыто», его можно открыть снова.",
    "Исправлено: на вкладке «Пати» больше не висит цифра старых комментариев при каждом входе.",
    "Исправлено: новый игрок в момент вступления мог «заверить» чужие прошлые дни нулями, из-за чего у всех пропадал опыт за мелкие квесты и в журнале появлялось «изм.». Теперь печать ставится только за дни после вступления в пати, опыт вернулся.",
  ] },
  { v: 11, date: "2026-11-02", title: "Фото, обсуждения и онлайн", items: [
    "Доказательство прямо в квесте: до 3 фото при отправке крупного или сюжетного квеста на проверку и при ответе на спор. WhatsApp больше не обязателен.",
    "Обсуждения: под квестом на проверке или в споре можно писать комментарии, автор отвечает. Когда итог подведён, переписка остаётся для чтения.",
    "«Оспорить» сразу считается твоим голосом «нет», голосовать отдельно не нужно. Счётчик показывает все голоса: «голоса 1/3 · да 0 · нет 1».",
    "Правило 48 часов теперь зеркальное: через 48 часов решают те, кто проголосовал. «Да» больше, значит засчитано. «Нет» больше или ничья, значит отклонено.",
    "«Оспорить» и «Не засчитывать» теперь требуют причину. К «Подтверждаю» комментарий по желанию. Кнопка «Спросить» задаёт вопрос без голоса.",
    "Раздел «Обсуждения» во вкладке «Пати»: твои квесты и споры, где ты участвуешь. Новые комментарии видны на вкладке и в плашке.",
    "Бросая сюжетный квест, можно написать причину. Друзья увидят её неделю.",
    "Зелёная точка у тех, у кого сайт открыт прямо сейчас, и последнее посещение на карточке: «был 20 мин назад», «был вчера в 22:14».",
    "Исправлены устаревшие подсказки в спорах: теперь везде «пока большинство не подтвердит».",
  ] },
  { v: 10, date: "2026-11-02", title: "Пати больше трёх", items: [
    "В пати теперь можно добавлять новых игроков, до 6 активных.",
    "Новичок пишет своё имя при первом входе, владелец подтверждает запрос в «Управлении пати».",
    "Проверка крупных квестов идёт по большинству голосов друзей. Правило 48 часов остаётся.",
    "Средний опыт в день на карточках и в итогах сезона, чтобы честно сравнивать тех, кто пришёл позже.",
    "Неактивных можно отправить в архив: их данные сохраняются, но они не участвуют в неделе и голосованиях.",
  ] },
  { v: 9, date: "2026-10-27", title: "Гайд, сообщения о багах и проверка без зависаний", items: [
    "Гайд в три уровня: «Быстрый старт», «Основы», «Всё до мелочей». Шпаргалка с цифрами, поиск, отметки прочитанного. Открывается кнопкой «?» в шапке.",
    "Обучение при первом входе: несколько подсказок поверх сайта. Повторить можно из гайда.",
    "Раздел «Правила» переехал в гайд.",
    "«Сообщить о баге» во вкладке «Ещё» и внизу каждой вкладки: текст, скриншот, статус и ответ в «Мои сообщения».",
    "Молчание = согласие: если есть хотя бы одно «да» и ни одного «нет», через 48 ч квест засчитывается сам. Рядом таймер.",
    "Подсказка при выборе ранга: примеры, поле «Чем докажешь?» для B, A, S и предупреждение, если ранг не похож на название.",
    "Проваленные за неделю сгруппированы по квесту: «Задачи по физике ×5».",
    "В Пати видно, кто сегодня не заходил.",
    "Пропуски повторов записываются за все пропущенные дни сезона, а не только за 7.",
    "Исправлено: «да» по спору после печати дня больше не даёт ⚠ и возвращает опыт.",
    "Исправлено: печать дня больше не записывается по несколько раз.",
    "Текст темпа сюжета стал понятнее.",
    "Удалённые сюжетные квесты и прошлые расписания повторов сохраняются для итогов года.",
  ] },
  { v: 8, date: "2026-10-22", title: "Защита, удобство и соревнование", items: [
    "Лимит мелочи — 150 XP в день (с 22 октября).",
    "Настройки квеста — заметные плашки под полем: характеристика, ранг, повтор, сюжет. В уведомлении видно, что выбрано.",
    "Невыполненный сегодняшний квест можно поправить: нажми на название.",
    "Повторяющийся квест можно изменить (название, ранг, расписание) — со следующего дня.",
    "«На сегодня» теперь создаёт копию квеста, а провал остаётся в своём дне. Удалять можно только квесты, созданные сегодня.",
    "Этапы сюжетных квестов друзей можно оспорить в течение суток.",
    "Печать дня запоминает и число квестов: стереть провал задним числом не выйдет.",
    "Без связи с сервером времени квесты не создаются и не отмечаются.",
    "Квесты грузятся по месяцам — опыт не потеряется к декабрю.",
    "Отметка «прочитано» для «Что нового» хранится в базе и работает на всех устройствах.",
    "Ачивки во вкладке «Статус».",
    "«Неделя» в Пати: опыт каждого за 7 дней и места.",
    "1 января в Пати откроются итоги сезона 1.",
    "Окно друга стало короче.",
  ] },
  { v: 7, date: "2026-10-19", title: "Новый интерфейс", items: [
    "Вкладки: Сегодня, Сюжет, Статус, Пати, Ещё. На телефоне они внизу экрана.",
    "Короткая форма квеста: характеристика, ранг, повтор и сюжет спрятаны под строкой настроек. Последний выбор характеристики и ранга запоминается.",
    "Полоска статуса на экране «Сегодня»: уровень, опыт, серия, прогресс дня и лимит мелочи.",
    "Квесты друзей на проверку: цифра на вкладке «Пати» и напоминание на «Сегодня».",
    "Профиль друга открывается в отдельном окне и не подменяет твою страницу.",
    "Проваленные и повторяющиеся квесты свёрнуты в одну строку.",
    "Строка квеста стала чище: ранг — цветом полосы слева и буквой у опыта.",
    "Правила разбиты на короткие разделы.",
    "Вкладка «Что нового». Жёлтая точка на «Ещё» значит, что вышло обновление.",
  ] },
  { v: 6, date: "2026-10-17", title: "Гибкий повтор", items: [
    "Повтор квеста каждые N дней (от 2 до 30) или по выбранным дням недели.",
    "У повторяющихся квестов видно расписание и дату следующего раза.",
  ] },
  { v: 5, date: "2026-10-15", title: "Защита от читов", items: [
    "Голоса привязаны к названию и рангу квеста: правка после голосования их обнуляет.",
    "Печать дня: браузеры друзей запоминают итоги твоих прошедших дней.",
    "Кнопка «Оспорить» для мелких квестов друга в течение суток.",
    "Этапы, добавленные в сюжетный квест позже, опыта не дают.",
    "Пропущенные дни с повторяющимися квестами записываются как проваленные.",
  ] },
  { v: 4, date: "2026-10-15", title: "Редактирование сюжета", items: [
    "Этапы можно добавлять, переименовывать и убирать, цель счётчика — менять.",
    "Строка темпа: идёшь по графику, опережаешь или отстаёшь.",
  ] },
  { v: 3, date: "2026-10-15", title: "Сюжетные квесты", items: [
    "Цели на недели с дедлайном: этапы или счётчик.",
    "Дневной квест можно привязать к сюжетному.",
    "Повторяющиеся ежедневные квесты.",
  ] },
  { v: 2, date: "2026-10-15", title: "Аккаунты и защита", items: [
    "Игрок привязан к аккаунту, привязку подтверждает владелец.",
    "Писать можно только в свои квесты и голоса.",
    "Время сервера вместо часов телефона, лимит мелочи 100 XP в день, пометки ⚠.",
  ] },
  { v: 1, date: "2026-10-15", title: "Запуск", items: [
    "Ежедневные квесты, ранги E–S, уровни, характеристики и классы.",
    "Пати из трёх игроков и голосование за крупные квесты.",
    "Журнал опыта за 14 дней.",
  ] },
];

// ---------- validation / anti-cheat ----------
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function validTask(t) {
  return t && typeof t.title === "string" && (isNewQ(t) ? okMEL(t.m, t.e, t.l) : RANKS[t.rank]) && statOf(t.stat) && typeof t.date === "string" && DATE_RE.test(t.date);
}
function validStory(s) {
  if (s && !s.deleted && s.kind === "plan") return typeof s.title === "string" && statOf(s.stat) && typeof s.deadline === "string" && DATE_RE.test(s.deadline) && Array.isArray(s.steps) &&
    s.steps.every((x) => x && typeof x.t === "string" && (x.old || okMEL(x.m, x.e, x.l))) && s.steps.some((x) => !x.removed);
  return s && !s.deleted && typeof s.title === "string" && RANKS[s.rank] && RANKS[s.rank].big && statOf(s.stat) && typeof s.deadline === "string" && DATE_RE.test(s.deadline) &&
    ((s.kind === "steps" && Array.isArray(s.steps) && s.steps.some((x) => x && typeof x.t === "string" && !x.removed)) || (s.kind === "count" && num(s.target) > 0));
}
function flagOf(t) {
  if (typeof t.createdAt !== "number") return "нет отметки времени";
  if (t.date > today()) return "дата из будущего";
  const ref = typeof t.movedAt === "number" ? t.movedAt : t.createdAt;
  if (dayOf(ref) > t.date) return "создан задним числом";
  if (t.done && typeof t.doneAt === "number" && dayOf(t.doneAt) > t.date) return "отмечен после своего дня";
  return null;
}
const sigOf = (it, kind) => kind === "story"
  ? (isPlan(it) ? ["s", "p", it.stat, it.title, it.deadline, num(it.ext)] : ["s", it.rank, it.stat, it.title, it.deadline, it.extended ? 1 : 0]).join("|")
  : ["t", isNewQ(it) ? "x" + it.m + "." + it.e + "." + it.l : it.rank, it.stat, it.title, it.date].join("|");
function votesFor(item, kind, round) {
  if (round === undefined) round = item.submittedAt;
  const sig = sigOf(item, kind);
  const out = [];
  for (const p of PLAYERS) {
    if (p.id === item.player || !isActive(p)) continue;
    const v = votesBy[p.id].find((x) => x.task === item.id && (x.kind || "task") === kind && x.owner === item.player && x.round === round && x.sig === sig);
    if (v && (v.vote === "yes" || v.vote === "no")) out.push({ ...v, voter: p.id });
    else if (round === "dispute") {
      const dk = kind === "step" ? "sdispute" : "dispute";
      const d = votesBy[p.id].find((x) => x.kind === dk && x.task === item.id && x.owner === item.player);
      if (d) out.push({ vote: "no", voter: p.id, fromDispute: true, at: d.at });
    }
  }
  return out;
}
function disputesFor(t) {
  const out = [];
  for (const p of PLAYERS) {
    if (p.id === t.player || !isActive(p)) continue;
    if (votesBy[p.id].some((x) => x.kind === "dispute" && x.task === t.id && x.owner === t.player)) out.push(p.id);
  }
  return out;
}
function voteCounts(item, kind, round) {
  const vs = votesFor(item, kind, round);
  return { yes: vs.filter((v) => v.vote === "yes").length, no: vs.filter((v) => v.vote === "no").length };
}
function voteResult(item, kind, round, startAt) {
  const { yes, no } = voteCounts(item, kind, round);
  const others = Math.max(1, othersCount(item.player)), need = Math.floor(others / 2) + 1;
  if (yes >= need) return "approved";
  if (no > others - need) return "rejected";
  const rr = round === undefined ? item.submittedAt : round;
  const st = typeof startAt === "number" ? startAt : typeof rr === "number" ? rr : null;
  if (yes + no >= 1 && st != null && now() - st >= AUTO_MS) return yes > no ? "approved" : "rejected";
  return "pending";
}
function autoLeft(item, kind, round, startAt) {
  const { yes, no } = voteCounts(item, kind, round);
  const rr = round === undefined ? item.submittedAt : round;
  const st = typeof startAt === "number" ? startAt : typeof rr === "number" ? rr : null;
  if (yes <= no || st == null) return null;
  return Math.max(0, st + AUTO_MS - now());
}
function autoRej(item, kind, round, startAt) {
  const { yes, no } = voteCounts(item, kind, round);
  const rr = round === undefined ? item.submittedAt : round;
  const st = typeof startAt === "number" ? startAt : typeof rr === "number" ? rr : null;
  if (yes + no < 1 || yes > no || st == null) return null;
  return Math.max(0, st + AUTO_MS - now());
}
const rejTxt = (ms) => (ms == null ? "" : " · отклонится через " + Math.max(1, Math.ceil(ms / 3600e3)) + " ч");
function voteTxt(item, kind, round) {
  const { yes, no } = voteCounts(item, kind, round);
  return "голоса " + (yes + no) + "/" + othersCount(item.player) + " · да " + yes + " · нет " + no;
}
const autoTxt = (ms) => (ms == null ? "" : " · засчитается через " + Math.max(1, Math.ceil(ms / 3600e3)) + " ч");
function disputeAt(t) {
  let m = null;
  for (const p of PLAYERS) {
    if (p.id === t.player || !isActive(p)) continue;
    for (const x of votesBy[p.id]) if (x.kind === "dispute" && x.task === t.id && x.owner === t.player && typeof x.at === "number") m = m == null ? x.at : Math.min(m, x.at);
  }
  return m;
}
function taskState(t) {
  if (!t.done) return "todo";
  if (!taskBig(t)) {
    if (!disputesFor(t).length) return "done";
    const r = voteResult(t, "task", "dispute", disputeAt(t));
    return r === "approved" ? "done" : r === "rejected" ? "rejected" : "disputed";
  }
  return voteResult(t, "task");
}
const countsTask = (t) => !flagOf(t) && (taskState(t) === "done" || taskState(t) === "approved");

// ---------- story quests ----------
const storyOf = (pid, id) => (storiesBy[pid] || []).find((s) => s.id === id);
const linkedTasks = (s) => (tasksBy[s.player] || []).filter((t) => t.link === s.id && countsTask(t));
function stepInfo(s, i) {
  const st = s.steps[i] || {};
  if (st.removed) return { done: false, viaLink: false, removed: true, day: null, at: null };
  if (isPlan(s)) return { done: !!st.done, viaLink: false, day: st.done ? st.d || (typeof st.doneAt === "number" ? dayOf(st.doneAt) : null) : null, at: typeof st.doneAt === "number" ? st.doneAt : null };
  const lt = linkedTasks(s).filter((t) => num(t.linkStep) === i && t.linkStep != null);
  let day = null, at = null;
  if (st.done && typeof st.doneAt === "number") { day = dayOf(st.doneAt); at = st.doneAt; }
  for (const t of lt) if (!day || t.date < day) { day = t.date; at = t.doneAt || t.createdAt; }
  return { done: !!st.done || lt.length > 0, viaLink: !st.done && lt.length > 0, day, at };
}
function progress(s) {
  if (s.kind === "steps" || isPlan(s)) {
    let total = 0, done = 0;
    s.steps.forEach((x, i) => { if (x.removed) return; total++; if (stepInfo(s, i).done) done++; });
    return { done, total, full: done >= total };
  }
  const total = num(s.target);
  const done = Math.max(0, num(s.manual) + linkedTasks(s).reduce((a, t) => a + num(t.amount), 0));
  return { done, total, full: done >= total };
}
function storyState(s) {
  if (isPlan(s) && s.closed) return "closed";
  if (s.done) {
    const r = voteResult(s, "story");
    if (r === "approved" && typeof s.submittedAt === "number" && dayOf(s.submittedAt) > s.deadline) return "late";
    return r;
  }
  return today() > s.deadline ? "expired" : "active";
}
function stepsCopy(s, withRenames) {
  return s.steps.map((x, i) => {
    const o = { t: x.t, done: !!x.done };
    if (typeof x.doneAt === "number") o.doneAt = x.doneAt;
    if (x.removed) o.removed = true;
    if (x.added) o.added = true;
    if (withRenames && !x.removed) { const inp = $("se-" + s.id + "-" + i); const v = inp ? inp.value.trim().slice(0, 60) : ""; if (v) o.t = v; }
    return o;
  });
}
const stepItem = (s, i) => { const si = stepInfo(s, i), x = s.steps[i] || {}; return { id: s.id + "~" + i, player: s.player, rank: "D", stat: s.stat, title: x.t || "", date: si.day || "", ...(isPlan(s) && !x.old ? { m: x.m, e: x.e, l: x.l } : {}) }; };
function stepDisputes(s, i) {
  const iid = s.id + "~" + i, out = [];
  for (const p of PLAYERS) {
    if (p.id === s.player || !isActive(p)) continue;
    if (votesBy[p.id].some((x) => x.kind === "sdispute" && x.task === iid && x.owner === s.player)) out.push(p.id);
  }
  return out;
}
function stepDisputeAt(s, i) {
  const iid = s.id + "~" + i;
  let m = null;
  for (const p of PLAYERS) {
    if (p.id === s.player || !isActive(p)) continue;
    for (const x of votesBy[p.id]) if (x.kind === "sdispute" && x.task === iid && x.owner === s.player && typeof x.at === "number") m = m == null ? x.at : Math.min(m, x.at);
  }
  return m;
}
function stepState(s, i) {
  if (!stepDisputes(s, i).length) return "ok";
  const r = voteResult(stepItem(s, i), "step", "dispute", stepDisputeAt(s, i));
  return r === "approved" ? "ok" : r === "rejected" ? "rejected" : "disputed";
}
const storyReward = (s) => (isPlan(s) ? planBonus(s) : Math.round(RANKS[s.rank].xp * (s.extended ? 0.5 : 1)));

// ---------- day seals (witnessed by friends) ----------
function sealInfo(pid) {
  const caps = {}, cnt = {}, doc = ssealBy[pid];
  if (!doc || doc.uid !== roster[pid]) return { caps, cnt };
  if (doc.days) for (const d in doc.days) caps[d] = num(doc.days[d]);
  if (doc.tk) for (const d in doc.tk) cnt[d] = num(doc.tk[d]);
  return { caps, cnt };
}

// ---------- progression ----------
function levelInfo(xp) { let L = 1, need = 50, acc = 0; while (xp >= acc + need) { acc += need; L++; need = 50 + 25 * (L - 1); } return { L, into: xp - acc, need }; }
function hunter(L) { return L >= 30 ? "S" : L >= 20 ? "A" : L >= 15 ? "B" : L >= 10 ? "C" : L >= 5 ? "D" : "E"; }

if (window.__MOCK) window.__sysProfile = (pid) => profile(pid); // только тесты: сверка с сервером
function profile(pid) {
  if (profCache.has(pid)) return profCache.get(pid);
  const r = computeProfile(pid);
  profCache.set(pid, r);
  return r;
}
function computeProfile(pid, sealMode) {
  const ts = tasksBy[pid] || [], ss = storiesBy[pid] || [];
  const ev = [];
  for (const t of ts) if (countsTask(t) || (sealMode && !flagOf(t) && taskState(t) === "disputed")) ev.push({ key: "t:" + t.id, day: t.date, at: t.doneAt || t.createdAt || 0, xp: taskXp(t), small: !taskBig(t), stat: t.stat });
  for (const s of ss) {
    if (s.kind === "steps") s.steps.forEach((_, i) => {
      const si = stepInfo(s, i);
      if (si.done && !s.steps[i].added && si.day && si.day <= s.deadline && si.day <= today() && (si.viaLink || stepState(s, i) === "ok" || (sealMode && stepState(s, i) === "disputed"))) ev.push({ key: "st:" + s.id + ":" + i, day: si.day, at: si.at || 0, xp: STEP_XP, small: true, stat: s.stat });
    });
    if (isPlan(s)) s.steps.forEach((x, i) => {
      if (x.removed || !x.done) return;
      const day = x.d || (typeof x.doneAt === "number" ? dayOf(x.doneAt) : null);
      if (!day || day > today()) return;
      const sst = stepState(s, i), g = plStepXp(x);
      if (g > 0 && (sst === "ok" || (sealMode && sst === "disputed"))) ev.push({ key: "st:" + s.id + ":" + i, day, at: x.doneAt || 0, xp: g, small: true, stat: s.stat });
    });
    if (storyState(s) === "approved") ev.push({ key: "s:" + s.id, day: dayOf(s.submittedAt), at: s.submittedAt, xp: storyReward(s), small: false, stat: s.stat });
  }
  ev.sort((a, b) => a.at - b.at);
  const statByDay = {};
  const award = new Map(), sx = Object.fromEntries(STATS.map((s) => [s.k, 0])), xpByDay = {}, allByDay = {}, smallByDay = {}, doneDays = new Set();
  let xp = 0, gxp = 0;
  const G = gMeta(pid);
  const sealed = sealInfo(pid), seals = sealed.caps, rawSmall = {}, tampered = new Set();
  for (const d in sealed.cnt) if (ts.filter((t) => t.date === d).length < sealed.cnt[d]) tampered.add(d);
  for (const e of ev) {
    let g = e.xp;
    if (e.small) {
      const C = capFor(e.day);
      const raw = rawSmall[e.day] || 0; rawSmall[e.day] = raw + Math.max(0, Math.min(g, C - raw));
      const cap = !sealMode && seals[e.day] != null ? Math.min(C, seals[e.day]) : C;
      const used = smallByDay[e.day] || 0; g = Math.max(0, Math.min(g, cap - used)); smallByDay[e.day] = used + g;
      if (seals[e.day] != null && rawSmall[e.day] > seals[e.day]) tampered.add(e.day);
    }
    award.set(e.key, g); xp += g; sx[e.stat] += g;
    const sd = (statByDay[e.day] = statByDay[e.day] || {}); sd[e.stat] = (sd[e.stat] || 0) + g;
    allByDay[e.day] = (allByDay[e.day] || 0) + g; doneDays.add(e.day);
    if (num(e.at) >= G.gAt) { gxp += g; xpByDay[e.day] = (xpByDay[e.day] || 0) + g; } // v28: опыт в этой группе (с момента вступления)
  }
  // выходные не рвут серию и не считаются в неё
  let streak = 0, d = today();
  if (!doneDays.has(d)) d = addDays(d, -1);
  while (d >= SEASON_START && (doneDays.has(d) || isOff(pid, d))) { if (doneDays.has(d)) streak++; d = addDays(d, -1); }
  // ---- achievements (computed from data, never stored) ----
  const ach = {};
  const setA = (k, day) => { if (day && (!ach[k] || day < ach[k])) ach[k] = day; };
  const days = [...doneDays].sort();
  if (days.length) setA("first", days[0]);
  let run = 0, prev = null, best = 0, bestIn = 0;
  for (const dd of days) {
    let gap = prev ? addDays(prev, 1) : null; while (gap && gap < dd && isOff(pid, gap)) gap = addDays(gap, 1);
    run = prev && gap === dd ? run + 1 : 1; prev = dd; best = Math.max(best, run);
    if (dd <= LAST_DAY) bestIn = Math.max(bestIn, run);
    if (run === 3) setA("s3", dd); if (run === 7) setA("s7", dd); if (run === 14) setA("s14", dd); if (run === 30) setA("s30", dd);
  }
  const byDay = {};
  for (const t of ts) (byDay[t.date] = byDay[t.date] || []).push(t);
  for (const dd of Object.keys(byDay).sort()) { const l = byDay[dd]; if (l.length >= 5 && l.every(countsTask)) { setA("perfect", dd); break; } }
  let clean = 0;
  for (let dd = SEASON_START; dd < today(); dd = addDays(dd, 1)) {
    const l = byDay[dd] || [];
    if (isOff(pid, dd) && !l.some((t) => t.done)) continue;
    clean = l.length && l.every((t) => t.done && taskState(t) !== "rejected") ? clean + 1 : 0;
    if (clean >= 7) { setA("clean7", dd); break; }
  }
  const bigEv = ev.filter((e) => !e.small).sort((a, b) => a.at - b.at);
  if (bigEv.length) setA("bigB", bigEv[0].day);
  for (const t of ts) if (t.rank === "S" && !isNewQ(t) && countsTask(t)) setA("bigS", t.date);
  // v18: крупная рыба = квест на 50+ XP, легенда = 100 часов, привычка = повтор 👎 → 👍
  const newDone = ts.filter((t) => isNewQ(t) && countsTask(t)).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  let mins = 0;
  for (const t of newDone) { if (taskXp(t) >= 50) setA("bigB", t.date); mins += t.m; if (mins >= LEGEND_MIN) setA("bigS", t.date); }
  const byTpl = {};
  for (const t of newDone) if (typeof t.fromDaily === "string") (byTpl[t.fromDaily] = byTpl[t.fromDaily] || []).push(t);
  for (const k in byTpl) { let bad = 0; for (const t of byTpl[k]) { if (t.l === 0) bad++; else if (t.l === 2 && bad >= 5) { setA("habit", t.date); break; } } }
  for (const s of ss) if (storyState(s) === "approved") { setA("story", dayOf(s.submittedAt)); if (s.rank === "S") setA("bigS", dayOf(s.submittedAt)); }
  const doneTasks = ts.filter(countsTask).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (doneTasks.length >= 100) setA("q100", doneTasks[99].date);
  let achXp = 0;
  for (const a of ACH) if (ach[a.k]) {
    achXp += a.xp; xp += a.xp; allByDay[ach[a.k]] = (allByDay[ach[a.k]] || 0) + a.xp;
    if (!G.cach.includes(a.k)) { gxp += a.xp; xpByDay[ach[a.k]] = (xpByDay[ach[a.k]] || 0) + a.xp; }
  }
  // v28: общий опыт = перенесённый из прошлых групп (снимок сервера при переходе) + опыт в этой группе. xpHere: всё, что видно в этой группе
  const xpHere = xp; xp = G.carry + gxp;
  let week = 0; for (let i = 0; i < 7; i++) week += xpByDay[addDays(today(), -i)] || 0;
  let seasonXp = 0; for (const k in xpByDay) if (k <= LAST_DAY) seasonXp += xpByDay[k];
  const td = ts.filter((t) => t.date === today());
  const tdDone = td.filter((t) => t.done).length;
  const stats = Object.fromEntries(STATS.map((s) => [s.k, 10 + Math.floor(sx[s.k] / 25)]));
  const order = [...STATS].sort((a, b) => sx[b.k] - sx[a.k]).filter((s) => sx[s.k] > 0);
  const cls = order.length === 0 ? "Новичок" : order.length === 1 ? order[0].title : order[0].title + "-" + order[1].title;
  const pending = ts.filter((t) => taskState(t) === "pending").length + ss.filter((s) => storyState(s) === "pending").length;
  const activeStories = ss.filter((s) => storyState(s) === "active").length;
  const storiesDone = ss.filter((s) => storyState(s) === "approved").length;
  const endD = today() < LAST_DAY ? today() : LAST_DAY, j0 = joinedOf(pid);
  const daysIn = Math.max(1, Math.round((toUTC(endD) - toUTC(j0)) / 864e5) + 1);
  const perDay = Math.round(seasonXp / daysIn);
  return { statByDay, xp, gxp, xpHere, carry: G.carry, allByDay, li: levelInfo(xp), stats, streak, best, bestIn, td, tdDone, cls, xpByDay, smallByDay, tampered, pending, award, activeStories, ach, achXp, week, seasonXp, storiesDone, perDay, daysIn, smallToday: smallByDay[today()] || 0, todayXp: xpByDay[today()] || 0 };
}


const PLAN_TERMS = [[7, "1 неделя"], [14, "2 недели"], [30, "1 месяц"], [60, "2 месяца"], [90, "3 месяца"]];
const PLAN_MAX = 120;
const plStepXp = (x) => (x.old ? (x.added ? 0 : STEP_XP) : xpOf(x.m, x.e, x.l));
const plAlive = (s) => s.steps.filter((x) => !x.removed);
const plGot = (s) => s.steps.reduce((a, x, i) => a + (!x.removed && x.done && (!s.player || stepState(s, i) !== "rejected") ? plStepXp(x) : 0), 0);
function planBonus(s) {
  return Math.round(s.steps.reduce((a, x, i) => a + (!x.removed && x.done && stepState(s, i) !== "rejected" ? plStepXp(x) * 0.5 * (num(x.bk) || 1) : 0), 0));
}
const planBonusMax = (s) => Math.round(s.steps.reduce((a, x, i) => a + (x.removed ? 0 : x.done ? (s.player && stepState(s, i) === "rejected" ? 0 : plStepXp(x) * 0.5 * (num(x.bk) || 1)) : plStepXp(x) * 0.5), 0));

const PF_SHOP = {
  bg: [
    { id: "base", n: "Базовый", p: 0 }, { id: "neon", n: "Неоновая сетка", p: 300 }, { id: "snow", n: "Снегопад", p: 350 }, { id: "rain", n: "Ливень", p: 400 },
    { id: "sunset", n: "Закат", p: 450 }, { id: "stars", n: "Звёздное небо", p: 500 }, { id: "dunes", n: "Дюны", p: 500 }, { id: "ocean", n: "Океан", p: 550 },
    { id: "sakura", n: "Сакура", p: 600 }, { id: "forest", n: "Туманный лес", p: 600 }, { id: "city", n: "Ночной город", p: 750 }, { id: "aurora", n: "Северное сияние", p: 800 },
    { id: "lava", n: "Лава", p: 850 }, { id: "matrix", n: "Матрица", p: 900 }, { id: "synth", n: "Синтвейв", p: 1000 },
    { id: "autumn", n: "Осенний лес", p: 550 }, { id: "underwater", n: "Подводный мир", p: 700 }, { id: "peaks", n: "Горы на закате", p: 750 },
    { id: "neoncity", n: "Неоновый ливень", p: 950 }, { id: "volcano", n: "Вулкан", p: 1100 }, { id: "tunnel", n: "Кибер-туннель", p: 1200 },
    { id: "storm", n: "Гроза", tr: "s14" }, { id: "dawn", n: "Восход", tr: "perfect" }, { id: "cosmos", n: "Космос", tr: "q100" }],
  fr: [
    { id: "none", n: "Без рамки", p: 0 }, { id: "neon", n: "Неоновая", p: 200 }, { id: "double", n: "Двойное кольцо", p: 300 }, { id: "emerald", n: "Изумрудная", p: 350 },
    { id: "ice", n: "Ледяная", p: 400 }, { id: "pulse", n: "Пульс", p: 450 }, { id: "pixel", n: "Пиксельная", p: 500 }, { id: "electric", n: "Электрическая", p: 700 },
    { id: "holo", n: "Голограмма", p: 800 }, { id: "blueflame", n: "Синее пламя", p: 900 }, { id: "rainbow", n: "Радужная", p: 1000 }, { id: "gold", n: "Золотое кольцо", p: 1200 },
    { id: "leaves", n: "Листва", p: 350 }, { id: "smoke", n: "Дымка", p: 450 }, { id: "sand", n: "Песчаный вихрь", p: 600 }, { id: "stardust", n: "Звёздная пыль", p: 750 },
    { id: "runes", n: "Руны", p: 900 }, { id: "dragon", n: "Дракон", p: 1300 },
    { id: "fire", n: "Огненная", tr: "s30" }, { id: "crystal", n: "Хрусталь", tr: "clean7" }, { id: "crown", n: "Корона", tr: "bigS" }],
  bd: [
    { id: "circle", n: "Круг", p: 0 }, { id: "shield", n: "Щит", p: 250 }, { id: "diamond", n: "Ромб", p: 250 },
    { id: "octa", n: "Октагон", p: 400 }, { id: "hex", n: "Гексагон", p: 500 }, { id: "gem", n: "Кристалл", p: 600 },
    { id: "heart", n: "Сердце", p: 350 }, { id: "bolt", n: "Молния", p: 450 }, { id: "crownb", n: "Корона", p: 700 }, { id: "wings", n: "Крылья", p: 900 }, { id: "star", n: "Звезда", tr: "story" }],
  hat: [
    { id: "none", n: "Без убора", p: 0 }, { id: "santa", n: "Новогодний колпак", p: 250 }, { id: "catears", n: "Кошачьи ушки", p: 300 }, { id: "tophat", n: "Цилиндр", p: 350 },
    { id: "cowboy", n: "Ковбойская шляпа", p: 400 }, { id: "headphones", n: "Наушники", p: 450 }, { id: "horns", n: "Рожки", p: 500 }, { id: "wizard", n: "Шляпа волшебника", p: 700 },
    { id: "halo", n: "Нимб", tr: "perfect" }, { id: "viking", n: "Шлем викинга", tr: "s30" }, { id: "crown", n: "Корона", tr: "bigS" }],
};

const PF_CATS = [["bg", "Фоны"], ["fr", "Рамки"], ["bd", "Значок"], ["hat", "Уборы"]];
const PF_ITEM = {}; for (const c in PF_SHOP) for (const it of PF_SHOP[c]) PF_ITEM[c + ":" + it.id] = { ...it, cat: c };
const PF_DEF = { bg: "base", fr: "none", bd: "circle", hat: "none" };
const PF_SC = [["ach", "Витрина ачивок"], ["fav", "Любимый квест"], ["story", "Текущий сюжет"], ["stats", "Статистика"], ["recent", "Недавняя активность"], ["diary", "Дневник"], ["awards", "Награды"], ["wall", "Стена"]];
const PF_SC_KEYS = PF_SC.map((x) => x[0]);
const PF_AWARDS = [["🔥", "Огонь"], ["💪", "Респект"], ["🧠", "Мозг"], ["🎯", "Снайпер"], ["🌙", "Сова"], ["🤝", "Поддержка"]];
const PF_AWARD_COST = 100, PF_ST = 60, PF_AB = 300;

function profOf(pid) {
  const raw = ((pid === me ? prefs : prefsBy[pid]) || {}).prof || {};
  const str = (v, n) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");
  const own = Array.isArray(raw.own) ? [...new Set(raw.own.filter((k) => typeof k === "string" && PF_ITEM[k] && PF_ITEM[k].p > 0))] : [];
  const show = Array.isArray(raw.show) ? [...new Set(raw.show.filter((k) => PF_SC_KEYS.includes(k)))] : PF_SC_KEYS.slice();
  const ach = Array.isArray(raw.ach) ? [...new Set(raw.ach.filter((k) => ACH.some((a) => a.k === k)))].slice(0, 6) : null;
  const eq = { ...PF_DEF };
  if (raw.eq && typeof raw.eq === "object") for (const c of ["bg", "fr", "bd", "hat"]) if (typeof raw.eq[c] === "string" && PF_ITEM[c + ":" + raw.eq[c]]) eq[c] = raw.eq[c];
  return { status: str(raw.status, PF_ST), about: typeof raw.about === "string" ? raw.about.trim().slice(0, PF_AB) : "", own, show, ach, eq };
}
const pfAwardsBy = (pid) => (votesBy[pid] || []).filter((x) => x && x.kind === "award" && typeof x.owner === "string" && x.owner !== pid && PF_AWARDS.some((a) => a[0] === x.e));
const pfSpent = (pid) => profOf(pid).own.reduce((a, k) => a + PF_ITEM[k].p, 0) + pfAwardsBy(pid).length * PF_AWARD_COST;
const pfPoints = (pid) => profile(pid).xp - pfSpent(pid);

  return {
    // o: { players: [{id,name,joined,archived}], roster: {pid: uid}, gm: {pid: {gAt, carry, cach}}, tasks: {pid: [...]}, stories, votes, seals, sseal: {pid: doc}, prefs }
    load(o) {
      PLAYERS = o.players.map((p) => ({ ...p })); roster = { ...o.roster }; ensureSlots();
      if (typeof setGm === "function") setGm(o.gm || {});
      for (const p of PLAYERS) {
        tasksBy[p.id] = ((o.tasks || {})[p.id] || []).map((x) => ({ ...x, player: p.id })).filter(validTask);
        storiesBy[p.id] = ((o.stories || {})[p.id] || []).map((x) => ({ ...x, player: p.id })).filter(validStory);
        votesBy[p.id] = (o.votes || {})[p.id] || [];
        sealsBy[p.id] = (o.seals || {})[p.id] || {};
        ssealBy[p.id] = (o.sseal || {})[p.id] || null; // v31: печать сервера
        prefsBy[p.id] = (o.prefs || {})[p.id] || {};
      }
      me = null; profCache.clear(); offCache.clear();
    },
    profile, levelInfo, xpOf, PLAYERS: () => PLAYERS, tasksOf: (pid) => tasksBy[pid] || [],
    pfItem: (k) => PF_ITEM[k] || null, profOf, pfPoints, pfAwardsBy, PF_AWARDS: () => PF_AWARDS, PF_AWARD_COST,
  };
}

return { makeCore };
})();
const { memCtx } = (() => {
// «Система» · v28: та же база, что у функции sys, но в памяти (тесты и мок сайта).
function memCtx(docs, uid, opts = {}) {
  const cl = (x) => (x == null ? null : JSON.parse(JSON.stringify(x)));
  const depth = (p) => p.split("/").length;
  return {
    uid, admin: !!opts.admin, now: opts.now || (() => Date.now()),
    get: async (p) => cl(docs[p]),
    put: async (p, d) => { docs[p] = cl(d); if (opts.onWrite) opts.onWrite(p); },
    del: async (p) => { delete docs[p]; if (opts.onWrite) opts.onWrite(p); },
    list: async (coll) => Object.keys(docs).filter((k) => k.startsWith(coll + "/") && depth(k) === depth(coll) + 1).map((k) => ({ id: k.split("/").pop(), data: cl(docs[k]) })),
    pidTaken: async (pid) => Object.keys(docs).some((k) => k.startsWith("pl/") && docs[k] && docs[k].pid === pid),
    users: async (uids) => {
      const out = {};
      for (const u of uids) {
        const of = (c) => Object.keys(docs).filter((k) => k.startsWith(c + "/") && depth(k) === depth(c) + 1).map((k) => ({ ...cl(docs[k]), id: k.split("/").pop() }));
        out[u] = { tasks: of("q/" + u + "/tasks"), story: of("q/" + u + "/story"), votes: of("v/" + u + "/votes").map(({ id, ...x }) => x), seals: Object.fromEntries(of("w/" + u + "/seals").map(({ id, ...x }) => [id, x])), sseal: cl(docs["ws/" + u + "/seal/main"]), prefs: cl(docs["q/" + u + "/meta/prefs"]) || {} };
      }
      return out;
    },
  };
}

return { memCtx };
})();
const { handle } = (() => {
// «Система» · v28: серверная логика групп, покупок и наград. Один и тот же файл работает
// в функции Supabase (sys/index.ts) и в тестах (мок базы в браузере). Опыт считает core.js: тот же код, что на сайте.
//
// Документы (пишет только сервер, кроме чата):
//   pl/{uid}            игрок: { pid, name, gid, role, carry, gAt, cach, joined, req, reqName, at }
//   g/{gid}/info        группа: { name, about, emb, col, lead, inv, at, members: { pid: { uid, name, role, joined, gAt, carry, cach } } }
//   g/{gid}/req/{uid}   заявка: { pid, name, note, at, xp, L }
//   g/{gid}/chat/{id}   чат: { by, pid, t, at } от игрока или { sys, t, at } от сервера
//   gi/{code}           приглашение → { gid }
// carry: опыт из прошлых групп (снимок при переходе), gAt: когда вступил (мс), cach: ачивки, уже вошедшие в carry.

const EMB = ["⚡", "🐺", "🦅", "🐉", "🔥", "🌙", "🦁", "🗡️", "🛡️", "⭐", "🌊", "🌿", "🎧", "📚", "🏔️", "🚀"];
const COL = ["#5ec8ff", "#ffcf5c", "#49e3a0", "#b48cff", "#ff5d73", "#ff9d4d", "#ff9ecf", "#7cf3ff"];
const MAX_MEMBERS = 30;
const TZ = 5 * 3600e3;
// v30: игровой день с 4:00 (как на сайте)
const D4_FROM = Date.UTC(2026, 10, 22, 23);
const dayOf = (ms) => new Date(ms + TZ - (ms >= D4_FROM ? 4 * 3600e3 : 0)).toISOString().slice(0, 10);
const str = (v, n) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");
const AB = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const rnd = (n, abc = "abcdefghijklmnopqrstuvwxyz0123456789") => { let s = ""; const r = crypto.getRandomValues(new Uint8Array(n)); for (const x of r) s += abc[x % abc.length]; return s; };
class Err extends Error {}
const no = (m) => { throw new Err(m); };

// ctx: { now(), uid, admin, get(path), put(path, data), del(path), list(coll, {gte?}), users(uids) → { uid: { tasks, story, votes, seals, prefs } }, pidTaken(pid) }
async function handle(ctx, body) {
  try {
    const a = String((body && body.a) || "");
    const fn = ACT[a];
    if (!fn) no("Неизвестное действие.");
    return { ok: true, ...(await fn(ctx, body || {})) };
  } catch (e) {
    if (e instanceof Err) return { ok: false, error: e.message };
    throw e;
  }
}

// ---------- опыт ----------
// Профили участников в контексте: группа (все её участники) или один игрок без группы.
async function coreFor(ctx, members) {
  const data = await ctx.users(members.map((m) => m.uid));
  const core = makeCore(() => ctx.now());
  const o = { players: [], roster: {}, gm: {}, tasks: {}, stories: {}, votes: {}, seals: {}, sseal: {}, prefs: {} };
  for (const m of members) {
    const d = data[m.uid] || {};
    o.players.push({ id: m.pid, name: m.name, joined: m.joined || "2026-10-15" });
    o.roster[m.pid] = m.uid;
    o.gm[m.pid] = { gAt: m.gAt || 0, carry: m.carry || 0, cach: m.cach || [] };
    o.tasks[m.pid] = d.tasks || []; o.stories[m.pid] = d.story || []; o.votes[m.pid] = d.votes || []; o.seals[m.pid] = d.seals || {}; o.sseal[m.pid] = d.sseal || null; o.prefs[m.pid] = d.prefs || {};
  }
  core.load(o);
  return core;
}
// ---------- v31: печати ставит сервер ----------
// Каждую ночь (4:10, после конца игрового дня) для каждого участника группы фиксируем итог прошедших дней:
// days[d] = опыт мелких квестов, tk[d] = число квестов. Дальше ядро не даст опыту за этот день вырасти задним числом.
// Первый раз переносим старые печати от браузеров друзей (берём минимум, как раньше), дальше дописываем только новые дни.
const addDays = (d, n) => new Date(Date.parse(d + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
async function sealAll(ctx) {
  const pls = (await ctx.list("pl")).map((r) => ({ uid: r.id, ...r.data })).filter((p) => p.pid && p.gid);
  const gids = [...new Set(pls.map((p) => p.gid))], y = addDays(dayOf(ctx.now()), -1);
  let wrote = 0;
  for (const gid of gids) {
    const info = await ctx.get("g/" + gid + "/info"); if (!info) continue;
    const members = membersOf(info); if (!members.length) continue;
    const core = await coreFor(ctx, members);
    for (const m of members) {
      const path = "ws/" + m.uid + "/seal/main", cur = await ctx.get(path);
      const doc = cur && cur.uid === m.uid ? { uid: m.uid, days: { ...(cur.days || {}) }, tk: { ...(cur.tk || {}) } } : { uid: m.uid, days: {}, tk: {} };
      if (!cur) for (const w of members) {
        if (w.pid === m.pid) continue;
        const old = await ctx.get("w/" + w.uid + "/seals/" + m.pid);
        if (!old || old.uid !== m.uid) continue;
        const from = w.joined || "2026-10-15";
        for (const d in old.days || {}) if (d >= from && d <= y) doc.days[d] = doc.days[d] == null ? Number(old.days[d]) || 0 : Math.min(doc.days[d], Number(old.days[d]) || 0);
        for (const d in old.tk || {}) if (d >= from && d <= y) doc.tk[d] = Math.max(doc.tk[d] || 0, Number(old.tk[d]) || 0);
      }
      const p = core.profile(m.pid), tasks = core.tasksOf(m.pid);
      for (let d = m.joined && m.joined > "2026-10-15" ? m.joined : "2026-10-15"; d <= y; d = addDays(d, 1)) {
        if (doc.days[d] == null) doc.days[d] = p.smallByDay[d] || 0;
        if (doc.tk[d] == null) doc.tk[d] = tasks.filter((t) => t.date === d).length;
      }
      const was = cur ? JSON.stringify({ uid: cur.uid, days: cur.days || {}, tk: cur.tk || {} }) : "";
      if (JSON.stringify(doc) !== was) { await ctx.put(path, { ...doc, at: ctx.now() }); wrote++; }
    }
  }
  return { ok: true, wrote, day: y };
}
const membersOf = (info) => Object.entries((info && info.members) || {}).map(([pid, m]) => ({ pid, ...m }));
const soloOf = (pl, uid) => [{ pid: pl.pid, uid, name: pl.name, joined: pl.joined, gAt: pl.gAt || 0, carry: pl.carry || 0, cach: pl.cach || [] }];
// снимок при переходе: весь опыт сейчас становится «перенесённым», ачивки помечаются учтёнными
async function snapshot(ctx, members, pid) {
  const core = await coreFor(ctx, members);
  const p = core.profile(pid), m = members.find((x) => x.pid === pid);
  return { carry: p.xp, cach: [...new Set([...(m.cach || []), ...Object.keys(p.ach)])], L: p.li.L, core, p };
}
async function myCtx(ctx) {
  const pl = await ctx.get("pl/" + ctx.uid);
  if (!pl) no("Сначала назови себя в Системе.");
  const info = pl.gid ? await ctx.get("g/" + pl.gid + "/info") : null;
  return { pl, info, members: info ? membersOf(info) : soloOf(pl, ctx.uid) };
}
const roleIn = (info, pid) => (info && info.members && info.members[pid] ? info.members[pid].role : null);
async function sysMsg(ctx, gid, t) { const at = ctx.now(); await ctx.put("g/" + gid + "/chat/" + at.toString(36) + "s" + rnd(4), { sys: 1, t: t.slice(0, 300), at }); }
async function newInvite(ctx, gid) { for (let i = 0; i < 5; i++) { const c = rnd(8, AB); if (!(await ctx.get("gi/" + c))) { await ctx.put("gi/" + c, { gid }); return c; } } no("Не получилось создать ссылку, попробуй ещё раз."); }
const lockedGroup = (info) => { if (!info) no("Группа не найдена."); return info; };

const ACT = {
  // регистрация: имя игрока в Системе (без одобрения владельца сайта)
  async reg(ctx, b) {
    const ex = await ctx.get("pl/" + ctx.uid);
    if (ex) return { pl: ex };
    const name = str(b.name, 24);
    if (!name) no("Напиши имя.");
    let pid = null;
    const rm = (await ctx.get("roster/main")) || {};
    for (const k in rm) if (rm[k] === ctx.uid) pid = k; // старый игрок пати: его опыт и голоса привязаны к старому id
    if (!pid) for (let i = 0; i < 6 && !pid; i++) { const c = "p-" + rnd(6); if (!(await ctx.pidTaken(c))) pid = c; }
    if (!pid) no("Не получилось, попробуй ещё раз.");
    const pl = { pid, name, gid: null, role: null, carry: 0, gAt: 0, cach: [], joined: dayOf(ctx.now()), req: null, reqName: null, at: ctx.now() };
    await ctx.put("pl/" + ctx.uid, pl);
    return { pl };
  },
  async rename(ctx, b) {
    const { pl, info } = await myCtx(ctx);
    const name = str(b.name, 24); if (!name) no("Напиши имя.");
    await ctx.put("pl/" + ctx.uid, { ...pl, name });
    if (info) { info.members[pl.pid].name = name; await ctx.put("g/" + pl.gid + "/info", info); }
    return {};
  },
  async create(ctx, b) {
    const { pl, members } = await myCtx(ctx);
    if (pl.gid) no("Ты уже в группе. Чтобы создать свою, сначала выйди.");
    const name = str(b.name, 30); if (name.length < 2) no("Название от 2 символов.");
    const emb = EMB.includes(b.emb) ? b.emb : EMB[0], col = COL.includes(b.col) ? b.col : COL[0];
    const s = await snapshot(ctx, members, pl.pid);
    if (pl.req) await dropReq(ctx, pl);
    const gid = "g-" + rnd(8), now = ctx.now();
    const inv = await newInvite(ctx, gid);
    const info = { name, about: str(b.about, 200), emb, col, lead: pl.pid, inv, at: now, members: { [pl.pid]: { uid: ctx.uid, name: pl.name, role: "lead", joined: dayOf(now), gAt: now, carry: s.carry, cach: s.cach } } };
    await ctx.put("g/" + gid + "/info", info);
    await ctx.put("pl/" + ctx.uid, { ...pl, gid, role: "lead", req: null, reqName: null });
    await sysMsg(ctx, gid, pl.name + " создал группу «" + name + "»");
    return { gid };
  },
  async preview(ctx, b) {
    const code = String(b.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const gi = code ? await ctx.get("gi/" + code) : null;
    const info = gi ? await ctx.get("g/" + gi.gid + "/info") : null;
    if (!info || info.inv !== code) no("Ссылка не работает: её отключили или в ней ошибка. Попроси новую.");
    const ms = membersOf(info);
    return { g: { gid: gi.gid, name: info.name, about: info.about || "", emb: info.emb, col: info.col, n: ms.length, lead: (ms.find((m) => m.role === "lead") || {}).name || "" } };
  },
  async request(ctx, b) {
    const { pl, members } = await myCtx(ctx);
    if (pl.gid) no("Ты уже в группе. Чтобы перейти, сначала выйди из неё.");
    const { g } = await ACT.preview(ctx, b);
    if (g.n >= MAX_MEMBERS) no("В группе уже " + MAX_MEMBERS + " участников, это максимум.");
    if (pl.req) await dropReq(ctx, pl);
    const s = await snapshot(ctx, members, pl.pid);
    await ctx.put("g/" + g.gid + "/req/" + ctx.uid, { pid: pl.pid, name: pl.name, note: str(b.note, 120), at: ctx.now(), xp: s.carry, L: s.L });
    await ctx.put("pl/" + ctx.uid, { ...pl, req: g.gid, reqName: g.name });
    return { g };
  },
  async cancel(ctx) {
    const { pl } = await myCtx(ctx);
    if (pl.req) await dropReq(ctx, pl);
    await ctx.put("pl/" + ctx.uid, { ...pl, req: null, reqName: null });
    return {};
  },
  async approve(ctx, b) {
    const { pl, info } = await myCtx(ctx);
    const r = roleIn(info, pl.pid); if (r !== "lead" && r !== "helper") no("Принимать заявки могут лидер и помощники.");
    const u = String(b.uid || ""), req = await ctx.get("g/" + pl.gid + "/req/" + u);
    if (!req) no("Заявки уже нет.");
    const tp = await ctx.get("pl/" + u);
    if (!tp || tp.gid) { await ctx.del("g/" + pl.gid + "/req/" + u); no("Игрок уже в другой группе."); }
    if (membersOf(info).length >= MAX_MEMBERS) no("В группе уже " + MAX_MEMBERS + " участников.");
    const s = await snapshot(ctx, soloOf(tp, u), tp.pid), now = ctx.now();
    info.members[tp.pid] = { uid: u, name: tp.name, role: "member", joined: dayOf(now), gAt: now, carry: s.carry, cach: s.cach };
    await ctx.put("g/" + pl.gid + "/info", info);
    await ctx.del("g/" + pl.gid + "/req/" + u);
    await ctx.put("pl/" + u, { ...tp, gid: pl.gid, role: "member", carry: s.carry, cach: s.cach, gAt: now, req: null, reqName: null });
    await sysMsg(ctx, pl.gid, tp.name + " вступил в группу (принял " + pl.name + ")");
    return {};
  },
  async reject(ctx, b) {
    const { pl, info } = await myCtx(ctx);
    const r = roleIn(info, pl.pid); if (r !== "lead" && r !== "helper") no("Отклонять заявки могут лидер и помощники.");
    const u = String(b.uid || "");
    await ctx.del("g/" + pl.gid + "/req/" + u);
    const tp = await ctx.get("pl/" + u);
    if (tp && tp.req === pl.gid) await ctx.put("pl/" + u, { ...tp, req: null, reqName: null, rejected: info.name });
    return {};
  },
  async kick(ctx, b) {
    const { pl, info, members } = await myCtx(ctx);
    const r = roleIn(info, pl.pid), t = info && info.members[b.pid];
    if (!t) no("Такого участника нет.");
    if (b.pid === pl.pid) no("Себя исключить нельзя.");
    if (!(r === "lead" || (r === "helper" && t.role === "member"))) no("Исключать может лидер, а помощник только обычных участников.");
    await leaveOne(ctx, pl.gid, info, members, b.pid);
    await sysMsg(ctx, pl.gid, t.name + " исключён из группы (" + pl.name + ")");
    return {};
  },
  async leave(ctx) {
    const { pl, info, members } = await myCtx(ctx);
    if (!info) no("Ты не в группе.");
    if (pl.role === "lead" && members.length > 1) no("Сначала передай лидерство другому участнику.");
    await leaveOne(ctx, pl.gid, info, members, pl.pid);
    if (members.length > 1) await sysMsg(ctx, pl.gid, pl.name + " вышел из группы");
    else await disband(ctx, pl.gid, info);
    return {};
  },
  async role(ctx, b) {
    const { pl, info } = await myCtx(ctx);
    if (roleIn(info, pl.pid) !== "lead") no("Роли меняет только лидер.");
    const t = info.members[b.pid]; if (!t || t.role === "lead") no("Такого участника нет.");
    const role = b.role === "helper" ? "helper" : "member";
    t.role = role; await ctx.put("g/" + pl.gid + "/info", info);
    const tp = await ctx.get("pl/" + t.uid); if (tp) await ctx.put("pl/" + t.uid, { ...tp, role });
    await sysMsg(ctx, pl.gid, role === "helper" ? t.name + " теперь помощник" : t.name + " больше не помощник");
    return {};
  },
  async lead(ctx, b) {
    const { pl, info } = await myCtx(ctx);
    if (roleIn(info, pl.pid) !== "lead") no("Передать лидерство может только лидер.");
    const t = info.members[b.pid]; if (!t || b.pid === pl.pid) no("Такого участника нет.");
    t.role = "lead"; info.members[pl.pid].role = "helper"; info.lead = b.pid;
    await ctx.put("g/" + pl.gid + "/info", info);
    const tp = await ctx.get("pl/" + t.uid); if (tp) await ctx.put("pl/" + t.uid, { ...tp, role: "lead" });
    await ctx.put("pl/" + ctx.uid, { ...pl, role: "helper" });
    await sysMsg(ctx, pl.gid, pl.name + " передал лидерство: теперь лидер " + t.name);
    return {};
  },
  async edit(ctx, b) {
    const { pl, info } = await myCtx(ctx);
    if (roleIn(info, pl.pid) !== "lead") no("Оформление меняет только лидер.");
    const name = str(b.name, 30); if (name.length < 2) no("Название от 2 символов.");
    info.name = name; info.about = str(b.about, 200);
    if (EMB.includes(b.emb)) info.emb = b.emb;
    if (COL.includes(b.col)) info.col = b.col;
    await ctx.put("g/" + pl.gid + "/info", info);
    return {};
  },
  async invite(ctx) {
    const { pl, info } = await myCtx(ctx);
    if (roleIn(info, pl.pid) !== "lead") no("Новую ссылку делает только лидер.");
    const old = info.inv;
    info.inv = await newInvite(ctx, pl.gid);
    await ctx.put("g/" + pl.gid + "/info", info);
    if (old) await ctx.del("gi/" + old);
    return { inv: info.inv };
  },
  // покупка в магазине: очки (опыт минус траты) сервер считает сам
  async buy(ctx, b) {
    const { pl, members } = await myCtx(ctx);
    const core = await coreFor(ctx, members);
    const it = core.pfItem(String(b.k || ""));
    if (!it || !(it.p > 0)) no("Такой вещи нет в магазине.");
    const own = core.profOf(pl.pid).own;
    if (own.includes(b.k)) return { points: core.pfPoints(pl.pid) };
    const pts = core.pfPoints(pl.pid);
    if (pts < it.p) no("Не хватает очков: нужно " + it.p + ", у тебя " + pts + ".");
    const path = "q/" + ctx.uid + "/meta/prefs", pr = (await ctx.get(path)) || {};
    const prof = pr.prof && typeof pr.prof === "object" ? pr.prof : {};
    const [cat, id] = String(b.k).split(":");
    const nprof = { ...prof, own: [...new Set([...(Array.isArray(prof.own) ? prof.own : []), b.k])], eq: { ...(prof.eq || {}), ...(b.wear === false ? {} : { [cat]: id }) } };
    await ctx.put(path, { ...pr, prof: nprof });
    return { points: pts - it.p };
  },
  // награда другу: 100 очков, одна в день одному другу
  async award(ctx, b) {
    const { pl, info, members } = await myCtx(ctx);
    if (!info || !info.members[b.to] || b.to === pl.pid) no("Наградить можно только участника своей группы.");
    const core = await coreFor(ctx, members);
    if (!core.PF_AWARDS().some((x) => x[0] === b.e)) no("Такой награды нет.");
    const day = dayOf(ctx.now());
    if (core.pfAwardsBy(pl.pid).some((x) => x.owner === b.to && x.day === day)) no("Сегодня ты уже награждал этого друга.");
    const pts = core.pfPoints(pl.pid);
    if (pts < core.PF_AWARD_COST) no("Не хватает очков: нужно " + core.PF_AWARD_COST + ", у тебя " + pts + ".");
    await ctx.put("v/" + ctx.uid + "/votes/" + b.to + "__aw-" + day, { kind: "award", owner: b.to, task: "aw-" + day, e: b.e, day, at: ctx.now() });
    return { points: pts - core.PF_AWARD_COST };
  },
  // опыт группы глазами сервера (для проверки и будущего «Доверия»)
  async xp(ctx) {
    const { members } = await myCtx(ctx);
    const core = await coreFor(ctx, members), out = {};
    for (const m of members) { const p = core.profile(m.pid); out[m.pid] = { xp: p.xp, gxp: p.gxp, L: p.li.L, week: p.week, points: core.pfPoints(m.pid) }; }
    return { xp: out };
  },
};

async function dropReq(ctx, pl) { if (pl.req) await ctx.del("g/" + pl.req + "/req/" + ctx.uid); }
// участник уходит (сам или исключили): опыт группы превращается в перенесённый
async function leaveOne(ctx, gid, info, members, pid) {
  const t = info.members[pid], s = await snapshot(ctx, members, pid), now = ctx.now();
  delete info.members[pid];
  if (Object.keys(info.members).length) await ctx.put("g/" + gid + "/info", info);
  const tp = (await ctx.get("pl/" + t.uid)) || {};
  await ctx.put("pl/" + t.uid, { ...tp, gid: null, role: null, carry: s.carry, cach: s.cach, gAt: now, joined: dayOf(now), left: info.name });
}
async function disband(ctx, gid, info) {
  for (const r of await ctx.list("g/" + gid + "/req")) {
    await ctx.del("g/" + gid + "/req/" + r.id);
    const tp = await ctx.get("pl/" + r.id); if (tp && tp.req === gid) await ctx.put("pl/" + r.id, { ...tp, req: null, reqName: null });
  }
  for (const c of await ctx.list("g/" + gid + "/chat")) await ctx.del("g/" + gid + "/chat/" + c.id);
  if (info.inv) await ctx.del("gi/" + info.inv);
  await ctx.del("g/" + gid + "/info");
}

return { handle };
})();
const { migrate28 } = (() => {
// «Система» · v28: перевод нынешней пати в группу «Система». Возвращает документы, которые нужно добавить.
// Активные игроки пати: участники (лидер Айтбатыр), опыт как есть (carry 0, gAt 0). Игроки в архиве: без группы,
// их опыт сейчас становится перенесённым (carry). Аккаунты без игрока в пати: назовут себя заново.
const TZ = 5 * 3600e3;
const dayOf = (ms) => new Date(ms + TZ).toISOString().slice(0, 10);
const GID = "g-sistema";
function migrate28(D, now, inv) {
  const rm = D["roster/main"] || {}, meta = (D["roster/meta"] && D["roster/meta"].players) || [];
  const base = [{ id: "aitbatyr", name: "Айтбатыр" }, { id: "aldiyar", name: "Алдияр" }, { id: "nursultan", name: "Нурсултан" }].map((p) => ({ ...p, joined: "2026-10-15" }));
  for (const m of meta) { if (!m || !m.id) continue; const ex = base.find((x) => x.id === m.id); const c = { id: m.id, name: m.name || (ex && ex.name) || "Игрок", joined: m.joined || "2026-10-15", archived: !!m.archived }; if (ex) Object.assign(ex, c); else base.push(c); }
  const ps = base.filter((p) => typeof rm[p.id] === "string" && rm[p.id]);
  // опыт игроков из архива: считаем так, будто они ещё в пати (как было до архива)
  const of = (u, c) => Object.keys(D).filter((k) => k.startsWith(c.replace("{u}", u) + "/") && k.split("/").length === 4).map((k) => ({ ...D[k], id: k.split("/").pop() }));
  const core = makeCore(() => now);
  const o = { players: ps.map((p) => ({ id: p.id, name: p.name, joined: p.joined })), roster: Object.fromEntries(ps.map((p) => [p.id, rm[p.id]])), gm: {}, tasks: {}, stories: {}, votes: {}, seals: {}, prefs: {} };
  for (const p of ps) { const u = rm[p.id]; o.tasks[p.id] = of(u, "q/{u}/tasks"); o.stories[p.id] = of(u, "q/{u}/story"); o.votes[p.id] = of(u, "v/{u}/votes").map(({ id, ...x }) => x); o.seals[p.id] = Object.fromEntries(of(u, "w/{u}/seals").map(({ id, ...x }) => [id, x])); o.prefs[p.id] = D["q/" + u + "/meta/prefs"] || {}; }
  core.load(o);
  const out = {}, members = {};
  for (const p of ps) {
    const u = rm[p.id], role = p.id === "aitbatyr" ? "lead" : "member";
    if (!p.archived) {
      members[p.id] = { uid: u, name: p.name, role, joined: p.joined, gAt: 0, carry: 0, cach: [] };
      out["pl/" + u] = { pid: p.id, name: p.name, gid: GID, role, carry: 0, gAt: 0, cach: [], joined: p.joined, req: null, reqName: null, at: now };
    } else {
      const pr = core.profile(p.id);
      out["pl/" + u] = { pid: p.id, name: p.name, gid: null, role: null, carry: pr.xp, gAt: now, cach: Object.keys(pr.ach), joined: dayOf(now), req: null, reqName: null, at: now, left: "Система" };
    }
  }
  out["g/" + GID + "/info"] = { name: "Система", about: "Первая группа. Здесь всё началось.", emb: "⚡", col: "#5ec8ff", lead: "aitbatyr", inv, at: now, members };
  out["gi/" + inv] = { gid: GID };
  out["g/" + GID + "/chat/" + now.toString(36) + "s0000"] = { sys: 1, t: "Пати стала группой «Система». Лидер: Айтбатыр. Зовите друзей по ссылке из ⚙ Управление.", at: now };
  return out;
}

return { migrate28 };
})();
window.__SYS = { handle, memCtx, migrate28 };
})();
