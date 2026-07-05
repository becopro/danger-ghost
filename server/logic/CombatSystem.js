const BASE_XP = 100;
const XP_EXPONENT = 1.6;

function calculateXpRequired(lvl) {
    return Math.floor(BASE_XP * Math.pow(lvl, XP_EXPONENT));
}

class CombatSystem {
    constructor() {
        this.players = new Map(); // socket.id -> playerState
    }

    initPlayer(playerId, state = null) {
        if (!state) {
            state = {
                level: 1, xp: 0, xpRequired: calculateXpRequired(1), pointsToDistribute: 0,
                vit: 1, agi: 1, int: 1, pow: 1, mag: 1, score: 0, hp: 0, maxHp: 0, mana: 0, maxMana: 0,
                equippedSkills: [0, 1, 2, 3], equippedRunes: [0, 0, 0, 0], equippedPassives: [-1, -1],
                weapon: { name: 'Starter Dirk', damage: 10 },
                inventory: [],
                equipment: { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null }
            };
        }
        this.recalculateStats(state);
        state.hp = state.maxHp;
        state.mana = state.maxMana;
        this.players.set(playerId, state);
        return state;
    }

    recalculateStats(state) {
        let bonuses = { vit: 0, agi: 0, int: 0, pow: 0, mag: 0 };
        if (state.equipment) {
            const slots = ['head', 'chest', 'mainhand', 'offhand', 'ring1', 'ring2', 'amulet'];
            slots.forEach(s => {
                const item = state.equipment[s];
                if (item && item.attributes) {
                    for (let attr in item.attributes) {
                        const attrLower = attr.toLowerCase();
                        if (bonuses.hasOwnProperty(attrLower)) {
                            bonuses[attrLower] += (item.attributes[attr] || 0);
                        }
                    }
                }
            });
        }
        const totalVit = state.vit + bonuses.vit;
        const totalMag = state.mag + bonuses.mag;
        const helmetBonus = (state.equipment && state.equipment.head) ? 1 : 0;
        
        state.maxHp = 4 + totalVit + helmetBonus;
        state.maxMana = 100 + (totalMag * 20);
    }

    addXp(playerId, amount) {
        const state = this.players.get(playerId);
        if (!state) return false;
        
        const maxLevel = 100000000000;
        if (state.level >= maxLevel) return false;
        
        state.xp += amount;
        let leveledUp = false;
        
        while (state.xp >= state.xpRequired && state.level < maxLevel) {
            state.xp -= state.xpRequired;
            state.level++;
            state.pointsToDistribute += 5;
            state.xpRequired = calculateXpRequired(state.level);
            this.addScore(playerId, state.level * 200); // Level up effect gives score
            leveledUp = true;
        }
        return { leveledUp, state };
    }

    addScore(playerId, points) {
        const state = this.players.get(playerId);
        if (!state) return;
        state.score += points;
    }

    deductScore(playerId, points) {
        const state = this.players.get(playerId);
        if (!state) return false;
        if (state.score >= points) {
            state.score -= points;
            return true;
        }
        return false;
    }

    // Server-side damage resolution
    takeDamage(playerId, amount) {
        const state = this.players.get(playerId);
        if (!state) return false;
        
        state.hp -= amount;
        if (state.hp <= 0) {
            state.hp = 0;
            // Player died logic
            return { dead: true, state };
        }
        return { dead: false, state };
    }

    consumeMana(playerId, amount) {
        const state = this.players.get(playerId);
        if (!state) return false;
        
        if (state.mana >= amount) {
            state.mana -= amount;
            return true;
        }
        return false;
    }

    bossCollision(bossRect, playerRect) {
        // Simple AABB collision
        return (
            playerRect.x < bossRect.x + bossRect.width &&
            playerRect.x + playerRect.width > bossRect.x &&
            playerRect.y < bossRect.y + bossRect.height &&
            playerRect.y + playerRect.height > bossRect.y
        );
    }

    bossHitByProjectile(bossRect, projRect) {
        return this.bossCollision(bossRect, projRect);
    }

    processCombatIntents(intents, entities) {
        // Process combat actions ordered by timestamp within the tick
        intents.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        
        const results = [];
        for (const intent of intents) {
            if (intent.type === 'attack_boss') {
                const boss = entities.find(e => e.id === intent.bossId);
                if (boss && boss.hp > 0) {
                    if (this.consumeMana(intent.playerId, intent.manaCost || 10)) {
                        boss.hp -= intent.damage || 1;
                        results.push({ intent, success: true, bossHp: boss.hp });
                        if (boss.hp <= 0) {
                            boss.hp = 0;
                            results.push({ type: 'boss_dead', bossId: boss.id, killerId: intent.playerId });
                        }
                    } else {
                        results.push({ intent, success: false, reason: 'no_mana' });
                    }
                }
            }
        }
        return results;
    }
}

module.exports = new CombatSystem();
