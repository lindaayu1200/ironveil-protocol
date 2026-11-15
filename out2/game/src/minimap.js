// 2D Canvas Minimap showing walls, player, teammates, and enemies.

export function createMinimap() {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  canvas.style.position = 'fixed';
  canvas.style.top = '16px';
  canvas.style.left = '16px';
  canvas.style.borderRadius = '4px';
  canvas.style.border = '1px solid #273445';
  canvas.style.background = '#0f141a';
  canvas.style.opacity = '0.85';
  canvas.style.zIndex = '10';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  function render(playerPos, playerYaw, bots, worldColliders) {
    ctx.clearRect(0, 0, 160, 160);

    // Map scaling: world bounds approx -18 to +18 X, -24 to +24 Z
    const scale = 3.2;
    const cx = 80;
    const cy = 80;

    // Draw walls / colliders
    ctx.fillStyle = '#273445';
    for (const b of worldColliders) {
      const bx = cx + b.min.x * scale;
      const bz = cy + b.min.z * scale;
      const bw = (b.max.x - b.min.x) * scale;
      const bh = (b.max.z - b.min.z) * scale;
      ctx.fillRect(bx, bz, Math.max(2, bw), Math.max(2, bh));
    }

    // Draw bots
    for (const bot of bots) {
      if (!bot.alive) continue;
      const bx = cx + bot.position.x * scale;
      const bz = cy + bot.position.z * scale;
      ctx.fillStyle = bot.team === 'attack' ? '#38bdf8' : '#dc2626';
      ctx.beginPath();
      ctx.arc(bx, bz, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw player
    const px = cx + playerPos.x * scale;
    const pz = cy + playerPos.z * scale;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(px, pz, 4, 0, Math.PI * 2);
    ctx.fill();

    // Direction line for player view
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, pz);
    ctx.lineTo(px - Math.sin(playerYaw) * 10, pz - Math.cos(playerYaw) * 10);
    ctx.stroke();
  }

  return {
    render,
  };
}
