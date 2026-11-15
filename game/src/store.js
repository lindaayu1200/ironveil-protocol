// Central store for Ironveil Protocol game state
import * as THREE from 'three';

export const store = {
  money: 800,
  armor: false,
  grenades: 2,
  inventory: ['pistol'], // owned weapons: 'pistol', 'vesper', 'kestrel', 'longbow'
  activeWeaponIndex: 0, // 0: pistol, 1: vesper, 2: kestrel, 3: longbow (if owned)
  
  roundState: 'freeze', // 'freeze', 'playing', 'planted', 'ended'
  roundTime: 115, // 1:55 in seconds
  freezeTime: 3.0,
  scoreAttack: 0,
  scoreDefense: 0,
  targetScore: 8,

  bomb: {
    planted: false,
    site: null, // 'A' or 'B'
    timer: 40.0,
    planter: null,
    defusing: false,
    defuseProgress: 0,
    plantProgress: 0,
  },

  teams: {
    attack: { alive: 5, total: 5 }, // player + 4 bots
    defense: { alive: 5, total: 5 }, // 5 bots
  },

  killFeed: [], // array of { text, time }
  roundBanner: { text: '', sub: '', active: false, timer: 0 },

  addMoney(amount) {
    this.money += amount;
  },

  addॉलKillFeed(text) {
    this.killFeed.unshift({ text, time: performance.now() });
    if (this.killFeed.length > 5) this.killFeed.pop();
  },

  showBanner(text, sub, duration = 3.5) {
    this.roundBanner.text = text;
    this.roundBanner.sub = sub;
    this.roundBanner.active = true;
    this.roundBanner.timer = duration;
  },

  resetRound() {
    this.roundState = 'freeze';
    this.freezeTime = 3.0;
    this.roundTime = 115;
    this.bomb.planted = false;
    this.bomb.site = null;
    this.bomb.timer = 40.0;
    this.bomb.defusing = false;
    this.bomb.defuseProgress = 0;
    this.bomb.plantProgress = 0;
    this.teams.attack.alive = 5;
    this.teams.attack.total = 5;
    this.teams.defense.alive = 5;
    this.teams.defense.total = 5;
    this.grenades = 2;
  }
};
