// Boot and main loop: fixed 60Hz simulation feeding render, connecting all Ironveil Protocol systems.
import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { store } from './store.js';
import { audio } from './audio.js';
import { createWorld } from './world.js';
import { createInput } from './input.js';
import { createPlayer } from './player.js';
import { createWeaponSystem } from './weapons.js';
import { createGrenades } from './grenades.js';
import { createBots } from './bots.js';
import { createEconomy } from './economy.js';
import { createRoundState } from './roundState.js';
import { createMinimap } from './minimap.js';
import { createHud } from './hud.js';

const FIXED_STEP = 1 / 60;
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.05, 140);
scene.add(camera);

const world = createWorld(scene);
const player = createPlayer(world.colliders);
const weaponSystem = createWeaponSystem(camera, store);
const economy = createEconomy(store, weaponSystem);
const bots = createBots(scene, world.colliders);
const grenades = createGrenades(scene, world.colliders, store);
const roundState = createRoundState(store, world, bots, player.state, weaponSystem);
const minimap = createMinimap();
const hud = createHud(store, (itemKey) => {
  economy.buy(itemKey);
});

const input = createInput(renderer.domElement, onLockChange);
const raycaster = new THREE.Raycaster();
raycaster.far = 100;
const direction = new THREE.Vector3();
const activeTracers = [];

function createTracer(from, to) {
  const geom = new THREE.BufferGeometry().setFromPoints([from, to]);
  const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(PALETTE.accent), transparent: true, opacity: 0.95, depthWrite: false });
  const line = new THREE.Line(geom, mat);
  scene.add(line);
  activeTracers.push({ line, ttl: 0.08 });
}

const body = player.state;
let elapsed = 0;
let accumulator = 0;
let lastTime = performance.now();
let buyMenuOpen = false;
let plantHoldTime = 0;
let defuseHoldTime = 0;

hud.onPlay(() => {
  audio.init();
  input.requestLock();
});

function onLockChange(locked) {
  if (locked) {
    hud.hideOverlay();
    hud.showBuyMenu(false);
    buyMenuOpen = false;
  } else if (store.roundState !== 'ended') {
    if (!buyMenuOpen) hud.showOverlay('paused', 0);
  }
}

function syncCamera() {
  camera.position.set(body.position.x, body.position.y + body.eye, body.position.z);
  camera.rotation.set(body.pitch, body.yaw, 0, 'YXZ');
}

function shoot() {
  if (!weaponSystem.ready()) return;
  const wData = weaponSystem.getActiveWeapon();
  if (!weaponSystem.takeRound()) return;

  const spread = weaponSystem.spread(player.groundSpeed(), body.crouching);
  camera.getWorldDirection(direction);
  direction.x += (Math.random() * 2 - 1) * spread;
  direction.y += (Math.random() * 2 - 1) * spread;
  direction.z += (Math.random() * 2 - 1) * spread;
  direction.normalize();

  scene.updateMatrixWorld(true);
  raycaster.set(camera.position, direction);
  const shootables = world.shootables.concat(bots.hitMeshes);
  const hit = raycaster.intersectObjects(shootables, false)[0];

  if (hit) {
    const obj = hit.object;
    if (obj.userData.bot) {
      const isHead = obj === obj.userData.bot.headMesh;
      const dmg = isHead ? wData.damage * 3 : wData.damage;
      const killed = bots.damageBot(obj, dmg);
      hud.hitMarker(killed, 90);
      if (killed) {
        store.addMoney(300);
        store.addॉलKillFeed(`YOU [${wData.name}] ${obj.userData.bot.name}`);
      }
    }
  }

  const muzzlePos = camera.position.clone().add(new THREE.Vector3(0.28, -0.24, -0.5).applyQuaternion(camera.quaternion));
  const hitPos = hit ? hit.point : camera.position.clone().addScaledVector(direction, 60);
  createTracer(muzzlePos, hitPos);

  weaponSystem.pullTrigger();
  player.recoil(wData.recoilPitch, (Math.random() * 2 - 1) * 0.005);
  bots.emitSound(body.position, 30);
  const curState = weaponSystem.getState();
  hud.setAmmo(curState.mag, curState.reserve);
}

