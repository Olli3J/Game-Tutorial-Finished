class SceneA extends Phaser.Scene {
  map;
  player;
  snake;
  snakeStartPoint;
  playerStartPoint;
  snakeCollider;
  cursors; //controls
  keyA;
  keyD;
  score = 0;
  scoreText;
  potions;
  inPlay = true; //boollean
  bloodScreen;

  constructor(config) {
    super(config);
  }
  preload() {
    //screens
    this.load.image('bloodScreen', 'assets/blood.png');
    //images
    this.load.image('tiles', 'assets/Nature_TileSet.png');
    this.load.image('background', 'assets/Nature_Background.png');
    this.load.image('potion', 'assets/potions.png');
    //JSON
    this.load.tilemapTiledJSON('platform-map', 'assets/map1.json');
    //Enemy
    this.load.image('enemy', 'assets/snake.png');
    //Player
    this.load.spritesheet('player', 'assets/GameTutorialPlayer.png', {
      frameWidth: 16.5,
      frameHeight: 32
    });


  } //end of preload

  create() {
    this.createLevel1();
    this.createPlayerMovement();
    this.cameraAndControls();

  }//end of create

  update() {
    if (this.inPlay) {
      if (this.cursors.left.isDown || this.keyA.isDown) {
        this.player.setVelocityX(-130);
        if (this.player.body.blocked.down) {
          this.player.anims.play('walk', true);
        } else {
          this.player.anims.play('idle', true);
        }
        this.player.flipX = false;
      } else if (this.cursors.right.isDown || this.keyD.isDown) {
        this.player.setVelocityX(130);
        if (this.player.body.blocked.down) {
          this.player.anims.play('walk', true);
        } else {
          this.player.anims.play('idle', true);
        }
        this.player.flipX = true;
      } else {
        this.player.setVelocityX(0);
        this.player.anims.play('idle', true);
        
      }
      if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && this.player.jumpCount < 2) {
        this.player.jumpCount++;
        this.player.setVelocityY(-200);
      } else if (this.player.body.blocked.down) {
        this.player.jumpCount = 0;

      }
    }
  }

  createLevel1() {
    this.add.image(280, 40, 'background').setScrollFactor(0, 0);
    //adding tilemap
    this.map = this.make.tilemap({ key: 'platform-map' });
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    //platform-tiles = the tiled name
    let tiles = this.map.addTilesetImage('game-tiles', 'tiles');
    let collisionLayer = this.map.createStaticLayer('collisionLayer', [tiles], 0, 0);
    collisionLayer.setCollisionBetween(1, 1000);


    //player
    this.playerStartPoint = SceneA.FindPoint(this.map, 'objectLayer', 'player', 'playerSpawn');
    this.player = this.physics.add.sprite(this.playerStartPoint.x, this.playerStartPoint.y, 'player');
    this.player.jumpCount = 0;
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, collisionLayer);


    //Enemy
    this.snakeStartPoint = SceneA.FindPoint(this.map, 'objectLayer', 'snake', 'snakeSpawn');
    this.snake = this.physics.add.sprite(this.snakeStartPoint.x, this.snakeStartPoint.y, 'enemy');
    this.snake.setCollideWorldBounds(true);
    this.physics.add.collider(this.snake, collisionLayer);
    this.physics.add.overlap(this.player, this.snake, this.snakeCollide, null, this);


    //collectable
    let potionPoints = SceneA.FindPoints(this.map, 'objectLayer', 'potion');
    this.potions = this.physics.add.staticGroup();
    for (var point, i = 0; i < potionPoints.length; i++) {
      point = potionPoints[i];
      this.potions.create(point.x, point.y, 'potion');
    }
    this.physics.add.overlap(this.player, this.potions, this.collectPotion, null, this);

    //Score
    this.scoreText = this.add.text(190, 5, 'Potion 0', {
      fontSize: '20px',
      fill: '#B22222',
      fontFamily: 'Century Gothic , sans-serif'
    }).setScrollFactor(0);

    //add screen
    this.bloodScreen = this.add.image(10, 10, 'bloodScreen').setScrollFactor(0, 0).setAlpha(0);
  
  } // end of class
  createPlayerMovement() {
    //flash
    this.player.on('animationcomplete-die', this.showBlood, this);
    this.anims.create({
      key: 'die',
      frames: this.anims.generateFrameNumbers('player', {
        start: 6,
        end: 8
      }),
      frameRate: 12,
      repeat: 0
    })
    //player walk 
    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('player', {
        start: 1,
        end: 5
      }),
      frameRate: 10,
      repeat: -1
    });
    //this.player.anims.play('walk', true);
    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('player', {
        start: 0,
        end: 0
      }),
    });

  }
  cameraAndControls() {
    //camera
    let camera = this.cameras.getCamera('');
    camera.startFollow(this.player);
    camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    //controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  }

  
  collectPotion(player, potion) {
    potion.disableBody(true, true);
    this.score += 10;
    this.scoreText.setText('Potion:' + this.score);
    if (this.potions.countActive(true) == 0) {
      this.scoreText.tint = true;
    }
  }

  snakeCollide(player, snake) {
    this.player.setVelocityX(0);
    this.player.anims.play('die', true);
    this.inPlay = false;
    
  }
  
  showBlood() {
    this.tweens.add(
      {
        targets: this.bloodScreen,
        alpha: { value: 1, duration: 500, ease: 'Power1' }
      }
    )
  }

  static FindPoint(map, layer, type, name) {
    var loc = map.findObject(layer, function (object) {
      if (object.type === type && object.name === name) {
        return object;
      }
    });
    return loc
  }
  static FindPoints(map, layer, type) {
    var locs = map.filterObjects(layer, function (object) {
      if (object.type === type) {
        return object
      }
    });
    return locs
  }

}