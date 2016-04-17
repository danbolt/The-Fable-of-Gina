var WalkEnemy = function(game, x, y) {
  Phaser.Sprite.call(this, game, x + 8, y + 8, 'blocks', 6);

  this.game.physics.arcade.enable(this);
  this.body.setSize(12, 10);
  this.anchor.set(0.5);
  this.body.collideWorldBounds = true;

  this.knockBackDirection = null;

  this.facing = Constants.Directions.South;
  this.standingStill = true;
  this.walkLoop = null;

  this.events.onRevived.add(this.startWalkLoop, this);
  this.events.onKilled.add(this.stopWalkLoop, this);

  this.animations.add('dance', [34, 35], 7, true);
  this.animations.play('dance');
};
WalkEnemy.prototype = Object.create(Phaser.Sprite.prototype);
WalkEnemy.prototype.constructor = WalkEnemy;
WalkEnemy.prototype.startWalkLoop = function () {
  if (this.walkLoop !== null) { return; }

  this.game.time.events.add(~~(Math.random() * 1000), function () {
    this.walkLoop = this.game.time.events.loop( 1000, function () {
      this.standingStill = !(this.standingStill);

      if (this.standingStill) {
        this.body.velocity.set(0);
      } else {
        this.facing = ~~(Math.random() * 4);

        this.body.velocity.set(Constants.WalkerEnemySpeed * Math.cos(this.facing * Math.PI / 2), Constants.WalkerEnemySpeed * Math.sin(this.facing * Math.PI / 2));
        this.game.time.events.add(300, function () { this.body.velocity.set(0); }, this);
      }
    }, this);
  }, this);
};
WalkEnemy.prototype.stopWalkLoop = function () {
  if (this.walkLoop === null) { return; }

  this.game.time.events.remove(this.walkLoop);
  this.walkLoop = null;
};

var Spikes = function(game, x, y) {
  Phaser.Sprite.call(this, game, x + 8, y + 8, 'blocks', 10);
  this.game.physics.arcade.enable(this);
  this.body.setSize(16, 16);
  this.anchor.set(0.5);

  this.animations.add('do', [10, 9, 12, 9], 10, true);
  this.animations.play('do');

  this.invincible = true;
};
Spikes.prototype = Object.create(Phaser.Sprite.prototype);
Spikes.prototype.constructor = Spikes;