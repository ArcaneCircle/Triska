import { CONFIG } from "./config.js";
import { state } from "./state.js";

export class Obstacle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  collidesWithPlayer() {
    if (state.PLAYER.timeSinceSuperLucky < CONFIG.superLuckyRecoveryTime) {
      return false;
    }

    return (
      Math.abs(state.PLAYER.x - this.x) < CONFIG.obstacleRadiusX &&
      Math.abs(state.PLAYER.y - this.y) < CONFIG.obstacleRadiusY
    );
  }

  render() {
    if (
      state.CAMERA.bottomY < this.y - CONFIG.obstacleRadiusY ||
      state.CAMERA.y > this.y + CONFIG.obstacleRadiusY
    ) {
      return;
    }

    let addedX = 0;
    if (state.PLAYER.timeSinceSuperLucky < CONFIG.superLuckyRecoveryTime) {
      addedX =
        (CONFIG.obstacleRadiusX *
          (CONFIG.superLuckyRecoveryTime - state.PLAYER.timeSinceSuperLucky)) /
        CONFIG.superLuckyRecoveryTime;

      const period = 0.2;
      if (state.PLAYER.timeSinceSuperLucky % period > period / 2) {
        return;
      }
    }

    state.CTX.fillStyle = "#000";

    state.CTX.wrap(() => {
      state.CTX.translate(addedX * Math.sign(this.x - CONFIG.width / 2), 0);
      state.CTX.beginPath();

      const halfSpikeHeight =
        CONFIG.obstacleRadiusY / CONFIG.obstacleSpikeCount;
      for (
        let y = this.y - CONFIG.obstacleRadiusY;
        y < this.y + CONFIG.obstacleRadiusY;
        y += halfSpikeHeight * 2
      ) {
        state.CTX.lineTo(this.x, y);
        state.CTX.lineTo(
          this.x +
            CONFIG.obstacleRadiusX * Math.sign(CONFIG.width / 2 - this.x),
          y + halfSpikeHeight,
        );
      }

      state.CTX.lineTo(this.x, this.y + CONFIG.obstacleRadiusY);

      state.CTX.fill();
    });
  }
}
