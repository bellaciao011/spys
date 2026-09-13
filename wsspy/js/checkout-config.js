/**
 * Checkout ativo: CenterPag
 * Links no formato go.centerpag.com (mesmo padrão do sppwd), códigos do funil spp.
 */
window.CheckoutConfig = {
  provider: 'centerpag',

  centerpag: {
    front: 'https://go.centerpag.com/PPU38CQELOC',
    back: 'https://go.centerpag.com/PPU38CQELOB',
    up1: 'https://go.centerpag.com/PPU38CQELO7',
    up2: 'https://go.centerpag.com/PPU38CQELO5',
    up3: 'https://go.centerpag.com/PPU38CQELO3',
    up4: 'https://go.centerpag.com/PPU38CQELO1',
    up5: 'https://go.centerpag.com/PPU38CQELNU',
    up6: 'https://go.centerpag.com/PPU38CQELNS',
    up7: '',
    up8: ''
  },

  prices: {
    front: 37.00,
    back: 19.00,
    up1: 49.00,
    up2: 65.00,
    up3: 79.00,
    up4: 97.00,
    up5: 109.00,
    up6: 127.00,
    up7: 157.00,
    up8: 197.00
  },

  url: function (key, extra) {
    var base;
    if (this.provider === 'centerpag') {
      base = this.centerpag[key] || '';
      if (!base) return '#';
      if (key !== 'front' && key !== 'back') {
        base = base + (base.indexOf('?') > -1 ? '&' : '?') + 'upsell=true';
      }
    } else if (this.cooud) {
      base = this.cooud[key];
    }
    if (!base) return '#';
    if (window.FunnelUtm) {
      FunnelUtm.persist();
      return FunnelUtm.appendToUrl(base, extra || {});
    }
    return base;
  },

  backUrl: function () {
    var base = this.centerpag.back;
    if (window.FunnelUtm) {
      FunnelUtm.persist();
      return FunnelUtm.appendToUrl(base, { src: 'BackRedirect' });
    }
    return base + (base.indexOf('?') > -1 ? '&' : '?') + 'src=BackRedirect';
  }
};
