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
        this.waveformData = new Array(64).fill(0);
        this.frequencyData = null;
        this.hexCanvas = null;
        this.startTime = Date.now();

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this._buildHexGrid();
        this.initParticles();
        this.initScanLines();
        requestAnimationFrame(() => this.animate());
    }

    _sc() {
        const colors = {
            idle:       { primary: '#1a8fff', glow: '#0055cc', wave: '#1a8fff', ring: 'rgba(26,143,255,', text: '#64b5ff' },
            listening:  { primary: '#00ff88', glow: '#00cc55', wave: '#00ff88', ring: 'rgba(0,255,136,',  text: '#00ff88' },
            processing: { primary: '#ffaa00', glow: '#cc7700', wave: '#ffaa00', ring: 'rgba(255,170,0,',  text: '#ffdd44' },
            speaking:   { primary: '#00ddff', glow: '#0099cc', wave: '#00ddff', ring: 'rgba(0,221,255,',  text: '#66eeff' }
        };
        return colors[this.state] || colors.idle;
    }

    resize() {
        this.canvas.width  = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.cx = this.canvas.width  / 2;
        this.cy = this.canvas.height / 2 - 20;
        this.radius = Math.min(this.canvas.width, this.canvas.height) * 0.21;
        this._buildHexGrid();
        this.initParticles();
    }

    setState(state) {
        const prev = this.state;
        this.state = state;
        if (prev !== state && (state === 'listening' || state === 'speaking' || state === 'processing')) {
            this.addPulse();
            this.addPulse();
        }
    }

    addPulse() {
        const c = this._sc();
        this.pulses.push({ r: this.radius * 0.65, alpha: 0.85, speed: 2.8 + Math.random() * 2, color: c.primary });
    }

    setAudioLevel(level)    { this.targetAudioLevel = Math.min(1, level); }
    setFrequencyData(data)  { this.frequencyData = data; }

    _buildHexGrid() {
        const w = this.canvas.width  || window.innerWidth;
        const h = this.canvas.height || window.innerHeight;
        this.hexCanvas = document.createElement('canvas');
        this.hexCanvas.width  = w;
        this.hexCanvas.height = h;
        const hx = this.hexCanvas.getContext('2d');
        const size = 28;
        const col  = size * Math.sqrt(3);
        const row  = size * 1.5;
        hx.strokeStyle = 'rgba(0, 100, 200, 0.07)';
        hx.lineWidth   = 0.8;
        for (let r = -1; r < h / row + 2; r++) {
            for (let c = -1; c < w / col + 2; c++) {
                const ox = c * col + (r % 2 === 0 ? 0 : col / 2);
                const oy = r * row;
                hx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = (Math.PI / 180) * (60 * i - 30);
                    const px = ox + size * Math.cos(a);
                    const py = oy + size * Math.sin(a);
                    i === 0 ? hx.moveTo(px, py) : hx.lineTo(px, py);
                }
                hx.closePath();
                hx.stroke();
            }
        }
    }

    updateWaveform() {
        const bars = this.waveformData.length;
        for (let i = 0; i < bars; i++) {
            let target = 0;
            if (this.state === 'listening') {
                if (this.frequencyData && this.frequencyData.length) {
                    const bin = Math.floor((i / bars) * this.frequencyData.length);
                    target = (this.frequencyData[bin] || 0) / 255;
                } else {
                    target = Math.random() * this.audioLevel;
                }
            } else if (this.state === 'speaking') {
                target = 0.2 + 0.45 * Math.abs(Math.sin(this.frame * 0.07 + i * 0.38));
            } else if (this.state === 'processing') {
                const wave = Math.sin(this.frame * 0.05 + i * 0.25) * 0.5 + 0.5;
                target = wave * 0.3;
            }
            this.waveformData[i] += (target - this.waveformData[i]) * 0.22;
        }
    }

    initParticles() {
        this.particles = [];
        const count = 90;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.22,
                vy: (Math.random() - 0.5) * 0.22,
                r: Math.random() * 1.6 + 0.3,
                baseAlpha: Math.random() * 0.45 + 0.08,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 0.022 + 0.007,
                hue: 195 + Math.random() * 35
            });
        }
    }

    initScanLines() {
        this.scanLines = [];
        for (let i = 0; i < 4; i++) {
            this.scanLines.push({
                y: Math.random() * this.canvas.height,
                speed: 0.3 + Math.random() * 0.5,
                alpha: 0.02 + Math.random() * 0.03
            });
        }
    }

    drawBackground() {
        const { ctx, cx, cy, canvas } = this;

        ctx.fillStyle = '#060a12';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (this.hexCanvas) ctx.drawImage(this.hexCanvas, 0, 0);

        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.radius * 3.8);
        const c = this._sc();
        grd.addColorStop(0,   c.ring + '0.12)');
        grd.addColorStop(0.45, c.ring + '0.04)');
        grd.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.scanLines.forEach(sl => {
            sl.y += sl.speed;
            if (sl.y > canvas.height) sl.y = -2;
            const grad = ctx.createLinearGradient(0, sl.y, 0, sl.y + 2);
            grad.addColorStop(0,   'rgba(0,180,255,0)');
            grad.addColorStop(0.5, `rgba(0,180,255,${sl.alpha})`);
            grad.addColorStop(1,   'rgba(0,180,255,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, sl.y, canvas.width, 2);
        });
    }

    drawParticles() {
        const { ctx } = this;
        this.particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            p.twinkle += p.twinkleSpeed;
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width)  p.x = 0;
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
        this.pulses = this.pulses.filter(p => p.alpha > 0.008);
        this.pulses.forEach(p => {
            ctx.beginPath();
            ctx.arc(cx, cy, p.r, 0, Math.PI * 2);
            const hex = p.color;
            const r = parseInt(hex.slice(1,3), 16);
            const g = parseInt(hex.slice(3,5), 16);
            const b = parseInt(hex.slice(5,7), 16);
            ctx.strokeStyle = `rgba(${r},${g},${b},${p.alpha})`;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
            ctx.stroke();
            ctx.shadowBlur = 0;
            p.r += p.speed;
            p.alpha *= 0.955;
        });
    }

    drawMainRing() {
        const { ctx, cx, cy, frame } = this;
        const r = this.radius;
        const t = frame * 0.004;
        const bump = this.audioLevel * 14;
        const c = this._sc();

        if (this.audioLevel > 0.05 || this.state === 'speaking') {
            const haloAlpha = 0.15 + this.audioLevel * 0.3;
            const haloGrd = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.55);
            haloGrd.addColorStop(0,   c.ring + haloAlpha + ')');
            haloGrd.addColorStop(0.5, c.ring + (haloAlpha * 0.4) + ')');
            haloGrd.addColorStop(1,   c.ring + '0)');
            ctx.beginPath();
            ctx.arc(cx, cy, r * 1.55, 0, Math.PI * 2);
            ctx.fillStyle = haloGrd;
            ctx.fill();
        }

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.45);
        ctx.shadowBlur = 22 + bump;
        ctx.shadowColor = c.glow;
        ctx.strokeStyle = c.primary;
        ctx.lineWidth = 2.8;
        const segments = [[0.05, 0.60], [0.72, 1.25], [1.38, 1.92]];
        segments.forEach(([s, e]) => {
            ctx.beginPath();
            ctx.arc(0, 0, r + bump * 0.18, s * Math.PI, e * Math.PI);
            ctx.stroke();
        });
        ctx.restore();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-t * 0.28);
        ctx.strokeStyle = c.ring + '0.4)';
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = c.primary;
        ctx.setLineDash([6, 12]);
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.865, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        ctx.save();
        ctx.translate(cx, cy);
        const innerR = r * 0.725 + Math.sin(frame * 0.024) * 3 + bump * 0.28;
        const innerA = 0.5 + Math.sin(frame * 0.018) * 0.22;
        ctx.strokeStyle = c.ring + innerA + ')';
        ctx.lineWidth = 1.6;
        ctx.shadowBlur = 14;
        ctx.shadowColor = c.primary;
        ctx.beginPath();
        ctx.arc(0, 0, innerR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.65);
        ctx.shadowBlur = 12;
        ctx.shadowColor = c.primary;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dotR = i % 2 === 0 ? 3.2 : 1.8;
            const alpha = i % 2 === 0 ? 1.0 : 0.5;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, dotR, 0, Math.PI * 2);
            ctx.fillStyle = c.ring + alpha + ')';
            ctx.fill();
        }
        ctx.restore();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 0.10);
        ctx.shadowBlur = 10;
        ctx.shadowColor = c.primary;
        ctx.fillStyle = c.primary;
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const dx = Math.cos(angle) * (r * 1.065);
            const dy = Math.sin(angle) * (r * 1.065);
            ctx.save();
            ctx.translate(dx, dy);
            ctx.rotate(angle + Math.PI / 4);
            const s = 5;
            ctx.fillRect(-s / 2, -s / 2, s, s);
            ctx.restore();
        }
        ctx.restore();
    }

    drawWaveform() {
        if (this.state === 'idle') return;
        const { ctx, cx, cy } = this;
        const r = this.radius;
        const bars = this.waveformData.length;
        const c = this._sc();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.lineWidth = 2.8;
        ctx.shadowBlur = 16;
        ctx.shadowColor = c.wave;

        if (this.state === 'speaking') {
            for (let pass = 0; pass < 2; pass++) {
                const alpha = pass === 0 ? 0.7 : 0.4;
                const offset = pass === 0 ? 0 : Math.PI / bars;
                ctx.beginPath();
                for (let i = 0; i <= bars; i++) {
                    const angle = ((i % bars) / bars) * Math.PI * 2 - Math.PI / 2 + offset;
                    const val   = this.waveformData[i % bars];
                    const barH  = val * 55;
                    const rr    = r + 6 + barH;
                    const x = Math.cos(angle) * rr;
                    const y = Math.sin(angle) * rr;
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.strokeStyle = c.ring + alpha + ')';
                ctx.stroke();
            }
        } else {
            for (let i = 0; i < bars; i++) {
                const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
                const val   = this.waveformData[i];
                const barH  = Math.max(3, val * 62);
                const alpha = 0.25 + val * 0.75;
                const x1 = Math.cos(angle) * (r + 5);
                const y1 = Math.sin(angle) * (r + 5);
                const x2 = Math.cos(angle) * (r + 5 + barH);
                const y2 = Math.sin(angle) * (r + 5 + barH);
                ctx.strokeStyle = c.ring + alpha + ')';
                ctx.beginPath();
                ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    drawCenter() {
        const { ctx, cx, cy, frame } = this;
        const r = this.radius;
        const c = this._sc();

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.68);
        grad.addColorStop(0,   'rgba(5,18,40,0.97)');
        grad.addColorStop(0.55,'rgba(3,12,28,0.95)');
        grad.addColorStop(1,   'rgba(0,5,15,0.80)');
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.70, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.save();
        ctx.translate(cx, cy);
        const orbitR = r * 0.38;
        for (let i = 0; i < 3; i++) {
            const a = frame * 0.018 + (i / 3) * Math.PI * 2;
            const dx = Math.cos(a) * orbitR;
            const dy = Math.sin(a) * orbitR;
            const dotAlpha = 0.6 + 0.4 * Math.sin(frame * 0.05 + i * 2);
            ctx.beginPath();
            ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = c.ring + dotAlpha + ')';
            ctx.shadowBlur = 10;
            ctx.shadowColor = c.primary;
            ctx.fill();
        }
        ctx.restore();

        const fontSize = Math.max(16, r * 0.265);
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `700 ${fontSize}px "Courier New", "Consolas", monospace`;
        ctx.shadowBlur = 28;
        ctx.shadowColor = c.glow;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('JARVIS', cx, cy);
        ctx.restore();

        const stateInfo = {
            idle:       { text: '· IN ATTESA ·',    color: c.ring + '0.55)' },
            listening:  { text: '● ASCOLTO',          color: '#00ff88' },
            processing: { text: '◈ ELABORAZIONE',     color: '#ffaa00' },
            speaking:   { text: '◆ RISPOSTA',         color: '#00ddff' }
        };
        const info = stateInfo[this.state] || stateInfo.idle;
        const subSize = Math.max(9, r * 0.105);
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${subSize}px "Courier New", monospace`;
        ctx.fillStyle = info.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = info.color.startsWith('#') ? info.color : c.primary;
        ctx.fillText(info.text, cx, cy + r * 0.42);
        ctx.restore();
    }

    drawHUD() {
        const { ctx, canvas, cx } = this;
        const W = canvas.width;
        const H = canvas.height;
        const c = this._sc();
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const hh = Math.floor(elapsed / 3600).toString().padStart(2,'0');
        const mm = Math.floor((elapsed % 3600) / 60).toString().padStart(2,'0');
        const ss = (elapsed % 60).toString().padStart(2,'0');
        const lineColor = c.ring + '0.40)';
        const textColor = c.ring + '0.45)';
        const cl = 44;

        ctx.strokeStyle = lineColor;
        ctx.lineWidth   = 1.5;

        [[20, 20, 1, 1], [W-20, 20, -1, 1], [20, H-20, 1, -1], [W-20, H-20, -1, -1]].forEach(([x, y, sx, sy]) => {
            ctx.beginPath();
            ctx.moveTo(x, y + sy * cl); ctx.lineTo(x, y); ctx.lineTo(x + sx * cl, y);
            ctx.stroke();
        });

        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = textColor;

        ctx.textAlign = 'left';
        ctx.fillText('JARVIS v3.1  ·  STARK INDUSTRIES', 28, H - 28);

        ctx.textAlign = 'center';
        ctx.fillText('J.A.R.V.I.S  ·  VOICE INTERFACE', cx, 32);

        ctx.textAlign = 'left';
        ctx.fillText('NEURAL LINK: ACTIVE', 28, 22);
        ctx.fillText(`UPTIME: ${hh}:${mm}:${ss}`, 28, 36);

        ctx.textAlign = 'right';
        ctx.fillText('ENCRYPTION: AES-256', W - 28, 22);
        ctx.fillText('POWER: OPTIMAL', W - 28, 36);
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
