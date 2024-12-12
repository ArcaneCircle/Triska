import { CONFIG } from "./config.js";
import { state } from "./state.js";
import { Menu, Button } from "./menu.js";
import { createNumberGenerator } from "./rng.js";
import { renderCat, renderSpark } from "./graphics.js";

export class MainMenu extends Menu {
  constructor() {
    super();

    this.buttons.push(
      new Button(
        CONFIG.width / 2,
        CONFIG.height / 2 + 50,
        state.DEATHS.length ? "TRY AGAIN" : "PLAY",
        () => {
          if (document.getElementById("modal").style.display !== "block") {
            state.MENU.dismiss();
            resetPlayer();
          }
        },
      ),
    );

    if (window.highscores.getHighScores().length > 0) {
      this.buttons.push(
        new Button(
          CONFIG.width / 2,
          CONFIG.height / 2 + 125,
          "SCOREBOARD",
          () => {
            document.getElementById("modal").style.display = "block";
          },
        ),
      );
    }

    this.created = Date.now();
  }

  render() {
    const lastScore = state.DEATHS.length
      ? state.DEATHS[state.DEATHS.length - 1].distance
      : -1;
    const newHighscore = lastScore >= window.highscores.getScore();

    const rng = createNumberGenerator(1);
    for (let i = 0; i < 100 * newHighscore; i++) {
      state.CTX.wrap(() => {
        const startY = -rng() * CONFIG.height * 2;
        const speed = 200 + rng() * 200;
        const rotationSpeed =
          Math.PI + rng() * Math.PI + (rng() < 0.5 ? 1 : -1);

        state.CTX.fillStyle =
          CONFIG.confettiColors[~~(rng() * CONFIG.confettiColors.length)];
        state.CTX.translate(
          CONFIG.wallX + rng() * (CONFIG.width - CONFIG.wallX * 2),
          startY + (speed * (Date.now() - this.created)) / 1000,
        );
        state.CTX.rotate((rotationSpeed * (Date.now() - this.created)) / 1000);
        state.CTX.scale(10, 10);
        state.CTX.beginPath();
        state.CTX.moveTo(-1, -1);
        state.CTX.lineTo(1, -1);
        state.CTX.lineTo(-1, 1);
        state.CTX.fill();
      });
    }

    super.render();

    // state.CTX.globalAlpha = Math.max(0, (state.GAME_DURATION - 1) / 0.3);

    state.CTX.wrap(() => {
      state.CTX.translate(CONFIG.width / 2, CONFIG.height / 3 - 50);
      state.CTX.scale(this.alpha, this.alpha);

      const title = "TRISKA";
      state.CTX.fillStyle = "#000";
      state.CTX.textBaseline = "middle";
      state.CTX.textAlign = "center";
      state.CTX.font = "bold 72pt Courier";
      state.CTX.fillText(title, 0, 0);

      const titleWidth = state.CTX.measureText(title);

      state.CTX.textAlign = "right";
      state.CTX.font = "30pt Courier";
      state.CTX.fillText("RELOADED", titleWidth.width / 2, 45);
    });

    state.CTX.wrap(() => {
      state.CTX.translate(CONFIG.width / 2, CONFIG.height / 2 - 40);
      state.CTX.scale(this.alpha, this.alpha);

      if (state.DEATHS.length) {
        state.CTX.fillStyle = "#b12a34";
        state.CTX.textBaseline = "middle";
        state.CTX.textAlign = "center";
        state.CTX.font = "24pt Courier";

        if (newHighscore) {
          state.CTX.fillText(`NEW RECORD! ${lastScore}M`, 0, 0);

          state.CTX.font = "8pt Courier";
          state.CTX.translate(0, 25);
          state.CTX.fillText(`(BUT REALLY, YOU COULD HAVE GONE HIGHER)`, 0, 0);
        } else {
          state.CTX.fillText(`YOU CLIMBED ${lastScore}M!`, 0, 0);

          state.CTX.font = "8pt Courier";
          state.CTX.translate(0, 25);
          state.CTX.fillText(
            `(YOU ONCE DID ${window.highscores.getScore()}M THOUGH)`,
            0,
            0,
          );
        }
      }
    });

    state.CTX.wrap(() => {
      state.CTX.translate(CONFIG.width - 120, CONFIG.height - 50);
      state.CTX.translate(0, (1 - this.alpha) * 100);

      const dizzy = state.DEATHS.length > 0 && Date.now() - this.created < 4000;
      if (dizzy) {
        state.CTX.rotate(
          (Math.sin(((Date.now() / 1000) * Math.PI * 2) / 2) * Math.PI) / 32,
        );
      }

      state.CTX.wrap(() => {
        state.CTX.scale(3, 3);
        renderCat(state.CTX, false, dizzy);
      });

      if (dizzy) {
        const rng = createNumberGenerator(1);

        const count = 5;
        for (let i = 0; i < count; i++) {
          state.CTX.wrap(() => {
            const ratio = i / count;
            state.CTX.translate(0, -80);

            const angle = ratio * Math.PI * 2 + (Date.now() / 1000) * Math.PI;
            state.CTX.translate(Math.cos(angle) * 40, Math.sin(angle) * 10);
            renderSpark(state.CTX, 0, 0);
          });
        }
      }
    });
  }
}
