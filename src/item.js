import { state } from "./state.js";
import { renderClover } from "./graphics.js";

export class Item {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  cycle(elapsed) {
    if (
      Math.abs(state.PLAYER.x - this.x) > 20 ||
      Math.abs(state.PLAYER.y - this.y) > 20 ||
      state.PLAYER.dead
    ) {
      return;
    }

    const index = state.ITEMS.indexOf(this);
    if (index >= 0) {
      state.ITEMS.splice(index, 1);
    }

    state.PLAYER.power += 0.34;

    if (state.PLAYER.power >= 1) {
      state.PLAYER.power = 1;
      state.PLAYER.superLucky = true;
    }
  }

  render() {
    if (state.MENU) return;
    if (state.CAMERA.bottomY < this.y - 50 || state.CAMERA.y > this.y + 50) {
      return;
    }
    renderClover(state.CTX, this.x, this.y);
  }
}
