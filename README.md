# Ironveil Protocol

A round-based tactical FPS built with three.js — single-player vs bots. Two teams, short rounds
won by eliminating the enemy squad or planting the charge, an economy to buy weapons and gear
between rounds, and gunplay where stopping to aim beats running and gunning.

Original map, names, art and sounds — inspired by the classic round-based tactical shooter genre,
never a copy of any commercial game.

Built for the [make.fun threejs-fps-02 bounty](https://make.fun/c/threejs-fps-02).

![threejs-fps-02](https://make.fun/badge/threejs-fps-02.svg)
![rank](https://make.fun/badge/threejs-fps-02/lindaayu1200/ironveil-protocol/rank.svg)
![reward](https://make.fun/badge/threejs-fps-02/lindaayu1200/ironveil-protocol/reward.svg)

## Play

Serve `game/` with any static server (or `node serve.ts`) and open
http://localhost:8080 in desktop Chrome. No build step, no network requests.

## Build the entry

`MAKEFUN_OUTPUT_DIR=out node main.ts` copies `game/` and `screenshots/` and writes the dossier.
