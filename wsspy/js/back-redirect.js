(function () {
  var shown = false;
  var matrixTimer = null;
  var countdownTimer = null;
  var mins = 14;
  var secs = 59;

  function isMobile() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }

  function checkoutUrl() {
    if (window.CheckoutConfig) return CheckoutConfig.backUrl();
    return 'https://go.centerpag.com/PPU38CQELOB?src=BackRedirect';
  }

  function injectStyles() {
    if (document.getElementById('br-styles')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);

    var style = document.createElement('style');
    style.id = 'br-styles';
    style.textContent = [
      '#br-overlay{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;padding:1.5rem;background:rgba(0,0,0,.72);backdrop-filter:blur(3px);font-family:Rajdhani,sans-serif;animation:brOverlayIn .5s ease both}',
      '@keyframes brOverlayIn{from{opacity:0}to{opacity:1}}',
      '#br-matrix{position:absolute;inset:0;z-index:0;opacity:.18;pointer-events:none}',
      '.br-glow{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:800px;height:800px;background:radial-gradient(circle,rgba(0,255,106,.06) 0%,transparent 65%);pointer-events:none;z-index:0}',
      '.br-popup{position:relative;z-index:2;width:100%;max-width:440px;background:rgba(4,14,8,.97);border:1.5px solid rgba(0,255,106,.35);border-radius:18px;padding:2.2rem 1.8rem 2rem;text-align:center;box-shadow:0 0 0 1px rgba(0,255,106,.08),0 0 60px rgba(0,255,106,.15),0 0 120px rgba(0,255,106,.06),0 30px 60px rgba(0,0,0,.7);animation:brPopupIn .6s cubic-bezier(.34,1.56,.64,1) both}',
      '@keyframes brPopupIn{from{opacity:0;transform:scale(.7) translateY(30px)}to{opacity:1;transform:scale(1) translateY(0)}}',
      '.br-popup::before{content:"";position:absolute;inset:-2px;border-radius:20px;background:linear-gradient(135deg,rgba(0,255,106,.3),transparent,rgba(0,255,106,.2));z-index:-1;animation:brBorderPulse 2.5s ease-in-out infinite}',
      '.br-popup::after{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#00ff6a,transparent);border-radius:18px 18px 0 0;animation:brBorderPulse 2.5s ease-in-out infinite}',
      '@keyframes brBorderPulse{0%,100%{opacity:.5}50%{opacity:1}}',
      '.br-corner{position:absolute;width:14px;height:14px;border-color:#00ff6a;border-style:solid;opacity:.5}',
      '.br-c-tl{top:10px;left:10px;border-width:1.5px 0 0 1.5px}',
      '.br-c-tr{top:10px;right:10px;border-width:1.5px 1.5px 0 0}',
      '.br-c-bl{bottom:10px;left:10px;border-width:0 0 1.5px 1.5px}',
      '.br-c-br{bottom:10px;right:10px;border-width:0 1.5px 1.5px 0}',
      '.br-live{display:inline-flex;align-items:center;gap:.5rem;background:rgba(255,59,59,.1);border:1px solid rgba(255,59,59,.4);border-radius:30px;padding:.35rem .9rem;font-family:Orbitron,monospace;font-size:.65rem;font-weight:700;color:#ff6868;letter-spacing:.16em;text-transform:uppercase;margin-bottom:1.3rem}',
      '.br-live-dot{width:7px;height:7px;border-radius:50%;background:#ff3b3b;box-shadow:0 0 8px #ff3b3b;animation:brBlink 1s steps(1) infinite;flex-shrink:0}',
      '@keyframes brBlink{0%,100%{opacity:1}50%{opacity:.2}}',
      '.br-icon{font-size:3rem;display:block;margin-bottom:.7rem;animation:brIconBounce 2s ease-in-out infinite}',
      '@keyframes brIconBounce{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-6px) rotate(-5deg)}75%{transform:translateY(-3px) rotate(3deg)}}',
      '.br-label{font-family:Orbitron,monospace;font-size:.72rem;font-weight:900;color:#ff9500;letter-spacing:.2em;text-transform:uppercase;margin-bottom:.5rem;text-shadow:0 0 18px rgba(255,149,0,.6)}',
      '.br-title{font-family:Orbitron,monospace;font-size:clamp(1.1rem,5vw,1.55rem);font-weight:900;color:#fff;line-height:1.2;letter-spacing:.02em;margin-bottom:.7rem}',
      '.br-title .hi{color:#00ff6a;text-shadow:0 0 20px rgba(0,255,106,.4)}',
      '.br-sub{font-size:.88rem;color:rgba(255,255,255,.45);line-height:1.6;margin-bottom:1.4rem;max-width:340px;margin-left:auto;margin-right:auto}',
      '.br-price{display:flex;align-items:center;justify-content:center;gap:1.2rem;margin-bottom:1.4rem;background:rgba(0,255,106,.04);border:1px solid rgba(0,255,106,.12);border-radius:12px;padding:1rem 1.2rem;position:relative;overflow:hidden}',
      '.br-price::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#00ff6a,transparent);opacity:.3}',
      '.br-price-old-label,.br-price-new-label{font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;margin-bottom:.2rem}',
      '.br-price-old-label{color:rgba(255,255,255,.3)}',
      '.br-price-new-label{color:#00ff6a;font-weight:700}',
      '.br-price-old-val{font-family:Orbitron,monospace;font-size:1.6rem;font-weight:900;color:rgba(255,59,59,.5);text-decoration:line-through;text-decoration-color:#ff3b3b}',
      '.br-price-new-val{font-family:Orbitron,monospace;font-size:2.2rem;font-weight:900;color:#00ff6a;text-shadow:0 0 24px rgba(0,255,106,.6);line-height:1}',
      '.br-arrow{font-size:1.4rem;color:#00ff6a;animation:brArrowPulse 1.2s ease-in-out infinite}',
      '@keyframes brArrowPulse{0%,100%{transform:translateX(0);opacity:1}50%{transform:translateX(5px);opacity:.6}}',
      '.br-savings{display:inline-block;background:rgba(0,255,106,.12);border:1px solid rgba(0,255,106,.3);border-radius:20px;padding:.2rem .7rem;font-size:.7rem;font-weight:700;color:#00ff6a;letter-spacing:.08em;text-transform:uppercase;margin-top:.25rem}',
      '.br-timer{display:flex;align-items:center;justify-content:center;gap:.5rem;margin-bottom:1.3rem;font-size:.75rem;color:rgba(255,255,255,.4);letter-spacing:.04em;flex-wrap:wrap}',
      '.br-t-block{background:rgba(255,59,59,.1);border:1px solid rgba(255,59,59,.25);border-radius:6px;padding:.2rem .5rem;font-family:Orbitron,monospace;font-size:1rem;font-weight:700;color:#ff3b3b;min-width:36px;text-align:center}',
      '.br-t-sep{color:rgba(255,59,59,.5);font-weight:700}',
      '.br-cta{width:100%;padding:1.1rem 1.5rem;background:linear-gradient(135deg,#00c450,#00ff6a);border:2.5px dashed rgba(255,255,255,.5);border-radius:12px;font-family:Orbitron,monospace;font-size:clamp(.72rem,3.2vw,.9rem);font-weight:900;letter-spacing:.06em;color:#000;cursor:pointer;transition:all .3s;box-shadow:0 4px 30px rgba(0,255,106,.4);animation:brCtaPulse 2s infinite;margin-bottom:.85rem;line-height:1.35;position:relative;overflow:hidden}',
      '.br-cta::before{content:"";position:absolute;top:-50%;left:-60%;width:50%;height:200%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-20deg);animation:brShimmer 2.5s infinite}',
      '@keyframes brCtaPulse{0%,100%{box-shadow:0 4px 30px rgba(0,255,106,.4),0 0 0 0 rgba(0,255,106,.3)}50%{box-shadow:0 6px 50px rgba(0,255,106,.65),0 0 0 8px rgba(0,255,106,0)}}',
      '@keyframes brShimmer{0%{left:-60%}100%{left:130%}}',
      '.br-cta:hover{transform:translateY(-2px);box-shadow:0 8px 40px rgba(0,255,106,.6)}',
      '.br-skip{background:none;border:none;font-size:.75rem;color:rgba(255,255,255,.25);cursor:pointer;text-decoration:underline;text-underline-offset:3px;font-family:Rajdhani,sans-serif;letter-spacing:.03em;transition:color .2s;display:block;margin:0 auto}',
      '.br-skip:hover{color:rgba(255,255,255,.45)}',
      '.br-footer{margin-top:1.2rem;font-size:.68rem;color:rgba(255,255,255,.15);letter-spacing:.04em}'
    ].join('');
    document.head.appendChild(style);
  }

  function injectMarkup() {
    if (document.getElementById('br-overlay')) return;
    var wrap = document.createElement('div');
    wrap.id = 'br-overlay';
    wrap.innerHTML = [
      '<canvas id="br-matrix"></canvas>',
      '<div class="br-glow"></div>',
      '<div class="br-popup">',
      '  <div class="br-corner br-c-tl"></div>',
      '  <div class="br-corner br-c-tr"></div>',
      '  <div class="br-corner br-c-bl"></div>',
      '  <div class="br-corner br-c-br"></div>',
      '  <div class="br-live"><div class="br-live-dot"></div>Exclusive Offer</div>',
      '  <span class="br-icon">🔓</span>',
      '  <div class="br-label">⚡ Wait — Don\'t Leave!</div>',
      '  <h1 class="br-title">Get Full Access for<br><span class="hi">$19.00 Instead of $29.90</span></h1>',
      '  <p class="br-sub">You\'re about to miss out. We\'re offering you a <strong style="color:rgba(255,255,255,.75);">one-time exclusive discount</strong> of $10.90 off — only available right now on this page.</p>',
      '  <div class="br-price">',
      '    <div><div class="br-price-old-label">Original Price</div><div class="br-price-old-val">$29.90</div></div>',
      '    <div class="br-arrow">→</div>',
      '    <div><div class="br-price-new-label">Your Price Now</div><div class="br-price-new-val">$19.00</div><div class="br-savings">Save $10.90</div></div>',
      '  </div>',
      '  <div class="br-timer">⏱ Offer expires in: <div style="display:flex;align-items:center;gap:.3rem;"><div class="br-t-block" id="br-tm">14</div><span class="br-t-sep">:</span><div class="br-t-block" id="br-ts">59</div></div></div>',
      '  <button type="button" class="br-cta" id="br-claim">Yes! Claim My $10.90 Discount Now</button>',
      '  <button type="button" class="br-skip" id="br-skip">No thanks, I\'ll pay full price later</button>',
      '  <div class="br-footer">🔒 Secure Payment · 30-Day Guarantee · Instant Access</div>',
      '</div>'
    ].join('');
    document.body.appendChild(wrap);

    document.getElementById('br-claim').addEventListener('click', function () {
      window.location.href = checkoutUrl();
    });
    document.getElementById('br-skip').addEventListener('click', skipOffer);
  }

  function startMatrix() {
    var canvas = document.getElementById('br-matrix');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var chars = 'アカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    var cols, drops;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.floor(canvas.width / 18);
      drops = Array(cols).fill(1).map(function () { return Math.floor(Math.random() * -60); });
    }

    function draw() {
      ctx.fillStyle = 'rgba(3,10,5,0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < cols; i++) {
        var c = chars[Math.floor(Math.random() * chars.length)];
        var y = drops[i] * 18;
        var x = i * 18;
        ctx.font = "bold 14px 'Courier New', monospace";
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#00ff6a';
        ctx.shadowBlur = 8;
        ctx.fillText(c, x, y);
        ctx.shadowBlur = 0;
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }

    resize();
    if (matrixTimer) clearInterval(matrixTimer);
    matrixTimer = setInterval(draw, 45);
    window.addEventListener('resize', resize);
  }

  function startCountdown() {
    mins = 14;
    secs = 59;
    var tmEl = document.getElementById('br-tm');
    var tsEl = document.getElementById('br-ts');
    if (!tmEl || !tsEl) return;
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(function () {
      secs--;
      if (secs < 0) { secs = 59; mins--; }
      if (mins < 0) { mins = 0; secs = 0; }
      tmEl.textContent = String(mins).padStart(2, '0');
      tsEl.textContent = String(secs).padStart(2, '0');
    }, 1000);
  }

  function showOffer() {
    if (shown) return;
    shown = true;
    injectStyles();
    injectMarkup();
    document.getElementById('br-overlay').style.display = 'flex';
    if (window.history && window.history.pushState) {
      window.history.pushState({ backRedirect: true }, document.title, window.location.href);
    }
    startMatrix();
    startCountdown();
  }

  function hideOffer() {
    var overlay = document.getElementById('br-overlay');
    if (overlay) overlay.style.display = 'none';
    shown = false;
  }

  function skipOffer() {
    hideOffer();
    window.onpopstate = null;
    window.history.back();
  }

  function init(options) {
    options = options || {};
    var mobileOnly = options.mobileOnly !== false;

    injectStyles();
    injectMarkup();

    window.addEventListener('load', function () {
      if (window.history && window.history.pushState) {
        window.history.pushState({ backRedirect: true }, document.title, window.location.href);
      }
    });

    window.onpopstate = function (e) {
      if (!e) return;
      if (mobileOnly && !isMobile()) return;
      if (shown) {
        hideOffer();
        return;
      }
      showOffer();
    };
  }

  window.BackRedirect = { init: init };
})();
