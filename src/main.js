Constants = {
  TileSize: 16,

  MoveSpeed: 100,

  RoomWidthInTiles: 20,
  RoomHeightInTiles: 11,

  CameraScrollTime: 650,

  KnockBackSpeed: -150,
  FlickerTime: 700,

  JumpTime: 300, // duration of jump
  PunchTime: 300, // duration of punch
  ShootTime: 50, // duration of time to "stall the player" when shooting
  BulletVelocity: 120,
  TimeBetweenBullets: 400, // prevent 'spamming' the bullets

  // enumerative type
  Directions: {
    North: 3,
    South: 1,
    West: 2,
    East: 0,
  },

  // indicies of tiles that can be broken by the hammer
  BreakableTiles: [
    5
  ]
};

var WalkEnemy = function(game, x, y) {
  Phaser.Sprite.call(this, game, x, y, 'blocks', 6);

  this.game.physics.arcade.enable(this);
  this.body.setSize(12, 10);
  this.anchor.set(0.5);

  this.knockBackDirection = null;
};
WalkEnemy.prototype = Object.create(Phaser.Sprite.prototype);
WalkEnemy.prototype.constructor = WalkEnemy;

var ToggleSwitch = function(game, x, y, color, toggleCallback) {
  Phaser.Sprite.call(this, game, x, y, 'blocks', color === 'red' ? 1 : 7);

  this.game.physics.arcade.enable(this);
  this.body.setSize(16, 16);
  this.anchor.set(0.5);

  this.toggleCallback = toggleCallback;
  this.color = color;
};
ToggleSwitch.prototype = Object.create(Phaser.Sprite.prototype);
ToggleSwitch.prototype.constructor = ToggleSwitch;

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
  this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.SPACEBAR);

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
  this.map.setCollisionByExclusion([8, 4].map(function (i) { return i+1; }), true, this.foreground, true);
  this.foreground.resizeWorld();

  this.cameraScrolling = false;
  this.cameraBounds = new Phaser.Rectangle(0, 0, this.game.camera.width, this.game.camera.height - (Constants.TileSize * 3));
  this.game.camera.bounds = null;

  this.testWalkEnemy = this.game.add.existing(new WalkEnemy(this.game, 16, 96));

  this.toggleSwitches = [];
  var testToggleSwitch = this.game.add.existing(new ToggleSwitch(this.game, 96, 96, 'blue', (function () { var that = this; return (function (color) { that.toggleSwitchTiles.call(that, color); }); }).call(this)));
  this.toggleSwitches.push(testToggleSwitch);

  this.player = this.game.add.existing(new Player(this.game, 64, 96, this.map, this.foreground));

  this.setUpGUI();
};
Gameplay.prototype.update = function() {
  this.game.physics.arcade.collide(this.player, this.foreground);

  // player/foe collision detection
  this.game.physics.arcade.overlap(this.player, this.testWalkEnemy, function () { }, function (player, enemy) {
    if (player.invincible === true || player.jumping === true) { return false; }

    player.knockBackDirection = new Phaser.Point(enemy.x - player.x, enemy.y - player.y);
    player.knockBackDirection.normalize();
    player.knockBackDirection.multiply(Constants.KnockBackSpeed, Constants.KnockBackSpeed);
    this.game.time.events.add(200, function () {
      player.knockBackDirection = null;
    }, this);

    player.invincible = true;
    var flickerPlayer = this.game.time.events.loop(100, function () {
      player.viewSprite.tint = (player.viewSprite.tint === 0xFFFFFF ? 0xFF0000 : 0xFFFFFF);
    }, this);
    this.game.time.events.add(Constants.FlickerTime, function () { player.viewSprite.tint = 0xFFFFFF; player.invincible = false; this.game.time.events.remove(flickerPlayer); }, this);

    return false;
  }, this);

  // bullet/toggleswitch collision detection
  this.game.physics.arcade.overlap(this.player.bullets, this.toggleSwitches, function () {}, function (toggleSwitch, bullet) {
    bullet.kill();

    toggleSwitch.toggleCallback(toggleSwitch.color);

    return false;
  }, this);

  // camera scrolling
  this.cameraBounds.x = this.game.camera.x;
  this.cameraBounds.y = this.game.camera.y;
  if (this.cameraScrolling === false && Phaser.Rectangle.contains(this.cameraBounds, this.player.x, this.player.y) === false) {
    this.cameraScrolling = true;
    this.player.disableMovement = true;
    this.player.bullets.forEach(function (b) { b.kill(); }, this);

    var calculatedCameraX = ~~(this.player.x / (Constants.RoomWidthInTiles * Constants.TileSize)) * (Constants.RoomWidthInTiles * Constants.TileSize);
    var calculatedCameraY = ~~(this.player.y / (Constants.RoomHeightInTiles * Constants.TileSize)) * (Constants.RoomHeightInTiles * Constants.TileSize);
    var cameraTween = this.game.add.tween(this.game.camera);
    cameraTween.to({x: calculatedCameraX, y: calculatedCameraY}, Constants.CameraScrollTime);
    cameraTween.onComplete.add(function () {
      this.cameraScrolling = false;
      this.player.disableMovement = false;
    }, this);
    cameraTween.start();
  } else {
    this.player.bullets.forEach(function (b) {
      if (Phaser.Rectangle.contains(this.cameraBounds, b.x, b.y) === false) {
        b.kill();
      }
    }, this);
  }
};
// remove/delete this function in final version
Gameplay.prototype.render = function () {
  //this.game.debug.body(this.player);

  //this.player.bullets.forEach(function(b) { this.game.debug.body(b); }, this);
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
  this.areaText = guiTestText;

  this.game.world.bringToTop(this.gui);
};
Gameplay.prototype.toggleSwitchTiles = function (color) {
  if (color === 'red') {
    this.map.forEach(function (tile) {
      if (tile instanceof Phaser.Tile) {
        if (tile.index === 8 + (1)) {
          this.map.putTile(13 + (1), tile.x, tile.y, this.foreground);
        } else if (tile.index === 13 + (1)) {
          this.map.putTile(8 + (1), tile.x, tile.y, this.foreground);
        }
      }
    }, this, 0, 0, this.map.width, this.map.height, this.foreground);
  } else if (color === 'blue') {
    this.map.forEach(function (tile) {

      if (tile instanceof Phaser.Tile) {
        if (tile.index === 4 + (1)) {
          this.map.putTile(0 + (1), tile.x, tile.y, this.foreground);
        } else if (tile.index === 0 + (1)) {
          this.map.putTile(4 + (1), tile.x, tile.y, this.foreground);
        }
      }

    }, this, 0, 0, this.map.width, this.map.height, this.foreground);
  }
};

var main = function() {
  console.log('hello, jam ...again! ♡');

  var game = new Phaser.Game(320, 224);

  game.state.add('Preload', Preload, false);
  game.state.add('Load', Load, false);
  game.state.add('Gameplay', Gameplay, false);

  game.state.start('Preload');
};