// Silo District map: mid lane, two side lanes, Site A (Silo), Site B (Depot), elevated platform, ramp, cover boxes.
import * as THREE from 'three';
import { PALETTE } from './palette.js';

export function createWorld(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const materials = {};
  for (const name of Object.keys(PALETTE)) {
    materials[name] = new THREE.MeshStandardMaterial({
      color: new THREE.Color(PALETTE[name]),
      roughness: name === 'accent' || name === 'oxide' ? 0.45 : 0.88,
      metalness: 0.05,
      flatShading: true,
    });
  }

  const colliders = [];
  const shootables = [];
  const bombSites = {
    A: new THREE.Box3(),
    B: new THREE.Box3(),
  };

  function box(width, height, depth, x, y, z, materialName = 'surface', isBombSite = null, siteKey = null) {
    const geom = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geom, materials[materialName] || materials.surface);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    
    const b3 = new THREE.Box3().setFromObject(mesh);
    colliders.push(b3);
    if (!isBombSite) {
      shootables.push(mesh);
    } else if (siteKey) {
      bombSites[siteKey].copy(b3);
      // Expand vertical range for bomb planting trigger
      bombSites[siteKey].min.y -= 1;
      bombSites[siteKey].max.y += 2;
    }
    return mesh;
  }

  // Ground plane (36m x 48m)
  box(36, 0.4, 48, 0, -0.2, 0, 'sand');

  // Outer boundary walls with doorways / openings
  // Back wall (Defense spawn area, Z: -22)
  box(14, 4.6, 0.4, -11, 2.3, -24, 'surface');
  box(14, 4.6, 0.4, 11, 2.3, -24, 'surface');
  box(8, 2.0, 0.4, 0, 3.6, -24, 'surface'); // top lintel for mid doorway

  // Front wall (Attack spawn area, Z: +22)
  box(12, 4.6, 0.4, -12, 2.3, 24, 'surface');
  box(12, 4.6, 0.4, 12, 2.3, 24, 'surface');
  box(12, 2.0, 0.4, 0, 3.6, 24, 'surface');

  // Left wall
  box(0.4, 4.6, 48, -18, 2.3, 0, 'surface');
  // Right wall
  box(0.4, 4.6, 48, 18, 2.3, 0, 'surface');

  // Interior dividing walls / lanes
  // Left side lane / Site A wall divider
  box(0.4, 4.6, 16, -9, 2.3, -6, 'hairline');
  box(0.4, 4.6, 14, -9, 2.3, 10, 'hairline');

  // Right side lane / Site B wall divider
  box(0.4, 4.6, 16, 9, 2.3, -6, 'hairline');
  box(0.4, 4.6, 14, 9, 2.3, 10, 'hairline');

  // Mid lane cross-walls and cover
  box(8, 3.2, 0.6, 0, 1.6, -2, 'hairline');
  box(6, 2.6, 0.6, 0, 1.3, 6, 'hairline');

  // Site A: "Silo" (top-left area around X: -13, Z: -14)
  // Bomb site A trigger zone (flat zone on floor)
  box(5, 0.05, 5, -13, 0.02, -14, 'accent', true, 'A');
  // Silo structures (oxide red and sand pillars/tanks)
  box(3.2, 3.6, 3.2, -13, 1.8, -14, 'oxide');
  box(1.6, 2.0, 1.6, -10, 1.0, -12, 'sand');
  box(1.2, 1.4, 1.2, -15, 0.7, -10, 'hairline');

  // Site B: "Depot" (top-right area around X: +13, Z: -14)
  box(5, 0.05, 5, 13, 0.02, -14, 'teal', true, 'B');
  box(3.6, 2.4, 2.2, 13, 1.2, -14, 'teal');
  box(1.8, 1.2, 2.4, 10, 0.6, -12, 'sand');
  box(1.4, 1.6, 1.4, 15, 0.8, -10, 'hairline');

  // Elevated platform with ramp (Mid-back area)
  box(7, 1.8, 4, 0, 0.9, -12, 'surface');
  // Ramp leading up to platform
  const rampGroup = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const stepMesh = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.2 + i * 0.2, 0.6),
      materials.hairline
    );
    stepMesh.position.set(0, (i * 0.25) / 2, -8 - i * 0.5);
    rampGroup.add(stepMesh);
    colliders.push(new THREE.Box3().setFromObject(stepMesh));
  }
  group.add(rampGroup);

  // Additional cover boxes / crates across lanes
  box(1.6, 1.1, 1.6, -4, 0.55, 1, 'sand');
  box(1.6, 1.1, 1.6, 4, 0.55, 1, 'sand');
  box(2.2, 0.9, 1.2, -4, 0.45, 14, 'hairline');
  box(2.2, 0.9, 1.2, 4, 0.45, 14, 'hairline');
  box(1.2, 1.4, 1.2, 0, 0.7, 16, 'hairline');

  // Lighting & Atmosphere
  scene.background = new THREE.Color('#1d2735');
  scene.fog = new THREE.FogExp2(new THREE.Color('#1d2735'), 0.022);

  const ambient = new THREE.HemisphereLight(new THREE.Color(PALETTE.ink), new THREE.Color(PALETTE.surface), 2.4);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(new THREE.Color(PALETTE.sand), 3.5);
  sun.position.set(14, 20, 12);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  sun.shadow.camera.far = 64;
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);

  const fill = new THREE.DirectionalLight(new THREE.Color(PALETTE.teal), 1.0);
  fill.position.set(-14, 12, -10);
  scene.add(fill);

  return { colliders, shootables, group, bombSites };
}
