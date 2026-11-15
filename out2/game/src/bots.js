// Bot management for Vantage (friendly) and Crimson Cartel (enemy) teams.
import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { createNavigation } from './ai/navigation.js';
import { audio } from './audio.js';

export function createBots(scene, colliders) {
  const nav = createNavigation();
  const bots = [];

  // Create visual meshes for bots
  const bodyMatAttack = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.teal), emissive: new THREE.Color(PALETTE.teal), emissiveIntensity: 0.35, roughness: 0.5, flatShading: true }); // Vantage (teal)
  const bodyMatDefense = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.oxide), emissive: new THREE.Color(PALETTE.oxide), emissiveIntensity: 0.35, roughness: 0.5, flatShading: true }); // Crimson Cartel (oxide red)
  const headMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.ink), emissive: new THREE.Color(PALETTE.ink), emissiveIntensity: 0.2, roughness: 0.4, flatShading: true });

  const bodyGeo = new THREE.BoxGeometry(0.5, 0.9, 0.3);
  const headGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);

  // Sound event dispatch for rotation
  let soundEvents = [];

  function emitSound(pos, radius = 25) {
    soundEvents.push({ pos: pos.clone(), radius, time: performance.now() });
  }

  // Spawn configuration: 4 friendlies + player at attack spawn; 5 enemies at defense spawn
  const spawnConfigs = [
    // Attackers (Vantage / player team) - index 0 is player (handled separately), 1-4 are bots
    { team: 'attack', name: 'Vex-1', pos: new THREE.Vector3(-3, 0, 18) },
    { team: 'attack', name: 'Vex-2', pos: new THREE.Vector3(3, 0, 18) },
    { team: 'attack', name: 'Vex-3', pos: new THREE.Vector3(-5, 0, 20) },
    { team: 'attack', name: 'Vex-4', pos: new THREE.Vector3(5, 0, 20) },
    // Defenders (Crimson Cartel) - 5 bots
    { team: 'defense', name: 'Cartel-1', pos: new THREE.Vector3(-10, 0, -18) },
    { team: 'defense', name: 'Cartel-2', pos: new THREE.Vector3(-4, 0, -18) },
    { team: 'defense', name: 'Cartel-3', pos: new THREE.Vector3(0, 0, -20) },
    { team: 'defense', name: 'Cartel-4', pos: new THREE.Vector3(4, 0, -18) },
    { team: 'defense', name: 'Cartel-5', pos: new THREE.Vector3(10, 0, -18) },
  ];

  for (let i = 0; i < spawnConfigs.length; i++) {
    const cfg = spawnConfigs[i];
    const group = new THREE.Group();
    group.position.copy(cfg.pos);

    const isAttack = cfg.team === 'attack';
    const torsoMesh = new THREE.Mesh(bodyGeo, isAttack ? bodyMatAttack : bodyMatDefense);
    torsoMesh.position.y = 0.65;
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;

    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 1.35;
    headMesh.castShadow = true;

    group.add(torsoMesh, headMesh);
    scene.add(group);

    const bot = {
      id: i,
      name: cfg.name,
      team: cfg.team,
      group,
      torsoMesh,
      headMesh,
      position: group.position,
      velocity: new THREE.Vector3(),
      health: 100,
      maxHealth: 100,
      alive: true,
      fall: 0,
      path: [],
      pathIndex: 0,
      state: 'roam', // 'roam', 'combat', 'plant', 'defuse', 'cover'
      targetEnemy: null,
      aimTimer: 0,
      burstTimer: 0,
      ammo: 30,
      homePos: cfg.pos.clone(),
      objectiveTarget: isAttack ? new THREE.Vector3(-13, 0, -14) : new THREE.Vector3(0, 0, 15), // Attackers go to Site A, Defenders hold mid/site
    };

    torsoMesh.userData.bot = bot;
    headMesh.userData.bot = bot;
    bots.push(bot);
  }

  const raycaster = new THREE.Raycaster();

  function resetBots() {
    for (const b of bots) {
      b.alive = true;
      b.health = 100;
      b.fall = 0;
      b.group.position.copy(b.homePos);
      b.group.rotation.set(0, 0, 0);
      b.state = 'roam';
      b.path = [];
      b.ammo = 30;
    }
  }

  function step(dt, time, playerPos, playerAlive, store) {
    // Clean old sound events
    const now = performance.now();
    soundEvents = soundEvents.filter(se => now - se.time < 2000);

    for (const b of bots) {
      if (!b.alive) {
        if (b.fall < 1) {
          b.fall = Math.min(1, b.fall + dt * 2.5);
          b.group.rotation.x = -b.fall * 1.5;
          b.group.position.y = -b.fall * 0.1;
        }
        continue;
      }

      // Check sound events for rotation
      for (const se of soundEvents) {
        if (b.position.distanceToSquared(se.pos) < se.radius * se.radius && b.team !== se.team) {
          if (b.state === 'roam') {
            b.state = 'combat';
          }
        }
      }

      // Determine enemies
      // Attackers target defense bots; Defenders target player + attack bots
      const enemies = bots.filter(other => other.team !== b.team && other.alive);
      if (b.team === 'defense' && playerAlive) {
        // Can target player as well
      }

      // Find closest visible enemy
      let closestEnemy = null;
      let minDist = 22; // max vision range

      if (b.team === 'defense' && playerAlive) {
        const d = b.position.distanceTo(playerPos);
        if (d < minDist) {
          minDist = d;
          closestEnemy = { pos: playerPos, isPlayer: true };
        }
      }

      for (const e of enemies) {
        const d = b.position.distanceTo(e.position);
        if (d < minDist) {
          minDist = d;
          closestEnemy = { pos: e.position, isPlayer: false, bot: e };
        }
      }

      if (closestEnemy) {
        b.state = 'combat';
        b.targetEnemy = closestEnemy;

        // Face enemy
        const dx = closestEnemy.pos.x - b.position.x;
        const dz = closestEnemy.pos.z - b.position.z;
        const targetYaw = Math.atan2(-dx, -dz);
        b.group.rotation.y = targetYaw;

        b.aimTimer += dt;
        if (b.aimTimer > 0.4) { // aim-delay
          b.burstTimer += dt;
          if (b.burstTimer > 0.18 && b.ammo > 0) {
            b.burstTimer = 0;
            b.ammo--;
            audio.playGunshot('rifle');
            // Deal damage occasionally if hitting player
            if (closestEnemy.isPlayer && Math.random() < 0.35) {
              // Trigger player damage in main.js
              store.playerDamaged = (store.playerDamaged || 0) + 24;
            } else if (!closestEnemy.isPlayer && closestEnemy.bot && Math.random() < 0.4) {
              closestEnemy.bot.health -= 25;
              if (closestEnemy.bot.health <= 0) {
                closestEnemy.bot.alive = false;
                store.addॉलKillFeed(`${b.name} [Kestrel-7] ${closestEnemy.bot.name}`);
              }
            }
          }
        }
      } else {
        b.aimTimer = 0;
        // Navigation / objective behavior
        if (b.path.length === 0 || b.pathIndex >= b.path.length) {
          const dest = b.team === 'attack' && store.bomb.planted ? new THREE.Vector3(0,0,0) : b.objectiveTarget;
          b.path = nav.findPath(b.position, dest);
          b.pathIndex = 0;
        }

        if (b.path.length > 0 && b.pathIndex < b.path.length) {
          const targetWp = b.path[b.pathIndex];
          const dir = new THREE.Vector3().subVectors(targetWp, b.position);
          dir.y = 0;
          const dist = dir.length();
          if (dist < 0.8) {
            b.pathIndex++;
          } else {
            dir.normalize();
            b.position.addScaledVector(dir, 3.2 * dt);
            b.group.rotation.y = Math.atan2(-dir.x, -dir.z);
          }
        }
      }
    }
  }

  function damageBot(mesh, amount) {
    const b = mesh.userData.bot;
    if (!b || !b.alive) return false;
    b.health -= amount;
    if (b.health <= 0) {
      b.alive = false;
      b.fall = 0;
      audio.playHitmarker(true);
      return true;
    }
    audio.playHitmarker(false);
    return false;
  }

  return {
    bots,
    resetBots,
    step,
    damageBot,
    emitSound,
    hitMeshes: bots.map(b => [b.torsoMesh, b.headMesh]).flat(),
  };
}
