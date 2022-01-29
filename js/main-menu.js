class Button {
    constructor(x, y, text, onClick) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.onClick = onClick;

        CTX.fillStyle = '#fff';
        CTX.textBaseline = 'middle';
        CTX.textAlign = 'center';
        CTX.font = '24pt Courier';
        const width = CTX.measureText(text).width;

        this.radiusX = Math.max(100, (width + 50) / 2);
        this.radiusY = 25;
    }

    render() {
        CTX.translate(this.x, this.y);

        CTX.rotate(Math.sin(Date.now() * Math.PI * 2 / 1000) * Math.PI / 128);

        if (this.contains(MOUSE_POSITION)) {
            CTX.scale(1.1, 1.1);
        }

        CTX.fillStyle = '#b12a34';
        CTX.fillRect(-this.radiusX, -this.radiusY, this.radiusX * 2, this.radiusY * 2);

        CTX.fillStyle = '#fff';
        CTX.textBaseline = 'middle';
        CTX.textAlign = 'center';
        CTX.font = '24pt Courier';
        CTX.fillText(this.text, 0, 0);
    }

    contains(position) {
        return Math.abs(this.x - position.x) < this.radiusX && Math.abs(this.y - position.y) < this.radiusY;
    }
}

class Menu {
    constructor() {
        this.buttons = [];
        this.fade(0, 1);
    }

    fade(fromValue, toValue) {
        this.fadeStartTime = Date.now();
        this.fadeEndTime = Date.now() + CONFIG.menuFadeDuration * 1000;
        this.fadeStartValue = fromValue;
        this.fadeEndValue = toValue;
    }

    get alpha() {
        let progress = (Date.now() - this.fadeStartTime) / (this.fadeEndTime - this.fadeStartTime);
        progress = Math.min(1, Math.max(0, progress));

        return progress * (this.fadeEndValue - this.fadeStartValue) + this.fadeStartValue;
    }

    dismiss() {
        if (!this.dismissed) {
            this.dismissed = true;
            this.fade(1, 0);
            setTimeout(() => MENU = null, CONFIG.menuFadeDuration * 1000);
        }
    }

    render() {
        CTX.globalAlpha = this.alpha;

        this.buttons.forEach(b => CTX.wrap(() => b.render()));
    }

    highlightedButton(position) {
        return this.buttons.filter((b) => b.contains(position))[0];
    }
}

class MainMenu extends Menu {
    constructor() {
        super();

        this.buttons.push(new Button(
            CONFIG.width / 2,
            CONFIG.height / 2 + 50,
            DEATHS.length ? 'TRY AGAIN' : 'PLAY',
            () => {
                MENU.dismiss();
                resetPlayer();
            },
        ));

        const scores = highscores();
        if (scores.length != 0) {
            this.buttons.push(new Button(
                CONFIG.width / 2,
                CONFIG.height / 2 + 125,
                'SCOREBOARD',
                () => {
                    const container = document.getElementById('scoreboard-container');
                    container.innerHTML = '';

                    const addr = window.webxdc.selfAddr;
                    const list = document.createElement('ol');
                    list.className = 'w3-ol';
                    highscores().forEach(item => {
                        const name = document.createElement('span');
                        name.className = 'w3-large';
                        name.textContent = item.name.length > 20 ? item.name.substring(0, 20) + '…' : item.name;

                        const score = document.createElement('span');
                        score.textContent = item.score + "M";
                        score.className = 'w3-right';

                        const li = document.createElement('li');
                        if (item.addr == addr) {
                            const strong = document.createElement("strong");
                            strong.appendChild(name);
                            strong.appendChild(score);
                            li.appendChild(strong);
                        } else {
                            li.appendChild(name);
                            li.appendChild(score);
                        }
                        list.appendChild(li);
                    });

                    container.appendChild(list);
                    document.getElementById('scoreboard').style.display='block';
                },
            ));
        }

        this.created = Date.now();
    }

