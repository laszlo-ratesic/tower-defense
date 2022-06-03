const config = {
    type: Phaser.AUTO,
    parent: 'content',
    width: 640,
    height: 512,
    scene: {
        key: 'main',
        preload,
        create,
        update
    }
};

const game = new Phaser.Game(config);

let graphics;
let path;

const preload = () => {
    this.load.atlas('sprites', 'assets/spritesheet.png', 'assets/spritesheet.json');
    this.load.image('bullet', 'assets/bullet.png');
}

const create = () => {

}

const update = () => {
    
}