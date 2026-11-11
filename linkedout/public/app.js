// LinkedOut front-end: vanilla JS, hash router, no build step.
// All user content is rendered via textContent (never innerHTML).

const app = document.getElementById('app');
let META = null;

// ---------- helpers ----------
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style') Object.assign(el.style, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** replaceChildren that flattens arrays and skips null/false. */
function fill(el, ...kids) {
  el.replaceChildren(...kids.flat(Infinity).filter((k) => k != null && k !== false));
}

async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status, data });
  return data;
}

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

const fmtDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
const stars = (n) => h('span', { class: 'stars', 'aria-label': `${n} out of 5` }, '★'.repeat(n), h('span', { class: 'off' }, '★'.repeat(5 - n)));
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

function setNav(name) {
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === name));
}

function loading() { fill(app, h('p', { class: 'muted center' }, 'Loading…')); }
function errorView(err) {
  fill(app, h('div', { class: 'empty' }, h('h2', {}, 'Something went wrong'), h('p', {}, err.message), h('a', { href: '#/', class: 'btn' }, 'Back to stories')));
}

// ---------- story card ----------
function reasonTags(reasons) {
  return h('div', { class: 'tags' }, reasons.map((r) => h('a', { class: 'tag', href: `#/?reason=${r}`, style: { textDecoration: 'none' } }, META.reasons[r] || r)));
}

function relateButton(s) {
  const btn = h('button', { class: `btn${s.related ? ' on' : ''}`, 'aria-pressed': String(s.related), type: 'button' });
  const paint = () => {
    fill(btn, s.related ? '✓ I relate' : '🤝 I relate', h('span', { class: 'muted' }, ` · ${s.relates}`));
    btn.className = `btn${s.related ? ' on' : ''}`;
    btn.setAttribute('aria-pressed', String(s.related));
  };
  paint();
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      const r = await api(`/api/stories/${s.id}/relate`, { method: 'POST' });
      s.related = r.related;
      s.relates = r.count;
      paint();
    } catch (e) { toast(e.message); }
    btn.disabled = false;
  });
  return btn;
}

function reportButton(s, onReported) {
  return h('button', {
    class: 'btn btn-ghost small', type: 'button',
    onclick: () => openReportDialog(s, onReported),
  }, '⚑ Report');
}

function storyMeta(s) {
  return h('div', { class: 'meta' },
    h('a', { href: `#/company/${s.companySlug}` }, s.company),
    s.role && h('span', {}, s.role),
    s.tenure && h('span', {}, META.tenures[s.tenure]),
    stars(s.rating),
    h('span', {}, fmtDate(s.createdAt)),
  );
}

function storyCard(s) {
  const excerpt = s.story.length > 320 ? `${s.story.slice(0, 320).trimEnd()}…` : s.story;
  const card = h('article', { class: 'card' },
    storyMeta(s),
    h('h3', {}, h('a', { href: `#/story/${s.id}` }, s.title)),
    reasonTags(s.reasons),
    h('p', { class: 'excerpt' }, excerpt),
    h('div', { class: 'actions' },
      relateButton(s),
      h('a', { class: 'btn btn-ghost', href: `#/story/${s.id}` }, 'Read full story'),
      reportButton(s, () => card.remove()),
    ),
  );
  return card;
}

// ---------- report dialog ----------
function openReportDialog(s, onReported) {
  const dlg = h('dialog', {});
  const form = h('form', { method: 'dialog' },
    h('h2', {}, 'Report this story'),
    h('p', { class: 'muted small' }, 'Stories with several reports are hidden until a moderator reviews them.'),
    Object.entries(META.reportReasons).map(([k, label], i) =>
      h('label', { class: 'check' }, h('input', { type: 'radio', name: 'reason', value: k, required: i === 0 }), label)),
    h('div', { class: 'actions' },
      h('button', { class: 'btn btn-primary', value: 'submit' }, 'Submit report'),
      h('button', { class: 'btn', value: 'cancel', formnovalidate: true }, 'Cancel'),
    ),
  );
  dlg.append(form);
  document.body.append(dlg);
  dlg.addEventListener('close', async () => {
    const reason = new FormData(form).get('reason');
    dlg.remove();
    if (dlg.returnValue !== 'submit' || !reason) return;
    try {
      await api(`/api/stories/${s.id}/report`, { method: 'POST', body: { reason } });
      toast('Thanks — a moderator will take a look.');
      onReported?.();
    } catch (e) { toast(e.message); }
  });
  dlg.showModal();
}

