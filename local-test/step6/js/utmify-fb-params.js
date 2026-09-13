/**
 * Persiste e reaplica fbc, fbc_ts, fbp e fbclid entre páginas (sessionStorage + cookies _fbc/_fbp).
 */
(function () {
  var STORAGE_KEY = "utmify_fb_ctx";
  var PARAMS = ["fbc", "fbc_ts", "fbp", "fbclid"];

  function getCookie(name) {
    var parts = ("; " + document.cookie).split("; " + name + "=");
    if (parts.length < 2) return "";
    return decodeURIComponent(parts.pop().split(";").shift() || "");
  }

  function readStore() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function writeStore(o) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(o));
    } catch (e) {}
  }

  function capture() {
    var q = new URLSearchParams(window.location.search);
    var st = readStore();
    var urlFbclid = q.get("fbclid");
    PARAMS.forEach(function (k) {
      var v = q.get(k);
      if (v !== null && v !== "") st[k] = v;
    });
    if (!st.fbp) {
      var fbp = getCookie("_fbp");
      if (fbp) st.fbp = fbp;
    }
    if (!st.fbc) {
      var fbc = getCookie("_fbc");
      if (fbc) st.fbc = fbc;
    }
    if (!st.fbc_ts && st.fbc) {
      var parts = st.fbc.split(".");
      if (parts.length >= 3) st.fbc_ts = parts[2];
    }
    if (urlFbclid) {
      st.fbc_ts = String(Date.now());
      st.fbc = "fb.1." + st.fbc_ts + "." + urlFbclid;
    } else if (st.fbclid) {
      if (!st.fbc_ts) st.fbc_ts = String(Date.now());
      if (!st.fbc) st.fbc = "fb.1." + st.fbc_ts + "." + st.fbclid;
    }
    writeStore(st);
  }

  function mergeParams(params) {
    capture();
    if (!(params instanceof URLSearchParams)) {
      params = new URLSearchParams(params || "");
    }
    var st = readStore();
    PARAMS.forEach(function (k) {
      if (st[k]) params.set(k, st[k]);
    });
    return params;
  }

  window.utmifyFbCapture = capture;
  window.utmifyFbMergeParams = mergeParams;

  capture();
  function delayedCapture() {
    setTimeout(capture, 500);
    setTimeout(capture, 2000);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", delayedCapture);
  } else {
    delayedCapture();
  }
})();
