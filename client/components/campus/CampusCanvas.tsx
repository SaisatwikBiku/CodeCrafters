'use client';

import { useEffect, useRef } from 'react';

interface CampusCanvasProps {
  completedStages: number;
  className?: string;
  style?: React.CSSProperties;
}

const BUILDINGS = [
  { name: 'Library', src: '/images/Lib.jpg' },
  { name: 'Classroom', src: '/images/Class.jpg' },
  { name: 'Cafeteria', src: '/images/cafe.jpg' },
  { name: 'Science Lab', src: '/images/Lab.jpg' },
  { name: 'Playground', src: '/images/Ground.jpg' },
];

const MESSAGES = [
  '🌱 Just getting started — you got this!',
  '⭐ Amazing! Library built!',
  '🔥 Classroom ready! You are on fire!',
  '🚀 Cafeteria open! Almost there!',
  '🎊 Science Lab done! One more to go!',
  '🎉 Campus complete! Python master!',
];

export default function CampusCanvas({ completedStages, className, style }: CampusCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<{
    frame: number;
    rafId: number | null;
    clouds: Array<{ x: number; y: number; speed: number }>;
    stars: Array<{ x: number; y: number; phase: number; size: number }>;
    bounces: Array<{ scale: number; vy: number; bouncing: boolean }>;
    particles: Array<{ x: number; y: number; vx: number; vy: number; col: string; life: number; sz: number }>;
    lastStages: number;
    imgs: HTMLImageElement[];
  }>({
    frame: 0,
    rafId: null,
    clouds: [
      { x: 10, y: 14, speed: 0.15 },
      { x: 170, y: 8, speed: 0.10 },
      { x: 310, y: 12, speed: 0.13 },
    ],
    stars: Array.from({ length: 8 }, (_, i) => ({
      x: 20 + i * 72, y: 5 + (i % 3) * 6, phase: i * 0.8, size: 4 + (i % 2) * 2,
    })),
    bounces: Array.from({ length: 5 }, () => ({ scale: 1.0, vy: 0, bouncing: false })),
    particles: [],
    lastStages: -1,
    imgs: BUILDINGS.map((b) => {
      const img = new Image();
      img.src = b.src;
      return img;
    }),
  });

  const completedRef = useRef(completedStages);
  completedRef.current = completedStages;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const anim = animRef.current;

    function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    function getCardSize(W: number, H: number) {
      return { BW: Math.floor(W * 0.27), BH: Math.floor(H * 0.27) };
    }

    function getPOS(W: number, H: number) {
      return [
        { cx: W * 0.17, cy: H * 0.32 },
        { cx: W * 0.50, cy: H * 0.32 },
        { cx: W * 0.83, cy: H * 0.32 },
        { cx: W * 0.32, cy: H * 0.70 },
        { cx: W * 0.68, cy: H * 0.70 },
      ];
    }

    function dStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string, a: number) {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = col;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const ag = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        if (i === 0) ctx.moveTo(cx + r * Math.cos(ag), cy + r * Math.sin(ag));
        else ctx.lineTo(cx + r * Math.cos(ag), cy + r * Math.sin(ag));
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function spawn(cx: number, cy: number) {
      const cols = ['#fbbf24', '#f97316', '#ec4899', '#7c3aed', '#10b981', '#3b82f6'];
      for (let i = 0; i < 30; i++) {
        const a = (i / 30) * Math.PI * 2, sp = 2 + Math.random() * 3.5;
        anim.particles.push({
          x: cx, y: cy,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3,
          col: cols[i % 6], life: 1, sz: 4 + Math.random() * 5,
        });
      }
    }

    function drawBackground(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#bbf7d0';
      ctx.fillRect(0, H - 30, W, 30);
      ctx.strokeStyle = '#86efac'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, H - 30); ctx.lineTo(W, H - 30); ctx.stroke();

      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -(t * 0.5 % 16);
      ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, H - 15); ctx.lineTo(W, H - 15); ctx.stroke();
      ctx.setLineDash([]); ctx.lineDashOffset = 0;

      const pulse = 1 + Math.sin(t * 0.04) * 0.04;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(W - 34, 28, 20 * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + t * 0.012;
        ctx.strokeStyle = '#fcd34d'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W - 34 + Math.cos(a) * 24, 28 + Math.sin(a) * 24);
        ctx.lineTo(W - 34 + Math.cos(a) * 32, 28 + Math.sin(a) * 32);
        ctx.stroke();
      }

      anim.stars.forEach((s) => {
        dStar(ctx, s.x, s.y, s.size, '#fbbf24', 0.4 + Math.sin(t * 0.06 + s.phase) * 0.4);
      });

      anim.clouds.forEach((cl) => {
        const cx2 = (cl.x + t * cl.speed) % (W + 80) - 40;
        const cy2 = 14 + Math.sin(t * 0.02 + cl.x) * 2;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        [[0, 0, 20], [20, -7, 16], [40, 0, 18]].forEach((d) => {
          ctx.beginPath(); ctx.arc(cx2 + d[0], cy2 + d[1], d[2], 0, Math.PI * 2); ctx.fill();
        });
      });

      const fc = ['#f97316', '#ec4899', '#7c3aed', '#10b981'];
      for (let j = 0; j < 12; j++) {
        const fx = 20 + j * 50, fy = H - 15 + Math.sin(t * 0.04 + j) * 2;
        ctx.fillStyle = fc[j % 4];
        ctx.beginPath(); ctx.arc(fx, fy, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath(); ctx.arc(fx, fy, 2, 0, Math.PI * 2); ctx.fill();
      }
    }

    function drawUnlocked(ctx: CanvasRenderingContext2D, idx: number, W: number, H: number) {
      const img = anim.imgs[idx];
      const { BW, BH } = getCardSize(W, H);
      const x = -BW / 2, y = -BH / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      rr(ctx, x + 5, y + 5, BW, BH, 10); ctx.fill();
      ctx.save();
      rr(ctx, x, y, BW, BH, 10);
      ctx.clip();
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, x, y, BW, BH);
      } else {
        ctx.fillStyle = '#dde4f0';
        rr(ctx, x, y, BW, BH, 10); ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Loading...', 0, 4);
      }
      ctx.restore();
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2.5;
      rr(ctx, x, y, BW, BH, 10); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x, y + BH - 20, BW, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(BUILDINGS[idx].name, 0, y + BH - 7);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(x + BW - 12, y + 12, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.5; ctx.stroke();
      dStar(ctx, x + BW - 12, y + 12, 6, '#fff', 1);
    }

    function drawLocked(ctx: CanvasRenderingContext2D, idx: number, t: number, W: number, H: number) {
      const { BW, BH } = getCardSize(W || 800, H || 500);
      const x = -BW / 2, y = -BH / 2;
      const pulse = 0.99 + Math.sin(t * 0.025 + idx * 1.5) * 0.01;
      ctx.save();
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#f1f5f9';
      rr(ctx, x, y, BW, BH, 10); ctx.fill();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
      rr(ctx, x, y, BW, BH, 10); ctx.stroke();
      ctx.setLineDash([]);
      const lf = Math.sin(t * 0.03 + idx) * 2;
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔒', 0, lf + 6);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 8px Arial';
      ctx.fillText(BUILDINGS[idx].name, 0, BH / 2 - 8);
      ctx.restore();
    }

    function drawProgress(ctx: CanvasRenderingContext2D, W: number, H: number, stages: number) {
      const bX = 10, bY = H - 22, bW = W - 20, bH = 14;
      ctx.fillStyle = '#fff'; rr(ctx, bX, bY, bW, bH, 5); ctx.fill();
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2;
      rr(ctx, bX, bY, bW, bH, 5); ctx.stroke();
      if (stages > 0) {
        const fc = ['#f97316', '#7c3aed', '#ec4899', '#10b981', '#3b82f6'];
        ctx.fillStyle = fc[Math.max(0, stages - 1)];
        rr(ctx, bX, bY, bW * (stages / 5), bH, 5); ctx.fill();
      }
      for (let i = 1; i <= 5; i++) {
        const dx = bX + (bW / 5) * i - bW / 10, dy = bY + bH / 2;
        ctx.fillStyle = i <= stages ? '#fff' : '#cbd5e1';
        ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#1a1a1a';
      ctx.fillText(MESSAGES[Math.min(stages, 5)], bX, bY - 5);
    }

    function animLoop() {
      if (!canvas.isConnected) { anim.rafId = null; return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width, H = canvas.height, t = anim.frame++;
      const stages = completedRef.current;

      if (stages !== anim.lastStages) {
        const ni = stages - 1;
        const POS = getPOS(W, H);
        if (ni >= 0 && ni < 5) {
          anim.bounces[ni].scale = 0.3;
          anim.bounces[ni].vy = 0.0;
          anim.bounces[ni].bouncing = true;
          spawn(POS[ni].cx, POS[ni].cy);
        }
        anim.lastStages = stages;
      }

      anim.bounces.forEach((bs) => {
        if (!bs.bouncing) { bs.scale = 1.0; return; }
        bs.vy += (1.0 - bs.scale) * 0.18 - bs.vy * 0.35;
        bs.scale += bs.vy;
        bs.scale = Math.max(0.3, Math.min(bs.scale, 1.15));
        if (Math.abs(bs.scale - 1.0) < 0.005 && Math.abs(bs.vy) < 0.005) {
          bs.bouncing = false; bs.scale = 1.0; bs.vy = 0;
        }
      });

      drawBackground(ctx, W, H, t);
      const POS = getPOS(W, H);
      POS.forEach((p, i) => {
        ctx.save();
        ctx.translate(p.cx, p.cy);
        ctx.scale(anim.bounces[i].scale, anim.bounces[i].scale);
        if (i < stages) drawUnlocked(ctx, i, W, H);
        else drawLocked(ctx, i, t, W, H);
        ctx.restore();
      });

      anim.particles = anim.particles.filter((p) => p.life > 0);
      anim.particles.forEach((p) => {
        ctx.save(); ctx.globalAlpha = p.life; ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * p.life, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.016;
      });

      drawProgress(ctx, W, H, stages);
      anim.rafId = requestAnimationFrame(animLoop);
    }

    anim.frame = 0;
    if (anim.rafId) cancelAnimationFrame(anim.rafId);
    animLoop();

    // Keep canvas resolution synced
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.round(e.contentRect.width);
        const h = Math.round(e.contentRect.height);
        if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
          canvas.width = w;
          canvas.height = h;
        }
      }
    });
    ro.observe(canvas);

    return () => {
      if (anim.rafId) cancelAnimationFrame(anim.rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="campus-canvas"
      width={800}
      height={500}
      className={className}
      style={style}
    />
  );
}
