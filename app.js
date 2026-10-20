/* Safe Space Online - client-side prototype
   Data is kept in the browser (localStorage) so the system can be demonstrated without a server. */
(function () {
  'use strict';

  /* ---------- storage helpers ---------- */
  var DB_KEY = 'safespace_db_v2', SESSION_KEY = 'safespace_user';
  var memDB = null, memSession = null;

  function readStore(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function writeStore(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function readSess(k) { try { return sessionStorage.getItem(k); } catch (e) { return memSession; } }
  function writeSess(k, v) { try { if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { memSession = v; } }

  var db;
  function load() {
    var raw = readStore(DB_KEY);
    if (raw) { try { db = JSON.parse(raw); return; } catch (e) { /* fall through */ } }
    db = memDB || seed();
    save();
  }
  function save() { memDB = db; writeStore(DB_KEY, JSON.stringify(db)); }
  function uid(p) { return p + Math.random().toString(36).slice(2, 9); }

  /* ---------- hashing (demo-grade) ---------- */
  function hash(pw, salt) {
    var data = new TextEncoder().encode(salt + ':' + pw);
    if (window.crypto && crypto.subtle) {
      return crypto.subtle.digest('SHA-256', data).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      });
    }
    var h = 5381, s = salt + ':' + pw;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return Promise.resolve('x' + h);
  }

  /* ---------- dates ---------- */
  function iso(d) { var m = d.getMonth() + 1, day = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day; }
  function addDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return d; }
  function fmtDate(s) { var d = new Date(s + 'T00:00:00'); return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }
  function nowStamp() { return new Date().toISOString(); }
  function fmtTime(iso8601) { var d = new Date(iso8601); return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  function nextWeekday(n) { var d = addDays(n); while (d.getDay() === 0) d.setDate(d.getDate() + 1); return iso(d); }

  /* ---------- seed data (pre-hashed demo passwords are created on first run) ---------- */
  var SALT = 'ssp';
  var DEMO_PW = 'Demo@2026';
  function seed() {
    var u = function (id, role, name, email, phone, extra) {
      var o = { id: id, role: role, name: name, email: email, phone: phone, pw: null, created: nowStamp(), consent: true };
      for (var k in extra) o[k] = extra[k];
      return o;
    };
    var d = {
      users: [
        u('u1', 'admin', 'Blessing Chikomo', 'admin@safespace.demo', '+263 77 410 2231', {}),
        u('t1', 'therapist', 'Dr. Rudo Chigumba', 'rudo.chigumba@safespace.demo', '+263 77 220 1984', { title: 'Clinical Psychologist', areas: ['Anxiety', 'Depression', 'Stress'], languages: ['English', 'Shona'], location: 'Avondale, Harare', fee: 30, verified: true, bio: 'Over twelve years supporting adults and young professionals with anxiety, low mood and burnout using cognitive behavioural therapy.' }),
        u('t2', 'therapist', 'Tendai Moyo', 'tendai.moyo@safespace.demo', '+263 71 555 0192', { title: 'Trauma and Grief Counsellor', areas: ['Trauma', 'Grief', 'Stress'], languages: ['English', 'Shona'], location: 'Mutare', fee: 20, verified: true, bio: 'Walks with clients through loss, trauma and major life changes in a gentle, culturally aware way.' }),
        u('t3', 'therapist', 'Nyasha Mutasa', 'nyasha.mutasa@safespace.demo', '+263 78 301 7745', { title: 'Student and Youth Counsellor', areas: ['Youth', 'Stress', 'Anxiety'], languages: ['English', 'Shona', 'Ndebele'], location: 'Harare', fee: 15, verified: true, bio: 'Helps university and college students with exam pressure, identity, relationships and career uncertainty.' }),
        u('t4', 'therapist', 'Chipo Dube', 'chipo.dube@safespace.demo', '+263 77 889 3306', { title: 'Relationship and Family Therapist', areas: ['Relationships', 'Family', 'Grief'], languages: ['English', 'Ndebele'], location: 'Bulawayo', fee: 25, verified: true, bio: 'Works with couples and families on communication, conflict and rebuilding trust.' }),
        u('t5', 'therapist', 'Mwansa Banda', 'mwansa.banda@safespace.demo', '+260 97 456 1180', { title: 'Substance Use Counsellor', areas: ['Addiction', 'Depression', 'Stress'], languages: ['English', 'Bemba', 'Nyanja'], location: 'Kabulonga, Lusaka', fee: 20, verified: true, bio: 'Practical, non-judgemental support for people recovering from alcohol and substance use, with sessions in English, Bemba and Nyanja.' }),
        u('t6', 'therapist', 'Rumbidzai Mhlanga', 'rumbidzai.mhlanga@safespace.demo', '+263 77 612 0953', { title: 'Perinatal Mental Health Counsellor', areas: ['Perinatal', 'Anxiety', 'Depression'], languages: ['English', 'Shona'], location: 'Harare', fee: 25, verified: false, bio: 'Support for mothers and expecting parents. Awaiting verification by the administrator.' }),
        u('t7', 'therapist', 'Natasha Mulenga', 'natasha.mulenga@safespace.demo', '+260 96 733 2054', { title: 'Perinatal Mental Health Counsellor', areas: ['Perinatal', 'Anxiety', 'Depression'], languages: ['English', 'Bemba'], location: 'Woodlands, Lusaka', fee: 25, verified: true, bio: 'Supports mothers and expecting parents through anxiety, low mood and the changes that come with a new baby.' }),
        u('c1', 'client', 'Tapiwa Kabaya', 'tapiwa.kabaya@safespace.demo', '+263 77 300 4412', { city: 'Harare', dob: '2003-05-14', emergency: 'Mrs. Kabaya (Mother), +263 77 300 8890' }),
        u('c2', 'client', 'Tatenda Mateyo', 'tatenda.mateyo@safespace.demo', '+263 78 245 1170', { city: 'Chitungwiza', dob: '2002-11-03', emergency: 'Mr. Mateyo (Father), +263 78 245 3301' }),
        u('c3', 'client', 'Kudzai Makoni', 'kudzai.makoni@safespace.demo', '+263 71 998 2045', { city: 'Bulawayo', dob: '1999-02-21', emergency: 'Ruvimbo Gumbo (Sister), +263 71 440 1812' }),
        u('c4', 'client', 'Chileshe Zulu', 'chileshe.zulu@safespace.demo', '+260 97 882 3341', { city: 'Lusaka', dob: '2001-08-09', emergency: 'Mrs. Zulu (Mother), +260 97 882 7710' })
      ],
      appointments: [],
      messages: [],
      notes: [],
      feedback: []
    };
    d.appointments = [
      { id: 'a1', clientId: 'c1', therapistId: 't1', date: nextWeekday(2), time: '10:00', mode: 'Video', reason: 'Exam stress and trouble sleeping', status: 'confirmed', created: nowStamp() },
      { id: 'a2', clientId: 'c2', therapistId: 't3', date: nextWeekday(3), time: '14:00', mode: 'Video', reason: 'Feeling overwhelmed with coursework', status: 'pending', created: nowStamp() },
      { id: 'a3', clientId: 'c3', therapistId: 't4', date: nextWeekday(4), time: '11:00', mode: 'Audio', reason: 'Communication in my marriage', status: 'confirmed', created: nowStamp() },
      { id: 'a4', clientId: 'c1', therapistId: 't3', date: iso(addDays(-9)), time: '15:00', mode: 'Video', reason: 'First introductory session', status: 'completed', created: nowStamp() }
    ];
    d.messages = [
      { id: 'm1', from: 'c1', to: 't1', text: 'Good morning Dr. Chigumba, I booked a session and wanted to ask if I should prepare anything.', at: new Date(Date.now() - 36e5 * 5).toISOString() },
      { id: 'm2', from: 't1', to: 'c1', text: 'Good morning Tapiwa. Just come as you are. It can help to note down when you feel most anxious this week.', at: new Date(Date.now() - 36e5 * 4).toISOString() }
    ];
    d.notes = [{ id: 'n1', apptId: 'a4', therapistId: 't3', text: 'Client settled well. Agreed on weekly study timetable and breathing exercises before exams.', at: nowStamp() }];
    d.feedback = [
      { id: 'f1', from: 'Blessing Chikomo (Administrator)', type: 'Change request', text: 'Add a clear notice that the platform is not an emergency service.', status: 'Implemented', at: nowStamp() },
      { id: 'f2', from: 'Dr. Rudo Chigumba (Therapist)', type: 'Feedback', text: 'Therapists should be able to keep private session notes.', status: 'Implemented', at: nowStamp() },
      { id: 'f3', from: 'Tatenda Mateyo (Client)', type: 'Change request', text: 'Allow clients to choose between video, audio and chat sessions.', status: 'Agreed', at: nowStamp() }
    ];
    return d;
  }

  /* ---------- tiny utils ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function byId(id) { return db.users.filter(function (u) { return u.id === id; })[0]; }
  function initials(n) { return n.replace(/^Dr\.\s*/, '').split(/\s+/).map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase(); }
  function me() { var id = readSess(SESSION_KEY); return id ? byId(id) : null; }
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
  }
  function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
  function strongPw(p) { return p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p); }

  /* ---------- router ---------- */
  var app = $('#app');
  var timerHandle = null, mediaStream = null;

  function stopMedia() {
    if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
    if (mediaStream) { mediaStream.getTracks().forEach(function (t) { t.stop(); }); mediaStream = null; }
  }

  function go(path) { location.hash = '#' + path; }

  function route() {
    stopMedia();
    var path = (location.hash || '#/home').slice(1);
    var parts = path.split('/').filter(Boolean);
    var name = parts[0] || 'home';
    var user = me();
    renderChrome(user, name);

    var guarded = ['appointments', 'messages', 'session', 'profile', 'dashboard', 'admin', 'book'];
    if (guarded.indexOf(name) > -1 && !user) { writeSess('after', path); return go('/login'); }

    var views = { home: vHome, login: vLogin, register: vRegister, therapists: vTherapists, book: vBook, appointments: vAppointments, messages: vMessages, session: vSession, profile: vProfile, dashboard: vDashboard, admin: vAdmin, feedback: vFeedback };
    (views[name] || vHome)(parts.slice(1), user);
    window.scrollTo(0, 0);
    var h = $('h1, h2', app); if (h) { h.setAttribute('tabindex', '-1'); }
  }

  function renderChrome(user, active) {
    var links = [['home', 'Home'], ['therapists', 'Find a counsellor']];
    if (user && user.role === 'client') links.push(['appointments', 'My sessions'], ['messages', 'Messages']);
    if (user && user.role === 'therapist') links.push(['dashboard', 'My practice'], ['messages', 'Messages']);
    if (user && user.role === 'admin') links.push(['admin', 'Administration']);
    links.push(['feedback', 'Feedback']);
    $('#nav').innerHTML = links.map(function (l) { return '<a href="#/' + l[0] + '" class="' + (active === l[0] ? 'active' : '') + '">' + l[1] + '</a>'; }).join('');
    $('#userbox').innerHTML = user
      ? '<a href="#/profile">' + esc(user.name) + '</a><button class="btn ghost small" id="logout">Log out</button>'
      : '<a class="btn ghost small" href="#/login">Log in</a><a class="btn small" href="#/register">Create account</a>';
    var lo = $('#logout'); if (lo) lo.onclick = function () { writeSess(SESSION_KEY, null); toast('You have been logged out'); go('/home'); };
  }

  /* ---------- views ---------- */
  function vHome() {
    var verified = db.users.filter(function (u) { return u.role === 'therapist' && u.verified && /Harare|Lusaka/.test(u.location); });
    app.innerHTML =
      '<section class="hero"><div>' +
      '<span class="pill">Private</span><span class="pill">Confidential</span><span class="pill">Affordable</span>' +
      '<h1>A calm place to talk, from wherever you are.</h1>' +
      '<p class="lead">Safe Space Online connects you with qualified therapists and counsellors across Zimbabwe and Zambia. Book a session, message your counsellor and meet online, all in one secure place.</p>' +
      '<p><a class="btn" href="#/therapists">Find a counsellor</a> <a class="btn ghost" href="#/register">Create a free account</a></p>' +
      '</div><div class="art"><h3>How it works</h3><ol style="padding-left:20px;margin:0"><li>Create your account in a minute</li><li>Choose a counsellor who fits your needs</li><li>Pick a day and time that suits you</li><li>Join your private session online</li></ol></div></section>' +
      '<h2>Meet some of our counsellors</h2><div class="grid g3">' +
      verified.slice(0, 3).map(therapistCard).join('') + '</div>' +
      '<div class="notice"><strong>Your privacy matters.</strong> Only you and your chosen counsellor can see your messages and session details. You can edit or delete your information at any time from your profile.</div>';
  }

  function therapistCard(t) {
    return '<article class="card"><div class="row"><div class="avatar" aria-hidden="true">' + esc(initials(t.name)) + '</div><div><h3>' + esc(t.name) + '</h3><div class="muted small">' + esc(t.title) + '</div></div></div>' +
      '<p class="small">' + esc(t.bio) + '</p>' +
      '<p>' + t.areas.map(function (a) { return '<span class="pill">' + esc(a) + '</span>'; }).join('') + '</p>' +
      '<p class="small muted">' + esc(t.location) + ' &middot; ' + esc(t.languages.join(', ')) + ' &middot; <strong>US$' + t.fee + '</strong> per session</p>' +
      '<a class="btn small" href="#/book/' + t.id + '">Book a session</a></article>';
  }

  function vLogin() {
    app.innerHTML = '<div class="card formcard"><h2>Welcome back</h2>' +
      '<form id="f" novalidate><label for="em">Email address</label><input id="em" type="email" autocomplete="username" required>' +
      '<label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" required>' +
      '<div id="msg"></div><p><button class="btn" type="submit">Log in</button></p></form>' +
      '<p class="small">New here? <a href="#/register">Create an account</a></p>' +
      '<div class="notice demo"><strong>Demonstration accounts</strong> (password <code>' + DEMO_PW + '</code>)<br>' +
      'Client: <code>tapiwa.kabaya@safespace.demo</code><br>Client: <code>tatenda.mateyo@safespace.demo</code><br>Therapist: <code>rudo.chigumba@safespace.demo</code><br>Administrator: <code>admin@safespace.demo</code></div></div>';
    $('#f').onsubmit = function (e) {
      e.preventDefault();
      var em = $('#em').value.trim().toLowerCase(), pw = $('#pw').value;
      var u = db.users.filter(function (x) { return x.email.toLowerCase() === em; })[0];
      var fail = function () { $('#msg').innerHTML = '<div class="err" role="alert">Incorrect email or password.</div>'; };
      if (!u) return fail();
      hash(pw, SALT).then(function (h) {
        var ok = u.pw ? u.pw === h : pw === DEMO_PW;
        if (!ok) return fail();
        writeSess(SESSION_KEY, u.id);
        var after = readSess('after'); writeSess('after', null);
        toast('Welcome, ' + u.name.split(' ')[0]);
        go(after ? '/' + after.replace(/^\//, '') : (u.role === 'therapist' ? '/dashboard' : u.role === 'admin' ? '/admin' : '/appointments'));
      });
    };
  }

  function vRegister() {
    app.innerHTML = '<div class="card formcard"><h2>Create your account</h2>' +
      '<form id="f" novalidate>' +
      '<label for="role">I am registering as</label><select id="role"><option value="client">A client looking for support</option><option value="therapist">A therapist or counsellor</option></select>' +
      '<label for="nm">Full name</label><input id="nm" autocomplete="name" placeholder="e.g. Tafadzwa Sibanda" required>' +
      '<label for="em">Email address</label><input id="em" type="email" autocomplete="email" required>' +
      '<label for="ph">Phone number</label><input id="ph" type="tel" placeholder="+263 77 000 0000 or +260 97 000 0000" autocomplete="tel">' +
      '<div id="tx" hidden><label for="ti">Professional title</label><input id="ti" placeholder="e.g. Clinical Psychologist"><label for="lic">Registration or licence number</label><input id="lic"></div>' +
      '<label for="pw">Password</label><input id="pw" type="password" autocomplete="new-password" aria-describedby="pwh"><div id="pwh" class="small muted">At least 8 characters with letters and numbers.</div>' +
      '<label for="pw2">Confirm password</label><input id="pw2" type="password" autocomplete="new-password">' +
      '<label style="display:flex;gap:10px;align-items:flex-start;font-weight:400"><input type="checkbox" id="cons" style="width:auto;margin-top:4px"> I agree to Safe Space Online storing my information securely and sharing it only with my chosen counsellor.</label>' +
      '<div id="msg"></div><p><button class="btn" type="submit">Create account</button></p></form></div>';
    $('#role').onchange = function () { $('#tx').hidden = this.value !== 'therapist'; };
    $('#f').onsubmit = function (e) {
      e.preventDefault();
      var role = $('#role').value, name = $('#nm').value.trim(), em = $('#em').value.trim().toLowerCase(), pw = $('#pw').value;
      var errs = [];
      if (name.length < 3) errs.push('Please enter your full name.');
      if (!validEmail(em)) errs.push('Please enter a valid email address.');
      if (db.users.some(function (u) { return u.email.toLowerCase() === em; })) errs.push('An account with this email already exists.');
      if (!strongPw(pw)) errs.push('Password must be at least 8 characters and include letters and numbers.');
      if (pw !== $('#pw2').value) errs.push('Passwords do not match.');
      if (role === 'therapist' && !$('#lic').value.trim()) errs.push('Therapists must provide a registration number for verification.');
      if (!$('#cons').checked) errs.push('You must agree to the privacy statement to continue.');
      if (errs.length) { $('#msg').innerHTML = '<div class="err" role="alert">' + errs.map(esc).join('<br>') + '</div>'; return; }
      hash(pw, SALT).then(function (h) {
        var u = { id: uid(role === 'therapist' ? 't' : 'c'), role: role, name: name, email: em, phone: $('#ph').value.trim(), pw: h, created: nowStamp(), consent: true };
        if (role === 'therapist') { u.title = $('#ti').value.trim() || 'Counsellor'; u.licence = $('#lic').value.trim(); u.areas = ['Stress']; u.languages = ['English']; u.location = 'Zimbabwe'; u.fee = 20; u.verified = false; u.bio = 'New counsellor. Profile awaiting verification.'; }
        db.users.push(u); save(); writeSess(SESSION_KEY, u.id);
        toast(role === 'therapist' ? 'Account created. An administrator will verify your registration.' : 'Welcome to Safe Space Online');
        go(role === 'therapist' ? '/dashboard' : '/therapists');
      });
    };
  }

  function vTherapists() {
    var areas = ['All']; db.users.forEach(function (u) { if (u.role === 'therapist' && u.verified) u.areas.forEach(function (a) { if (areas.indexOf(a) < 0) areas.push(a); }); });
    app.innerHTML = '<h1>Find a counsellor</h1><p class="muted">All counsellors listed here have been verified by our administrator.</p>' +
      '<div class="grid g3" style="margin:14px 0 22px"><div><label for="q">Search by name or location</label><input id="q" placeholder="e.g. Harare or Lusaka"></div>' +
      '<div><label for="ar">Area of support</label><select id="ar">' + areas.map(function (a) { return '<option>' + esc(a) + '</option>'; }).join('') + '</select></div>' +
      '<div><label for="lg">Language</label><select id="lg"><option>All</option><option>English</option><option>Shona</option><option>Ndebele</option><option>Bemba</option><option>Nyanja</option></select></div></div>' +
      '<div id="list" class="grid g3"></div>';
    function draw() {
      var q = $('#q').value.trim().toLowerCase(), ar = $('#ar').value, lg = $('#lg').value;
      var res = db.users.filter(function (t) {
        return t.role === 'therapist' && t.verified &&
          (!q || (t.name + ' ' + t.location + ' ' + t.title).toLowerCase().indexOf(q) > -1) &&
          (ar === 'All' || t.areas.indexOf(ar) > -1) && (lg === 'All' || t.languages.indexOf(lg) > -1);
      });
      $('#list').innerHTML = res.length ? res.map(therapistCard).join('') : '<p class="muted">No counsellors match your search. Try changing the filters.</p>';
    }
    ['q', 'ar', 'lg'].forEach(function (id) { $('#' + id).oninput = draw; });
    draw();
  }

  var SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

  function vBook(args, user) {
    var t = byId(args[0]);
    if (!t || t.role !== 'therapist' || !t.verified) { app.innerHTML = '<div class="card"><h2>Counsellor not found</h2><a href="#/therapists">Back to counsellors</a></div>'; return; }
    if (user.role !== 'client') { app.innerHTML = '<div class="card"><h2>Booking is for clients</h2><p>Please log in with a client account to book a session.</p></div>'; return; }
    var chosen = null;
    app.innerHTML = '<a href="#/therapists">&larr; Back to counsellors</a><div class="grid g2" style="margin-top:12px"><div class="card"><div class="row"><div class="avatar">' + esc(initials(t.name)) + '</div><div><h2 style="margin:0">' + esc(t.name) + '</h2><div class="muted">' + esc(t.title) + '</div></div></div><p>' + esc(t.bio) + '</p><p class="small muted">Fee: US$' + t.fee + ' per 50-minute session. Payment is arranged with your counsellor.</p></div>' +
      '<form class="card" id="f" novalidate><h3>Book a session</h3>' +
      '<label for="dt">Date</label><input type="date" id="dt" min="' + iso(new Date()) + '" value="' + nextWeekday(1) + '">' +
      '<label>Available times</label><div class="slots" id="slots" role="group" aria-label="Available times"></div>' +
      '<label for="md">Session type</label><select id="md"><option>Video</option><option>Audio</option><option>Chat</option></select>' +
      '<label for="rs">What would you like support with?</label><textarea id="rs" placeholder="A short description helps your counsellor prepare" maxlength="500"></textarea>' +
      '<div id="msg"></div><p><button class="btn" type="submit">Request appointment</button></p></form></div>';
    function drawSlots() {
      var date = $('#dt').value, taken = db.appointments.filter(function (a) { return a.therapistId === t.id && a.date === date && a.status !== 'cancelled'; }).map(function (a) { return a.time; });
      var dow = new Date(date + 'T00:00:00').getDay();
      var isToday = date === iso(new Date()), hr = new Date().getHours();
      $('#slots').innerHTML = dow === 0 ? '<span class="muted small">Counsellors do not take sessions on Sundays.</span>' :
        SLOTS.map(function (s) {
          var off = taken.indexOf(s) > -1 || (isToday && parseInt(s, 10) <= hr) || (dow === 6 && parseInt(s, 10) >= 13);
          return '<button type="button" class="slot' + (chosen === s ? ' sel' : '') + '" data-s="' + s + '"' + (off ? ' disabled' : '') + '>' + s + '</button>';
        }).join('');
      Array.prototype.forEach.call(document.querySelectorAll('.slot'), function (b) { b.onclick = function () { chosen = b.dataset.s; drawSlots(); }; });
    }
    $('#dt').onchange = function () { chosen = null; drawSlots(); };
    drawSlots();
    $('#f').onsubmit = function (e) {
      e.preventDefault();
      var date = $('#dt').value;
      if (!date || date < iso(new Date())) return $('#msg').innerHTML = '<div class="err" role="alert">Please choose a date that is today or later.</div>';
      if (!chosen) return $('#msg').innerHTML = '<div class="err" role="alert">Please choose a time.</div>';
      if (db.appointments.some(function (a) { return a.therapistId === t.id && a.date === date && a.time === chosen && a.status !== 'cancelled'; })) return $('#msg').innerHTML = '<div class="err" role="alert">That time has just been taken. Please choose another.</div>';
      if (db.appointments.some(function (a) { return a.clientId === user.id && a.date === date && a.time === chosen && a.status !== 'cancelled'; })) return $('#msg').innerHTML = '<div class="err" role="alert">You already have a session at that time.</div>';
      db.appointments.push({ id: uid('a'), clientId: user.id, therapistId: t.id, date: date, time: chosen, mode: $('#md').value, reason: $('#rs').value.trim().slice(0, 500), status: 'pending', created: nowStamp() });
      save(); toast('Request sent to ' + t.name); go('/appointments');
    };
  }

  function statusBadge(s) { return '<span class="status st-' + s + '">' + s.charAt(0).toUpperCase() + s.slice(1) + '</span>'; }

  function vAppointments(a, user) {
    if (user.role !== 'client') return go(user.role === 'therapist' ? '/dashboard' : '/admin');
    var mine = db.appointments.filter(function (x) { return x.clientId === user.id; }).sort(function (x, y) { return (x.date + x.time) < (y.date + y.time) ? 1 : -1; });
    app.innerHTML = '<div class="row between wrapflex"><h1>My sessions</h1><a class="btn" href="#/therapists">Book a new session</a></div>' +
      (mine.length ? '<div class="tablewrap"><table><thead><tr><th>Date</th><th>Time</th><th>Counsellor</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
        mine.map(function (x) {
          var t = byId(x.therapistId);
          var acts = '';
          if (x.status === 'confirmed') acts += '<a class="btn small" href="#/session/' + x.id + '">Join</a> ';
          if (x.status === 'pending' || x.status === 'confirmed') acts += '<button class="btn small warn" data-cancel="' + x.id + '">Cancel</button>';
          return '<tr><td>' + fmtDate(x.date) + '</td><td>' + x.time + '</td><td>' + esc(t ? t.name : 'Unknown') + '</td><td>' + esc(x.mode) + '</td><td>' + statusBadge(x.status) + '</td><td>' + acts + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="card"><p>You have no sessions yet. <a href="#/therapists">Find a counsellor</a> to get started.</p></div>');
    Array.prototype.forEach.call(document.querySelectorAll('[data-cancel]'), function (b) {
      b.onclick = function () {
        if (!confirm('Cancel this appointment?')) return;
        db.appointments.forEach(function (x) { if (x.id === b.dataset.cancel) x.status = 'cancelled'; });
        save(); toast('Appointment cancelled'); route();
      };
    });
  }

  function vMessages(args, user) {
    if (user.role === 'admin') return go('/admin');
    var contacts = {};
    db.messages.forEach(function (m) { if (m.from === user.id) contacts[m.to] = 1; if (m.to === user.id) contacts[m.from] = 1; });
    db.appointments.forEach(function (a) { if (a.clientId === user.id) contacts[a.therapistId] = 1; if (a.therapistId === user.id) contacts[a.clientId] = 1; });
    var ids = Object.keys(contacts).filter(function (id) { return byId(id); });
    var sel = args[0] && byId(args[0]) ? args[0] : ids[0];
    app.innerHTML = '<h1>Messages</h1><div class="notice">Messages are private between you and your counsellor. Please do not use messages for emergencies.</div>' +
      (ids.length ? '<div class="msglayout"><div class="threadlist" role="list">' + ids.map(function (id) {
        var p = byId(id);
        return '<a role="listitem" class="thread' + (id === sel ? ' sel' : '') + '" href="#/messages/' + id + '" style="text-decoration:none"><strong>' + esc(p.name) + '</strong><div class="small muted">' + esc(p.title || 'Client') + '</div></a>';
      }).join('') + '</div><div class="card"><h3>' + esc(byId(sel).name) + '</h3><div class="chat" id="chat" aria-live="polite"></div>' +
        '<form id="f" class="row" style="margin-top:12px"><input id="tx" placeholder="Write a message" maxlength="1000" aria-label="Message" required><button class="btn" type="submit">Send</button></form></div></div>'
        : '<div class="card"><p>No conversations yet. Book a session or message a counsellor from the <a href="#/therapists">directory</a>.</p></div>');
    if (!ids.length) return;
    function draw() {
      var thread = db.messages.filter(function (m) { return (m.from === user.id && m.to === sel) || (m.from === sel && m.to === user.id); }).sort(function (a, b) { return a.at < b.at ? -1 : 1; });
      $('#chat').innerHTML = thread.length ? thread.map(function (m) { return '<div class="bubble ' + (m.from === user.id ? 'me' : 'them') + '">' + esc(m.text) + '<time>' + fmtTime(m.at) + '</time></div>'; }).join('') : '<span class="muted small">No messages yet. Say hello.</span>';
      $('#chat').scrollTop = 99999;
    }
    draw();
    $('#f').onsubmit = function (e) {
      e.preventDefault();
      var v = $('#tx').value.trim(); if (!v) return;
      db.messages.push({ id: uid('m'), from: user.id, to: sel, text: v, at: nowStamp() }); save(); $('#tx').value = ''; draw();
    };
  }

  function vSession(args, user) {
    var a = db.appointments.filter(function (x) { return x.id === args[0]; })[0];
    if (!a || (a.clientId !== user.id && a.therapistId !== user.id) || a.status !== 'confirmed') {
      app.innerHTML = '<div class="card"><h2>Session not available</h2><p>This session is not confirmed or you do not have access to it.</p></div>'; return;
    }
    var other = byId(user.id === a.clientId ? a.therapistId : a.clientId);
    var key = 'room_' + a.id, roomMsgs = [];
    try { roomMsgs = JSON.parse(readStore(key) || '[]'); } catch (e) { roomMsgs = []; }
    app.innerHTML = '<div class="row between wrapflex"><div><h1 style="margin:0">Session with ' + esc(other.name) + '</h1><div class="muted">' + fmtDate(a.date) + ' at ' + a.time + ' &middot; ' + esc(a.mode) + '</div></div><button class="btn warn" id="end">Leave session</button></div>' +
      '<div class="grid g2" style="margin-top:18px"><div><div class="stage" id="stage"><span class="timer" id="timer">00:00</span><div id="ph" style="text-align:center"><div class="avatar" style="margin:0 auto 10px;width:84px;height:84px;font-size:1.8rem">' + esc(initials(other.name)) + '</div>' + esc(other.name) + '<div class="small" style="opacity:.7">Waiting for video link</div></div><div class="tile" id="tile">You</div></div>' +
      '<p class="row" style="margin-top:12px"><button class="btn ghost small" id="cam">Turn on my camera</button><span class="small muted">Camera preview stays on your device.</span></p></div>' +
      '<div class="card"><h3>Session chat</h3><div class="chat" id="chat"></div><form id="f" class="row" style="margin-top:12px"><input id="tx" aria-label="Message" placeholder="Type a message" maxlength="500"><button class="btn" type="submit">Send</button></form></div></div>';
    var secs = 0; timerHandle = setInterval(function () { secs++; var m = Math.floor(secs / 60), s = secs % 60; $('#timer').textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }, 1000);
    function draw() { $('#chat').innerHTML = roomMsgs.map(function (m) { return '<div class="bubble ' + (m.from === user.id ? 'me' : 'them') + '">' + esc(m.text) + '</div>'; }).join(''); $('#chat').scrollTop = 99999; }
    draw();
    $('#f').onsubmit = function (e) { e.preventDefault(); var v = $('#tx').value.trim(); if (!v) return; roomMsgs.push({ from: user.id, text: v }); writeStore(key, JSON.stringify(roomMsgs)); $('#tx').value = ''; draw(); };
    $('#cam').onclick = function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return toast('Camera is not supported on this device');
      navigator.mediaDevices.getUserMedia({ video: true }).then(function (s) {
        mediaStream = s; var v = document.createElement('video'); v.autoplay = true; v.muted = true; v.playsInline = true; v.srcObject = s;
        $('#tile').innerHTML = ''; $('#tile').appendChild(v); v.style.cssText = 'width:100%;height:100%;object-fit:cover;transform:scaleX(-1);position:static';
      }).catch(function () { toast('Camera permission was not granted'); });
    };
    $('#end').onclick = function () { go(user.role === 'therapist' ? '/dashboard' : '/appointments'); };
  }

  function vProfile(a, user) {
    app.innerHTML = '<h1>My profile</h1><div class="grid g2"><form class="card" id="f" novalidate><h3>Personal information</h3>' +
      '<label for="nm">Full name</label><input id="nm" value="' + esc(user.name) + '">' +
      '<label for="em">Email address</label><input id="em" type="email" value="' + esc(user.email) + '">' +
      '<label for="ph">Phone number</label><input id="ph" value="' + esc(user.phone || '') + '">' +
      (user.role === 'client' ? '<label for="ct">City or town</label><input id="ct" value="' + esc(user.city || '') + '"><label for="ec">Emergency contact</label><input id="ec" value="' + esc(user.emergency || '') + '">' : '') +
      (user.role === 'therapist' ? '<label for="bio">Short biography</label><textarea id="bio">' + esc(user.bio || '') + '</textarea><label for="fee">Fee per session (US$)</label><input id="fee" type="number" min="0" value="' + (user.fee || 0) + '">' : '') +
      '<div id="msg"></div><p><button class="btn" type="submit">Save changes</button></p></form>' +
      '<div class="card"><h3>Privacy and data</h3><p class="small">You control your information. You can download a copy of your data or permanently delete your account.</p>' +
      '<p><button class="btn ghost" id="exp">Download my data</button></p><p><button class="btn warn" id="del">Delete my account</button></p></div></div>';
    $('#f').onsubmit = function (e) {
      e.preventDefault();
      var nm = $('#nm').value.trim(), em = $('#em').value.trim().toLowerCase();
      if (nm.length < 3 || !validEmail(em)) return $('#msg').innerHTML = '<div class="err" role="alert">Please enter a valid name and email address.</div>';
      if (db.users.some(function (u) { return u.id !== user.id && u.email.toLowerCase() === em; })) return $('#msg').innerHTML = '<div class="err" role="alert">That email is already used by another account.</div>';
      user.name = nm; user.email = em; user.phone = $('#ph').value.trim();
      if ($('#ct')) { user.city = $('#ct').value.trim(); user.emergency = $('#ec').value.trim(); }
      if ($('#bio')) { user.bio = $('#bio').value.trim(); user.fee = Math.max(0, +$('#fee').value || 0); }
      save(); toast('Profile updated'); route();
    };
    $('#exp').onclick = function () {
      var out = { profile: user, appointments: db.appointments.filter(function (x) { return x.clientId === user.id || x.therapistId === user.id; }), messages: db.messages.filter(function (m) { return m.from === user.id || m.to === user.id; }) };
      delete out.profile.pw;
      var blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }), link = document.createElement('a');
      link.href = URL.createObjectURL(blob); link.download = 'my-safespace-data.json'; link.click();
    };
    $('#del').onclick = function () {
      if (!confirm('This permanently deletes your account, appointments and messages. Continue?')) return;
      db.users = db.users.filter(function (u) { return u.id !== user.id; });
      db.appointments = db.appointments.filter(function (x) { return x.clientId !== user.id && x.therapistId !== user.id; });
      db.messages = db.messages.filter(function (m) { return m.from !== user.id && m.to !== user.id; });
      save(); writeSess(SESSION_KEY, null); toast('Your account has been deleted'); go('/home');
    };
  }

  function vDashboard(a, user) {
    if (user.role !== 'therapist') return go('/home');
    var mine = db.appointments.filter(function (x) { return x.therapistId === user.id; }).sort(function (x, y) { return (x.date + x.time) < (y.date + y.time) ? -1 : 1; });
    var count = function (s) { return mine.filter(function (x) { return x.status === s; }).length; };
    app.innerHTML = '<h1>My practice</h1>' +
      (user.verified ? '' : '<div class="notice" style="border-color:var(--accent)"><strong>Awaiting verification.</strong> Your profile is not listed publicly until an administrator verifies your registration.</div>') +
      '<div class="stats"><div class="stat"><b>' + count('pending') + '</b>Requests to review</div><div class="stat"><b>' + count('confirmed') + '</b>Confirmed sessions</div><div class="stat"><b>' + count('completed') + '</b>Completed sessions</div></div>' +
      (mine.length ? '<div class="tablewrap"><table><thead><tr><th>Date</th><th>Time</th><th>Client</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
        mine.map(function (x) {
          var c = byId(x.clientId), acts = '';
          if (x.status === 'pending') acts = '<button class="btn small" data-act="confirmed" data-id="' + x.id + '">Confirm</button> <button class="btn small warn" data-act="cancelled" data-id="' + x.id + '">Decline</button>';
          if (x.status === 'confirmed') acts = '<a class="btn small" href="#/session/' + x.id + '">Start</a> <button class="btn small ghost" data-act="completed" data-id="' + x.id + '">Mark done</button>';
          if (x.status === 'completed') acts = '<button class="btn small ghost" data-note="' + x.id + '">Session notes</button>';
          return '<tr><td>' + fmtDate(x.date) + '</td><td>' + x.time + '</td><td>' + esc(c ? c.name : 'Removed user') + '</td><td>' + esc(x.reason || '-') + '</td><td>' + statusBadge(x.status) + '</td><td>' + acts + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="card"><p>No appointment requests yet.</p></div>') +
      '<div id="notes"></div>';
    Array.prototype.forEach.call(document.querySelectorAll('[data-act]'), function (b) {
      b.onclick = function () { db.appointments.forEach(function (x) { if (x.id === b.dataset.id) x.status = b.dataset.act; }); save(); toast('Appointment ' + b.dataset.act); route(); };
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-note]'), function (b) {
      b.onclick = function () {
        var id = b.dataset.note, existing = db.notes.filter(function (n) { return n.apptId === id && n.therapistId === user.id; })[0];
        $('#notes').innerHTML = '<div class="card" style="margin-top:20px"><h3>Private session notes</h3><p class="small muted">Only you can see these notes.</p><textarea id="nt">' + esc(existing ? existing.text : '') + '</textarea><p><button class="btn" id="sv">Save notes</button></p></div>';
        $('#sv').onclick = function () {
          var v = $('#nt').value.trim();
          if (existing) { existing.text = v; existing.at = nowStamp(); } else db.notes.push({ id: uid('n'), apptId: id, therapistId: user.id, text: v, at: nowStamp() });
          save(); toast('Notes saved');
        };
        $('#notes').scrollIntoView({ behavior: 'smooth' });
      };
    });
  }

  function vAdmin(args, user) {
    if (user.role !== 'admin') return go('/home');
    var tab = args[0] || 'users';
    var clients = db.users.filter(function (u) { return u.role === 'client'; }).length;
    var th = db.users.filter(function (u) { return u.role === 'therapist'; });
    app.innerHTML = '<h1>Administration</h1>' +
      '<div class="stats"><div class="stat"><b>' + clients + '</b>Registered clients</div><div class="stat"><b>' + th.filter(function (t) { return t.verified; }).length + '</b>Verified counsellors</div><div class="stat"><b>' + th.filter(function (t) { return !t.verified; }).length + '</b>Awaiting verification</div><div class="stat"><b>' + db.appointments.length + '</b>Total appointments</div></div>' +
      '<div class="tabs"><button class="' + (tab === 'users' ? 'sel' : '') + '" data-tab="users">Users</button><button class="' + (tab === 'appts' ? 'sel' : '') + '" data-tab="appts">Appointments</button><button class="' + (tab === 'fb' ? 'sel' : '') + '" data-tab="fb">Stakeholder feedback</button></div><div id="panel"></div>';
    Array.prototype.forEach.call(document.querySelectorAll('[data-tab]'), function (b) { b.onclick = function () { go('/admin/' + b.dataset.tab); }; });
    var p = $('#panel');
    if (tab === 'users') {
      p.innerHTML = '<div class="tablewrap"><table><thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Verification</th><th></th></tr></thead><tbody>' + db.users.map(function (u) {
        var v = u.role === 'therapist' ? (u.verified ? statusBadge('confirmed').replace('Confirmed', 'Verified') + ' <button class="btn small ghost" data-ver="' + u.id + '">Revoke</button>' : statusBadge('pending').replace('Pending', 'Unverified') + ' <button class="btn small" data-ver="' + u.id + '">Verify</button>') : '-';
        return '<tr><td>' + esc(u.name) + '</td><td>' + esc(u.role) + '</td><td>' + esc(u.email) + '</td><td>' + v + '</td><td>' + (u.id === user.id ? '' : '<button class="btn small warn" data-rm="' + u.id + '">Remove</button>') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
      Array.prototype.forEach.call(document.querySelectorAll('[data-ver]'), function (b) { b.onclick = function () { var t = byId(b.dataset.ver); t.verified = !t.verified; save(); toast(t.verified ? 'Counsellor verified' : 'Verification revoked'); route(); }; });
      Array.prototype.forEach.call(document.querySelectorAll('[data-rm]'), function (b) {
        b.onclick = function () {
          var id = b.dataset.rm; if (!confirm('Remove this user and their appointments and messages?')) return;
          db.users = db.users.filter(function (u) { return u.id !== id; });
          db.appointments = db.appointments.filter(function (x) { return x.clientId !== id && x.therapistId !== id; });
          db.messages = db.messages.filter(function (m) { return m.from !== id && m.to !== id; });
          save(); toast('User removed'); route();
        };
      });
    } else if (tab === 'appts') {
      p.innerHTML = '<div class="tablewrap"><table><thead><tr><th>Date</th><th>Time</th><th>Client</th><th>Counsellor</th><th>Type</th><th>Status</th></tr></thead><tbody>' + db.appointments.slice().sort(function (x, y) { return (x.date + x.time) < (y.date + y.time) ? -1 : 1; }).map(function (x) {
        var c = byId(x.clientId), t = byId(x.therapistId);
        return '<tr><td>' + fmtDate(x.date) + '</td><td>' + x.time + '</td><td>' + esc(c ? c.name : '-') + '</td><td>' + esc(t ? t.name : '-') + '</td><td>' + esc(x.mode) + '</td><td>' + statusBadge(x.status) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    } else {
      p.innerHTML = '<p class="muted">Every change request must be agreed with the stakeholder before it is built. Update the status as decisions are made.</p><div class="tablewrap"><table><thead><tr><th>From</th><th>Type</th><th>Details</th><th>Status</th></tr></thead><tbody>' + db.feedback.map(function (f) {
        return '<tr><td>' + esc(f.from) + '</td><td>' + esc(f.type) + '</td><td>' + esc(f.text) + '</td><td><select data-fb="' + f.id + '" aria-label="Status">' + ['Open', 'Agreed', 'Implemented', 'Declined'].map(function (s) { return '<option' + (f.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></td></tr>';
      }).join('') + '</tbody></table></div>';
      Array.prototype.forEach.call(document.querySelectorAll('[data-fb]'), function (s) { s.onchange = function () { db.feedback.forEach(function (f) { if (f.id === s.dataset.fb) f.status = s.value; }); save(); toast('Status updated'); }; });
    }
  }

  function vFeedback(a, user) {
    app.innerHTML = '<div class="card formcard"><h2>Share feedback</h2><p class="muted">Tell us what works and what should change. Requests are reviewed with the administrator and agreed before they are added to the system.</p>' +
      '<form id="f" novalidate><label for="ty">Type</label><select id="ty"><option>Feedback</option><option>Change request</option><option>Problem report</option></select>' +
      '<label for="nm">Your name</label><input id="nm" value="' + esc(user ? user.name : '') + '">' +
      '<label for="tx">Details</label><textarea id="tx" maxlength="600"></textarea><div id="msg"></div><p><button class="btn" type="submit">Submit</button></p></form></div>';
    $('#f').onsubmit = function (e) {
      e.preventDefault();
      var nm = $('#nm').value.trim(), tx = $('#tx').value.trim();
      if (!nm || tx.length < 10) return $('#msg').innerHTML = '<div class="err" role="alert">Please enter your name and at least 10 characters of detail.</div>';
      var kind = $('#ty').value;
      db.feedback.push({ id: uid('f'), from: nm + (user ? ' (' + user.role.charAt(0).toUpperCase() + user.role.slice(1) + ')' : ''), type: kind, text: tx, status: 'Open', at: nowStamp() });
      save(); $('#f').reset(); $('#msg').innerHTML = '<div class="okmsg" role="status">Thank you. Your ' + esc(kind.toLowerCase()) + ' has been recorded.</div>';
    };
  }

  /* ---------- start ---------- */
  load();
  window.addEventListener('hashchange', route);
  route();
})();
