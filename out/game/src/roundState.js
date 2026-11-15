// Round state & bomb objective management.
import { audio } from './audio.js';

export function createRoundState(store, world, bots, player, weaponSystem) {
  function startNewRound(winner) {
    if (winner === 'attack') store.scoreAttack++;
    else if (winner === 'defense') store.scoreDefense++;

    if (store.scoreAttack >= store.targetScore || store.scoreDefense >= store.targetScore) {
      store.showBanner(store.scoreAttack >= store.targetScore ? 'VANTAGE WINS MATCH!' : 'CRIMSON CARTEL WINS MATCH!', 'Final Score', 999);
      store.roundState = 'ended';
      return;
    }

    const winText = winner === 'attack' ? 'ROUND WON - VANTAGE' : 'ROUND LOST - CARTEL';
    store.showBanner(winText, `Score: ${store.scoreAttack} - ${store.scoreDefense}`);
    audio.playSting();

    // Reward money
    if (winner === 'attack') store.addMoney(3000);
    else store.addMoney(1400);

    store.resetRound();
    bots.resetBots();
    player.position.set(0, 0, 20);
    weaponSystem.refill();
  }

  function step(dt, playerPos, playerAlive) {
    if (store.roundState === 'ended') return;

    if (store.roundState === 'freeze') {
      store.freezeTime -= dt;
      if (store.freezeTime <= 0) {
        store.roundState = 'playing';
      }
      return;
    }

    if (store.roundState === 'playing') {
      store.roundTime -= dt;
      if (store.roundTime <= 0) {
        // Defenders win on timeout
        startNewRound('defense');
        return;
      }

      // Check team eliminations
      const attackAlive = (playerAlive ? 1 : 0) + bots.bots.filter(b => b.team === 'attack' && b.alive).length;
      const defenseAlive = bots.bots.filter(b => b.team === 'defense' && b.alive).length;
      store.teams.attack.alive = attackAlive;
      store.teams.defense.alive = defenseAlive;

      if (defenseAlive === 0) {
        startNewRound('attack');
        return;
      }
      if (attackAlive === 0) {
        startNewRound('defense');
        return;
      }

      // Check bomb plant timer if planted
      if (store.bomb.planted) {
        store.bomb.timer -= dt;
        if (store.bomb.timer <= 0) {
          // Attackers win via bomb explosion
          startNewRound('attack');
          return;
        }
      }
    }
  }

  return {
    startNewRound,
    step,
  };
}
