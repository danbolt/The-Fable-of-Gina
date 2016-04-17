var Player = function(game, x, y, map, foreground, putPoofCallback) {
  Phaser.Sprite.call(this, game, x, y, 'blocks', 63);
  this.game.physics.arcade.enable(this);
  this.body.setSize(12, 10);
  this.anchor.set(0.5, 1);

  this.putPoof = putPoofCallback;

  this.map = map;
  this.foreground = foreground;

  this.disableMovement = false;
  this.facing = Constants.Directions.South;

  this.invincible = false;
  this.knockBackDirection = null;

  this.jumping = false;
  this.punching = false;
  this.shooting = false;
  this.dying = false;

  this.currentForm = 'weak';
  //this.currentForm = 'bird';
  //this.currentForm = 'rock';
  //this.currentForm = 'tank';

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

  this.viewSprite.animations.add('weak_idle_south', [16], 1);
  this.viewSprite.animations.add('weak_run_south', [16, 17], 5, true);
  this.viewSprite.animations.add('weak_idle_east', [18], 1); 
  this.viewSprite.animations.add('weak_run_east', [18, 19], 5, true);
  this.viewSprite.animations.add('weak_idle_west', [20], 1);
  this.viewSprite.animations.add('weak_run_west', [20, 21], 5, true);
  this.viewSprite.animations.add('weak_idle_north', [22], 1);
  this.viewSprite.animations.add('weak_run_north', [22, 23], 5, true);
  this.viewSprite.animations.add('weak_pose', [24], 5, true);
  this.viewSprite.animations.add('weak_die', [16, 18, 20, 22, 16, 18, 20, 22, 25], 9, false);

  this.viewSprite.animations.add('tank_idle_south', [64], 1);
  this.viewSprite.animations.add('tank_run_south', [64, 65], 5, true);
  this.viewSprite.animations.add('tank_idle_east', [66], 1); 
  this.viewSprite.animations.add('tank_run_east', [66, 67], 5, true);
  this.viewSprite.animations.add('tank_idle_west', [70], 1);
  this.viewSprite.animations.add('tank_run_west', [70, 71], 5, true);
  this.viewSprite.animations.add('tank_idle_north', [68], 1);
  this.viewSprite.animations.add('tank_run_north', [68, 69], 5, true);
  this.viewSprite.animations.add('tank_die', [64, 66, 70, 68, 64, 66, 70, 68, 72], 9, false);

  this.viewSprite.animations.add('rock_idle_south', [39], 1);
  this.viewSprite.animations.add('rock_run_south', [39, 40], 5, true);
  this.viewSprite.animations.add('rock_idle_east', [43], 1); 
  this.viewSprite.animations.add('rock_run_east', [43, 44], 5, true);
  this.viewSprite.animations.add('rock_idle_west', [45], 1);
  this.viewSprite.animations.add('rock_run_west', [45, 46], 5, true);
  this.viewSprite.animations.add('rock_idle_north', [41], 1);
  this.viewSprite.animations.add('rock_run_north', [41, 42], 5, true);
  this.viewSprite.animations.add('rock_punch_south', [48], 1);
  this.viewSprite.animations.add('rock_punch_east', [50], 1);
  this.viewSprite.animations.add('rock_punch_west', [55], 1);
  this.viewSprite.animations.add('rock_punch_north', [53], 1);
  this.viewSprite.animations.add('rock_die', [39, 43, 45, 41, 39, 43, 45, 41, 47], 9, false);

  this.viewSprite.animations.add('bird_idle_south', [28], 1);
  this.viewSprite.animations.add('bird_idle_east', [28], 1);
  this.viewSprite.animations.add('bird_idle_north', [29], 1);
  this.viewSprite.animations.add('bird_idle_west', [29], 1);
  this.viewSprite.animations.add('bird_run_south', [32, 33], 5, true);
  this.viewSprite.animations.add('bird_run_east', [32, 33], 5, true);
  this.viewSprite.animations.add('bird_run_north', [36, 37], 5, true);
  this.viewSprite.animations.add('bird_run_west', [36, 37], 5, true);
  this.viewSprite.animations.add('bird_die', [28, 29, 32, 33, 36, 37, 36, 37, 38], 9, false);

  this.viewSprite.animations.play(this.currentForm + '_idle_south');

  this.canShoot = true;
  this.bullets = this.game.add.group();
  for (var i = 0; i < 3; i++) {
    var newBullet = this.game.add.sprite(i * 32 + 100, 100, 'blocks', 1);
    this.game.physics.arcade.enable(newBullet);
    newBullet.anchor.set(0.5);
    newBullet.width = 10;
    newBullet.height = 10;

    newBullet.animations.add('flicker', [73, 74], 12, true);
    newBullet.animations.play('flicker');

    this.bullets.addChild(newBullet);
    this.bullets.addToHash(newBullet);

    newBullet.kill();
  }
};
Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;
Player.prototype.update = function () {
  // directional keyboard movement
  if (this.disableMovement === false && this.knockBackDirection === null && this.dying === false) {
    // don't move while punching
    if (this.punching === false && this.shooting === false) {
      if (this.game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
        this.body.velocity.x = Constants.MoveSpeed;
        this.body.velocity.y = 0;

        this.facing = Constants.Directions.East;

        this.viewSprite.animations.play(this.currentForm + '_run_east');
      } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
        this.body.velocity.x = -Constants.MoveSpeed;
        this.body.velocity.y = 0;

        this.facing = Constants.Directions.West;

        this.viewSprite.animations.play(this.currentForm + '_run_west');
      } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
        this.body.velocity.x = 0;
        this.body.velocity.y = Constants.MoveSpeed;

        this.facing = Constants.Directions.South;

        this.viewSprite.animations.play(this.currentForm + '_run_south');
      } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
        this.body.velocity.x = 0;
        this.body.velocity.y = -Constants.MoveSpeed;

        this.facing = Constants.Directions.North;

        this.viewSprite.animations.play(this.currentForm + '_run_north');
      } else {
        this.body.velocity.set(0);

        if (this.dying === false && this.punching === false) {
          switch (this.facing) {
            case Constants.Directions.East:
              this.viewSprite.animations.play(this.currentForm + '_idle_east');
              break;
            case Constants.Directions.South:
              this.viewSprite.animations.play(this.currentForm + '_idle_south');
              break;
            case Constants.Directions.West:
              this.viewSprite.animations.play(this.currentForm + '_idle_west');
              break;
            case Constants.Directions.North:
              this.viewSprite.animations.play(this.currentForm + '_idle_north');
              break;
          }
        }
      }
    }

    if (this.currentForm === 'bird' && this.jumping === false && this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
      this.jumping = true;
      this.frame = 60;

      var jumpTween = this.game.add.tween(this.viewSprite);
      jumpTween.to({y: [-24, 0]}, Constants.JumpTime, Phaser.Easing.Linear.None);
      jumpTween.onComplete.add(function () {
        this.jumping = false;
        this.frame = 63;
      }, this);
      jumpTween.start();
    }

    if (this.currentForm === 'rock' && this.punching === false && this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
      this.punching = true;
      this.body.velocity.set(0);

      this.punchBox.revive();
      this.punchBox.x = this.facing === Constants.Directions.West ? -16 : (this.facing === Constants.Directions.East ? 16 : 0);
      this.punchBox.y = this.facing === Constants.Directions.South ? 8 : (this.facing === Constants.Directions.North ? -24 : -8);
      this.viewSprite.animations.play('rock_punch_' + Constants.DirectionStrings[this.facing]);

      // if the player has punched a particular tile, perform necessary logic
      var hitTile = null;
      switch (this.facing) {
        case Constants.Directions.East:
          this.punchBox.frame = 51;
          var hitTile = this.map.getTile(~~((this.right + 8) / Constants.TileSize), ~~((this.y - 6) / Constants.TileSize), this.foreground);
          break;
        case Constants.Directions.West:
          this.punchBox.frame = 54;
          var hitTile = this.map.getTile(~~((this.left - 8) / Constants.TileSize), ~~((this.y - 6) / Constants.TileSize), this.foreground);
          break;
        case Constants.Directions.South:
          this.punchBox.frame = 52;
          var hitTile = this.map.getTile(~~((this.x) / Constants.TileSize), ~~((this.bottom + 8) / Constants.TileSize), this.foreground);
          break;
        case Constants.Directions.North:
          this.punchBox.frame = 49;
          var hitTile = this.map.getTile(~~((this.x) / Constants.TileSize), ~~((this.top + 8) / Constants.TileSize), this.foreground);
          break;
      }
      if (hitTile !== null) {
        var tileIndex = hitTile.index - 1;

        // break breakable tiles
        if (Constants.BreakableTiles.indexOf(tileIndex) !== -1) {
          this.map.removeTile(hitTile.x, hitTile.y, this.foreground);

          switch (this.facing) {
            case Constants.Directions.East:
              this.putPoof((this.right + 8), this.y - 8);
              break;
            case Constants.Directions.West:
              this.putPoof((this.left - 8), this.y - 8);
              break;
            case Constants.Directions.South:
              this.putPoof((this.x), this.bottom + 8);
              break;
            case Constants.Directions.North:
              this.putPoof((this.x), this.top - 8);
              break;
          } 
          this.putPoof(this.punchBox.worldTransform.x, this.punchBox.worldTransform.y);
        }
      }

      this.game.time.events.add(Constants.PunchTime, function () {
        this.punching = false;

        this.punchBox.toggled = false;
        this.punchBox.kill();
      }, this);
    }

    if (this.currentForm === 'tank' && this.shooting === false && this.canShoot === true && this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
      var newBullet = this.bullets.getFirstDead();
      if (newBullet !== null) {
        this.shooting = true;
        this.body.velocity.set(0);

        newBullet.revive();

        newBullet.x = this.x + (this.facing === (Constants.Directions.West ? -16 : (this.facing === Constants.Directions.East ? 16 : 0)));
        newBullet.y = this.y + (this.facing === (Constants.Directions.South ? 10 : (this.facing === Constants.Directions.North ? -32 : -32))) - 10;
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