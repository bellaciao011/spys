(function () {
  var UTM_KEYS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'src', 'xcod', 'fbclid', 'ttclid', 'gclid', 'ref', 'referencia', '_fbp',
    'tel', 'celular'
  ];

  var UTM_STRIP = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_perfect'];
  var FB_SOURCE = /facebook|fb\.com|meta|instagram|^fb$|^ig$/i;
  var TT_SOURCE = /tiktok|^tt$|bytedance|musical\.ly/i;

  function hasVal(v) {
    return v != null && String(v).trim() !== '';
  }

  function fromUrl() {
    var url = new URLSearchParams(window.location.search);
    var out = {};
    UTM_KEYS.forEach(function (k) {
      var v = url.get(k);
      if (hasVal(v)) out[k] = v;
    });
    return out;
  }

  function clearCloakFlags() {
    try {
      sessionStorage.removeItem('funnel_utm_cloak_mode');
      sessionStorage.removeItem('funnel_utm_cloaked');
      sessionStorage.removeItem('funnel_fb_utm_content');
      localStorage.removeItem('funnel_tt_attribution');
    } catch (e) { /* ignore */ }
  }

  function persistFromUrl() {
    clearCloakFlags();
    var data = fromUrl();

    if (data.fbclid || (data.utm_source && FB_SOURCE.test(data.utm_source)) || data._fbp) {
      sessionStorage.setItem('funnel_from_facebook', '1');
    }
    if (data.ttclid || (data.utm_source && TT_SOURCE.test(data.utm_source))) {
      sessionStorage.setItem('funnel_from_tiktok', '1');
    }

    Object.keys(data).forEach(function (k) {
      if (hasVal(data[k])) sessionStorage.setItem('funnel_' + k, data[k]);
    });
  }

  function getAll() {
    var out = {};
    var urlData = fromUrl();
    UTM_KEYS.forEach(function (k) {
      var v = urlData[k] || sessionStorage.getItem('funnel_' + k);
      if (hasVal(v)) out[k] = v;
    });
    return out;
  }

  function toDirectPayUrl(base) {
    return String(base || '')
      .replace(/^https?:\/\/go\.perfectpay\.com\.br\//i, 'https://checkout.perfectpay.com.br/checkout/');
  }

  function stripEmptyParams(url) {
    var keys = [];
    url.searchParams.forEach(function (_v, k) { keys.push(k); });
    keys.forEach(function (k) {
      if (!hasVal(url.searchParams.get(k))) url.searchParams.delete(k);
    });
  }

  function appendToUrl(base, extra) {
    persistFromUrl();

    var cleaned = toDirectPayUrl(base);
    var isAbsolute = /^https?:\/\//i.test(cleaned);
    var url;

    try {
      url = isAbsolute ? new URL(cleaned) : new URL(cleaned, window.location.href);
    } catch (e) {
      var mergedFb = Object.assign({}, getAll(), extra || {});
      var p = new URLSearchParams();
      Object.keys(mergedFb).forEach(function (k) {
        if (hasVal(mergedFb[k])) p.set(k, String(mergedFb[k]).trim());
      });
      var qsFallback = p.toString();
      if (!qsFallback) return cleaned;
      return cleaned + (cleaned.indexOf('?') > -1 ? '&' : '?') + qsFallback;
    }

    UTM_STRIP.forEach(function (k) {
      url.searchParams.delete(k);
    });
    stripEmptyParams(url);

    var merged = Object.assign({}, getAll(), extra || {});
    Object.keys(merged).forEach(function (k) {
      if (hasVal(merged[k])) url.searchParams.set(k, String(merged[k]).trim());
    });
    stripEmptyParams(url);

    if (!isAbsolute) return url.pathname + url.search + url.hash;
    return url.toString();
  }

  function appendToPath(path, extra) {
    return appendToUrl(path, extra);
  }

  window.FunnelUtm = {
    persist: persistFromUrl,
    getAll: getAll,
    toDirectPayUrl: toDirectPayUrl,
    getCloakMode: function () { return 'off'; },
    shouldCloakAsFacebook: function () { return false; },
    isCloakedAsFacebook: function () { return false; },
    getTikTokAttribution: function () { return null; },
    attributionPayload: function () { return {}; },
    appendToUrl: appendToUrl,
    appendToPath: appendToPath
  };

  persistFromUrl();
})();
