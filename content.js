/* ============================================================
   SHWETA SHUBHAM — GOOGLE SHEET CONTENT LAYER
   ------------------------------------------------------------
   Reads published Google Sheet tabs as CSV and re-renders the
   matching sections of the page.

   Nothing here needs editing. Admins edit the Google Sheet;
   the sheet ID lives in config.js.

   Safety: if the sheet is unreachable, malformed or empty, the
   HTML already in index.html is left untouched, so the site
   always shows something sensible.
   ============================================================ */
(function () {
  "use strict";

  var CFG = window.SS_CONFIG || {};
  var SHEET_ID = (CFG.SHEET_ID || "").trim();
  var CACHE_MIN = typeof CFG.CACHE_MINUTES === "number" ? CFG.CACHE_MINUTES : 10;
  var CACHE_KEY = "ss-sheet-cache-v1";

  /* Admins routinely paste the whole browser address instead of just the ID.
     Accept either, so a reasonable mistake does not silently break the site. */
  var idFromUrl = SHEET_ID.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/);
  if (idFromUrl) SHEET_ID = idFromUrl[1];

  if (!SHEET_ID) return; // not configured — keep built-in content

  /* ---------- CSV parsing (RFC 4180) ---------- */
  function parseCSV(text) {
    var rows = [], row = [], val = "", inQ = false, i = 0, c;
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    for (; i < text.length; i++) {
      c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') { val += '"'; i++; }
          else inQ = false;
        } else val += c;
      } else if (c === '"') inQ = true;
      else if (c === ",") { row.push(val); val = ""; }
      else if (c === "\n") { row.push(val); rows.push(row); row = []; val = ""; }
      else val += c;
    }
    if (val !== "" || row.length) { row.push(val); rows.push(row); }
    return rows;
  }

  /* Convert rows to objects keyed by lower-cased header names. */
  function toObjects(rows) {
    if (!rows.length) return [];
    var head = rows[0].map(function (h) {
      return String(h).toLowerCase().replace(/\s+/g, "_").trim();
    });
    return rows.slice(1).map(function (r) {
      var o = {};
      head.forEach(function (h, i) { if (h) o[h] = (r[i] === undefined ? "" : String(r[i]).trim()); });
      return o;
    }).filter(function (o) {
      return Object.keys(o).some(function (k) { return o[k] !== ""; });
    });
  }

  /* ---------- safe rich text ---------- */
  function esc(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* Escapes everything, then re-enables a tiny, safe subset so an
     admin can write **bold**, line breaks and [links](url). */
  function rich(s) {
    var e = esc(s);
    e = e.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    e = e.replace(/\[([^\]]+)\]\(((?:https?:|tel:|mailto:|#)[^)\s]*)\)/g,
      function (m, txt, url) { return '<a href="' + url + '">' + txt + "</a>"; });
    e = e.replace(/&lt;(\/?)(b|i|em|strong|small|u)&gt;/g, "<$1$2>");
    e = e.replace(/&lt;br\s*\/?&gt;/g, "<br>");
    e = e.replace(/\n/g, "<br>");
    return e;
  }

  function telLink(num) {
    var digits = String(num).replace(/[^\d]/g, "");
    if (digits.length === 10) digits = "91" + digits;
    return "+" + digits;
  }

  /* ---------- fetching ---------- */
  function sheetURL(tab) {
    return "https://docs.google.com/spreadsheets/d/" + SHEET_ID +
      "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent(tab);
  }

  function readCache() {
    if (!CACHE_MIN) return null;
    try {
      var raw = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (!raw || raw.id !== SHEET_ID) return null;
      if (Date.now() - raw.at > CACHE_MIN * 60000) return null;
      return raw.data;
    } catch (e) { return null; }
  }

  function writeCache(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ id: SHEET_ID, at: Date.now(), data: data }));
    } catch (e) { /* quota — ignore */ }
  }

  var TABS = ["settings", "notices", "festivals", "timings", "guidelines",
    "staff_scope", "fees", "committee", "escalation", "checklist",
    "downloads", "gallery", "quick_actions", "resolutions", "records", "posters",
    "helplines", "events"];

  function fetchTab(tab) {
    return fetch(sheetURL(tab), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(tab + " " + r.status); return r.text(); })
      .then(function (t) { return { tab: tab, rows: toObjects(parseCSV(t)) }; })
      .catch(function () { return { tab: tab, rows: null }; });
  }

  /* ---------- renderers ---------- */
  var R = {};

  R.settings = function (rows) {
    var map = {};
    rows.forEach(function (r) { if (r.key) map[r.key.toLowerCase()] = r.value || ""; });
    Object.keys(map).forEach(function (k) {
      var nodes = document.querySelectorAll('[data-ss="' + k + '"]');
      Array.prototype.forEach.call(nodes, function (n) {
        var v = map[k];
        if (n.tagName === "A" && /^(https?:|tel:|mailto:|#)/.test(v)) { n.href = v; return; }
        /* An admin types an address, not "mailto:", so build the link here
           rather than leave the old href pointing at the previous mailbox. */
        if (n.tagName === "A" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
          n.href = "mailto:" + v;
          n.textContent = v;
          return;
        }
        if (n.tagName === "A" && /^[\d\s()+-]{8,}$/.test(v)) {
          var digits = v.replace(/\D/g, "");
          if (digits.length === 10) digits = "91" + digits;
          n.href = "tel:+" + digits;
          n.textContent = v;
          return;
        }
        n.innerHTML = rich(v);
      });
    });
    applyMapEmbed(map.map_embed);
  };

  /* The map is the one place the sheet hands us a URL that goes straight into
     an iframe, so it is checked against an allow-list of Google embed
     addresses first. Anything unrecognised is ignored and the built-in map is
     left alone, rather than trusting whatever was typed. */
  var MAP_OK = /^https:\/\/(?:www\.)?(?:google\.com\/maps\/embed|maps\.google\.com\/maps\?)/i;

  function applyMapEmbed(raw) {
    var wrap = document.getElementById("mapWrap");
    var frame = document.getElementById("mapFrame");
    if (!wrap || !frame || raw === undefined) return;

    var v = String(raw === null ? "" : raw).trim();
    if (!v || /^(off|no|none|hide|hidden)$/i.test(v)) { wrap.hidden = true; return; }

    /* accept a whole <iframe> pasted out of Google Maps, not just the URL */
    var m = v.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    var url = (m ? m[1] : v).replace(/&amp;/gi, "&").trim();
    if (!MAP_OK.test(url)) return;

    wrap.hidden = false;
    if (frame.getAttribute("src") !== url) frame.setAttribute("src", url);
  }

  R.notices = function (rows) {
    var el = document.getElementById("noticeList");
    if (!el) return;
    var pill = { red: "pill-red", gold: "pill-gold", green: "pill-green", grey: "pill-grey" };
    el.innerHTML = rows.map(function (r, i) {
      var last = i === rows.length - 1;
      return '<div style="padding:18px 22px' + (last ? "" : ";border-bottom:1px solid var(--line)") + '">' +
        '<span class="pill ' + (pill[(r.colour || r.color || "grey").toLowerCase()] || "pill-grey") + '">' + esc(r.tag || "Notice") + "</span>" +
        '<b style="display:block;margin-top:8px">' + rich(r.title) + "</b>" +
        (r.body ? '<small style="color:var(--muted)">' + rich(r.body) + "</small>" : "") +
        "</div>";
    }).join("");
  };

  R.festivals = function (rows) {
    var el = document.getElementById("festRows");
    if (!el) return;
    /* A festival with no name is a blank row, and a sheet of them would
       wipe the list, so only render when there is something to show. */
    var list = rows.filter(function (r) { return r.name; });
    if (!list.length) return;
    el.innerHTML = list.map(function (r) {
      return "<tr><td><b>" + esc(r.name) + '</b></td><td class="num">' +
        esc(r.date || "") + "</td></tr>";
    }).join("");
  };

  R.timings = function (rows) {
    var el = document.getElementById("timingRows");
    if (!el) return;
    el.innerHTML = rows.map(function (r) {
      return "<tr><td><b>" + rich(r.activity) + "</b></td>" +
        '<td class="num">' + rich(r.timings) + "</td>" +
        "<td>" + rich(r.notes) + "</td></tr>";
    }).join("");
  };

  R.guidelines = function (rows) {
    var el = document.getElementById("acclist");
    if (!el) return;
    var order = [], byNo = {};
    rows.forEach(function (r) {
      var no = r.section || "";
      if (!no) return;
      if (!byNo[no]) { byNo[no] = { no: no, title: "", keywords: "", anchor: "", items: [] }; order.push(no); }
      var g = byNo[no];
      if (r.title && !g.title) g.title = r.title;
      if (r.keywords && !g.keywords) g.keywords = r.keywords;
      if (r.anchor && !g.anchor) g.anchor = r.anchor;
      if (r.text) g.items.push({ kind: (r.kind || "li").toLowerCase(), text: r.text });
    });
    if (!order.length) return;

    el.innerHTML = order.map(function (no) {
      var g = byNo[no], out = "", openList = false;
      g.items.forEach(function (it) {
        var isLi = it.kind === "li" || it.kind === "";
        if (isLi && !openList) { out += "<ul>"; openList = true; }
        if (!isLi && openList) { out += "</ul>"; openList = false; }
        if (isLi) out += "<li>" + rich(it.text) + "</li>";
        else if (it.kind === "sub") out += "<p><b>" + rich(it.text) + "</b></p>";
        else if (it.kind === "note") out += '<div class="note">' + rich(it.text) + "</div>";
        else if (it.kind === "note-red") out += '<div class="note red">' + rich(it.text) + "</div>";
        else if (it.kind === "note-green") out += '<div class="note green">' + rich(it.text) + "</div>";
        else out += "<p>" + rich(it.text) + "</p>";
      });
      if (openList) out += "</ul>";
      return '<details class="acc"' + (g.anchor ? ' id="' + esc(g.anchor) + '"' : "") +
        ' data-k="' + esc(g.keywords.toLowerCase()) + '">' +
        '<summary><span class="sec-no">' + esc(g.no) + "</span> " + esc(g.title) + "</summary>" +
        '<div class="body">' + out + "</div></details>";
    }).join("");

    var noRes = document.getElementById("noresult");
    if (noRes && !noRes.classList.contains("hidden")) noRes.classList.add("hidden");
  };

  R.staff_scope = function (rows) {
    var el = document.getElementById("scopeGrid");
    if (!el) return;
    var order = [], byRole = {};
    rows.forEach(function (r) {
      var role = r.role || "";
      if (!role) return;
      if (!byRole[role]) { byRole[role] = { role: role, icon: r.icon || "", covered: [], not: [], duties: [], prose: [] }; order.push(role); }
      var g = byRole[role];
      if (r.icon && !g.icon) g.icon = r.icon;
      var col = (r.group || "covered").toLowerCase().replace(/[\s-]/g, "_");
      var bucket = col === "not_covered" || col === "not" ? "not"
        : col === "duties" || col === "resident_duties" ? "duties"
          : col === "prose" ? "prose" : "covered";
      if (r.text) g[bucket].push(r.text);
    });
    if (!order.length) return;

    el.innerHTML = order.map(function (role) {
      var g = byRole[role];
      var head = (g.icon ? esc(g.icon) + " " : "") + esc(g.role);

      if (g.prose.length) {
        return '<div class="card" style="background:var(--brand);color:#dcece7;border-color:var(--brand)">' +
          '<h3 style="color:#fff">' + head + "</h3>" +
          g.prose.map(function (p, i) {
            return '<p style="color:#b9d4cd' + (i === g.prose.length - 1 ? ";margin:0" : "") + '">' + rich(p) + "</p>";
          }).join("") + "</div>";
      }

      function col(label, cls, items) {
        if (!items.length) return "";
        return "<div><h4><span class=\"pill " + cls + '">' + esc(label) + "</span></h4><ul>" +
          items.map(function (t) { return "<li>" + rich(t) + "</li>"; }).join("") + "</ul></div>";
      }
      return '<div class="card"><h3>' + head + '</h3><div class="scope">' +
        col("Covered", "pill-green", g.covered) +
        col(g.duties.length ? "Resident duties" : "Not covered", "pill-red", g.duties.length ? g.duties : g.not) +
        "</div></div>";
    }).join("");
  };

  R.fees = function (rows) {
    var cards = rows.filter(function (r) { return (r.type || "").toLowerCase() === "card"; });
    var pens = rows.filter(function (r) { return (r.type || "").toLowerCase() !== "card"; });

    var cardEl = document.getElementById("feeCards");
    if (cardEl && cards.length) {
      var pill = { red: "pill-red", gold: "pill-gold", green: "pill-green", grey: "pill-grey" };
      cardEl.innerHTML = cards.map(function (r) {
        return '<div class="card"><span class="pill ' +
          (pill[(r.colour || r.color || "gold").toLowerCase()] || "pill-gold") + '">' + esc(r.label) + "</span>" +
          '<h3 style="margin-top:12px">' + rich(r.amount) + "</h3>" +
          '<p style="margin:0;color:var(--muted);font-size:.92rem">' + rich(r.note) + "</p></div>";
      }).join("");
    }

    var rowEl = document.getElementById("penaltyRows");
    if (rowEl && pens.length) {
      rowEl.innerHTML = pens.map(function (r) {
        return "<tr><td>" + rich(r.label) + '</td><td class="num">' + rich(r.amount) + "</td></tr>";
      }).join("");
    }
  };

  /* a committee number is worth tapping; anything else is left as written */
  function phoneCell(num) {
    var v = String(num == null ? "" : num).trim();
    if (!/\d{6,}/.test(v.replace(/\s/g, ""))) return esc(v);
    return '<a href="tel:' + telLink(v) + '">' + esc(v) + "</a>";
  }

  R.committee = function (rows) {
    var groups = { core: [], advisory: [], extended: [] };
    rows.forEach(function (r) {
      var g = (r.group || "core").toLowerCase();
      if (g.indexOf("adv") === 0) groups.advisory.push(r);
      else if (g.indexOf("ext") === 0) groups.extended.push(r);
      else groups.core.push(r);
    });

    var core = document.getElementById("coreRows");
    if (core && groups.core.length) {
      core.innerHTML = groups.core.map(function (r) {
        return "<tr><td><b>" + esc(r.name) + "</b></td><td>" + esc(r.post) + "</td><td>" + esc(r.flat) +
          '</td><td class="num ph">' + phoneCell(r.phone) + "</td><td>" + rich(r.responsibilities) + "</td></tr>";
      }).join("");
    }
    [["advRows", groups.advisory], ["extRows", groups.extended]].forEach(function (p) {
      var el = document.getElementById(p[0]);
      if (!el || !p[1].length) return;
      el.innerHTML = p[1].map(function (r) {
        return "<tr><td>" + esc(r.name) + "</td><td>" + esc(r.flat) +
          '</td><td class="num ph">' + phoneCell(r.phone) + "</td></tr>";
      }).join("");
    });
  };

  R.escalation = function (rows) {
    var el = document.getElementById("escRows");
    if (!el) return;
    el.innerHTML = rows.map(function (r, i) {
      var num = String(r.number || "");
      var cell = /\d{6,}/.test(num.replace(/\s/g, ""))
        ? '<a href="tel:' + telLink(num) + '">' + esc(num) + "</a>"
        : esc(num);
      return '<tr><td class="num">' + (i + 1) + "</td><td><b>" + esc(r.contact) +
        '</b></td><td class="num">' + cell + "</td><td>" + rich(r.availability) + "</td></tr>";
    }).join("");
  };

  R.checklist = function (rows) {
    var el = document.getElementById("checklist");
    if (!el) return;
    el.innerHTML = rows.map(function (r, i) {
      return '<label class="check"><input type="checkbox" data-c="' + (i + 1) + '"><span><b>' +
        (i + 1) + ". " + esc(r.title) + "</b><small>" + rich(r.detail) + "</small></span></label>";
    }).join("");
    if (typeof window.SSChecklist === "function") window.SSChecklist();
  };

  R.downloads = function (rows) {
    var el = document.getElementById("dlList");
    if (!el) return;
    el.innerHTML = rows.map(function (r, i) {
      var last = i === rows.length - 1;
      var href = r.url || "#contact";
      var dl = /\.(pdf|docx?|xlsx?|png|jpe?g)$/i.test(href) ? " download" : "";
      return "<a href=\"" + esc(href) + '"' + dl + ' style="display:block;padding:16px 20px' +
        (last ? "" : ";border-bottom:1px solid var(--line)") +
        ';color:inherit;text-decoration:none"><b>\uD83D\uDCC4 ' + esc(r.title) +
        '</b><br><small style="color:var(--muted)">' + rich(r.note) + "</small></a>";
    }).join("");
  };

  /* Works out the real path of a picture named in the sheet.

     Photos are filed under images/<section>/, but the sheet only ever needs
     the bare file name — this fills in the section folder. A name that
     already has a folder in it is treated as relative to images/, and a full
     https:// link is used untouched. A stray leading "images/" or "/" is
     tolerated so a path copied out of the repo still resolves. */
  function imgSrc(file, folder) {
    var f = String(file === undefined || file === null ? "" : file).trim();
    if (/^https?:\/\//i.test(f)) return f;
    f = f.replace(/^\/+/, "").replace(/^images\//i, "");
    return "images/" + (f.indexOf("/") < 0 ? folder + "/" : "") + f;
  }

  R.gallery = function (rows) {
    var el = document.getElementById("gal");
    if (!el) return;
    el.innerHTML = rows.map(function (r) {
      return '<figure tabindex="0" data-cap="' + esc(r.caption || r.title) + '">' +
        '<img src="' + esc(imgSrc(r.file, "gallery")) + '" alt="' + esc(r.title) + '"' +
        ' data-c1="' + esc(r.colour1 || r.color1 || "#14564a") + '"' +
        ' data-c2="' + esc(r.colour2 || r.color2 || "#0b3a32") + '"' +
        ' onerror="phFallback(this)" loading="lazy">' +
        "<figcaption>" + esc(r.title) + "</figcaption></figure>";
    }).join("");
  };

  R.posters = function (rows) {
    var el = document.getElementById("posGrid");
    if (!el) return;
    rows = rows.filter(function (r) { return r.file; });
    if (!rows.length) return;
    el.innerHTML = rows.map(function (r) {
      var src = imgSrc(r.file, "posters");
      return '<figure tabindex="0" data-cap="' + esc(r.caption || r.title) + '">' +
        '<div class="shot"><img src="' + esc(src) + '" alt="' + esc(r.title) + '"' +
        ' onerror="phFallback(this)" loading="lazy"></div>' +
        "<figcaption>" + esc(r.title) + "</figcaption></figure>";
    }).join("");
  };

  /* A Google Drive "share" link opens a viewer page, not the picture, so an
     <img> pointed straight at one shows nothing. Lift the file id out of
     whichever shape was pasted  /file/d/<id>/view, ?id=<id>, or /d/<id>. */
  function driveId(u) {
    var s = String(u);
    var m = s.match(/\/file\/d\/([A-Za-z0-9_-]{8,})/) ||
      s.match(/[?&]id=([A-Za-z0-9_-]{8,})/) ||
      s.match(/\/d\/([A-Za-z0-9_-]{8,})/);
    return m ? m[1] : "";
  }

  /* Drive hands the same file out from more than one host, and which of
     them answers has changed over the years. Rather than bet on one, every
     candidate is returned and the page tries the next if a photo fails. */
  function photoSrcs(raw) {
    var f = String(raw === undefined || raw === null ? "" : raw).trim();
    if (!f) return [];
    if (/^https?:\/\/[^\/]*\bgoogle\.com\//i.test(f)) {
      var id = driveId(f);
      if (!id) return [f];
      return ["https://lh3.googleusercontent.com/d/" + id + "=w1600",
        "https://drive.google.com/thumbnail?id=" + id + "&sz=w1600",
        "https://drive.google.com/uc?export=view&id=" + id];
    }
    return [imgSrc(f, "events")];
  }

  /* The admin should not have to remember which word we chose for a column,
     so the usual synonyms are all accepted. */
  function pick(row, names) {
    for (var i = 0; i < names.length; i++) {
      var v = row[names[i]];
      if (v !== undefined && v !== null && String(v).trim()) return String(v).trim();
    }
    return "";
  }

  R.events = function (rows) {
    var track = document.getElementById("evTrack");
    if (!track) return;
    var list = rows.map(function (r) {
      return {
        name: pick(r, ["name", "event", "title"]),
        note: pick(r, ["details", "detail", "description", "summary", "note"]),
        photo: pick(r, ["photo", "link", "url", "image", "picture", "file"]),
        when: parseDate(pick(r, ["date", "held", "on"]))
      };
    /* A row with no picture has nothing to show in a photo carousel, and a
       row with no name would appear as an unlabelled slide. */
    }).filter(function (e) { return e.photo && e.name; });
    if (!list.length) return;

    /* "Latest events" should lead with the latest. Rows that carry no date,
       or a date we could not read, keep the order the sheet put them in. */
    var dated = list.filter(function (e) { return e.when && e.when.iso; });
    if (dated.length === list.length) {
      list.sort(function (a, b) { return a.when.iso < b.when.iso ? 1 : a.when.iso > b.when.iso ? -1 : 0; });
    }

    track.innerHTML = list.map(function (e) {
      var srcs = photoSrcs(e.photo);
      var when = e.when ? '<span class="ev-when">' + esc(e.when.long || e.when.raw) + "</span>" : "";
      var cap = e.name + (e.note ? " \u2014 " + e.note : "");
      return '<figure tabindex="0" data-cap="' + esc(cap) + '">' +
        '<div class="shot"><img src="' + esc(srcs[0]) + '" alt="' + esc(e.name) + '"' +
        ' data-alt="' + esc(srcs.slice(1).join("|")) + '"' +
        ' onerror="evImgFail(this)" loading="lazy"></div>' +
        '<figcaption><span class="ev-name">' + esc(e.name) + "</span>" + when +
        (e.note ? '<p class="ev-note">' + rich(e.note) + "</p>" : "") +
        "</figcaption></figure>";
    }).join("");

    /* The section and its menu entry stay out of the way until there is
       something in them, so an empty carousel is never published. */
    var sec = document.getElementById("events");
    if (sec) sec.hidden = false;
    var link = document.getElementById("evLink");
    if (link) link.hidden = false;
  };

  /* Group decides the pill colour and whether the card is styled as urgent.
     Unknown groups fall back to "society" rather than rendering unstyled. */
  var HL_GROUPS = {
    emergency: { pill: "pill-red", cls: " sos" },
    society: { pill: "pill-gold", cls: "" },
    utility: { pill: "pill-grey", cls: "" },
    support: { pill: "pill-green", cls: "" }
  };

  R.helplines = function (rows) {
    var el = document.getElementById("helpGrid");
    if (!el) return;
    var cards = rows.filter(function (r) { return r.name && r.number; });
    if (!cards.length) return;
    /* A dropped helpline is a number a resident cannot reach, so a partly
       readable sheet must never replace the vetted built-in list. Google
       types a column from its values: when most numbers are bare digits the
       column becomes numeric and every entry containing a space arrives
       empty. Formatting the number column as plain text fixes it. */
    var lost = rows.filter(function (r) { return r.name && !r.number; });
    if (lost.length) {
      if (window.console && console.warn) {
        console.warn("Helplines: " + lost.length + " row(s) have a name but no number (" +
          lost.map(function (r) { return r.name; }).join(", ") +
          "). Format the number column in the sheet as plain text. Showing the built-in numbers instead.");
      }
      return;
    }
    el.innerHTML = cards.map(function (r) {
      var label = String(r.group || "Society").trim();
      var g = HL_GROUPS[label.toLowerCase()] || HL_GROUPS.society;
      var num = String(r.number).trim();
      var plain = num.replace(/\s/g, "");
      var digits = num.replace(/[^\d]/g, "");
      /* Only a bare 10-digit mobile needs +91. Short codes (100, 108),
         toll-free lines (1800 …) and landlines are dialled as written. */
      var href = (digits.length === 10 && plain.charAt(0) !== "+")
        ? "tel:" + telLink(num)
        : "tel:" + plain;
      return '<a class="card hl' + g.cls + '" href="' + href + '">' +
        '<span class="hl-top"><span class="hl-ico">' + esc(r.icon) + "</span>" +
        '<span class="pill ' + g.pill + '">' + esc(label) + "</span></span>" +
        "<b>" + esc(r.name) + "</b>" +
        '<span class="hl-num">' + esc(num) + "</span>" +
        "<small>" + rich(r.note) + "</small></a>";
    }).join("");
  };

  R.quick_actions = function (rows) {
    var el = document.getElementById("qaGrid");
    if (!el) return;
    el.innerHTML = rows.map(function (r) {
      return '<a class="card tile" href="' + esc(r.link || "#") + '">' +
        '<span class="ico">' + esc(r.icon) + "</span><b>" + esc(r.title) + "</b>" +
        "<small>" + rich(r.note) + "</small></a>";
    }).join("");
  };

  /* ---------- resolutions & records ---------- */
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MONF = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

  function monthIndex(name) {
    var k = String(name).slice(0, 3).toLowerCase();
    for (var i = 0; i < MON.length; i++) if (MON[i].toLowerCase() === k) return i + 1;
    return 0;
  }

  /* Accepts 2025-04-26, 26/04/2025, 26 April 2025 or April 26, 2025.
     Anything else is shown exactly as typed, so a date is never silently lost. */
  function parseDate(s) {
    s = String(s === undefined || s === null ? "" : s).trim();
    if (!s) return null;
    var m, y = 0, mo = 0, d = 0;
    if ((m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
    else if ((m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/))) { d = +m[1]; mo = +m[2]; y = +m[3]; }
    else if ((m = s.match(/^(\d{1,2})\s+([A-Za-z]{3,})\.?,?\s+(\d{4})$/))) { d = +m[1]; mo = monthIndex(m[2]); y = +m[3]; }
    else if ((m = s.match(/^([A-Za-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{4})$/))) { mo = monthIndex(m[1]); d = +m[2]; y = +m[3]; }
    else return { raw: s };
    if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return { raw: s };
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return {
      iso: y + "-" + p(mo) + "-" + p(d),
      day: p(d),
      monYear: MON[mo - 1] + " " + y,
      long: d + " " + MONF[mo - 1] + " " + y,
      raw: s
    };
  }

  R.resolutions = function (rows) {
    var el = document.getElementById("resList");
    if (!el) return;
    /* A resolution with no reference, title or summary carries no information:
       it means the sheet columns were renamed or the rows were mis-pasted.
       Skip those rows, and keep the built-in list if none survive. */
    rows = rows.filter(function (r) { return r.ref || r.title || r.summary; });
    if (!rows.length) return;
    var pills = {
      passed: "pill-green", approved: "pill-green", adopted: "pill-green",
      noted: "pill-grey", deferred: "pill-grey", withdrawn: "pill-grey",
      pending: "pill-gold", proposed: "pill-gold", rejected: "pill-red"
    };
    el.innerHTML = rows.map(function (r) {
      var dt = parseDate(r.date);
      var st = r.status || "Passed";
      var cls = pills[String(st).toLowerCase()] || "pill-grey";
      var link = r.link && /^(https?:|#|mailto:)/.test(r.link)
        ? '<p style="margin-top:9px"><a href="' + esc(r.link) + '">Read the full resolution</a></p>' : "";
      return '<article class="res" data-date="' + esc(dt && dt.iso ? dt.iso : "") + '">' +
        '<div class="res-top">' +
        (r.ref ? '<span class="res-ref">' + esc(r.ref) + "</span>" : "") +
        (dt ? "<time" + (dt.iso ? ' datetime="' + dt.iso + '"' : "") + ">" +
          esc(dt.long || dt.raw) + "</time>" : "") +
        '<span class="pill ' + cls + '">' + esc(st) + "</span></div>" +
        "<b>" + esc(r.title) + "</b><p>" + rich(r.summary) + "</p>" + link +
        "</article>";
    }).join("");
    if (typeof window.SSLists === "function") window.SSLists();
  };

  R.records = function (rows) {
    var el = document.getElementById("recList");
    if (!el) return;
    el.innerHTML = rows.map(function (r) {
      var s = String(r.type || "").toLowerCase(), key, label, pill;
      if (/mom|minute/.test(s)) { key = "mom"; label = "Minutes of Meeting"; pill = "pill-green"; }
      else if (/circular/.test(s)) { key = "circular"; label = "Circular"; pill = "pill-gold"; }
      else { key = "notice"; label = "Notice"; pill = "pill-red"; }
      var dt = parseDate(r.date);
      var href = r.link && /^(https?:|#|mailto:)/.test(r.link) ? r.link : "#contact";
      /* A real document opens in its own tab so the resident keeps their
         place on the page; an in-page anchor must not. */
      var away = /^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : "";
      return '<a class="rec" data-type="' + key + '" data-date="' + esc(dt && dt.iso ? dt.iso : "") +
        '" href="' + esc(href) + '"' + away + '><span class="rec-date">' +
        (dt && dt.day ? "<b>" + dt.day + "</b><span>" + esc(dt.monYear) + "</span>"
          : "<b>&middot;</b><span>" + esc(dt ? dt.raw : "") + "</span>") +
        '</span><span class="rec-main"><span class="pill ' + pill + '">' + esc(label) +
        "</span><b>" + esc(r.title) + "</b><small>" + rich(r.note) + "</small></span></a>";
    }).join("");
    if (typeof window.SSLists === "function") window.SSLists();
  };

  /* ---------- status note ---------- */
  function status(msg, ok) {
    if (CFG.SHOW_STATUS === false) return;
    var el = document.getElementById("sheetStatus");
    if (!el) return;
    el.textContent = msg;
    el.style.color = ok ? "" : "var(--gold)";
  }

  /* ---------- run ---------- */
  function render(data) {
    var applied = 0;
    TABS.forEach(function (tab) {
      var rows = data[tab];
      if (!rows || !rows.length || !R[tab]) return;
      try { R[tab](rows); applied++; }
      catch (e) { if (window.console) console.warn("Sheet tab '" + tab + "' failed to render:", e); }
    });
    /* The page search indexes live DOM text, so it has to be rebuilt
       once the sheet has replaced the built-in content. */
    if (applied && typeof window.SSSearch === "function") {
      try { window.SSSearch(); } catch (e) { /* search is optional */ }
    }
    return applied;
  }

  function boot() {
    var cached = readCache();
    if (cached) {
      var n = render(cached);
      status(n ? "Content loaded from the society Google Sheet." : "", true);
      return;
    }
    Promise.all(TABS.map(fetchTab)).then(function (results) {
      var data = {}, got = 0;
      results.forEach(function (r) { if (r.rows && r.rows.length) { data[r.tab] = r.rows; got++; } });
      if (!got) {
        status("Could not reach the Google Sheet \u2014 showing the built-in content.", false);
        return;
      }
      writeCache(data);
      var n = render(data);
      status(n ? "Content loaded from the society Google Sheet." : "", true);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