// ---------- views ----------
async function feedView(params) {
  setNav('feed');
  const state = {
    q: params.get('q') || '',
    reason: params.get('reason') || '',
    sort: params.get('sort') || 'recent',
    offset: 0,
  };
  const stats = await api('/api/stats');

  const list = h('div', {});
  const more = h('div', { class: 'center' });

  const syncUrl = () => {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.reason) p.set('reason', state.reason);
    if (state.sort !== 'recent') p.set('sort', state.sort);
    const next = `#/${p.toString() ? `?${p}` : ''}`;
    if (location.hash !== next) history.replaceState(null, '', next);
  };

  async function load(reset) {
    if (reset) { state.offset = 0; fill(list, h('p', { class: 'muted center' }, 'Loading…')); }
    const p = new URLSearchParams({ offset: state.offset, limit: 15, sort: state.sort });
    if (state.q) p.set('q', state.q);
    if (state.reason) p.set('reason', state.reason);
    const data = await api(`/api/stories?${p}`);
    if (reset) fill(list);
    if (!data.total) {
      list.append(h('div', { class: 'empty' },
        h('p', {}, state.q || state.reason ? 'No stories match those filters.' : 'No stories yet. Be the first.'),
        h('a', { class: 'btn btn-primary', href: '#/share' }, 'Share your exit')));
    }
    data.items.forEach((s) => list.append(storyCard(s)));
    state.offset += data.items.length;
    fill(more, state.offset < data.total
      ? h('button', { class: 'btn', type: 'button', onclick: () => load(false) }, `Load more (${data.total - state.offset} left)`)
      : '');
  }

  let debounce;
  const search = h('input', {
    type: 'search', placeholder: 'Search companies, roles, stories…', value: state.q, 'aria-label': 'Search stories',
    oninput: (e) => { clearTimeout(debounce); debounce = setTimeout(() => { state.q = e.target.value.trim(); syncUrl(); load(true); }, 250); },
  });
  const sort = h('select', { 'aria-label': 'Sort', onchange: (e) => { state.sort = e.target.value; syncUrl(); load(true); } },
    h('option', { value: 'recent', selected: state.sort === 'recent' }, 'Most recent'),
    h('option', { value: 'top', selected: state.sort === 'top' }, 'Most relatable'));

  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Filter by reason' });
  const paintChips = () => fill(chips,
    h('button', { class: `chip${!state.reason ? ' on' : ''}`, type: 'button', onclick: () => { state.reason = ''; paintChips(); syncUrl(); load(true); } }, 'All'),
    Object.entries(META.reasons).map(([k, label]) =>
      h('button', { class: `chip${state.reason === k ? ' on' : ''}`, type: 'button', onclick: () => { state.reason = state.reason === k ? '' : k; paintChips(); syncUrl(); load(true); } }, label)),
  );
  paintChips();

  fill(app,
    h('section', { class: 'hero' },
      h('h1', {}, 'The exit interview they never read.'),
      h('p', {}, 'Anonymous, first-hand stories about why people really left their jobs — so the next person can walk in with eyes open.'),
      h('div', { class: 'stats' },
        h('div', { class: 'stat' }, h('b', {}, stats.stories), h('span', {}, 'stories')),
        h('div', { class: 'stat' }, h('b', {}, stats.companies), h('span', {}, 'companies')),
        stats.topReasons[0] && h('div', { class: 'stat' }, h('b', {}, stats.topReasons[0].label), h('span', {}, 'most common reason')),
      ),
    ),
    h('div', { class: 'filters' }, search, sort),
    chips, list, more,
  );
  await load(true);
}

async function storyView(id) {
  setNav('feed');
  const { story: s } = await api(`/api/stories/${id}`);
  document.title = `${s.title} — LinkedOut`;
  const mine = store.get('lo_mine', {});
  const deleteToken = mine[s.id];

  fill(app,
    h('a', { class: 'back', href: '#/' }, '← All stories'),
    h('article', { class: 'card' },
      storyMeta(s),
      h('h1', {}, s.title),
      reasonTags(s.reasons),
      h('div', { class: 'story-body' }, s.story),
      s.advice && h('div', { class: 'advice' }, h('b', {}, 'Advice for the next person: '), s.advice),
      h('div', { class: 'actions' },
        relateButton(s),
        h('a', { class: 'btn btn-ghost', href: `#/company/${s.companySlug}` }, `More about ${s.company}`),
        reportButton(s, () => { location.hash = '#/'; }),
        deleteToken && h('button', {
          class: 'btn btn-ghost btn-danger', type: 'button',
          onclick: async () => {
            if (!confirm('Delete your story permanently?')) return;
            try {
              await api(`/api/stories/${s.id}`, { method: 'DELETE', headers: { 'X-Delete-Token': deleteToken } });
              delete mine[s.id]; store.set('lo_mine', mine);
              toast('Your story was deleted.');
              location.hash = '#/';
            } catch (e) { toast(e.message); }
          },
        }, 'Delete my story'),
      ),
    ),
  );
}

