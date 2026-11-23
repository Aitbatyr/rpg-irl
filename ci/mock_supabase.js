// Minimal in-memory stand-in for supabase-js, enough for shim.js
(() => {
  const M = window.__MOCK;
  const docs = M.docs; // path -> data
  const accounts = M.accounts; // [{auth_id, uid, email, admin, created_at}]
  const chans = [];
  window.__writes = [];
  let session = M.session || null;
  const authCbs = [];
  const getJ = (row, col) => { if (col.startsWith("data->>")) { const v = row.data[col.slice(7)]; return v == null ? null : String(v); } return row[col]; };
  const tableRows = (t) => t === "docs" ? Object.entries(docs).map(([path, data]) => ({ path, coll: path.split("/").slice(0, -1).join("/"), id: path.split("/").pop(), data })) : t === "accounts" ? accounts : [];
  // v31: как настоящий Supabase: в событии новая версия документа (data), сайт применяет её без перечитывания
  const fire = (path, type) => setTimeout(() => { const d = docs[path]; const nw = type === "DELETE" || d === undefined ? {} : { path, data: JSON.parse(JSON.stringify(d)) }; chans.forEach((c) => c.pg.forEach((cb) => cb({ eventType: type, new: nw, old: { path } }))); }, 20);
  M.fire = fire; // тесты: «изменение от друга» через живое обновление
  function builder(table) {
    const st = { table, op: "select", filters: [], lim: null, single: false, payload: null };
    const b = {
      select() { return b; },
      eq(c, v) { st.filters.push((r) => getJ(r, c) === v); return b; },
      gte(c, v) { st.filters.push((r) => getJ(r, c) != null && getJ(r, c) >= v); return b; },
      gt(c, v) { st.filters.push((r) => getJ(r, c) != null && getJ(r, c) > v); return b; },
      lt(c, v) { st.filters.push((r) => getJ(r, c) != null && getJ(r, c) < v); return b; },
      lte(c, v) { st.filters.push((r) => getJ(r, c) != null && getJ(r, c) <= v); return b; },
      in(c, vs) { st.filters.push((r) => vs.includes(getJ(r, c))); return b; },
      order() { return b; },
      limit(n) { st.lim = n; return b; },
      maybeSingle() { st.single = true; return b; },
      upsert(rows) { st.op = "upsert"; st.payload = [].concat(rows); return b; },
      update(obj) { st.op = "update"; st.payload = obj; return b; },
      delete() { st.op = "delete"; return b; },
      then(res, rej) { return Promise.resolve().then(exec).then(res, rej); },
    };
    function exec() {
      window.__q = (window.__q || 0) + 1;
      if (M.offline) return { data: null, error: { message: "fetch failed" } };
      if (st.op === "upsert") {
        for (const r of st.payload) {
          if (M.denyPrefix && r.path.split("/")[1] !== M.myUid() && !M.isAdmin()) return { data: null, error: { code: "42501", message: "new row violates row-level security policy" } };
          let d = JSON.parse(JSON.stringify(r.data));
          // v28: как триггеры сервера: чат (автор, время), покупки (prof.own меняет только сервер)
          if (/^g\/[^/]+\/chat\//.test(r.path)) {
            const pl = docs["pl/" + M.myUid()] || {};
            if (d.by !== M.myUid() || d.sys || !pl.gid || r.path.split("/")[1] !== pl.gid || r.path in docs) return { data: null, error: { code: "42501", message: "new row violates row-level security policy" } };
            const imgs = Array.isArray(d.imgs) ? d.imgs.filter((x) => typeof x === "string").slice(0, 3) : [];
            const t = String(d.t || "").trim().slice(0, 500);
            if (!t && !imgs.length) return { data: null, error: { code: "P0001", message: "СИСТЕМА: сообщение от 1 до 500 символов." } };
            d = { by: M.myUid(), pid: pl.pid, n: pl.name || "", t, ...(imgs.length ? { imgs } : {}), at: Date.now() };
          }
          // v30: реакции в чате (как триггер сервера): только свои, только участник группы
          if (/^g\/[^/]+\/react\//.test(r.path)) {
            const pl = docs["pl/" + M.myUid()] || {};
            if (!pl.gid || r.path.split("/")[1] !== pl.gid || !r.path.endsWith("__" + M.myUid())) return { data: null, error: { code: "42501", message: "new row violates row-level security policy" } };
            d = { m: String(d.m || ""), e: String(d.e || ""), by: M.myUid(), at: Date.now() };
          }
          if (/^q\/[^/]+\/meta\/prefs$/.test(r.path) && d.prof && typeof d.prof === "object") {
            const old = docs[r.path] && docs[r.path].prof && docs[r.path].prof.own;
            if (old) d.prof.own = JSON.parse(JSON.stringify(old)); else delete d.prof.own;
          }
          docs[r.path] = d; window.__writes.push(["set", r.path, d]); fire(r.path, "UPDATE");
        }
        return { data: null, error: null };
      }
      let rows = tableRows(table).filter((r) => st.filters.every((f) => f(r)));
      if (st.op === "delete") { rows.forEach((r) => { delete docs[r.path]; window.__writes.push(["delete", r.path]); fire(r.path, "DELETE"); }); return { data: null, error: null }; }
      if (st.op === "update") { rows.forEach((r) => Object.assign(r, st.payload)); window.__writes.push(["acc-update", st.payload]); return { data: JSON.parse(JSON.stringify(rows)), error: null }; }
      rows = rows.slice().sort((a, b) => String(a.id || "").localeCompare(String(b.id || "")));
      if (st.lim) rows = rows.slice(0, st.lim);
      rows = JSON.parse(JSON.stringify(rows));
      return { data: st.single ? rows[0] || null : rows, error: null };
    }
    return b;
  }
  const client = {
    from: (t) => builder(t),
    rpc: async (name, a) => {
      if (name === "server_now") return { data: Date.now() + (M.skew || 0), error: null };
      if (name === "doc_merge") {
        if (!(a.p_path in docs)) return { data: null, error: { code: "P0002", message: "not_found" } };
        Object.assign(docs[a.p_path], JSON.parse(JSON.stringify(a.p_patch))); window.__writes.push(["update", a.p_path, a.p_patch]); fire(a.p_path, "UPDATE");
        return { data: null, error: null };
      }
      return { data: null, error: { message: "no rpc" } };
    },
    functions: {
      invoke: async (name, o) => {
        if (M.offline || !window.__SYS) return { data: null, error: { message: "fetch failed", context: { json: async () => ({}) } } };
        const ctx = window.__SYS.memCtx(docs, M.myUid(), { now: () => Date.now() + (M.skew || 0), onWrite: (p) => { window.__writes.push(["fn", p]); fire(p, "UPDATE"); } });
        const data = await window.__SYS.handle(ctx, JSON.parse(JSON.stringify((o && o.body) || {})));
        window.__writes.push(["call", (o && o.body && o.body.a) || "", data && data.ok]);
        return { data, error: null };
      },
    },
    storage: { from: () => ({ upload: async (id, blob) => { window.__writes.push(["upload", id, blob.size]); return { data: { path: id }, error: null }; }, remove: async (ids) => { window.__writes.push(["remove", ids]); return { error: null }; } }) },
    channel: (name, opts) => {
      const c = { name, pg: [], pres: [], state: {} };
      const api = {
        on(type, filter, cb) { if (type === "postgres_changes") c.pg.push(cb); else c.pres.push(cb); return api; },
        subscribe(cb) { chans.push(c); setTimeout(() => cb && cb("SUBSCRIBED"), 10); return api; },
        presenceState() { return Object.assign({}, M.presence || {}, c.state); },
        track: async (s) => { if (opts && opts.config && opts.config.presence) c.state[opts.config.presence.key] = [s]; setTimeout(() => c.pres.forEach((f) => f()), 5); },
      };
      return api;
    },
    auth: {
      getSession: async () => ({ data: { session } }),
      getUser: async () => ({ data: { user: session ? session.user : null } }),
      onAuthStateChange: (cb) => { authCbs.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
      signInWithPassword: async ({ email, password }) => {
        const a = accounts.find((x) => x.email === email);
        if (!a || password !== "secret1") return { data: {}, error: { message: "Invalid login credentials" } };
        session = { user: { id: a.auth_id, email } }; return { data: { session }, error: null };
      },
      signUp: async ({ email }) => {
        if (accounts.find((x) => x.email === email)) return { data: {}, error: { message: "User already registered" } };
        const id = "auth-" + Math.random().toString(36).slice(2, 10);
        accounts.push({ auth_id: id, uid: id, email, admin: false, created_at: new Date().toISOString() });
        session = { user: { id, email } }; return { data: { session }, error: null };
      },
      signOut: async () => { session = null; return { error: null }; },
      resetPasswordForEmail: async () => ({ error: null }),
      updateUser: async () => ({ error: null }),
    },
  };
  M.myUid = () => { const a = accounts.find((x) => session && x.auth_id === session.user.id); return a ? a.uid : null; };
  M.isAdmin = () => { const a = accounts.find((x) => session && x.auth_id === session.user.id); return !!(a && a.admin); };
  window.supabase = { createClient: () => client };
})();
