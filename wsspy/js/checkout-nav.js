(function () {
  window.CheckoutNav = {
    toCheckout: function (key) {
      var url = '#';
      if (window.CheckoutConfig && CheckoutConfig.centerpag && CheckoutConfig.centerpag[key]) {
        var base = CheckoutConfig.centerpag[key];
        if (key !== 'front' && key !== 'back') {
          base = base + (base.indexOf('?') > -1 ? '&' : '?') + 'upsell=true';
        }
        url = base;
      } else if (window.CheckoutConfig) {
        url = CheckoutConfig.url(key);
      }
      if (window.FunnelUtm) {
        FunnelUtm.persist();
        url = FunnelUtm.appendToUrl(url);
      }
      window.location.href = url;
    },

    bindFront: function () {
      ['ctaButton', 'ctaButton2'].forEach(function (id) {
        var btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          if (btn.tagName === 'BUTTON') {
            btn.disabled = true;
            btn.style.opacity = '0.75';
          }
          CheckoutNav.toCheckout('front');
        });
      });
    },

    bindUpsell: function (checkoutKey) {
      var accept = document.getElementById('offer-btn') || document.getElementById('cta-btn');
      if (!accept || accept.__ppCheckoutBound) return;
      accept.__ppCheckoutBound = true;

      accept.addEventListener('click', function (e) {
        e.preventDefault();
        var btn = accept;
        if (btn.tagName === 'BUTTON') {
          btn.disabled = true;
          btn.textContent = 'Processing...';
        }

        CheckoutNav.toCheckout(checkoutKey);
      });
    }
  };
})();