async function companiesView(params) {
  setNav('companies');
  const list = h('div', { class: 'company-list' });
  async function load(q) {
    const { items } = await api(`/api/companies?q=${encodeURIComponent(q)}`);
    fill(list, ...(items.length ? items.map((c) =>
      h('a', { class: 'card company-row', href: `#/company/${c.slug}` },
        h('div', {}, h('h3', {}, c.name), h('span', { class: 'muted small' }, plural(c.count, 'story', 'stories'))),
        h('div', { class: 'center' }, stars(Math.round(c.avgRating)), h('div', { class: 'muted small' }, `${c.avgRating} / 5`)),
      )) : [h('div', { class: 'empty' }, 'No companies found.')]));
  }
  let t;
  fill(app,
    h('h1', {}, 'Companies'),
    h('p', { class: 'muted' }, 'Ranked by number of exit stories. Rating = "would you recommend working here?"'),
    h('div', { class: 'filters' }, h('input', {
      type: 'search', placeholder: 'Find a company…', 'aria-label': 'Find a company', value: params.get('q') || '',
      oninput: (e) => { clearTimeout(t); t = setTimeout(() => load(e.target.value), 200); },
    })),
    list,
  );
  await load(params.get('q') || '');
}

async function companyView(slug) {
  setNav('companies');
  const c = await api(`/api/companies/${encodeURIComponent(slug)}`);
  document.title = `${c.name} — LinkedOut`;
  const { items, total } = await api(`/api/stories?company=${encodeURIComponent(slug)}&limit=50`);
  fill(app,
    h('a', { class: 'back', href: '#/companies' }, '← All companies'),
    h('section', { class: 'card' },
      h('h1', {}, c.name),
      h('div', { class: 'meta' }, h('span', {}, plural(c.count, 'exit story', 'exit stories')), stars(Math.round(c.avgRating)), h('span', {}, `${c.avgRating} / 5 would recommend`)),
      h('h2', { style: { marginTop: '16px' } }, 'Why people left'),
      h('div', { class: 'bars' }, c.topReasons.map((r) =>
        h('div', { class: 'bar-row' },
          h('span', {}, r.label),
          h('div', { class: 'bar', role: 'img', 'aria-label': `${r.pct}% of stories` }, h('i', { style: { width: `${r.pct}%` } })),
          h('span', { class: 'muted small' }, `${r.pct}%`)))),
      c.count < 3 && h('p', { class: 'muted small', style: { marginTop: '12px' } }, 'Based on very few stories — treat as anecdotal.'),
    ),
    h('h2', { style: { margin: '24px 0 12px' } }, `Stories (${total})`),
    items.map(storyCard),
  );
}

function guidelinesView() {
  setNav('guidelines');
  fill(app, h('article', { class: 'card' },
    h('h1', {}, 'Posting guidelines'),
    h('p', {}, 'LinkedOut exists so people can make informed decisions about where to work. Honest, specific stories help. Revenge posts don\'t.'),
    h('h2', {}, 'Do'),
    h('ul', {},
      h('li', {}, 'Describe your own first-hand experience.'),
      h('li', {}, 'Be specific about what happened and how it affected you.'),
      h('li', {}, 'Refer to people by role ("my manager", "a VP"), not name.'),
      h('li', {}, 'Offer advice for whoever is considering the job next.')),
    h('h2', {}, 'Don\'t'),
    h('ul', {},
      h('li', {}, 'Name or identify private individuals, coworkers, or managers.'),
      h('li', {}, 'Post contact details, links, or anything that identifies you or others (we automatically strip emails, phone numbers, links and @handles).'),
      h('li', {}, 'State things as fact that you don\'t know to be true. Frame opinions as opinions.'),
      h('li', {}, 'Share confidential business information or trade secrets.'),
      h('li', {}, 'Post hate, threats, or harassment.')),
    h('h2', {}, 'Protecting your anonymity'),
    h('ul', {},
      h('li', {}, 'We don\'t collect names, emails, or store IP addresses. Dates are shown by month only.'),
      h('li', {}, 'Small details (exact dates, team names, unique projects) can still identify you. Leave them out if you\'re worried.'),
      h('li', {}, 'After posting you get a private delete key. Keep it to remove your story later.')),
    h('h2', {}, 'Serious misconduct'),
    h('p', {}, 'If you experienced harassment, discrimination, or illegal activity, consider also reporting it to the relevant labor authority or an employment lawyer — a post here is not a legal complaint.'),
  ));
}

