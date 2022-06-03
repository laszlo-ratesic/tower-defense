const config = {
  type: Phaser.AUTO,
  parent: 'content',
  width: 640,
  height: 512,
  scene: {
    key: 'main',
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

let graphics;
let path;

// Enemy speed defined as global variable temporarily
const ENEMY_SPEED = 1 / 10000;

// Array map to check if places are free on grid
// Notice the similarity to the grid where the line is placed
let map = [
  [0, -1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, -1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, -1, -1, -1, -1, -1, -1, -1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, -1, 0, 0],
];

function preload() {
  this.load.atlas(
    'sprites',
    'assets/spritesheet.png',
    'assets/spritesheet.json'
  );
  this.load.image('bullet', 'assets/bullet.png');
}

const Enemy = new Phaser.Class({
  Extends: Phaser.GameObjects.Image,

  initialize: function Enemy(scene) {
    Phaser.GameObjects.Image.call(this, scene, 0, 0, 'sprites', 'enemy');
    this.follower = { t: 0, vec: new Phaser.Math.Vector2() };
  },
  update: function (time, delta) {
    // move the t point along the path,
    // 0 is both start and end
    this.follower.t += ENEMY_SPEED * delta;

    // get the new x and y coords in vec
    path.getPoint(this.follower.t, this.follower.vec);

    // update enemy x and y to above
    this.setPosition(this.follower.vec.x, this.follower.vec.y);

    // if we have reached the end of the path, remove enemy
    if (this.follower.t >= 1) {
      this.setActive(false);
      this.setVisible(false);
    }
  },
  startOnPath: function () {
    // set the t param at the start of the path
    this.follower.t = 0;

    // get x and y of the given t point
    path.getPoint(this.follower.t, this.follower.vec);

    // set the x and y of our enemy to what we receive above
    this.setPosition(this.follower.vec.x, this.follower.vec.y);
  },
});

const Turret = new Phaser.Class({
  Extends: Phaser.GameObjects.Image,

  initialize: function Turret(scene) {
    Phaser.GameObjects.Image.call(this, scene, 0, 0, 'sprites', 'turret');
    this.nextTic = 0;
  },
  // places the turret according to grid
  place: function (i, j) {
    this.y = i * 64 + 64 / 2;
    this.x = j * 64 + 64 / 2;
    map[i][j] = 1;
  },
  update: function (time, delta) {
    // time to shoot
    if (time > this.nextTic) {
      this.nextTic = time + 1000;
    }
  },
});

const Bullet = new Phaser.Class({
  Extends: Phaser.GameObjects.Image,

  initialize: function Bullet(scene) {
    Phaser.GameObjects.Image.call(this, scene, 0, 0, 'bullet');

    this.dx = 0;
    this.dy = 0;
    this.lifespan = 0;

    this.speed = Phaser.Math.GetSpeed(600, 1);
  },

  fire: function (x, y, angle) {
    this.setActive(true);
    this.setVisible(true);

    // Bullets fire from the middle of the screen to x and y above
    this.setPosition(x, y);

    // we dont need to rotate the bullets as they are round
    // this.setRotation(angle);

    this.dx = Math.cos(angle);
    this.dy = Math.sin(angle);

    this.lifespan = 300;
  },

  update: function (time, delta) {
    this.lifespan -= delta;

    this.x += this.dx * (this.speed * delta);
    this.y += this.dy * (this.speed * delta);

    if (this.lifespan <= 0) {
      this.setActive(false);
      this.setVisible(false);
    }
  },
});

function drawGrid(graphics) {
  graphics.lineStyle(1, 0x0000ff, 0.8);
  for (let i = 0; i < 8; i++) {
    graphics.moveTo(0, i * 64);
    graphics.lineTo(640, i * 64);
  }
  for (let j = 0; j < 10; j++) {
    graphics.moveTo(j * 64, 0);
    graphics.lineTo(j * 64, 512);
  }
  graphics.strokePath();
}

function placeTurret(pointer) {
  let i = Math.floor(pointer.y / 64);
  let j = Math.floor(pointer.x / 64);
  if (canPlaceTurret(i, j)) {
    const turret = turrets.get();
    if (turret) {
      turret.setActive(true);
      turret.setVisible(true);
      turret.place(i, j);
    }
  }

  function canPlaceTurret(i, j) {
    return map[i][j] === 0;
  }
}

function create() {
  // graphics element only for visualization
  // NOT RELATED TO PATH
  let graphics = this.add.graphics();
  drawGrid(graphics);

  // The path for enemies
  // parameters are the start x and y of path
  path = this.add.path(96, -32);
  path.lineTo(96, 164);
  path.lineTo(480, 164);
  path.lineTo(480, 544);

  graphics.lineStyle(3, 0xffffff, 1);
  // visualize the path
  path.draw(graphics);

  // Add enemies group to the game
  enemies = this.add.group({ classType: Enemy, runChildUpdate: true });
  this.nextEnemy = 0;

  // Add turrets
  turrets = this.add.group({ classType: Turret, runChildUpdate: true });
  this.input.on('pointerdown', placeTurret);
}

function update(time, delta) {
  // if its time for the next enemy
  if (time > this.nextEnemy) {
    const enemy = enemies.get();
    if (enemy) {
      enemy.setActive(true);
      enemy.setVisible(true);

      // place the enemy at start of path
      enemy.startOnPath();

      this.nextEnemy = time + 2000;
    }
  }
}
