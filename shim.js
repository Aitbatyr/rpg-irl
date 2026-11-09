/* «Система» · прослойка: те же вызовы, что давал claude.ai (db, user, assets, room), но поверх Supabase. */
(() => {
  "use strict";
  const CFG = window.SISTEMA_CONFIG || {};
  const sb = window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  window.SISTEMA_BLOB = (id) => CFG.url + "/storage/v1/object/public/blobs/" + encodeURIComponent(id);
  let account = null, readyRes;
  const ready = new Promise((r) => (readyRes = r));

  // ---------- helpers ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const collOf = (p) => p.split("/").slice(0, -1).join("/");
  const idOf = (p) => p.split("/").pop();
  const autoId = () => { const a = "abcdefghijklmnopqrstuvwxyz0123456789"; let s = ""; const r = crypto.getRandomValues(new Uint8Array(20)); for (const x of r) s += a[x % 36]; return s; };
  const hex32 = () => [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const clean = (d) => JSON.parse(JSON.stringify(d ?? {}));
  function mapErr(e) {
    const code = e && e.code;
    const err = new Error((e && e.message) || "error");
    err.code = code === "42501" || /row-level security|permission/i.test(err.message) ? "invalid_argument" : code === "P0002" ? "not_found" : "unavailable";
    return err;
  }

  // ---------- live queries ----------
  const watchers = new Set();
  function notify(coll, path) { for (const w of watchers) if ((coll && w.coll === coll) || (path && w.path === path)) w.kick(); }
  function kickAll() { for (const w of watchers) w.kick(); }
  function watch(spec) {
    let last = null, timer = null, alive = true, busy = false, again = false;
    const fire = async () => {
      if (!alive) return;
      if (busy) { again = true; return; }
      busy = true;
      try {
        const rows = await spec.run();
        const sig = JSON.stringify(rows);
        if (sig !== last && alive) { last = sig; spec.next(spec.mk(rows)); }
      } catch (e) { clearTimeout(timer); timer = setTimeout(fire, 5000); }
      busy = false;
      if (again) { again = false; fire(); }
    };
    const entry = { coll: spec.coll, path: spec.path, kick: () => { clearTimeout(timer); timer = setTimeout(fire, 80); } };
    watchers.add(entry);
    setTimeout(fire, 0);
    return () => { alive = false; clearTimeout(timer); watchers.delete(entry); };
  }
  const snapDoc = (id, data) => ({ id, exists: data !== undefined && data !== null, data: () => (data == null ? undefined : JSON.parse(JSON.stringify(data))), metadata: { fromCache: false, hasPendingWrites: false } });
  const snapColl = (rows) => { const docs = rows.map((r) => snapDoc(r.id, r.data)); return { docs, size: docs.length, empty: !docs.length, metadata: { fromCache: false } }; };

  function coll(path, filters = [], lim = 1000) {
    const run = async () => {
      let q = sb.from("docs").select("id,data").eq("coll", path);
      for (const [k, op, v] of filters) {
        const c = "data->>" + k;
        if (op === ">=") q = q.gte(c, String(v)); else if (op === "<") q = q.lt(c, String(v)); else if (op === "==") q = q.eq(c, String(v));
        else if (op === ">") q = q.gt(c, String(v)); else if (op === "<=") q = q.lte(c, String(v));
      }
      const { data, error } = await q.order("id").limit(lim);
      if (error) throw mapErr(error);
      return data || [];
    };
    const api = {
      where: (k, op, v) => coll(path, filters.concat([[k, op, v]]), lim),
      orderBy: () => api,
      limit: (n) => coll(path, filters, n),
      get: async () => snapColl(await run()),
      onSnapshot: (next, onError) => watch({ coll: path, run, next, mk: snapColl, onError }),
      doc: (id) => docRef(path + "/" + (id || autoId())),
      add: async (d) => { const r = docRef(path + "/" + autoId()); await r.set(d); return r; },
    };
    return api;
  }
  function docRef(path) {
    const id = idOf(path), c = collOf(path);
    const run = async () => {
      const { data, error } = await sb.from("docs").select("data").eq("path", path).maybeSingle();
      if (error) throw mapErr(error);
      return data ? data.data : null;
    };
    return {
      id, path,
      get: async () => snapDoc(id, await run()),
      set: async (d) => {
        const { error } = await sb.from("docs").upsert({ path, coll: c, id, data: clean(d), updated_at: new Date().toISOString() }, { onConflict: "path" });
        if (error) throw mapErr(error);
        notify(c, path);
      },
      update: async (d) => {
        const { error } = await sb.rpc("doc_merge", { p_path: path, p_patch: clean(d) });
        if (error) throw mapErr(error);
        notify(c, path);
      },
      delete: async () => {
        const { error } = await sb.from("docs").delete().eq("path", path);
        if (error) throw mapErr(error);
        notify(c, path);
      },
      onSnapshot: (next) => watch({ path, run, next, mk: (d) => snapDoc(id, d) }),
      acquire: async (o) => {
        const { data, error } = await sb.rpc("server_now");
        if (error) throw mapErr(error);
        return { acquired: true, expiresAt: new Date(Number(data) + ((o && o.ttlMs) || 1000)).toISOString() };
      },
      collection: (s) => coll(path + "/" + s),
    };
  }
  const dbApi = Object.freeze({ doc: docRef, collection: (p) => coll(p) });

  function startRealtime() {
    let was = false;
    sb.channel("docs-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "docs" }, (p) => {
        const path = (p.new && p.new.path) || (p.old && p.old.path);
        if (path) notify(collOf(path), path);
      })
      .subscribe((st) => { if (st === "SUBSCRIBED") { if (was) kickAll(); was = true; } });
    // запасная пересверка: живые обновления приходят сами, поэтому редко
    setInterval(() => { if (!document.hidden) kickAll(); }, 600000);
    let hiddenAt = 0;
    document.addEventListener("visibilitychange", () => { if (document.hidden) hiddenAt = Date.now(); else if (Date.now() - hiddenAt > 30000) kickAll(); });
  }

  // ---------- user ----------
  const userApi = Object.freeze({
    id: async () => account.uid,
    me: async () => ({ id: account.uid, name: account.email || "" }),
    isOwner: async () => !!account.admin,
    canEdit: async () => !!account.admin,
    can: async () => true,
    profiles: async (ids) => {
      const list = [].concat(ids || []);
      const { data } = await sb.from("accounts").select("uid,email").in("uid", list);
      return Object.fromEntries(list.map((i) => { const a = (data || []).find((x) => x.uid === i); return [i, { id: i, name: a ? a.email || "" : "", avatarUrl: "", guest: false, isMe: i === account.uid }]; }));
    },
  });

  // ---------- assets ----------
  const assetsApi = Object.freeze({
    upload: async (blob) => {
      const id = hex32();
      const { error } = await sb.storage.from("blobs").upload(id, blob, { contentType: blob.type || "image/jpeg", upsert: false, cacheControl: "31536000" });
      if (error) throw mapErr(error);
      return { id, url: window.SISTEMA_BLOB(id), sizeBytes: blob.size, contentType: blob.type };
    },
    delete: async (id) => { await sb.storage.from("blobs").remove([id]); },
    list: async () => ({ assets: [], usage: {} }),
  });

  // ---------- room (кто онлайн) ----------
  let roomApi = null;
  function makeRoom() {
    let state = {}, joined = false;
    const fns = new Set();
    const ch = sb.channel("online", { config: { presence: { key: account.uid } } });
    const peers = () => { const st = ch.presenceState(); return Object.keys(st).map((k) => ({ peer: k, by: k, kind: "viewer", isMe: k === account.uid, sameTab: false, guest: false, presence: (st[k] && st[k][0]) || {}, updatedAt: Date.now() })); };
    const emit = () => { const ps = peers(); fns.forEach((f) => { try { f({ peers: ps, joined: [], left: [], updated: [] }); } catch {} }); };
    ch.on("presence", { event: "sync" }, emit).subscribe(async (st) => { if (st === "SUBSCRIBED") { joined = true; try { await ch.track(state); } catch {} } });
    return Object.freeze({
      presence: async (p) => { state = { ...state, ...p }; if (joined) await ch.track(state); },
      onPeers: (fn) => { fns.add(fn); setTimeout(emit, 0); return () => fns.delete(fn); },
      peers,
      connected: () => joined,
    });
  }

  // ---------- push-уведомления ----------
  const FN = CFG.url + "/functions/v1/push";
  const b64u = (s) => { const p = "=".repeat((4 - (s.length % 4)) % 4), b = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(b, (c) => c.charCodeAt(0)); };
  const sameKey = (buf, key) => { if (!buf) return false; const a = new Uint8Array(buf), k = b64u(key); return a.length === k.length && a.every((x, i) => x === k[i]); };
  async function fnKey() { const r = await fetch(FN + "?key=1", { headers: { apikey: CFG.key } }); if (!r.ok) throw new Error("fn " + r.status); const j = await r.json(); if (!j.key) throw new Error("no key"); return j.key; }
  async function curSub() { if (!("serviceWorker" in navigator)) return null; const reg = await navigator.serviceWorker.getRegistration(); return reg ? reg.pushManager.getSubscription() : null; }
  window.SISTEMA_PUSH = Object.freeze({
    supported: () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && window.isSecureContext,
    iosNeedsInstall: () => /iPhone|iPad|iPod/.test(navigator.userAgent) && !(navigator.standalone || (window.matchMedia && matchMedia("(display-mode: standalone)").matches)),
    available: async () => { try { await fnKey(); return true; } catch { return false; } },
    state: async () => {
      const perm = "Notification" in window ? Notification.permission : "unsupported";
      const sub = await curSub().catch(() => null);
      if (!sub) return { on: false, perm };
      const { data } = await sb.from("push_subs").select("prefs").eq("endpoint", sub.endpoint).maybeSingle();
      return { on: !!data, prefs: (data && data.prefs) || {}, perm };
    },
    enable: async (prefs) => {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") throw new Error("denied");
      const key = await fnKey();
      const reg = await navigator.serviceWorker.register("sw.js");
      await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (sub && !sameKey(sub.options && sub.options.applicationServerKey, key)) { await sub.unsubscribe(); sub = null; }
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(key) });
      const j = sub.toJSON();
      const { error } = await sb.from("push_subs").upsert({ uid: account.uid, endpoint: j.endpoint, sub: j, prefs: prefs || {} }, { onConflict: "endpoint" });
      if (error) throw error;
      return true;
    },
    disable: async () => { const sub = await curSub(); if (sub) { await sb.from("push_subs").delete().eq("endpoint", sub.endpoint); await sub.unsubscribe().catch(() => {}); } },
    setPrefs: async (prefs) => { const sub = await curSub(); if (sub) await sb.from("push_subs").update({ prefs }).eq("endpoint", sub.endpoint); },
    test: async () => {
      const { data } = await sb.auth.getSession();
      const r = await fetch(FN, { method: "POST", headers: { apikey: CFG.key, Authorization: "Bearer " + (data.session ? data.session.access_token : ""), "Content-Type": "application/json" }, body: JSON.stringify({ type: "selftest" }) });
      const j = await r.json().catch(() => ({}));
      return r.ok ? j.sent || 0 : -1;
    },
  });
  if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", (e) => { if (e.data && e.data.type === "nav" && typeof window.SISTEMA_NAV === "function") window.SISTEMA_NAV(e.data.url); });

  window.claude = Object.freeze({
    use: async (name) => {
      await ready;
      if (name === "db") return dbApi;
      if (name === "user") return userApi;
      if (name === "assets") return assetsApi;
      if (name === "room") { if (!roomApi) roomApi = makeRoom(); return roomApi; }
      return null;
    },
  });

  // ---------- вход ----------
  const css = document.createElement("style");
  css.textContent = `
#authOv{position:fixed;inset:0;z-index:200;display:grid;place-items:center;padding:16px;background:rgba(3,6,14,.92);backdrop-filter:blur(4px)}
#authOv .box{width:100%;max-width:380px;display:flex;flex-direction:column;gap:12px;padding:22px;border:1px solid var(--line,#2a6c8f);background:var(--panel-solid,#0b1830);color:var(--fg,#dcebff);font-family:var(--f-body,system-ui)}
#authOv h1{margin:0;font:800 italic 30px/1 var(--f-display,system-ui);letter-spacing:.02em}
#authOv input{font:inherit;font-size:16px;padding:12px;border:1px solid var(--line,#2a6c8f);background:var(--bg,#060a14);color:inherit}
#authOv .row{display:flex;gap:8px;flex-wrap:wrap}
#authOv .msg{font-size:13px;min-height:1em;color:var(--gold,#ffcf5c)}
#authOv .lnk{background:none;border:0;color:var(--muted,#7f95ba);font:inherit;font-size:13px;text-decoration:underline;cursor:pointer;padding:0;align-self:flex-start}
.authfoot{display:flex;justify-content:center;gap:8px;font-size:12px;color:var(--muted,#7f95ba);padding:0 16px 90px}
.authfoot button{background:none;border:0;color:inherit;text-decoration:underline;cursor:pointer;font:inherit}`;
  document.head.appendChild(css);
  let mode = "in";
  function showLogin(msg) {
    let ov = document.getElementById("authOv");
    if (!ov) { ov = document.createElement("div"); ov.id = "authOv"; document.body.appendChild(ov); }
    const reset = mode === "newpass";
    ov.innerHTML = '<form class="box" id="authForm" autocomplete="on"><h1>СИСТЕМА<span style="color:var(--sys,#5ec8ff)">.</span></h1>' +
      '<div style="font-size:14px;color:var(--muted,#7f95ba)">' + (reset ? "Придумай новый пароль." : mode === "up" ? "Создай аккаунт: почта и пароль от 6 символов." : "Вход в систему.") + "</div>" +
      (reset ? "" : '<input type="email" id="authEmail" placeholder="Почта" required autocomplete="email">') +
      '<input type="password" id="authPass" placeholder="' + (reset ? "Новый пароль" : "Пароль") + '" required minlength="6" autocomplete="' + (mode === "in" ? "current-password" : "new-password") + '">' +
      '<div class="msg" id="authMsg">' + esc(msg || "") + "</div>" +
      '<div class="row"><button class="btn" type="submit">' + (reset ? "Сохранить" : mode === "up" ? "Создать аккаунт" : "Войти") + "</button>" +
      (reset ? "" : '<button class="btn ghost" type="button" id="authSwitch">' + (mode === "up" ? "У меня уже есть аккаунт" : "Создать аккаунт") + "</button>") + "</div>" +
      (mode === "in" ? '<button class="lnk" type="button" id="authForgot">Забыл пароль</button>' : "") + "</form>";
    const f = document.getElementById("authForm"), m = document.getElementById("authMsg");
    const sw = document.getElementById("authSwitch"); if (sw) sw.onclick = () => { mode = mode === "up" ? "in" : "up"; showLogin(); };
    const fg = document.getElementById("authForgot");
    if (fg) fg.onclick = async () => {
      const email = (document.getElementById("authEmail").value || "").trim();
      if (!email) { m.textContent = "Впиши почту, и я пришлю ссылку для нового пароля."; return; }
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
      m.textContent = error ? "Не получилось: " + error.message : "Письмо отправлено. Открой ссылку из него на этом устройстве.";
    };
    f.onsubmit = async (e) => {
      e.preventDefault();
      const btn = f.querySelector('button[type="submit"]'); btn.disabled = true; m.textContent = "";
      try {
        const password = document.getElementById("authPass").value;
        if (reset) {
          const { error } = await sb.auth.updateUser({ password });
          if (error) throw error;
          mode = "in"; ov.remove(); if (!account) await onSession();
          return;
        }
        const email = document.getElementById("authEmail").value.trim();
        const r = mode === "up" ? await sb.auth.signUp({ email, password }) : await sb.auth.signInWithPassword({ email, password });
        if (r.error) throw r.error;
        if (!r.data.session) { m.textContent = "Аккаунт создан. Подтверди почту по ссылке из письма и войди."; mode = "in"; return; }
        await onSession();
      } catch (err) {
        const t = String((err && err.message) || err);
        m.textContent = /Invalid login/i.test(t) ? "Неверная почта или пароль." : /already registered/i.test(t) ? "Такая почта уже зарегистрирована. Нажми «У меня уже есть аккаунт»." : /Password should/i.test(t) ? "Пароль слишком короткий." : "Ошибка: " + t;
      }
      btn.disabled = false;
    };
  }

  async function loadAccount() {
    const { data: u } = await sb.auth.getUser();
    if (!u || !u.user) return null;
    for (let i = 0; i < 6; i++) {
      const { data } = await sb.from("accounts").select("*").eq("auth_id", u.user.id).maybeSingle();
      if (data) return data;
      await new Promise((r) => setTimeout(r, 700));
    }
    return null;
  }
  async function onSession() {
    if (account) return;
    const a = await loadAccount();
    if (!a) { showLogin("Не удалось загрузить аккаунт. Обнови страницу."); return; }
    account = a;
    const ov = document.getElementById("authOv"); if (ov) ov.remove();
    startRealtime();
    readyRes();
    addFooter();
    watchBinding();
    if (account.admin) { setTimeout(ownerPanel, 1500); setInterval(() => { if (!document.hidden) ownerPanel(); }, 60000); }
  }

  function addFooter() {
    const f = document.createElement("div");
    f.className = "authfoot";
    f.innerHTML = "<span>" + esc(account.email || "") + '</span><button type="button" id="authOut">Выйти</button>';
    const foot = document.querySelector(".foot");
    if (foot) { foot.insertAdjacentHTML("beforeend", '<span aria-hidden="true">·</span>'); f.style.cssText = "display:inline-flex;gap:8px;padding:0"; foot.appendChild(f); }
    else document.body.appendChild(f);
    document.getElementById("authOut").onclick = async () => { try { await window.SISTEMA_PUSH.disable(); } catch {} await sb.auth.signOut(); location.reload(); };
  }

  // если владелец привязал этот вход к старому профилю, перезагрузиться
  // пока игрок не в пати, база не отдаёт ему чужие данные. Как только его приняли, перезагрузиться,
  // чтобы сайт не считал «пустые» данные настоящими
  async function isMemberNow() {
    if (account.admin) return true;
    const { data } = await sb.from("docs").select("data").eq("path", "roster/main").maybeSingle();
    return !!(data && data.data && Object.values(data.data).includes(account.uid));
  }
  function watchBinding() {
    let wasMember = null;
    isMemberNow().then((m) => (wasMember = m)).catch(() => {});
    const t = setInterval(async () => {
      try {
        const { data } = await sb.from("accounts").select("uid,admin").eq("auth_id", account.auth_id).maybeSingle();
        if (data && (data.uid !== account.uid || data.admin !== account.admin)) { location.reload(); return; }
        if (wasMember === false && (await isMemberNow())) location.reload();
      } catch {}
    }, 15000);
    setTimeout(() => clearInterval(t), 6 * 3600e3);
  }

  // ---------- панель владельца: привязка входов и импорт ----------
  // владелец: следим, какие старые профили ещё без входа (для кнопок «Это … (старый профиль)» у запросов)
  async function ownerPanel() {
    const [{ data: accs }, { data: rm }] = await Promise.all([
      sb.from("accounts").select("uid"),
      sb.from("docs").select("data").eq("path", "roster/main").maybeSingle(),
    ]);
    const roster = (rm && rm.data) || {};
    const used = new Set((accs || []).map((a) => a.uid));
    const legacy = Object.entries(roster).filter(([, u]) => typeof u === "string" && u.startsWith("u_") && !used.has(u));
    const lf = JSON.stringify(legacy);
    if (lf !== JSON.stringify(window.SISTEMA_LEGACY_FREE_RAW || null)) {
      window.SISTEMA_LEGACY_FREE_RAW = legacy;
      window.SISTEMA_LEGACY_FREE = legacy.map(([slot, u]) => ({ slot, uid: u }));
      window.dispatchEvent(new Event("sistema-legacy"));
    }
  }
  window.SISTEMA_BIND = async (fromUid, toUid) => {
    if (!account || !account.admin) return "нет прав";
    const { data, error } = await sb.from("accounts").update({ uid: toUid }).eq("uid", fromUid).select("uid");
    if (error) return error.message;
    if (!data || !data.length) return "аккаунт не найден";
    ownerPanel();
    return null;
  };
  function alertMsg(t) { const m = document.getElementById("migMsg"); if (m) m.textContent = t; }
  async function importFile(file, opts) {
    const blobsOnly = !!(opts && opts.blobsOnly);
    let pack;
    try { pack = JSON.parse(await file.text()); } catch { alertMsg("Файл не читается."); return; }
    if (!pack || !Array.isArray(pack.docs)) { alertMsg("Это не файл переноса."); return; }
    const rows = blobsOnly ? [] : pack.docs.filter((d) => d && typeof d.path === "string" && d.path.split("/").length % 2 === 0).map((d) => ({ path: d.path, coll: collOf(d.path), id: idOf(d.path), data: d.data || {} }));
    let done = 0;
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await sb.from("docs").upsert(rows.slice(i, i + 200), { onConflict: "path" });
      if (error) { alertMsg("Ошибка на записи " + i + ": " + error.message); return; }
      done += Math.min(200, rows.length - i);
      alertMsg("Записи: " + done + " из " + rows.length);
    }
    const blobs = Array.isArray(pack.blobs) ? pack.blobs : [];
    let ok = 0, lastErr = "";
    for (const b of blobs) {
      try {
        const bin = Uint8Array.from(atob(b.b64), (c) => c.charCodeAt(0));
        const { error } = await sb.storage.from("blobs").upload(b.id, new Blob([bin], { type: b.type || "image/jpeg" }), { contentType: b.type || "image/jpeg", upsert: false, cacheControl: "31536000" });
        if (!error || /exist|duplicate/i.test(String(error.message || error.error || ""))) ok++;
        else lastErr = String(error.message || error.error || error);
      } catch {}
      alertMsg("Записи: " + done + " · фото: " + ok + " из " + blobs.length);
    }
    alertMsg((blobsOnly ? "Фото в файле: " + blobs.length + ", загружено: " + ok : "Перенос завершён: записей " + done + ", фото " + ok + " из " + blobs.length) + (lastErr ? ". Ошибка: " + lastErr : "") + ". Обнови страницу.");
    return true;
  }

  // ---------- старт ----------
  sb.auth.onAuthStateChange((ev) => {
    if (ev === "PASSWORD_RECOVERY") { mode = "newpass"; showLogin(); }
    if (ev === "SIGNED_OUT" && account) location.reload();
  });
  (async () => {
    const { data } = await sb.auth.getSession();
    if (data && data.session && !/type=recovery/.test(location.hash)) await onSession();
    else if (!document.getElementById("authOv")) showLogin();
  })();
})();