function shareView() {
  setNav('share');
  const L = META.limits;
  const errs = {};

  const field = (name, label, control, hint) => {
    const err = h('div', { class: 'err', id: `err-${name}` });
    errs[name] = err;
    return h('div', { class: 'field', 'data-field': name }, h('label', { for: `f-${name}` }, label), control, hint && h('div', { class: 'hint' }, hint), err);
  };
  const counter = (el, max) => {
    const c = h('span', {}, `0 / ${max}`);
    el.addEventListener('input', () => { c.textContent = `${el.value.length} / ${max}`; });
    return c;
  };

  const company = h('input', { id: 'f-company', name: 'company', type: 'text', maxlength: L.company.max, required: true, autocomplete: 'off', list: 'company-suggest', placeholder: 'e.g. Acme Corp' });
  const suggest = h('datalist', { id: 'company-suggest' });
  let st;
  company.addEventListener('input', () => {
    clearTimeout(st);
    st = setTimeout(async () => {
      const q = company.value.trim();
      if (q.length < 2) return;
      const { items } = await api(`/api/companies?q=${encodeURIComponent(q)}`).catch(() => ({ items: [] }));
      fill(suggest, ...items.slice(0, 8).map((c) => h('option', { value: c.name })));
    }, 200);
  });
  const role = h('input', { id: 'f-role', name: 'role', type: 'text', maxlength: L.role.max, placeholder: 'e.g. Software Engineer (optional)', autocomplete: 'off' });
  const tenure = h('select', { id: 'f-tenure', name: 'tenure' }, h('option', { value: '' }, 'Prefer not to say'),
    Object.entries(META.tenures).map(([k, v]) => h('option', { value: k }, v)));
  const title = h('input', { id: 'f-title', name: 'title', type: 'text', maxlength: L.title.max, required: true, placeholder: 'Sum it up in one line' });
  const story = h('textarea', { id: 'f-story', name: 'story', maxlength: L.story.max, required: true, placeholder: 'What actually happened? What was the moment you knew you had to leave?' });
  const advice = h('textarea', { id: 'f-advice', name: 'advice', maxlength: L.advice.max, style: { minHeight: '90px' }, placeholder: 'What should someone considering this job know? (optional)' });

  const piiWarn = h('div', { class: 'notice warn', hidden: true });
  const piiRe = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})|((?:https?:\/\/|www\.)\S+)|(\+?\(?\d(?:[\s().-]{0,2}\d){8,})|((^|\s)@[A-Za-z0-9_]{2,})/i;
  const checkPii = () => { piiWarn.hidden = ![role, title, story, advice].some((el) => piiRe.test(el.value)); };
  piiWarn.append(h('b', {}, 'Heads up: '), 'it looks like you included an email, phone number, link or @handle. These will be removed automatically when you post.');
  [role, title, story, advice].forEach((el) => el.addEventListener('input', checkPii));

  const reasonsErr = h('div', { class: 'err' }); errs.reasons = reasonsErr;
  const reasons = h('fieldset', { class: 'field', 'data-field': 'reasons' },
    h('legend', {}, `Why did you leave? (pick up to ${L.reasons.max})`),
    h('div', { class: 'reason-grid' }, Object.entries(META.reasons).map(([k, v]) =>
      h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'reasons', value: k }), v))),
    reasonsErr);
  reasons.addEventListener('change', () => {
    const boxes = [...reasons.querySelectorAll('input')];
    const n = boxes.filter((b) => b.checked).length;
    boxes.forEach((b) => { b.disabled = !b.checked && n >= L.reasons.max; });
  });

  const ratingErr = h('div', { class: 'err' }); errs.rating = ratingErr;
  const rating = h('fieldset', { class: 'field', 'data-field': 'rating' },
    h('legend', {}, 'Would you recommend working there?'),
    h('div', { class: 'rating' }, [1, 2, 3, 4, 5].map((n) =>
      h('label', {}, h('input', { type: 'radio', name: 'rating', value: n }), h('span', {}, `${n}★`)))),
    h('div', { class: 'hint' }, h('span', {}, '1 = run, 5 = it was fine, I just moved on')),
    ratingErr);

  const agreeErr = h('div', { class: 'err' }); errs.agree = agreeErr;
  const agree = h('div', { class: 'field', 'data-field': 'agree' },
    h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'agree', id: 'f-agree' }),
      h('span', {}, 'This is my own honest experience, and I haven\'t named or identified any private individuals. I\'ve read the ', h('a', { href: '#/guidelines', target: '_blank' }, 'guidelines'), '.')),
    agreeErr);

  const submit = h('button', { class: 'btn btn-primary', type: 'submit' }, 'Post anonymously');
  const formErr = h('div', { class: 'err', role: 'alert' });

  const form = h('form', { class: 'form card', novalidate: true },
    h('div', { class: 'notice' }, h('b', {}, 'You\'re anonymous here. '), 'No account, no email, no name. Refer to people by role, not name.'),
    h('div', { class: 'row2' }, field('company', 'Company', h('div', {}, company, suggest)), field('role', 'Your role', role)),
    field('tenure', 'How long were you there?', tenure),
    reasons,
    field('title', 'Headline', title, [h('span', {}, 'Keep it factual'), counter(title, L.title.max)]),
    field('story', 'Your story', story, [h('span', {}, `At least ${L.story.min} characters`), counter(story, L.story.max)]),
    piiWarn,
    field('advice', 'Advice for the next person', advice, [h('span', {}), counter(advice, L.advice.max)]),
    rating, agree, formErr,
    h('div', { class: 'actions' }, submit, h('a', { class: 'btn btn-ghost', href: '#/' }, 'Cancel')),
  );

  // Clear a field's error as soon as the user touches it.
  form.addEventListener('input', (e) => {
    const f = e.target.closest('[data-field]');
    if (f?.classList.contains('invalid')) { f.classList.remove('invalid'); if (errs[f.dataset.field]) errs[f.dataset.field].textContent = ''; }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    Object.values(errs).forEach((el) => { el.textContent = ''; });
    form.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
    formErr.textContent = '';
    const fd = new FormData(form);
    const body = {
      company: company.value, role: role.value, tenure: tenure.value, title: title.value,
      story: story.value, advice: advice.value, reasons: fd.getAll('reasons'),
      rating: Number(fd.get('rating')), agree: fd.get('agree') === 'on',
    };
    submit.disabled = true; submit.textContent = 'Posting…';
    try {
      const res = await api('/api/stories', { method: 'POST', body });
      const mine = store.get('lo_mine', {});
      mine[res.story.id] = res.deleteToken;
      store.set('lo_mine', mine);
      postedView(res);
    } catch (err) {
      if (err.data?.errors) {
        let first;
        for (const [k, msg] of Object.entries(err.data.errors)) {
          if (errs[k]) errs[k].textContent = msg;
          const f = form.querySelector(`[data-field="${k}"]`);
          f?.classList.add('invalid');
          first ??= f;
        }
        first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      formErr.textContent = err.message;
      submit.disabled = false; submit.textContent = 'Post anonymously';
    }
  });

  fill(app, h('h1', {}, 'Share your exit'), h('p', { class: 'muted' }, 'Tell the next person what the job listing didn\'t.'), form);
}

