// Economy system: money rewards, shop purchases (weapons, armor, grenades, ammo).

export const PRICES = {
  vesper: 1200,
  kestrel: 2700,
  longbow: 4600,
  grenade: 300,
  armor: 1000,
  ammo: 400,
};

export function createEconomy(store, weaponSystem) {
  function buy(itemKey) {
    const price = PRICES[itemKey];
    if (price === undefined || store.money < price) return false;

    if (itemKey === 'armor') {
      if (store.armor) return false;
      store.money -= price;
      store.armor = true;
      return true;
    }

    if (itemKey === 'grenade') {
      if (store.grenades >= 2) return false;
      store.money -= price;
      store.grenades++;
      return true;
    }

    if (itemKey === 'ammo') {
      store.money -= price;
      weaponSystem.refill();
      return true;
    }

    if (['vesper', 'kestrel', 'longbow'].includes(itemKey)) {
      if (store.inventory.includes(itemKey)) return false;
      store.money -= price;
      store.inventory.push(itemKey);
      return true;
    }

    return false;
  }

  return {
    buy,
  };
}
