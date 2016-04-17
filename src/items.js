var Key = function(game, x, y, color) {
  Phaser.Sprite.call(this, game, x + 8, y + 8, 'blocks', 10);
  this.game.physics.arcade.enable(this);
  this.body.setSize(16, 16);
  this.anchor.set(0.5);
  this.frame = Constants.LockColors[color];

  this.color = color;
};
Key.prototype = Object.create(Phaser.Sprite.prototype);
Key.prototype.constructor = Key;

var WinObject = function(game, x, y) {
  Phaser.Sprite.call(this, game, x + 8, y + 8, 'blocks', 10);
  this.game.physics.arcade.enable(this);
  this.body.setSize(16, 16);
  this.anchor.set(0.5);

  this.animations.add('flicker', [97, 98], 10, true);
  this.animations.play('flicker');
};
WinObject.prototype = Object.create(Phaser.Sprite.prototype);
WinObject.prototype.constructor = WinObject;

var Lock = function(game, x, y, color) {
  Phaser.Sprite.call(this, game, x + 8, y + 8, 'blocks', 10);
  this.game.physics.arcade.enable(this);
  this.body.setSize(16, 16);
  this.anchor.set(0.5);
  this.body.immovable = true;
  this.frame = Constants.LockColors[color] + 3;

  this.color = color;
};
Lock.prototype = Object.create(Phaser.Sprite.prototype);
Lock.prototype.constructor = Lock;

var ToggleSwitch = function(game, x, y, color, toggleCallback) {
  Phaser.Sprite.call(this, game, x + 8, y + 8, 'blocks', color === 'red' ? 1 : 7);

  this.game.physics.arcade.enable(this);
  this.body.setSize(16, 16);
  this.anchor.set(0.5, 0.5);

  this.animations.add('flip', color === 'red' ? [1,2,1,2,1,2] : [7,3,7,3,7,3], 5, false);

  this.toggleCallback = toggleCallback;
  this.color = color;
};
ToggleSwitch.prototype = Object.create(Phaser.Sprite.prototype);
ToggleSwitch.prototype.constructor = ToggleSwitch;