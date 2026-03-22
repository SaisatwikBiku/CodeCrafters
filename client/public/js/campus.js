/**
 * campus.js — Simple 2D campus renderer using Canvas API
 * Buildings are unlocked stage by stage.
 */
window.CampusRenderer = (function () {

  const BUILDINGS = [
    { name: 'Library',     x: 30,  y: 30,  w: 90,  h: 60,  color: '#3b82f6' },
    { name: 'Classroom',   x: 150, y: 30,  w: 90,  h: 60,  color: '#10b981' },
    { name: 'Cafeteria',   x: 270, y: 30,  w: 90,  h: 60,  color: '#f59e0b' },
    { name: 'Science Lab', x: 60,  y: 130, w: 100, h: 70,  color: '#8b5cf6' },
    { name: 'Playground',  x: 200, y: 130, w: 130, h: 70,  color: '#ec4899' },
  ];

  function draw(canvasEl, completedStages) {
    const ctx = canvasEl.getContext('2d');
    const W = canvasEl.width;
    const H = canvasEl.height;

    // Background
    ctx.fillStyle = '#1a2744';
    ctx.fillRect(0, 0, W, H);

    // Ground paths (simple grid)
    ctx.strokeStyle = '#2e3a5a';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    BUILDINGS.forEach((b, i) => {
      const unlocked = i < completedStages;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(b.x + 4, b.y + 4, b.w, b.h);

      // Building fill
      ctx.fillStyle = unlocked ? b.color : '#2e3650';
      ctx.fillRect(b.x, b.y, b.w, b.h);

      // Border
      ctx.strokeStyle = unlocked ? '#ffffff33' : '#1e2a40';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      // Roof line
      if (unlocked) {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(b.x, b.y, b.w, 12);
      }

      // Label
      ctx.fillStyle = unlocked ? '#fff' : '#4a5568';
      ctx.font = `bold ${unlocked ? 11 : 10}px Courier New`;
      ctx.textAlign = 'center';
      ctx.fillText(b.name, b.x + b.w / 2, b.y + b.h / 2 + 4);

      // Lock icon on locked buildings
      if (!unlocked) {
        ctx.fillStyle = '#4a5568';
        ctx.font = '14px serif';
        ctx.fillText('🔒', b.x + b.w / 2, b.y + b.h / 2 - 8);
      }
    });

    // Stage label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`${completedStages} / 5 buildings complete`, 8, H - 8);
  }

  function drawMini(canvasEl, completedStages) {
    // Same as draw but scaled for the modal mini-view
    draw(canvasEl, completedStages);
  }

  return { draw, drawMini };
})();