function postedView({ story, deleteToken, redactedCount }) {
  fill(app, h('section', { class: 'card' },
    h('h1', {}, 'Your story is live 🎉'),
    h('p', {}, 'Thank you. Someone is about to make a better decision because of it.'),
    redactedCount > 0 && h('div', { class: 'notice warn' }, `We removed ${plural(redactedCount, 'piece')} of contact info to protect privacy.`),
    h('h2', { style: { marginTop: '16px' } }, 'Your private delete key'),
    h('p', { class: 'muted small' }, 'This browser remembers it, but save a copy if you might want to delete your story from another device. We can\'t recover it.'),
    h('div', { class: 'token' }, `${story.id}:${deleteToken}`),
    h('div', { class: 'actions' },
      h('a', { class: 'btn btn-primary', href: `#/story/${story.id}` }, 'View your story'),
      h('a', { class: 'btn', href: '#/delete' }, 'Delete with a key'),
      h('a', { class: 'btn btn-ghost', href: '#/' }, 'Back to stories')),
  ));
}

function deleteView() {
  const input = h('input', { type: 'text', placeholder: 'story-id:key', 'aria-label': 'Delete key' });
  fill(app, h('form', {
    class: 'card form',
    onsubmit: async (e) => {
      e.preventDefault();
      const [id, token] = input.value.trim().split(':');
      if (!id || !token) return toast('Paste the full key, including the colon.');
      if (!confirm('Delete this story permanently?')) return;
      try {
        await api(`/api/stories/${id}`, { method: 'DELETE', headers: { 'X-Delete-Token': token } });
        toast('Story deleted.');
        location.hash = '#/';
      } catch (err) { toast(err.message); }
    },
  }, h('h1', {}, 'Delete a story'), h('p', { class: 'muted' }, 'Paste the delete key you got when you posted.'), input,
  h('div', {}, h('button', { class: 'btn btn-primary', type: 'submit' }, 'Delete story'))));
}

