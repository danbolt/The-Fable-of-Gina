Constants = {
  TileSize: 16,

  MoveSpeed: 50,

  RoomWidthInTiles: 20,
  RoomHeightInTiles: 11,

  CameraScrollTime: 650,
};


// State 
var Preload = function () {
  //
};
Preload.prototype.preload = function() {
  this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  this.game.scale.refresh();

  this.game.scale.pageAlignHorizontally = true;
  this.game.scale.pageAlignVertically = true;

  // enable crisp rendering
  this.game.stage.smoothed = false;
  this.game.renderer.renderSession.roundPixels = true;  
  Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
  PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST; //for WebGL

  this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.DOWN);
  this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.UP);

  this.game.input.gamepad.start();
};
Preload.prototype.create = function () {
  this.game.state.start('Load');
};

var Load = function () {
  //
};
Load.prototype.preload = function() {
  this.game.load.spritesheet('blocks', 'asset/img/blocks.png', 16, 16);

  this.game.load.tilemap('overworld', 'asset/map/overworld.json', undefined, Phaser.Tilemap.TILED_JSON);

  this.game.load.bitmapFont('font', 'asset/font/font.png', 'asset/font/font.json');
};
Load.prototype.create = function () {
  this.game.state.start('Gameplay');
};

var Gameplay = function () {
  this.player = null;
};
Gameplay.prototype.preload = function() {
  //
};
Gameplay.prototype.create = function() {
  this.map = this.game.add.tilemap('overworld');
  this.map.addTilesetImage('blocks', 'blocks', 16, 16);
  this.background = this.map.createLayer('background');
  this.foreground = this.map.createLayer('foreground');
  this.map.setCollisionByExclusion([], true, this.foreground, true);
  this.foreground.resizeWorld();

  this.cameraScrolling = false;
  this.cameraBounds = new Phaser.Rectangle(0, 0, this.game.camera.width, this.game.camera.height - (Constants.TileSize * 3));
  this.game.camera.bounds = null;

  this.player = this.game.add.sprite(64, 96, 'blocks', 4);
  this.player.disableMovement = false;
  this.game.physics.arcade.enable(this.player);
  this.player.body.setSize(14, 14);
  this.player.anchor.set(0.5);

  this.player.update = function () {
    if (this.disableMovement === false) {
      if (this.game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
        this.body.velocity.x = Constants.MoveSpeed;
        this.body.velocity.y = 0;
      } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
        this.body.velocity.x = -Constants.MoveSpeed;
        this.body.velocity.y = 0;
      } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
        this.body.velocity.x = 0;
        this.body.velocity.y = Constants.MoveSpeed;
      } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
        this.body.velocity.x = 0;
        this.body.velocity.y = -Constants.MoveSpeed;
      } else {
        this.body.velocity.set(0);
      }
    } else {
      this.body.velocity.set(0);
    }
  };

  this.setUpGUI();
};
Gameplay.prototype.update = function() {
  this.game.physics.arcade.collide(this.player, this.foreground);

  // camera scrolling
  this.cameraBounds.x = this.game.camera.x;
  this.cameraBounds.y = this.game.camera.y;
  if (this.cameraScrolling === false && Phaser.Rectangle.contains(this.cameraBounds, this.player.x, this.player.y) === false) {
    this.cameraScrolling = true;
    this.player.disableMovement = true;

    var calculatedCameraX = ~~(this.player.x / (Constants.RoomWidthInTiles * Constants.TileSize)) * (Constants.RoomWidthInTiles * Constants.TileSize);
    var calculatedCameraY = ~~(this.player.y / (Constants.RoomHeightInTiles * Constants.TileSize)) * (Constants.RoomHeightInTiles * Constants.TileSize);
    var cameraTween = this.game.add.tween(this.game.camera);
    cameraTween.to({x: calculatedCameraX, y: calculatedCameraY}, Constants.CameraScrollTime);
    cameraTween.onComplete.add(function () {
      this.cameraScrolling = false;
      this.player.disableMovement = false;
    }, this);
    cameraTween.start();
  }
};
Gameplay.prototype.setUpGUI = function() {
  this.gui = this.game.add.group();
  this.gui.fixedToCamera = true;
  this.gui.cameraOffset.y = Constants.RoomHeightInTiles * Constants.TileSize;

  var guiBlack = this.game.add.sprite(0, 0, 'blocks', 15);
  guiBlack.width = this.game.width;
  guiBlack.height = Constants.TileSize * 3;
  this.gui.addChild(guiBlack);

  var guiTestText = this.game.add.bitmapText(16, 16, 'font', 'overworld i', 8);
  this.gui.addChild(guiTestText);

  this.game.world.bringToTop(this.gui);
};

var main = function() {
  console.log('hello, jam ...again! ♡');

  var game = new Phaser.Game(320, 224);

  game.state.add('Preload', Preload, false);
  game.state.add('Load', Load, false);
  game.state.add('Gameplay', Gameplay, false);

  game.state.start('Preload');
};