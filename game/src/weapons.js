// 4 Weapons: P9 Sidearm, Vesper, Kestrel-7, Longbow with viewmodel, recoil, spread, reload, switching.
import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { audio } from './audio.js';

const WEAPON_DATA = [
  {
    id: 'pistol',
    name: 'P9 Sidearm',
    magSize: 12,
    reserve: 48,
    fireGap: 0.16,
    reloadTime: 1.4,
    damage: 32,
    falloffStart: 12,
    falloffMin: 14,
    spreadStill: 0.003,
    spreadMoving: 0.02,
    recoilPitch: 0.02,
    audioName: 'pistol',
    size: [0.06, 0.08, 0.22],
  },
  {
    id: 'vesper',
    name: 'Vesper',
    magSize: 30,
    reserve: 120,
    fireGap: 0.075,
    reloadTime: 1.8,
    damage: 22,
    falloffStart: 10,
    falloffMin: 10,
    spreadStill: 0.0025,
    spreadMoving: 0.032,
    recoilPitch: 0.012,
    audioName: 'rifle',
    size: [0.08, 0.09, 0.35],
  },
  {
    id: 'kestrel',
    name: 'Kestrel-7',
    magSize: 30,
    reserve: 90,
    fireGap: 0.096,
    reloadTime: 1.9,
    damage: 38,
    falloffStart: 35,
    falloffMin: 30,
    spreadStill: 0.002,
    spreadMoving: 0.028,
    recoilPitch: 0.018,
    audioName: 'rifle',
    size: [0.09, 0.1, 0.42],
  },
  {
    id: 'longbow',
    name: 'Longbow',
    magSize: 10,
    reserve: 30,
    fireGap: 0.85,
    reloadTime: 2.6,
    damage: 105,
    falloffStart: 80,
    falloffMin: 90,
    spreadStill: 0.0001,
    spreadMoving: 0.08,
    recoilPitch: 0.07,
    audioName: 'sniper',
    size: [0.07, 0.08, 0.55],
  },
];

export function createWeaponSystem(camera, store) {
  const gripMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.hairline), roughness: 0.7, metalness: 0.2, depthTest: false });
  const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.ink), roughness: 0.5, metalness: 0.35, depthTest: false });

  const modelGroup = new THREE.Group();
  camera.add(modelGroup);

  let currentWeaponMesh = null;

  function buildViewModel(wData) {
    if (currentWeaponMesh) modelGroup.remove(currentWeaponMesh);
    const model = new THREE.Group();
    const [w, h, d] = wData.size;
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
    receiver.renderOrder = 999;
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(w * 0.5, h * 0.5, d * 0.8), gripMat);
    barrel.position.set(0, h * 0.25, -d * 0.8);
    barrel.renderOrder = 999;
    model.add(receiver, barrel);
    model.position.set(0.28, -0.24, -0.5);
    model.rotation.set(0.04, -0.08, 0.05);
    model.renderOrder = 999;
    modelGroup.add(model);
    currentWeaponMesh = model;
  }

  const flash = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, 0.28),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.accent), transparent: true, opacity: 0.95, depthWrite: false, depthTest: false, side: THREE.DoubleSide }),
  );
  flash.position.set(0.28, -0.22, -1.0);
  flash.renderOrder = 1000;
  flash.visible = false;
  camera.add(flash);

  const flashLight = new THREE.PointLight(new THREE.Color(PALETTE.accent), 0, 8);
  flashLight.position.set(0.28, -0.22, -0.7);
  camera.add(flashLight);

  // States per weapon
  const states = WEAPON_DATA.map(w => ({
    mag: w.magSize,
    reserve: w.reserve,
    cooldown: 0,
    reloadLeft: 0,
  }));

  let activeIndex = 0;
  buildViewModel(WEAPON_DATA[activeIndex]);

  const state = {
    flash: 0,
    kick: 0,
  };

  function step(dt) {
    const cur = states[activeIndex];
    cur.cooldown = Math.max(0, cur.cooldown - dt);
    cur.reloadLeft = Math.max(0, cur.reloadLeft - dt);
    state.flash = Math.max(0, state.flash - dt);
    state.kick += (0 - state.kick) * Math.min(1, dt * 14);

    if (currentWeaponMesh) {
      currentWeaponMesh.position.z = -0.5 + state.kick;
      currentWeaponMesh.rotation.x = 0.04 + state.kick * 2.2;
      if (cur.reloadLeft > 0) {
        const wData = WEAPON_DATA[activeIndex];
        currentWeaponMesh.rotation.x = 0.04 - 0.55 * Math.min(1, (wData.reloadTime - cur.reloadLeft) * 2);
      }
    }

    flash.visible = state.flash > 0;
    flash.rotation.z = state.flash * 30;
    flashLight.intensity = state.flash > 0 ? 25 : 0;

    if (cur.reloadLeft > 0 && cur.reloadLeft <= dt) {
      const wData = WEAPON_DATA[activeIndex];
      const need = wData.magSize - cur.mag;
      const take = Math.min(need, cur.reserve);
      cur.mag += take;
      cur.reserve -= take;
    }
  }

  return {
    WEAPON_DATA,
    getState() {
      return states[activeIndex];
    },
    getActiveWeapon() {
      return WEAPON_DATA[activeIndex];
    },
    step,
    ready() {
      const cur = states[activeIndex];
      return cur.mag > 0 && cur.cooldown === 0 && cur.reloadLeft === 0;
    },
    pullTrigger() {
      const cur = states[activeIndex];
      const wData = WEAPON_DATA[activeIndex];
      cur.cooldown = wData.fireGap;
      state.flash = 0.06;
      state.kick = wData.recoilPitch * 1.5;
      audio.playGunshot(wData.audioName);
    },
    takeRound() {
      const cur = states[activeIndex];
      if (cur.mag <= 0) return false;
      cur.mag -= 1;
      return true;
    },
    reload() {
      const cur = states[activeIndex];
      const wData = WEAPON_DATA[activeIndex];
      if (cur.reloadLeft > 0 || cur.mag === wData.magSize || cur.reserve === 0) return;
      cur.reloadLeft = wData.reloadTime;
      audio.playReload();
    },
    switchWeapon(index) {
      if (index < 0 || index >= WEAPON_DATA.length) return;
      // Check if owned (pistol, vesper, kestrel, longbow)
      const wId = WEAPON_DATA[index].id;
      if (wId !== 'pistol' && !store.inventory.includes(wId)) return;
      activeIndex = index;
      store.activeWeaponIndex = index;
      buildViewModel(WEAPON_DATA[activeIndex]);
    },
    spread(speed, crouching) {
      const wData = WEAPON_DATA[activeIndex];
      const moveFactor = Math.min(1, speed / 5.2);
      const crouchMult = crouching ? 0.6 : 1.0;
      return (wData.spreadStill + moveFactor * wData.spreadMoving) * crouchMult;
    },
    refill() {
      for (let i = 0; i < WEAPON_DATA.length; i++) {
        states[i].mag = WEAPON_DATA[i].magSize;
        states[i].reserve = WEAPON_DATA[i].reserve;
        states[i].cooldown = 0;
        states[i].reloadLeft = 0;
      }
    }
  };
}