async function modView() {
  setNav('');
  let token = sessionStorage.getItem('lo_admin') || '';
  const box = h('div', {});
  const tokenInput = h('input', { type: 'password', placeholder: 'Admin token', value: token, 'aria-label': 'Admin token' });

  async function load() {
    token = tokenInput.value;
    sessionStorage.setItem('lo_admin', token);
    fill(box, h('p', { class: 'muted' }, 'Loading…'));
    try {
      const { items } = await api('/api/admin/queue', { headers: { Authorization: `Bearer ${token}` } });
      if (!items.length) return fill(box, h('div', { class: 'empty' }, 'Queue is empty. 🎉'));
      fill(box, ...items.map((s) => {
        const act = (action) => async () => {
          try {
            await api(`/api/admin/stories/${s.id}`, { method: 'POST', body: { action }, headers: { Authorization: `Bearer ${token}` } });
            toast(`Story ${action}d.`); load();
          } catch (e) { toast(e.message); }
        };
        const counts = {};
        s.reports.forEach((r) => { counts[r.reason] = (counts[r.reason] || 0) + 1; });
        return h('article', { class: 'card' },
          h('div', { class: 'meta' }, h('span', { class: 'tag' }, s.status), h('b', {}, plural(s.reports.length, 'report')),
            Object.entries(counts).map(([k, n]) => h('span', {}, `${META.reportReasons[k]} ×${n}`))),
          storyMeta(s), h('h3', {}, s.title), h('p', { class: 'excerpt' }, s.story),
          s.advice && h('div', { class: 'advice' }, s.advice),
          h('div', { class: 'actions' },
            h('button', { class: 'btn', type: 'button', onclick: act('restore') }, 'Restore & clear reports'),
            s.status === 'visible' && h('button', { class: 'btn', type: 'button', onclick: act('hide') }, 'Hide'),
            h('button', { class: 'btn btn-danger', type: 'button', onclick: () => confirm('Permanently remove content?') && act('remove')() }, 'Remove')));
      }));
    } catch (e) {
      fill(box, h('p', { class: 'err' }, e.message));
    }
  }

  fill(app, h('h1', {}, 'Moderation queue'),
    h('form', { class: 'filters', onsubmit: (e) => { e.preventDefault(); load(); } }, tokenInput, h('button', { class: 'btn btn-primary' }, 'Load')),
    box);
  if (token) load();
}

// ---------- router ----------
async function route() {
  const [path, query = ''] = location.hash.replace(/^#/, '').split('?');
  const params = new URLSearchParams(query);
  const parts = (path || '/').split('/').filter(Boolean);
  document.title = 'LinkedOut — why people really left';
  window.scrollTo(0, 0);
  loading();
  try {
    META ??= await api('/api/meta');
    switch (parts[0]) {
      case undefined: return await feedView(params);
      case 'story': return await storyView(parts[1]);
      case 'companies': return await companiesView(params);
      case 'company': return await companyView(parts[1]);
      case 'share': return shareView();
      case 'guidelines': return guidelinesView();
      case 'delete': return deleteView();
      case 'mod': return await modView();
      default: throw new Error('Page not found.');
    }
  } catch (e) {
    errorView(e);
  }
}

window.addEventListener('hashchange', route);
route();
