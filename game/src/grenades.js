// Frag grenade system: arc physics, bounce, 2.5s fuse, radial damage, screen shake.
import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { audio } from './audio.js';

export function createGrenades(scene, colliders, store) {
  const geom = new THREE.SphereGeometry(0.12, 12, 8);
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(PALETTE.hairline), roughness: 0.4, metalness: 0.8 });

  const activeGrenades = [];

  function throwGrenade(pos, direction) {
    if (store.grenades <= 0) return;
    store.grenades--;

    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(pos);
    scene.add(mesh);

    const velocity = direction.clone().multiplyScalar(14).add(new THREE.Vector3(0, 5, 0));
    activeGrenades.push({
      mesh,
      position: mesh.position,
      velocity,
      fuse: 2.5,
    });
  }

  function step(dt, playerPos, bots, damagePlayerCallback) {
    for (let i = activeGrenades.length - 1; i >= 0; i--) {
      const g = activeGrenades[i];
      g.fuse -= dt;
      g.velocity.y -= 15 * dt; // gravity
      g.position.addScaledVector(g.velocity, dt);

      // Floor / wall collision bounce
      if (g.position.y < 0.12) {
        g.position.y = 0.12;
        g.velocity.y = -g.velocity.y * 0.4;
        g.velocity.x *= 0.7;
        g.velocity.z *= 0.7;
      }

      if (g.fuse <= 0) {
        // Explode
        scene.remove(g.mesh);
        activeGrenades.splice(i, 1);
        audio.playExplosion();

        // Radial damage check against player & bots
        const expPos = g.position.clone();
        if (playerPos.distanceTo(expPos) < 10) {
          const dmg = Math.max(10, Math.floor(90 * (1 - playerPos.distanceTo(expPos) / 10)));
          damagePlayerCallback(dmg);
        }

        for (const b of bots) {
          if (b.alive && b.position.distanceTo(expPos) < 10) {
            const dmg = Math.max(20, Math.floor(100 * (1 - b.position.distanceTo(expPos) / 10)));
            b.health -= dmg;
            if (b.health <= 0) {
              b.alive = false;
              store.addॉलKillFeed(`Grenade explosion killed ${b.name}`);
            }
          }
        }
      }
    }
  }

  return {
    throwGrenade,
    step,
  };
}
