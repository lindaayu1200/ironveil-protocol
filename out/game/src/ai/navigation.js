// Waypoint navigation graph over Silo District lanes for bots.
import * as THREE from 'three';

export function createNavigation() {
  // Define waypoints and connections across lanes, mid, and bomb sites A & B
  const waypoints = [
    { id: 0, pos: new THREE.Vector3(0, 0, 18), neighbors: [1, 2, 3], type: 'spawn_attack' }, // 0: Attacker spawn center
    { id: 1, pos: new THREE.Vector3(-6, 0, 14), neighbors: [0, 4, 7], type: 'lane_left' },
    { id: 2, pos: new THREE.Vector3(0, 0, 12), neighbors: [0, 5, 8], type: 'lane_mid' },
    { id: 3, pos: new THREE.Vector3(6, 0, 14), neighbors: [0, 6, 9], type: 'lane_right' },
    { id: 4, pos: new THREE.Vector3(-12, 0, 6), neighbors: [1, 7, 10], type: 'lane_left' },
    { id: 5, pos: new THREE.Vector3(0, 0, 2), neighbors: [2, 8, 11], type: 'lane_mid' },
    { id: 6, pos: new THREE.Vector3(12, 0, 6), neighbors: [3, 9, 12], type: 'lane_right' },
    { id: 7, pos: new THREE.Vector3(-12, 0, -4), neighbors: [4, 10, 13], type: 'site_a_approach' },
    { id: 8, pos: new THREE.Vector3(0, 0, -6), neighbors: [5, 11, 14], type: 'mid_platform' },
    { id: 9, pos: new THREE.Vector3(12, 0, -4), neighbors: [6, 12, 15], type: 'site_b_approach' },
    { id: 10, pos: new THREE.Vector3(-13, 0, -14), neighbors: [7, 13, 16], type: 'site_a' }, // Bomb Site A
    { id: 11, pos: new THREE.Vector3(0, 0, -14), neighbors: [8, 14, 16], type: 'mid_back' },
    { id: 12, pos: new THREE.Vector3(13, 0, -14), neighbors: [9, 15, 17], type: 'site_b' }, // Bomb Site B
    { id: 13, pos: new THREE.Vector3(-14, 0, -20), neighbors: [10, 16], type: 'spawn_defense_a' },
    { id: 14, pos: new THREE.Vector3(0, 0, -20), neighbors: [11, 16, 17], type: 'spawn_defense_mid' },
    { id: 15, pos: new THREE.Vector3(14, 0, -20), neighbors: [12, 17], type: 'spawn_defense_b' },
    { id: 16, pos: new THREE.Vector3(-7, 0, -24), neighbors: [10, 11, 13], type: 'defense_backline_a' },
    { id: 17, pos: new THREE.Vector3(7, 0, -24), neighbors: [12, 11, 15], type: 'defense_backline_b' },
  ];

  function getNearestWaypoint(pos) {
    let nearest = waypoints[0];
    let minDist = Infinity;
    for (const wp of waypoints) {
      const d = wp.pos.distanceToSquared(pos);
      if (d < minDist) {
        minDist = d;
        nearest = wp;
      }
    }
    return nearest;
  }

  function findPath(startPos, targetPos) {
    const startWp = getNearestWaypoint(startPos);
    const targetWp = getNearestWaypoint(targetPos);
    if (startWp.id === targetWp.id) return [targetWp.pos];

    // Simple BFS shortest path over waypoint graph
    const queue = [[startWp.id]];
    const visited = new Set([startWp.id]);

    while (queue.length > 0) {
      const path = queue.shift();
      const currId = path[path.length - 1];

      if (currId === targetWp.id) {
        return path.map(id => waypoints[id].pos);
      }

      const currWp = waypoints[currId];
      for (const nId of currWp.neighbors) {
        if (!visited.has(nId)) {
          visited.add(nId);
          queue.push([...path, nId]);
        }
      }
    }

    return [targetWp.pos];
  }

  return {
    waypoints,
    getNearestWaypoint,
    findPath,
  };
}
