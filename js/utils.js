CanvasRenderingContext2D.prototype.wrap = function(f) {
    this.save();
    f();
    this.restore();
};

createNumberGenerator = seed => {
    const ints = new Uint32Array([
        Math.imul(seed, 0x85ebca6b),
        Math.imul(seed, 0xc2b2ae35),
    ]);

    return () => {
        const s0 = ints[0];
        const s1 = ints[1] ^ s0;
        ints[0] = (s0 << 26 | s0 >> 8) ^ s1 ^ s1 << 9;
        ints[1] = s1 << 13 | s1 >> 19;
        return (Math.imul(s0, 0x9e3779bb) >>> 0) / 0xffffffff;
    };
};

class Camera {
    constructor() {
        this.topY = PLAYER.y - CONFIG.height + CONFIG.groundHeight;
    }

    get bottomY() {
        return this.topY + CONFIG.height;
    }

    cycle(elapsed) {
        const targetTopY = Math.min(this.topY, PLAYER.y - CONFIG.height * 0.7);

        const diff = targetTopY - this.topY;

        const velocity = diff / 0.1;

        this.topY += velocity * elapsed;

        // this.topY = Math.min(this.topY, PLAYER.y - CONFIG.height * 0.5);
    }
}

class Item {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    cycle(elapsed) {
        if (Math.abs(PLAYER.x - this.x) > 20 || Math.abs(PLAYER.y - this.y) > 20 || PLAYER.dead) {
            return;
        }

        const index = ITEMS.indexOf(this);
        if (index >= 0) {
            ITEMS.splice(index, 1);
        }

        PLAYER.power += 0.34;

        if (PLAYER.power >= 1) {
            PLAYER.power = 1;
            PLAYER.superLucky = true;
        }
    }

    render() {
        if (MENU) return;
        if (CAMERA.bottomY < this.y - 50 || CAMERA.y > this.y + 50) {
            return;
        }
        renderClover(CTX, this.x, this.y);
    }
}