function step(dt) {
  elapsed += dt;

  for (let i = activeTracers.length - 1; i >= 0; i--) {
    const tr = activeTracers[i];
    tr.ttl -= dt;
    tr.line.material.opacity = Math.max(0, tr.ttl / 0.08 * 0.95);
    if (tr.ttl <= 0) {
      scene.remove(tr.line);
      tr.line.geometry.dispose();
      tr.line.material.dispose();
      activeTracers.splice(i, 1);
    }
  }

  if (store.roundState !== 'freeze') {
    player.step(dt, input.state.keys);
  }
  weaponSystem.step(dt);
  grenades.step(dt, body.position, bots.bots, (dmg) => {
    body.hp -= store.armor ? dmg * 0.5 : dmg;
    if (body.hp <= 0 && body.alive) {
      body.alive = false;
      store.addॉलKillFeed('YOU were eliminated');
    }
  });
  bots.step(dt, elapsed, body.position, body.alive, store);
  roundState.step(dt, body.position, body.alive);

  // Handle player damage from store
  if (store.playerDamaged) {
    body.hp -= store.armor ? store.playerDamaged * 0.5 : store.playerDamaged;
    store.playerDamaged = 0;
    if (body.hp <= 0 && body.alive) {
      body.alive = false;
      store.addॉलKillFeed('YOU were eliminated');
    }
  }

  // Handle Plant / Defuse (E key)
  if (input.state.keys.has('KeyE') && store.roundState === 'playing' && !store.bomb.planted) {
    // Check distance to bomb sites A or B
    const nearA = body.position.distanceTo(new THREE.Vector3(-13, 0, -14)) < 3.5;
    const nearB = body.position.distanceTo(new THREE.Vector3(13, 0, -14)) < 3.5;
    if (nearA || nearB) {
      plantHoldTime += dt;
      store.bomb.plantProgress = plantHoldTime / 3.0;
      if (plantHoldTime >= 3.0) {
        store.bomb.planted = true;
        store.bomb.site = nearA ? 'A' : 'B';
        store.bomb.timer = 40.0;
        store.addॉलKillFeed(`Bomb planted at Site ${store.bomb.site}!`);
        audio.playBeep();
      }
    } else {
      plantHoldTime = 0;
      store.bomb.plantProgress = 0;
    }
  } else {
    plantHoldTime = 0;
    store.bomb.plantProgress = 0;
  }

  // Handle Buy Menu toggle (B key)
  if (input.state.keys.has('KeyB') && !buyMenuOpen) {
    buyMenuOpen = true;
    hud.showBuyMenu(true);
    if (document.pointerLockElement) document.exitPointerLock();
  }

  // Handle weapon switching (1, 2, 3, 4 keys)
  if (input.state.keys.has('Digit1')) weaponSystem.switchWeapon(0);
  if (input.state.keys.has('Digit2')) weaponSystem.switchWeapon(1);
  if (input.state.keys.has('Digit3')) weaponSystem.switchWeapon(2);
  if (input.state.keys.has('Digit4')) weaponSystem.switchWeapon(3);

  // Handle grenade throw (G key)
  if (input.state.keys.has('KeyG') && store.grenades > 0) {
    input.state.keys.delete('KeyG');
    camera.getWorldDirection(direction);
    grenades.throwGrenade(camera.position, direction);
  }

  hud.update(body.hp, store.armor, store.money, store.roundTime, store.scoreAttack, store.scoreDefense, store.killFeed);
  hud.showBanner(store.roundBanner.text, store.roundBanner.sub, store.roundBanner.active);
  if (store.roundBanner.active) {
    store.roundBanner.timer -= dt;
    if (store.roundBanner.timer <= 0) store.roundBanner.active = false;
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (input.state.locked) {
    const look = input.takeLook();
    player.look(look.x, look.y);
    if (input.state.firing && weaponSystem.ready()) shoot();
    if (input.state.keys.has('KeyR')) weaponSystem.reload();
  }

  accumulator += dt;
  let steps = 0;
  while (accumulator >= FIXED_STEP && steps < 5) {
    step(FIXED_STEP);
    accumulator -= FIXED_STEP;
    steps += 1;
  }
  if (accumulator > FIXED_STEP * 5) accumulator = 0;

  syncCamera();
  minimap.render(body.position, body.yaw, bots.bots, world.colliders);
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Scroll wheel weapon switching
window.addEventListener('wheel', (e) => {
  if (!input.state.locked) return;
  let idx = store.activeWeaponIndex + (e.deltaY > 0 ? 1 : -1);
  if (idx < 0) idx = 3;
  if (idx > 3) idx = 0;
  weaponSystem.switchWeapon(idx);
});

syncCamera();
const curState = weaponSystem.getState();
hud.setAmmo(curState.mag, curState.reserve);
requestAnimationFrame(frame);
