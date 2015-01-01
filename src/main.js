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
};
Load.prototype.create = function () {
  this.game.state.start('Gameplay');
};

var Gameplay = function () {
  //
};
Gameplay.prototype.preload = function() {
  //
};
Gameplay.prototype.create = function() {
  this.game.add.sprite(16, 16, 'blocks', 4);
};
Gameplay.prototype.update = function() {
  //
};

var main = function() {
  console.log('hello, jam ...again! ♡');

  var game = new Phaser.Game(320, 224);

  game.state.add('Preload', Preload, false);
  game.state.add('Load', Load, false);
  game.state.add('Gameplay', Gameplay, false);

  game.state.start('Preload');
};