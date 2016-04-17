var Player = function(game, x, y, map, foreground) {
  Phaser.Sprite.call(this, game, x, y, 'blocks', 15);
  this.game.physics.arcade.enable(this);
  this.body.setSize(12, 10);
  this.anchor.set(0.5, 1);

  this.map = map;
  this.foreground = foreground;

  this.disableMovement = false;
  this.facing = Constants.Directions.South;

  this.invincible = false;
  this.knockBackDirection = null;

  this.jumping = false;
  this.punching = false;
  this.shooting = false;

  this.viewSprite = this.game.add.sprite(0, 0, 'blocks', 14);
  this.viewSprite.anchor.set(0.5, 1);
  this.addChild(this.viewSprite);

  this.punchBox = this.game.add.sprite(0, 0, 'blocks', 1);
  this.punchBox.toggled = false;
  this.game.physics.arcade.enable(this.punchBox);
  this.punchBox.anchor.set(0.5);
  this.punchBox.body.setSize(14, 14);
  this.addChild(this.punchBox);
  this.punchBox.kill();

  this.canShoot = true;
  this.bullets = this.game.add.group();
  for (var i = 0; i < 3; i++) {
    var newBullet = this.game.add.sprite(i * 32 + 100, 100, 'blocks', 1);
    this.game.physics.arcade.enable(newBullet);
    newBullet.anchor.set(0.5);
    newBullet.width = 10;
    newBullet.height = 10;

    this.bullets.addChild(newBullet);
    this.bullets.addToHash(newBullet);

    newBullet.kill();
  }
};
Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;
Player.prototype.update = function () {
  // directional keyboard movement
  if (this.disableMovement === false && this.knockBackDirection === null) {
    // don't move while punching
    if (this.punching === false && this.shooting === false) {
      if (this.game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
        this.body.velocity.x = Constants.MoveSpeed;
        this.body.velocity.y = 0;

        this.facing = Constants.Directions.East;
      } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
        this.body.velocity.x = -Constants.MoveSpeed;
        this.body.velocity.y = 0;

        this.facing = Constants.Directions.West;
      } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
        this.body.velocity.x = 0;
        this.body.velocity.y = Constants.MoveSpeed;

        this.facing = Constants.Directions.South;
      } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
        this.body.velocity.x = 0;
        this.body.velocity.y = -Constants.MoveSpeed;

        this.facing = Constants.Directions.North;
      } else {
        this.body.velocity.set(0);
      }
    }

    if (this.jumping === false && this.game.input.keyboard.isDown(Phaser.Keyboard.Q)) {
      this.jumping = true;

      var jumpTween = this.game.add.tween(this.viewSprite);
      jumpTween.to({y: [-24, 0]}, Constants.JumpTime, Phaser.Easing.Linear.None);
      jumpTween.onComplete.add(function () {
        this.jumping = false;
      }, this);
      jumpTween.start();
    }

    if (this.punching === false && this.game.input.keyboard.isDown(Phaser.Keyboard.W)) {
      this.punching = true;
      this.body.velocity.set(0);

      this.punchBox.revive();
      this.punchBox.x = this.facing === Constants.Directions.West ? -16 : (this.facing === Constants.Directions.East ? 16 : 0);
      this.punchBox.y = this.facing === Constants.Directions.South ? 8 : (this.facing === Constants.Directions.North ? -24 : -8);

      // if the player has punched a particular tile, perform necessary logic
      var hitTile = null;
      switch (this.facing) {
        case Constants.Directions.East:
          var hitTile = this.map.getTile(~~((this.right + 4) / Constants.TileSize), ~~((this.y - 6) / Constants.TileSize), this.foreground);
          break;
        case Constants.Directions.West:
          var hitTile = this.map.getTile(~~((this.left - 4) / Constants.TileSize), ~~((this.y - 6) / Constants.TileSize), this.foreground);
          break;
        case Constants.Directions.South:
          var hitTile = this.map.getTile(~~((this.x) / Constants.TileSize), ~~((this.bottom + 4) / Constants.TileSize), this.foreground);
          break;
        case Constants.Directions.North:
          var hitTile = this.map.getTile(~~((this.x) / Constants.TileSize), ~~((this.top + 4) / Constants.TileSize), this.foreground);
          break;
      }
      if (hitTile !== null) {
        var tileIndex = hitTile.index - 1;

        // break breakable tiles
        if (Constants.BreakableTiles.indexOf(tileIndex) !== -1) {
          this.map.removeTile(hitTile.x, hitTile.y, this.foreground);
        }
      }

      this.game.time.events.add(Constants.PunchTime, function () {
        this.punching = false;

        this.punchBox.toggled = false;
        this.punchBox.kill();
      }, this);
    }

    if (this.shooting === false && this.canShoot === true && this.game.input.keyboard.isDown(Phaser.Keyboard.E)) {
      var newBullet = this.bullets.getFirstDead();
      if (newBullet !== null) {
        this.shooting = true;
        this.body.velocity.set(0);

        newBullet.revive();

        newBullet.x = this.x + (this.facing === (Constants.Directions.West ? -16 : (this.facing === Constants.Directions.East ? 16 : 0)));
        newBullet.y = this.y + (this.facing === (Constants.Directions.South ? 8 : (this.facing === Constants.Directions.North ? -24 : -8)));
        newBullet.body.velocity.x = this.facing === Constants.Directions.West ? -Constants.BulletVelocity : (this.facing === Constants.Directions.East ? Constants.BulletVelocity : 0);
        newBullet.body.velocity.y = this.facing === Constants.Directions.South ? Constants.BulletVelocity : (this.facing === Constants.Directions.North ? -Constants.BulletVelocity : 0);

        this.game.time.events.add(Constants.ShootTime, function () {
          this.shooting = false;
        }, this);

        this.canShoot = false;
        this.game.time.events.add(Constants.TimeBetweenBullets, function () {
          this.canShoot = true;
        }, this);
      }
    }
  } else if (this.knockBackDirection !== null) {
    this.body.velocity.set(this.knockBackDirection.x, this.knockBackDirection.y);
  } else {
    this.body.velocity.set(0);
  }
};