    render() {
        const addr = window.webxdc.selfAddr;
        const lastScore = DEATHS.length ? DEATHS[DEATHS.length - 1].distance : -1;
        const newHighscore = lastScore >= highscore(addr);

        const rng = createNumberGenerator(1);
        for (let i = 0 ; i < 100 * newHighscore ; i++) {
            CTX.wrap(() => {
                const startY = -rng() * CONFIG.height * 2;
                const speed = 200 + rng() * 200;
                const rotationSpeed = Math.PI + rng() * Math.PI + (rng() < 0.5 ? 1 : -1);

                CTX.fillStyle = CONFIG.confettiColors[~~(rng() * CONFIG.confettiColors.length)];
                CTX.translate(
                    CONFIG.wallX + rng() * (CONFIG.width - CONFIG.wallX * 2),
                    startY + speed * (Date.now() - this.created) / 1000,
                );
                CTX.rotate(rotationSpeed * (Date.now() - this.created) / 1000);
                CTX.scale(10, 10);
                CTX.beginPath();
                CTX.moveTo(-1, -1);
                CTX.lineTo(1, -1);
                CTX.lineTo(-1, 1);
                CTX.fill();
            });
        }

        super.render();

        // CTX.globalAlpha = Math.max(0, (GAME_DURATION - 1) / 0.3);

        CTX.wrap(() => {
            CTX.translate(CONFIG.width / 2, CONFIG.height / 3 - 50);
            CTX.scale(this.alpha, this.alpha);

            const title = 'TRISKA';
            CTX.fillStyle = '#000';
            CTX.textBaseline = 'middle';
            CTX.textAlign = 'center';
            CTX.font = 'bold 72pt Courier';
            CTX.fillText(title, 0, 0);

            const titleWidth = CTX.measureText(title);

            CTX.textAlign = 'right';
            CTX.font = '30pt Courier';
            CTX.fillText('RELOADED', titleWidth.width / 2, 45);
        });

        CTX.wrap(() => {
            CTX.translate(CONFIG.width / 2, CONFIG.height / 2 - 40);
            CTX.scale(this.alpha, this.alpha);

            if (DEATHS.length) {
                CTX.fillStyle = '#b12a34';
                CTX.textBaseline = 'middle';
                CTX.textAlign = 'center';
                CTX.font = '24pt Courier';

                if (newHighscore) {
                    CTX.fillText(`NEW RECORD! ${lastScore}M`, 0, 0);

                    CTX.font = '8pt Courier';
                    CTX.translate(0, 25);
                    CTX.fillText(`(BUT REALLY, YOU COULD HAVE GONE HIGHER)`, 0, 0);
                } else {
                    CTX.fillText(`YOU CLIMBED ${lastScore}M!`, 0, 0);

                    CTX.font = '8pt Courier';
                    CTX.translate(0, 25);
                    CTX.fillText(`(YOU ONCE DID ${highscore(addr)}M THOUGH)`, 0, 0);
                }
            }
        });

        CTX.wrap(() => {
            CTX.translate(CONFIG.width - 120, CONFIG.height - 50);
            CTX.translate(0, (1 - this.alpha) * 100);

            const dizzy = DEATHS.length > 0 && Date.now() - this.created < 4000;
            if (dizzy) {
                CTX.rotate(Math.sin(Date.now() / 1000 * Math.PI * 2 / 2) * Math.PI / 32);
            }

            CTX.wrap(() => {
                CTX.scale(3, 3);
                renderCat(CTX, false, dizzy);
            });

            if (dizzy) {
                const rng = createNumberGenerator(1);

                const count = 5;
                for (let i = 0 ; i < count ; i++) {
                    CTX.wrap(() => {
                        const ratio = i / count;
                        CTX.translate(0, -80);

                        const angle = ratio * Math.PI * 2 + Date.now() / 1000 * Math.PI;
                        CTX.translate(Math.cos(angle) * 40, Math.sin(angle) * 10);
                        renderSpark(CTX, 0, 0);
                    });
                }

            }
        });
    }
}
