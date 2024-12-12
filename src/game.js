import "./game.css";
import "@webxdc/highscores";

import "./utils.js";
import { state } from "./state.js";
import { CONFIG } from "./config.js";
import { createNumberGenerator } from "./rng.js";
import { Player } from "./player.js";
import { Camera } from "./camera.js";
import { MainMenu } from "./main-menu.js";
import { Obstacle } from "./obstacle.js";
import { Item } from "./item.js";
import { BACKGROUND_PATTERNS, renderDeath, renderGauge } from "./graphics.js";

function h(tag, attributes, ...children) {
  const element = document.createElement(tag);
  if (attributes) {
    Object.entries(attributes).forEach((entry) => {
      element.setAttribute(entry[0], entry[1]);
    });
  }
  element.append(...children);
  return element;
}

const scoreboard = h("div", { id: "scoreboard", class: "w3-container" });

document.body.append(
  h(
    "div",
    { id: "modal", class: "w3-modal", onclick: "event.stopPropagation();" },
    h(
      "div",
      {
        class: "w3-modal-content w3-animate-top",
        onclick: "event.stopPropagation();",
      },
      h(
        "header",
        { class: "w3-container w3-red" },
        h(
          "h2",
          {},
          "Scoreboard",
          h(
            "span",
            {
              class: "w3-button w3-display-topright",
              onclick: "document.getElementById('modal').style.display='none'",
            },
            "×",
          ),
        ),
      ),
      scoreboard,
    ),
  ),
);

const CANVAS = document.getElementById("can");
let RNG = null;
let RENDERED_POWER = 0;

window.onload = () => {
  window.highscores
    .init({
      onHighscoresChanged: () => {
        scoreboard.innerHTML = window.highscores.renderScoreboard().innerHTML;
      },
    })
    .then(() => {
      CANVAS.width = CONFIG.width;
      CANVAS.height = CONFIG.height;

      resetGame();

      window.onresize();

      animationFrame();
    });
};

window.onresize = () => {
  const ratio = CONFIG.width / CONFIG.height;

  let width, height;
  if (innerWidth / innerHeight < ratio) {
    width = innerWidth;
    height = innerWidth / ratio;
  } else {
    height = innerHeight;
    width = innerHeight * ratio;
  }

  inner.style.width = `${width}px`;
  inner.style.height = `${height}px`;
};

window.animationFrame = () => {
  const now = performance.now();
  const elapsed = (now - state.LAST_FRAME) / 1000;
  state.LAST_FRAME = now;

  cycle(elapsed);
  renderFrame();

  requestAnimationFrame(animationFrame);
};

window.onmousedown = window.onkeydown = () => (state.MOUSE_DOWN = true);
window.onmouseup =
  window.ontouchcancel =
  window.onkeyup =
    () => (state.MOUSE_DOWN = false);

window.ontouchstart = (e) => {
  onmousemove(e.touches[0]);
  onmousedown(e);
};

window.ontouchmove = (e) => e.preventDefault();

window.ontouchend = (e) => {
  onmouseup();
  onclick();
};

window.onmousemove = (e) => {
  const rect = CANVAS.getBoundingClientRect();
  state.MOUSE_POSITION = {
    x: ((e.pageX - rect.left) / rect.width) * CONFIG.width,
    y: ((e.pageY - rect.top) / rect.height) * CONFIG.height,
  };

  if (state.MENU && state.MENU.highlightedButton(state.MOUSE_POSITION)) {
    CANVAS.style.cursor = "pointer";
  } else {
    CANVAS.style.cursor = "default";
  }
};

window.onclick = () => {
  if (state.MENU) {
    const button = state.MENU.highlightedButton(state.MOUSE_POSITION);
    if (button) button.onClick();
  } else {
    // if (!state.WAIT_FOR_RELEASE) {
    //     // state.PLAYER.jump();
    //     state.WAIT_FOR_RELEASE = true;
    // }
  }
};

