import { CONFIG } from "./config.js";

export class Camera {
  constructor(player) {
    this.player = player;
    this.topY = player.y - CONFIG.height + CONFIG.groundHeight;
  }

  get bottomY() {
    return this.topY + CONFIG.height;
  }

  cycle(elapsed) {
    const targetTopY = Math.min(this.topY, this.player.y - CONFIG.height * 0.7);

    const diff = targetTopY - this.topY;

    const velocity = diff / 0.1;

    this.topY += velocity * elapsed;

    // this.topY = Math.min(this.topY, this.player.y - CONFIG.height * 0.5);
  }
}
