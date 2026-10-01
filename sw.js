/* ============================================================
   SHWETA SHUBHAM — OFFLINE SHELL
   ------------------------------------------------------------
   Lets residents keep the page on their home screen and still
   read the guidelines, timings and helpline numbers when there
   is no signal — in a power cut, a lift breakdown or a
   basement with no coverage.

   Rules:
     • Pages and code are network-first, so anyone online always
       sees the newest content and never a stale page.
     • Photos are cache-first, because they almost never change.
     • Anything on another domain (the Google Sheet, the Google
       map) is left completely alone and never stored here.

   Bump VERSION whenever the files in SHELL change.
   ============================================================ */
var VERSION = "ss-shell-v2";

var SHELL = [
  "./",
  "./index.html",
  "./config.js",
  "./content.js",
  "./manifest.webmanifest",
  "./images/brand/logo.png",
  "./images/brand/favicon.png",
  "./images/brand/icon-192.png",
  "./images/brand/icon-512.png",
  "./images/brand/apple-touch-icon.png",
  "./images/hero/building.jpg"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (c) {
      /* Add one by one: a single missing file must not abandon the
         whole install and leave residents with no offline copy. */
      return Promise.all(SHELL.map(function (u) {
        return c.add(new Request(u, { cache: "reload" })).catch(function () { });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (n) {
        return n === VERSION ? null : caches.delete(n);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return; // sheet + map untouched

  var p = url.pathname;
  var isCode = p.endsWith("/") || /\.(?:html|js|webmanifest|css)$/.test(p);

  if (req.mode === "navigate" || isCode) {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match("./index.html");
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
