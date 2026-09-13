(function () {
  var FB_SOURCE = /facebook|fb\.com|meta|instagram|^fb$|^ig$/i;
  var TT_SOURCE = /tiktok|^tt$|bytedance|musical\.ly/i;
  var EMAIL_CAMPAIGNS = /^(cart_abandono_a|cart_abandono_b|cart_reembolso)$/i;
  var EMAIL_SRC = /^(email[123]_[ab]|refund[123])$/i;
  var HIDE_KEY = 'funnel_hide_upsell_prices';

  function getParam(key) {
    var url = new URLSearchParams(window.location.search);
    var v = url.get(key);
    if (v && String(v).trim()) return v;
    return sessionStorage.getItem('funnel_' + key) || '';
  }

  function detectFacebook() {
    if (sessionStorage.getItem('funnel_from_facebook') === '1') return true;

    if (getParam('fbclid')) {
      sessionStorage.setItem('funnel_from_facebook', '1');
      return true;
    }

    var src = getParam('utm_source');
    if (src && FB_SOURCE.test(src)) {
      sessionStorage.setItem('funnel_from_facebook', '1');
      return true;
    }

    if (getParam('_fbp')) {
      sessionStorage.setItem('funnel_from_facebook', '1');
      return true;
    }

    return false;
  }

  function detectTikTok() {
    if (sessionStorage.getItem('funnel_from_tiktok') === '1') return true;

    if (getParam('ttclid')) {
      sessionStorage.setItem('funnel_from_tiktok', '1');
      return true;
    }

    var src = getParam('utm_source');
    if (src && TT_SOURCE.test(src)) {
      sessionStorage.setItem('funnel_from_tiktok', '1');
      return true;
    }

    return false;
  }

  function detectEmailRecovery() {
    if (sessionStorage.getItem(HIDE_KEY) === 'email') return true;

    var campaign = (getParam('utm_campaign') || '').trim();
    var srcTag = (getParam('src') || '').trim();
    var source = (getParam('utm_source') || '').trim();
    var medium = (getParam('utm_medium') || '').trim().toLowerCase();
    var content = (getParam('utm_content') || '').trim().toLowerCase();

    var byCampaign = EMAIL_CAMPAIGNS.test(campaign);
    var bySrc = EMAIL_SRC.test(srcTag);
    var byStalkeaEmail =
      /^stalkea$/i.test(source) &&
      medium === 'email' &&
      (byCampaign || bySrc || /^email[123]$/.test(content) || /^refund/.test(content));

    if (byCampaign || bySrc || byStalkeaEmail) {
      sessionStorage.setItem(HIDE_KEY, 'email');
      return true;
    }

    return false;
  }

  function shouldHidePrices() {
    return detectFacebook() || detectTikTok() || detectEmailRecovery();
  }

  function injectStyles() {
    if (document.getElementById('upsell-price-toggle-styles')) return;
    var style = document.createElement('style');
    style.id = 'upsell-price-toggle-styles';
    style.textContent = '.hide-upsell-prices .upsell-charge-box,.hide-upsell-prices .offer-decline{display:none!important}';
    document.head.appendChild(style);
  }

  function applyCtaLabels(hidePrices) {
    ['offer-btn', 'cta-btn'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn) return;
      var fbCta = btn.getAttribute('data-fb-cta');
      var directCta = btn.getAttribute('data-direct-cta');
      if (hidePrices && fbCta) {
        btn.textContent = fbCta;
      } else if (directCta) {
        btn.textContent = directCta;
      }
    });
  }

  function applyDeclineVisibility(hide) {
    var declines = document.querySelectorAll('.offer-decline, #decline-link');
    declines.forEach(function (el) {
      el.style.display = hide ? 'none' : '';
    });
  }

  function apply() {
    injectStyles();
    var hide = shouldHidePrices();
    document.body.classList.toggle('hide-upsell-prices', hide);
    applyCtaLabels(hide);
    applyDeclineVisibility(hide);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }

  window.UpsellPriceToggle = {
    isFromFacebook: detectFacebook,
    isFromTikTok: detectTikTok,
    isEmailRecovery: detectEmailRecovery,
    shouldHidePrices: shouldHidePrices,
    apply: apply
  };
})();
