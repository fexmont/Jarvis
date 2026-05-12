class JarvisCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.frame = 0;
        this.state = 'idle';
        this.audioLevel = 0;
        this.targetAudioLevel = 0;
        this.pulses = [];
        this.particles = [];
        this.scanLines = [];
        this.waveformData = new Array(32).fill(0);
        this.rippleActive = false;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.initParticles();
        this.initScanLines();
        requestAnimationFrame(() => this.animate());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.cx = this.canvas.width / 2;
        this.cy = this.canvas.height / 2 - 30;
        this.radius = Math.min(this.canvas.width, this.canvas.height) * 0.20;
        this.initParticles();
    }

    setState(state) {
        const prev = this.state;
        this.state = state;
        if (prev !== state && (state === 'listening' || state === 'speaking' || state === 'processing')) {
            this.addPulse();
        }
    }

    addPulse() {
        this.pulses.push({ r: this.radius * 0.7, alpha: 0.9, speed: 3.5 });
    }

    setAudioLevel(level) {
        this.targetAudioLevel = Math.min(1, level);
    }

    updateWaveform() {
        for (let i = 0; i < this.waveformData.length; i++) {
            const target = this.state === 'speaking' || this.state === 'listening'
                ? Math.random() * this.audioLevel
                : 0;
            this.waveformData[i] += (target - this.waveformData[i]) * 0.3;
        }
    }

    initParticles() {
        this.particles = [];
        const count = 70;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                r: Math.random() * 1.4 + 0.3,
                baseAlpha: Math.random() * 0.5 + 0.1,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 0.025 + 0.008,
                hue: 190 + Math.random() * 30
            });
        }
    }

    initScanLines() {
        this.scanLines = [];
        for (let i = 0; i < 3; i++) {
            this.scanLines.push({
                y: Math.random() * this.canvas.height,
                speed: 0.4 + Math.random() * 0.6,
                alpha: 0.03 + Math.random() * 0.04
            });
        }
    }

    drawBackground() {
        const { ctx, cx, cy, canvas } = this;

        ctx.fillStyle = '#060a12';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Central radial glow
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.radius * 3.5);
        grd.addColorStop(0, 'rgba(0, 80, 180, 0.10)');
        grd.addColorStop(0.5, 'rgba(0, 40, 100, 0.05)');
        grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Subtle grid
        ctx.strokeStyle = 'rgba(0, 100, 180, 0.04)';
        ctx.lineWidth = 1;
        const gridSize = 60;
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // Scan lines
        this.scanLines.forEach(sl => {
            sl.y += sl.speed;
            if (sl.y > canvas.height) sl.y = -2;
            const grad = ctx.createLinearGradient(0, sl.y, 0, sl.y + 2);
            grad.addColorStop(0, `rgba(0, 180, 255, 0)`);
            grad.addColorStop(0.5, `rgba(0, 180, 255, ${sl.alpha})`);
            grad.addColorStop(1, `rgba(0, 180, 255, 0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, sl.y, canvas.width, 2);
        });
    }

    drawParticles() {
        const { ctx } = this;
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.twinkle += p.twinkleSpeed;
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            const alpha = p.baseAlpha * (0.5 + 0.5 * Math.sin(p.twinkle));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${alpha})`;
            ctx.fill();
        });
    }

    drawPulses() {
        const { ctx, cx, cy } = this;
        this.pulses = this.pulses.filter(p => p.alpha > 0.01);
        this.pulses.forEach(p => {
            ctx.beginPath();
            ctx.arc(cx, cy, p.r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 200, 255, ${p.alpha})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            p.r += p.speed;
            p.alpha *= 0.96;
        });
    }

    drawMainRing() {
        const { ctx, cx, cy, frame } = this;
        const r = this.radius;
        const t = frame * 0.004;
        const bump = this.audioLevel * 12;

        // Outer rotating arcs (3 segments)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.4);
        ctx.shadowBlur = 18 + bump;
        ctx.shadowColor = '#0099ff';
        ctx.strokeStyle = '#1a8fff';
        ctx.lineWidth = 2.5;

        const segments = [
            [0.05, 0.65],
            [0.72, 1.28],
            [1.38, 1.95]
        ];
        segments.forEach(([start, end]) => {
            ctx.beginPath();
            ctx.arc(0, 0, r + bump * 0.2, start * Math.PI, end * Math.PI);
            ctx.stroke();
        });
        ctx.restore();

        // Second ring — counter-rotating, dashed
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-t * 0.25);
        ctx.strokeStyle = 'rgba(0, 160, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#0088ff';
        ctx.setLineDash([5, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Third ring — inner glow pulse
        ctx.save();
        ctx.translate(cx, cy);
        const innerR = r * 0.72 + Math.sin(frame * 0.022) * 2.5 + bump * 0.3;
        const innerA = 0.55 + Math.sin(frame * 0.018) * 0.2;
        ctx.strokeStyle = `rgba(0, 220, 255, ${innerA})`;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00ddff';
        ctx.beginPath();
        ctx.arc(0, 0, innerR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Rotating dots on outer ring
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.6);
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00d4ff';
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dotR = i % 2 === 0 ? 2.8 : 1.6;
            const alpha = i % 2 === 0 ? 1.0 : 0.45;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, dotR, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
            ctx.fill();
        }
        ctx.restore();

        // Diamond markers (4 positions, slow rotation)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.12);
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00aaff';
        ctx.fillStyle = '#00bbff';
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const dx = Math.cos(angle) * (r * 1.06);
            const dy = Math.sin(angle) * (r * 1.06);
            ctx.save();
            ctx.translate(dx, dy);
            ctx.rotate(angle + Math.PI / 4);
            const s = 4.5;
            ctx.fillRect(-s / 2, -s / 2, s, s);
            ctx.restore();
        }
        ctx.restore();
    }

    drawWaveform() {
        if (this.state !== 'listening' && this.state !== 'speaking') return;
        const { ctx, cx, cy } = this;
        const r = this.radius * 0.62;
        const bars = this.waveformData.length;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.state === 'speaking' ? '#00ffcc' : '#00aaff';

        for (let i = 0; i < bars; i++) {
            const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
            const barH = this.waveformData[i] * 18 + 2;
            const x1 = Math.cos(angle) * (r - barH);
            const y1 = Math.sin(angle) * (r - barH);
            const x2 = Math.cos(angle) * r;
            const y2 = Math.sin(angle) * r;
            const alpha = 0.4 + this.waveformData[i] * 0.6;
            ctx.strokeStyle = this.state === 'speaking'
                ? `rgba(0, 255, 180, ${alpha})`
                : `rgba(0, 180, 255, ${alpha})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawCenter() {
        const { ctx, cx, cy } = this;
        const r = this.radius;

        // Dark center fill
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.68);
        grad.addColorStop(0, 'rgba(5, 18, 40, 0.97)');
        grad.addColorStop(0.6, 'rgba(3, 12, 28, 0.95)');
        grad.addColorStop(1, 'rgba(0, 5, 15, 0.80)');
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.70, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // JARVIS main text
        const fontSize = Math.max(16, r * 0.26);
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `700 ${fontSize}px "Courier New", "Consolas", monospace`;
        ctx.shadowBlur = 22;
        ctx.shadowColor = '#0088ff';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('JARVIS', cx, cy);
        ctx.restore();

        // State sub-text
        const stateInfo = {
            idle:       { text: '· IN ATTESA ·',   color: 'rgba(0, 160, 255, 0.50)' },
            listening:  { text: '● ASCOLTO',         color: '#00ff99' },
            processing: { text: '◈ ELABORAZIONE',    color: '#ffaa00' },
            speaking:   { text: '◆ RISPOSTA',        color: '#00d4ff' }
        };
        const info = stateInfo[this.state] || stateInfo.idle;
        const subSize = Math.max(9, r * 0.10);
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${subSize}px "Courier New", monospace`;
        ctx.fillStyle = info.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = info.color;
        ctx.fillText(info.text, cx, cy + r * 0.40);
        ctx.restore();
    }

    drawHUD() {
        const { ctx, canvas, cx } = this;
        const W = canvas.width;
        const H = canvas.height;

        // Top-left corner lines
        const cl = 40;
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(20, 20 + cl); ctx.lineTo(20, 20); ctx.lineTo(20 + cl, 20);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(W - 20 - cl, 20); ctx.lineTo(W - 20, 20); ctx.lineTo(W - 20, 20 + cl);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(20, H - 20 - cl); ctx.lineTo(20, H - 20); ctx.lineTo(20 + cl, H - 20);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(W - 20 - cl, H - 20); ctx.lineTo(W - 20, H - 20); ctx.lineTo(W - 20, H - 20 - cl);
        ctx.stroke();

        // Version text bottom-left
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = 'rgba(0, 150, 255, 0.35)';
        ctx.textAlign = 'left';
        ctx.fillText('JARVIS v3.1  ·  STARK INDUSTRIES', 28, H - 28);

        // Top center label
        ctx.textAlign = 'center';
        ctx.fillText('J.A.R.V.I.S  ·  VOICE INTERFACE', cx, 32);
    }

    animate() {
        this.frame++;
        this.audioLevel += (this.targetAudioLevel - this.audioLevel) * 0.12;
        this.updateWaveform();

        this.drawBackground();
        this.drawParticles();
        this.drawPulses();
        this.drawMainRing();
        this.drawWaveform();
        this.drawCenter();
        this.drawHUD();

        requestAnimationFrame(() => this.animate());
    }
}