window.renderFrame = () => {
  state.CTX.fillStyle = "#000";
  state.CTX.fillRect(0, 0, CONFIG.width, CONFIG.height);

  state.CTX.wrap(() => {
    if (Date.now() < state.CAMERA_SHAKE_END) {
      state.CTX.translate(
        Math.random() * CONFIG.shakeFactor * 2 + CONFIG.shakeFactor,
        Math.random() * CONFIG.shakeFactor * 2 + CONFIG.shakeFactor,
      );
    }

    // Walls
    state.CTX.fillStyle = "#000";
    state.CTX.fillRect(0, state.CAMERA.topY, CONFIG.wallX, CONFIG.height);
    state.CTX.fillRect(CONFIG.width, 0, -CONFIG.wallX, CONFIG.height);

    // Background color
    state.CTX.fillStyle =
      Date.now() < state.CAMERA_SHAKE_END ? "#900" : "#c8caca";
    state.CTX.fillRect(
      CONFIG.wallX,
      0,
      CONFIG.width - CONFIG.wallX * 2,
      CONFIG.height,
    );

    // Background trees
    BACKGROUND_PATTERNS.forEach((pattern, i) => {
      state.CTX.fillStyle = pattern;

      const distance = Math.abs(Math.sin(1 + i * 2));

      const offset = state.CAMERA.topY * 0.8 * (1 - distance / 4);
      state.CTX.wrap(() => {
        state.CTX.globalAlpha = 1 - distance / 2;
        state.CTX.translate(0, -offset);
        state.CTX.fillRect(
          CONFIG.wallX,
          offset,
          CONFIG.width - CONFIG.wallX * 2,
          CONFIG.height,
        );
      });
    });

    state.CTX.translate(0, -state.CAMERA.topY);

    // Obstacles
    state.OBSTACLES.forEach((o) => o.render());
    state.ITEMS.forEach((i) => i.render());

    state.DEATHS.forEach((death) => renderDeath(state.CTX, death.x, death.y));

    if (state.MENU) state.CTX.globalAlpha = 1 - state.MENU.alpha;
    if (state.GAME_DURATION === 0) return;

    // Ground
    state.CTX.fillStyle = "#000";
    state.CTX.fillRect(
      0,
      CONFIG.playerRadius + 10,
      CONFIG.width,
      CONFIG.groundHeight,
    );

    // Player
    state.PLAYER.render();
  });

  if (!state.MENU && state.PLAYER.distance) {
    state.CTX.fillStyle = "#b12a34";
    state.CTX.textBaseline = "top";
    state.CTX.textAlign = "left";
    state.CTX.font = "18pt Courier";
    state.CTX.fillText(`${state.PLAYER.distance}M`, CONFIG.wallX + 15, 15);

    state.CTX.wrap(() => {
      state.CTX.translate(CONFIG.width / 2, 25);

      const scale =
        1 + Math.min(0.1, Math.abs(RENDERED_POWER - state.PLAYER.power));

      if (RENDERED_POWER < state.PLAYER.power) {
        state.CTX.scale(scale, scale);
      }

      renderGauge(state.CTX, RENDERED_POWER);
    });
  }

  if (state.MENU) state.CTX.wrap(() => state.MENU.render());
};

window.resetGame = () => {
  resetPlayer();
  state.MENU = new MainMenu();
};

window.resetPlayer = () => {
  RNG = createNumberGenerator(1);
  state.PLAYER = new Player();
  state.CAMERA = new Camera(state.PLAYER);
  state.OBSTACLES = [];
  state.ITEMS = [];
};

window.cycle = (elapsed) => {
  if (!state.MENU || state.MENU.dismissed) {
    state.GAME_DURATION += elapsed;
  } else {
    state.GAME_DURATION = 0;
  }

  if (!state.MOUSE_DOWN) {
    state.WAIT_FOR_RELEASE = false;
  }

  state.PLAYER.cycle(elapsed);
  state.CAMERA.cycle(elapsed);
  state.ITEMS.forEach((i) => i.cycle(elapsed));

  const appliedDiff = Math.max(
    -elapsed * 0.5,
    Math.min(elapsed * 0.5, state.PLAYER.power - RENDERED_POWER),
  );
  RENDERED_POWER += appliedDiff;

  if (
    !state.OBSTACLES.length ||
    state.OBSTACLES[state.OBSTACLES.length - 1].y >= state.CAMERA.topY
  ) {
    generateNewObstacle();
  }
};

window.generateNewObstacle = () => {
  const lastObstacleY = state.OBSTACLES.length
    ? state.OBSTACLES[state.OBSTACLES.length - 1].y
    : CONFIG.obstaclesStartY;

  const difficulty = Math.min(1, state.OBSTACLES.length / 20);
  const minSpacing = CONFIG.obstacleRadiusY * 2 + 200 + (1 - difficulty) * 400;
  const extraSpacing = (1 - difficulty) * 500;

  const doubleProbability = difficulty * 0.2;

  const xRng = RNG() < 0.5;

  const obstacle = new Obstacle(
    xRng ? CONFIG.wallX : CONFIG.width - CONFIG.wallX,
    lastObstacleY - (RNG() * extraSpacing + minSpacing),
  );
  state.OBSTACLES.push(obstacle);

  if (RNG() < doubleProbability) {
    state.OBSTACLES.push(
      new Obstacle(
        !xRng ? CONFIG.wallX : CONFIG.width - CONFIG.wallX,
        obstacle.y,
      ),
    );
  }

  if (RNG() < 0.5) {
    state.ITEMS.push(
      new Item(
        CONFIG.wallX * 2 + RNG() * (CONFIG.width - CONFIG.wallX * 4),
        obstacle.y + RNG() * 100,
      ),
    );
  }
};
