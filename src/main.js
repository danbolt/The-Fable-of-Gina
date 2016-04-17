Globals = {
  HasKeys: {
    red: false,
    blue: false,
    green: false
  },

  PlayerHealth: 0,
  PlayerMaxHealth: 4,
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
  this.game.input.keyboard.addKeyCapture(Phaser.Keyboard.SPACEBAR);

  this.game.input.gamepad.start();

  this.game.load.bitmapFont('font', 'asset/font/font.png', 'asset/font/font.json');
};
Preload.prototype.create = function () {
  var loadingText = this.game.add.bitmapText(this.game.width / 2, this.game.height / 2, 'font', 'loading!', 8);
  loadingText.align = 'center';
  loadingText.anchor.set(0.5);

  this.game.state.start('Load', false);
};

var Load = function () {
  //
};
Load.prototype.preload = function() {
  this.game.load.spritesheet('blocks', 'asset/img/blocks.png', 16, 16);

  this.game.load.tilemap('overworld', 'asset/map/overworld.json', undefined, Phaser.Tilemap.TILED_JSON);
};
Load.prototype.create = function () {
  this.game.state.start('TitleScreen');
};

var TitleScreen = function () {
  //
};
TitleScreen.prototype.create = function () {
  this.game.stage.backgroundColor = 0x000000;

  var logoText = this.game.add.bitmapText(this.game.width / 2, this.game.height / 2, 'font', 'the fable of gina\n\npress enter to start', 8);
  logoText.align = 'center';
  logoText.anchor.set(0.5);

  var startGameKey = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
  startGameKey.onUp.add(function () {
    this.game.input.keyboard.removeKey(startGameKey);
    this.game.state.start('Gameplay');
  }, this);
  
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
  this.map.setCollisionByExclusion([8, 6].map(function (i) { return i+1; }), true, this.foreground, true);
  this.foreground.resizeWorld();

  this.cameraScrolling = false;
  this.cameraBounds = new Phaser.Rectangle(0, 0, this.game.camera.width, this.game.camera.height - (Constants.TileSize * 3));
  this.game.camera.bounds = null;

  this.hostiles = [];
  this.enemies = [];
  this.toggleSwitches = [];
  this.locks = [];
  this.keys = [];

  this.poofPool = this.game.add.group();
  for (var i = 0; i < 7; i++) {
    var newPoof = this.game.add.sprite(0, 0, 'blocks', 0);
    newPoof.animations.add('poof', [93, 94, 95, 96], 7, false).killOnComplete = true;
    newPoof.kill();

    this.poofPool.addChild(newPoof);
  }

  this.walkEnemyPool = this.game.add.group();
  for (var i = 0; i < 7; i++) {
    var newWalker = new WalkEnemy(this.game, 0, 0);
    this.walkEnemyPool.addChild(newWalker);
    this.hostiles.push(newWalker);
    newWalker.kill();
  };

  var that = this;
  var putPoofCallback = function(x, y) {
    var newPoof = that.poofPool.getFirstDead();
      if (newPoof !== null) {
        newPoof.revive();
        newPoof.x = x - 8;
        newPoof.y = y - 8;
        newPoof.animations.play('poof');

        that.game.world.bringToTop(that.poofPool);
      }
  };

  this.map.objects.environment.forEach(function (envObject) {
    if (envObject.name === 'spike') {
      var newSpikes = this.game.add.existing(new Spikes(this.game, envObject.x, envObject.y));
      this.hostiles.push(newSpikes);
    } else if (envObject.name === 'player') {
      this.player = this.game.add.existing(new Player(this.game, envObject.x, envObject.y, this.map, this.foreground, putPoofCallback));
      player = this.player;
    } else if (envObject.name === 'red_switch') {
      var newSwitch = this.game.add.existing(new ToggleSwitch(this.game, envObject.x, envObject.y, 'red', (function () { var that = this; return (function (color) { that.toggleSwitchTiles.call(that, color); }); }).call(this)));
      this.toggleSwitches.push(newSwitch);
    } else if (envObject.name === 'blue_switch') {
      var newSwitch = this.game.add.existing(new ToggleSwitch(this.game, envObject.x, envObject.y, 'blue', (function () { var that = this; return (function (color) { that.toggleSwitchTiles.call(that, color); }); }).call(this)));
      this.toggleSwitches.push(newSwitch);
    } else if (envObject.name === 'lock') {
      var newLock = this.game.add.existing(new Lock(this.game, envObject.x, envObject.y, envObject.properties.color));
      this.locks.push(newLock);
    } else if (envObject.name === 'key') {
      var newKey = this.game.add.existing(new Key(this.game, envObject.x, envObject.y, envObject.properties.color));
      this.keys.push(newKey);
    } else if (envObject.name === 'win') {
      var newGoal = this.game.add.existing(new WinObject(this.game, envObject.x, envObject.y));
      this.goal = newGoal;
    }
  }, this);
  
  this.game.world.bringToTop(this.player);
  this.player.bullets.forEach(function (b) { this.game.world.bringToTop(b); }, this);
  this.game.world.bringToTop(this.player.punchBox);

  this.sparklePool = this.game.add.group();
  for (var i = 0; i < 10; i++) {
    var newPoof = this.game.add.sprite(0, 0, 'blocks', 0);
    newPoof.animations.add('poof', [14, 15], 10, true);
    newPoof.animations.play('poof');
    newPoof.kill();

    this.sparklePool.addChild(newPoof);
  }

  var calculatedCameraX = ~~(this.player.x / (Constants.RoomWidthInTiles * Constants.TileSize)) * (Constants.RoomWidthInTiles * Constants.TileSize);
  var calculatedCameraY = ~~(this.player.y / (Constants.RoomHeightInTiles * Constants.TileSize)) * (Constants.RoomHeightInTiles * Constants.TileSize);
  this.camera.x = calculatedCameraX;
  this.camera.y = calculatedCameraY;

  Globals.HasKeys.red = false;
  Globals.HasKeys.blue = false;
  Globals.HasKeys.green = false;
  Globals.PlayerHealth = Globals.PlayerMaxHealth;

  this.setUpGUI();
};
Gameplay.prototype.update = function() {
  // solid-object collisions
  this.game.physics.arcade.collide(this.enemies, this.foreground);
  this.game.physics.arcade.collide(this.player, this.foreground);
  this.game.physics.arcade.collide(this.player, this.locks, function () {}, function (player, lock) {
    if (Globals.HasKeys[lock.color] === true) {
      lock.kill();
    }
  }, this);

  // win game logic
  this.game.physics.arcade.overlap(this.player, this.goal, function (player, goal) {
    goal.kill();

    var claimIcon = this.game.add.sprite(this.player.x, this.player.y - 24, 'blocks', 0);
    claimIcon.animations.add('flicker', [97, 98], 10, true);
    claimIcon.animations.play('flicker');
    claimIcon.anchor.set(0.5);

    this.player.disableMovement = true;
    this.player.viewSprite.animations.play('weak_pose');

    this.game.time.events.add(3000, function () {
      this.game.state.start('TitleScreen');
    }, this);
  }, undefined, this);

  // get key logic
  this.game.physics.arcade.overlap(this.player, this.keys, function (player, key) {
    key.kill();

    var newKeyGraphic = this.game.add.sprite((Constants.LockColors[key.color] - 76) * 20, 0, 'blocks', Constants.LockColors[key.color]);
    this.gui.keys.addChild(newKeyGraphic);

    this.player.disableMovement = true;
    if (this.player.currentForm === 'weak') {
      this.player.viewSprite.animations.play('weak_pose');
    }
    var claimIcon = this.game.add.sprite(this.player.x, this.player.y - 24, 'blocks', key.frame);
    claimIcon.anchor.set(0.5);
    this.game.time.events.add(1500, function () {

      for (var i = 0; i < 10; i++) {
        var newSparkle = this.sparklePool.getFirstDead();
        if (newSparkle !== null) {
          newSparkle.revive();
          newSparkle.x = player.x;
          newSparkle.y = player.y;
          var index = i;
          var nS = newSparkle;
          var newPoofTween = this.game.add.tween(newSparkle);
          newPoofTween.to({ x: [player.x + (70 * Math.cos(i / 10 * Math.PI * 2))  , claimIcon.x], y: [player.y + (70 * Math.sin(i / 10 * Math.PI * 2)) , claimIcon.y] }, 1200);

          if (i === 0) {
            newPoofTween.onComplete.add(function () {
              claimIcon.destroy();
              this.player.disableMovement = false;

              this.sparklePool.forEach(function (s) { s.kill(); });

              switch (this.player.currentForm) {
                case 'weak':
                  this.player.currentForm = 'bird';
                  break;
                case 'bird':
                  this.player.currentForm = 'rock';
                  break;
                case 'rock':
                  this.player.currentForm = 'tank';
                  break;
                default:
                  break;
              }
              
              this.player.viewSprite.animations.play(this.player.currentForm + '_idle_south');
            }, this);
          }

          newPoofTween.start();
        }
      }
    }, this);

    Globals.HasKeys[key.color] = true;
  }, undefined, this);

  // player/foe collision detection
  this.game.physics.arcade.overlap(this.player, this.hostiles, function () { }, function (player, enemy) {
    if (player.invincible === true || player.jumping === true) { return false; }

    Globals.PlayerHealth--;
    this.gui.hearts.children.forEach(function (h) {
      h.frame = this.gui.hearts.children.indexOf(h) <= (Globals.PlayerHealth - 1) ? 99 : 100;
    }, this);

    if (Globals.PlayerHealth > 0) {
      player.knockBackDirection = new Phaser.Point(enemy.x - player.x, enemy.y - player.y);
      player.knockBackDirection.normalize();
      player.knockBackDirection.multiply(Constants.KnockBackSpeed, Constants.KnockBackSpeed);
      this.game.time.events.add(401, function () {
        player.knockBackDirection = null;
      }, this);

      player.invincible = true;
      var flickerPlayer = this.game.time.events.loop(100, function () {
        player.viewSprite.tint = (player.viewSprite.tint === 0xFFFFFF ? 0xFF0000 : 0xFFFFFF);
      }, this);
      this.game.time.events.add(Constants.FlickerTime, function () { player.viewSprite.tint = 0xFFFFFF; player.invincible = false; this.game.time.events.remove(flickerPlayer); }, this);

      return false;
    } else if (Globals.PlayerHealth === 0) {
      // player has died! boo
      this.player.dying = true;
      this.player.disableMovement = true;
      this.player.viewSprite.animations.play(this.player.currentForm + '_die');

      this.game.time.events.add(3000, function () {
        this.game.state.start('TitleScreen');
      }, this);
      
    }
  }, this);

  // bullet/enemy collision detection
  this.game.physics.arcade.overlap(this.player.bullets, this.enemies, function () {}, function (enemy, bullet) {
    bullet.kill();

    if (!(enemy.invincible)) {
      enemy.kill();

      var newPoof = this.poofPool.getFirstDead();
      if (newPoof !== null) {
        newPoof.revive();
        newPoof.x = enemy.x - 8;
        newPoof.y = enemy.y - 8;
        newPoof.animations.play('poof');
      }
    }

    return false;
  }, this);

  // punch/enemy collision detection
  this.game.physics.arcade.overlap(this.player.punchBox, this.enemies, function () {}, function (pBox, enemy) {
    if (!(enemy.invincible)) {
      enemy.kill();

      var newPoof = this.poofPool.getFirstDead();
      if (newPoof !== null) {
        newPoof.revive();
        newPoof.x = enemy.x - 8;
        newPoof.y = enemy.y - 8;
        newPoof.animations.play('poof');

        this.game.world.bringToTop(this.poofPool);
      }
    }

    return false;
  }, this);

  // bullet/toggleswitch collision detection
  this.game.physics.arcade.overlap(this.player.bullets, this.toggleSwitches, function () {}, function (toggleSwitch, bullet) {
    bullet.kill();

    toggleSwitch.toggleCallback(toggleSwitch.color);
    toggleSwitch.animations.play('flip');

    return false;
  }, this);

  // punch/toggleswitch collision detection
  this.game.physics.arcade.overlap(this.player.punchBox, this.toggleSwitches, function () {}, function (pBox, toggleSwitch) {
    if (pBox.toggled === true) { return; }

    toggleSwitch.toggleCallback(toggleSwitch.color);
    toggleSwitch.animations.play('flip');

    pBox.toggled = true;

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

    // kill the previous room's enemies
    this.enemies.forEach(function (e) { e.kill(); });
    this.enemies.length = 0;

    // spawn new enemies for the current room
    this.map.objects.enemies.forEach(function (enemyData) {
      if (enemyData.x > calculatedCameraX && enemyData.x < calculatedCameraX + this.cameraBounds.width &&
          enemyData.y > calculatedCameraY && enemyData.y < calculatedCameraY + this.cameraBounds.height) {
        if (enemyData.name === 'walker') {
          var newWalker = this.walkEnemyPool.getFirstDead();
          newWalker.x = enemyData.x + 8;
          newWalker.y = enemyData.y + 8;
          newWalker.revive();
          this.enemies.push(newWalker);
        }
      }
    }, this);
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

  var guiBlack = this.game.add.sprite(0, 0, 'blocks', 11);
  guiBlack.tint = 0x000000;
  guiBlack.width = this.game.width;
  guiBlack.height = Constants.TileSize * 3;
  this.gui.addChild(guiBlack);

  var guiTestText = this.game.add.bitmapText(16, 4, 'font', 'life', 8);
  this.gui.addChild(guiTestText);
  this.areaText = guiTestText;

  var hearts = this.game.add.group();
  hearts.x = 16;
  hearts.y = 16;
  for (var i = 0; i < Globals.PlayerMaxHealth; i++) {
    var heartContainer = this.game.add.sprite(21 * i, 0, 'blocks', 99);
    hearts.addChild(heartContainer);
  }
  this.gui.hearts = hearts;
  this.gui.addChild(hearts);

  var guiTestText = this.game.add.bitmapText(128, 4, 'font', 'keys', 8);
  this.gui.addChild(guiTestText);
  this.areaText = guiTestText;
  var keys = this.game.add.group();
  keys.x = 128;
  keys.y = 16;
  this.gui.keys = keys;
  this.gui.addChild(keys);

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
        if (tile.index === 6 + (1)) {
          this.map.putTile(0 + (1), tile.x, tile.y, this.foreground);
        } else if (tile.index === 0 + (1)) {
          this.map.putTile(6 + (1), tile.x, tile.y, this.foreground);
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
  game.state.add('TitleScreen', TitleScreen, false);
  game.state.add('Gameplay', Gameplay, false);

  game.state.start('Preload');
};