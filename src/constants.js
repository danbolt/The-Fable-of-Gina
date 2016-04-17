var Constants = {
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
  BulletVelocity: 200,
  TimeBetweenBullets: 400, // prevent 'spamming' the bullets

  WalkerEnemySpeed: 70,

  // enumerative type
  Directions: {
    North: 3,
    South: 1,
    West: 2,
    East: 0,
  },
  DirectionStrings: ['east', 'south', 'west', 'north'],

  // indicies of tiles that can be broken by the hammer
  BreakableTiles: [
    5
  ],

  LockColors: {
    red: 78,
    blue: 77,
    green: 76,
  }
};