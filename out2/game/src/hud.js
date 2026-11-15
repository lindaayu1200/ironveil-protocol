// Enhanced DOM HUD: Health, armor, money, ammo, timer, score, alive counters, kill feed, buy menu, round banners.

export function createHud(store, buyCallback) {
  const overlay = document.getElementById('overlay');
  const title = document.getElementById('overlay-title');
  const copy = document.getElementById('overlay-copy');
  const play = document.getElementById('play');
  const ammoMag = document.getElementById('ammo-mag');
  const ammoReserve = document.getElementById('ammo-reserve');
  const scoreValue = document.getElementById('score-value');
  const hitmarker = document.getElementById('hitmarker');

  // Create additional HUD elements dynamically if needed
  const hudContainer = document.getElementById('hud');

  const healthDiv = document.createElement('div');
  healthDiv.id = 'health-display';
  healthDiv.style.cssText = 'position:fixed; left:32px; bottom:64px; font-family:var(--font-readout); font-size:22px; font-weight:bold; color:var(--ink); text-shadow:0 2px 4px rgba(0,0,0,0.8);';
  hudContainer.appendChild(healthDiv);

  const moneyDiv = document.createElement('div');
  moneyDiv.id = 'money-display';
  moneyDiv.style.cssText = 'position:fixed; left:32px; bottom:96px; font-family:var(--font-readout); font-size:22px; font-weight:bold; color:var(--accent); text-shadow:0 2px 4px rgba(0,0,0,0.8);';
  hudContainer.appendChild(moneyDiv);

  const topHud = document.createElement('div');
  topHud.id = 'top-hud';
  topHud.style.cssText = 'position:fixed; left:50%; top:16px; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:4px; font-family:var(--font-readout); text-shadow:0 2px 4px rgba(0,0,0,0.8);';
  topHud.innerHTML = `
    <div id="team-names" style="font-size:15px; font-weight:bold; color:var(--muted); letter-spacing:0.1em;">VANTAGE <span id="team-score-text" style="color:var(--ink);">0 — 0</span> CARTEL</div>
    <div id="timer-display" style="font-size:28px; font-weight:bold; color:var(--accent);">0:00</div>
  `;
  hudContainer.appendChild(topHud);

  const killFeedDiv = document.createElement('div');
  killFeedDiv.id = 'kill-feed';
  killFeedDiv.style.cssText = 'position:fixed; right:16px; top:16px; font-family:var(--font-readout); font-size:12px; color:var(--muted); text-align:right; display:flex; flex-direction:column; gap:4px;';
  hudContainer.appendChild(killFeedDiv);

  const bannerDiv = document.createElement('div');
  bannerDiv.id = 'round-banner';
  bannerDiv.style.cssText = 'position:fixed; left:50%; top:30%; transform:translate(-50%, -50%); text-align:center; display:none; z-index:20;';
  bannerDiv.innerHTML = '<h1 id="banner-title" style="font-size:36px; color:var(--accent); margin:0;"></h1><p id="banner-sub" style="font-size:18px; color:var(--ink); margin:8px 0 0;"></p>';
  hudContainer.appendChild(bannerDiv);

  // Buy Menu Overlay
  const buyMenu = document.createElement('div');
  buyMenu.id = 'buy-menu';
  buyMenu.className = 'overlay';
  buyMenu.hidden = true;
  buyMenu.innerHTML = `
    <div class="panel" style="width:480px;">
      <h1>Ironveil Buy Menu</h1>
      <p>Press keys 1-6 or click items to purchase gear for the next rounds.</p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
        <button class="buy-btn" data-item="vesper">[1] Vesper SMG - $1200</button>
        <button class="buy-btn" data-item="kestrel">[2] Kestrel-7 Rifle - $2700</button>
        <button class="buy-btn" data-item="longbow">[3] Longbow Sniper - $4600</button>
        <button class="buy-btn" data-item="armor">[4] Kevlar Armor - $1000</button>
        <button class="buy-btn" data-item="grenade">[5] Frag Grenade - $300</button>
        <button class="buy-btn" data-item="ammo">[6] Max Ammo - $400</button>
      </div>
      <button id="close-buy" type="button" style="width:100%; font:inherit; padding:10px; background:var(--surface); border:1px solid var(--hairline); color:var(--ink); border-radius:8px; cursor:pointer;">Close Buy Menu (B)</button>
    </div>
  `;
  document.body.appendChild(buyMenu);

  buyMenu.querySelectorAll('.buy-btn').forEach(btn => {
    btn.style.cssText = 'font:inherit; padding:12px; background:var(--surface); border:1px solid var(--hairline); color:var(--ink); border-radius:8px; cursor:pointer; text-align:left;';
    btn.addEventListener('click', () => {
      buyCallback(btn.dataset.item);
    });
  });

  buyMenu.querySelector('#close-buy').addEventListener('click', () => {
    buyMenu.hidden = true;
    if (document.exitPointerLock) document.exitPointerLock();
  });

  let hitTimer = 0;

  return {
    setAmmo(mag, reserve) {
      ammoMag.textContent = String(mag);
      ammoReserve.textContent = `/ ${reserve}`;
    },
    setScore(attack, defense) {
      scoreValue.textContent = `${attack} - ${defense}`;
    },
    update(playerHp, playerArmor, money, roundTime, scoreAtt, scoreDef, killFeedItems) {
      healthDiv.textContent = `HP: ${Math.max(0, Math.floor(playerHp))} ${playerArmor ? '[ARMOR]' : ''}`;
      moneyDiv.textContent = `$${money}`;

      const mins = Math.floor(roundTime / 60);
      const secs = Math.floor(roundTime % 60);
      const timerDisplay = document.getElementById('timer-display');
      if (timerDisplay) timerDisplay.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

      const teamScoreText = document.getElementById('team-score-text');
      if (teamScoreText) teamScoreText.textContent = `${scoreAtt} — ${scoreDef}`;

      scoreValue.textContent = `${scoreAtt} - ${scoreDef}`;

      killFeedDiv.innerHTML = killFeedItems.map(kf => `<div>${kf.text}</div>`).join('');
    },
    showBuyMenu(show) {
      buyMenu.hidden = !show;
    },
    showBanner(text, sub, show) {
      if (show) {
        bannerDiv.style.display = 'block';
        bannerDiv.querySelector('#banner-title').textContent = text;
        bannerDiv.querySelector('#banner-sub').textContent = sub;
      } else {
        bannerDiv.style.display = 'none';
      }
    },
    hitMarker(killed, holdMs = 90) {
      hitmarker.classList.add('on');
      hitmarker.style.transform = killed ? 'translate(-50%, -50%) rotate(45deg) scale(1.25)' : '';
      clearTimeout(hitTimer);
      hitTimer = setTimeout(() => {
        hitmarker.classList.remove('on');
        hitmarker.style.transform = '';
      }, holdMs);
    },
    showOverlay(mode, score) {
      overlay.hidden = false;
      play.focus();
    },
    hideOverlay() {
      overlay.hidden = true;
    },
    onPlay(handler) {
      play.addEventListener('click', handler);
    },
  };
}
