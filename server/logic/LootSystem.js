const crypto = require('crypto');

const LootSystem = {
    PREFIX_POOL: [
        { name: "Fiery", type: "Prefix", stat: "fireDamageBonus", minValue: 5, maxValue: 15 },
        { name: "Robust", type: "Prefix", stat: "defenseBonus", minValue: 10, maxValue: 30 },
        { name: "Glacial", type: "Prefix", stat: "coldDamageBonus", minValue: 4, maxValue: 12 },
        { name: "Gleaming", type: "Prefix", stat: "accuracyRating", minValue: 15, maxValue: 50 }
    ],

    SUFFIX_POOL: [
        { name: "of the Falcon", type: "Suffix", stat: "attackSpeedBonus", minValue: 5, maxValue: 15 },
        { name: "of the Serpent", type: "Suffix", stat: "manaRecoveryBonus", minValue: 3, maxValue: 10 },
        { name: "of the Vampire", type: "Suffix", stat: "lifeLeechPercent", minValue: 1, maxValue: 5 },
        { name: "of the Titan", type: "Suffix", stat: "vitalityBonus", minValue: 5, maxValue: 20 }
    ],

    generate: function(iLvl, slot, forceQuality) {
        var quality = forceQuality || this.determineQuality();
        var itemGuid = crypto.randomUUID();
        
        var baseName = this.getBaseNameBySlot(slot);
        var baseDamage = 0;
        var baseDefense = 0;
        var attributes = {};
        var scale = 1 + (iLvl * 0.05);

        var slotLower = (slot || "").toLowerCase();
        if (slotLower === 'mainhand') {
            baseDamage = Math.round(15 * scale * (0.9 + Math.random() * 0.2));
        } else if (slotLower !== 'ring1' && slotLower !== 'ring2' && slotLower !== 'ring' && slotLower !== 'amulet') {
            baseDefense = Math.round(10 * scale * (0.9 + Math.random() * 0.2));
        }

        var attrPool = ['vit', 'agi', 'int', 'pow', 'mag'];
        var numAttrs = 1;
        var attrRange = { min: 1, max: 3 };

        if (quality === 'Rare') {
            numAttrs = 2;
            attrRange = { min: 4, max: 8 };
        } else if (quality === 'Epic') {
            numAttrs = 3;
            attrRange = { min: 10, max: 20 };
        }

        var selectedAttrs = [];
        var poolCopy = attrPool.slice();
        for (var a = 0; a < numAttrs; a++) {
            if (poolCopy.length === 0) break;
            var randIdx = Math.floor(Math.random() * poolCopy.length);
            selectedAttrs.push(poolCopy.splice(randIdx, 1)[0]);
        }

        selectedAttrs.forEach(function(attr) {
            var val = Math.round((attrRange.min + Math.random() * (attrRange.max - attrRange.min)) * scale);
            attributes[attr] = val;
        });

        var finalName = baseName;
        if (slotLower === 'ring1' || slotLower === 'ring') {
            if (quality === 'Common') finalName = "Bronze Cold Ring";
            else if (quality === 'Rare') finalName = "Stellar Ice Enchanted Ring";
            else finalName = "Eternal Winter Alliance";
        } else if (slotLower === 'ring2') {
            if (quality === 'Common') finalName = "Rustic Wooden Ring";
            else if (quality === 'Rare') finalName = "Runic Wood Rooted Ring";
            else finalName = "Forest Awakening Seal";
        } else {
            var prefixes = [];
            var suffixes = [];
            if (quality === 'Common') {
                prefixes = ["Basic", "Simple", "Worn", "Common"];
                suffixes = ["Iron", "Leather", "Wood", "Bone"];
            } else if (quality === 'Rare') {
                prefixes = ["Reinforced", "Sharp", "Special", "Powerful"];
                suffixes = ["of Nowhere", "of the Deep", "of the Abyss", "of the Guardian"];
            } else {
                prefixes = ["Grand", "Royal", "Supreme", "Divine"];
                suffixes = ["Ghostly", "Shadowy", "Absolute", "Infinite"];
            }
            var prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            var suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            
            var slotName = "";
            if (slotLower === 'head') slotName = "Helmet";
            else if (slotLower === 'chest') slotName = "Chestplate";
            else if (slotLower === 'mainhand') slotName = "Blade";
            else if (slotLower === 'offhand') slotName = "Shield";
            else if (slotLower === 'amulet') slotName = "Amulet";

            if (quality === 'Rare') finalName = prefix + " " + slotName + " " + suffix;
            else finalName = prefix + " " + suffix + " " + slotName;
        }

        var reqStr = (slotLower === 'mainhand') ? Math.round(iLvl * 0.8) : Math.round(iLvl * 0.4);
        var reqInt = (slotLower === 'amulet' || slotLower === 'ring' || slotLower === 'ring1' || slotLower === 'ring2') ? Math.round(iLvl * 0.8) : 0;
        var reqAgi = (slotLower === 'head') ? Math.round(iLvl * 0.5) : 0;

        var icon = "assets/sprites/equip_amulet.png";
        if (slotLower === 'mainhand') icon = "assets/sprites/equip_weapon.png";
        else if (slotLower === 'offhand') icon = "assets/sprites/equip_shield.png";
        else if (slotLower === 'head') icon = "assets/sprites/equip_head.png";
        else if (slotLower === 'chest') icon = "assets/sprites/equip_chest.png";
        else if (slotLower === 'ring1' || (slotLower === 'ring' && (finalName.toLowerCase().includes("ice") || finalName.toLowerCase().includes("cold") || finalName.toLowerCase().includes("winter")))) icon = "assets/sprites/equip_ring_ice.png";
        else if (slotLower === 'ring2' || (slotLower === 'ring' && (finalName.toLowerCase().includes("wood") || finalName.toLowerCase().includes("forest")))) icon = "assets/sprites/equip_ring_wood.png";

        var item = {
            id: itemGuid,
            name: finalName,
            quality: quality,
            slot: (slotLower === 'ring1' || slotLower === 'ring2') ? slotLower : slot,
            itemLevel: iLvl,
            icon: icon,
            attributes: attributes,
            requiredStats: { strength: reqStr, intelligence: reqInt, agility: reqAgi }
        };

        if (baseDamage > 0) item.baseDamage = baseDamage;
        if (baseDefense > 0) item.baseDefense = baseDefense;

        if (quality === 'Epic') item.specialEffect = "Epic Power of Nowhere!";
        else if (quality === 'Rare') item.specialEffect = "Rare Guardian Effect.";

        return item;
    },

    determineQuality: function() {
        var rand = Math.random();
        if (rand < 0.05) return 'Epic';
        if (rand < 0.25) return 'Rare';
        return 'Common';
    },

    getBaseNameBySlot: function(slot) {
        var slotLower = (slot || "").toLowerCase();
        switch(slotLower) {
            case 'mainhand': return 'Blade';
            case 'offhand': return 'Shield';
            case 'chest': return 'Armor';
            case 'head': return 'Helmet';
            case 'ring1': return 'Ice Ring';
            case 'ring2': return 'Wood Ring';
            case 'amulet': return 'Amulet';
            default: return 'Relic';
        }
    },

    rollEnemyDrop: function(levelNum) {
        var lvl = 1;
        if (levelNum === "cave1") lvl = 34;
        else lvl = parseInt(levelNum, 10) || 1;

        var randCount = Math.random();
        var count = 0;
        if (randCount < 0.50) count = 0;
        else if (randCount < 0.85) count = 1;
        else count = 2;

        var droppedItems = [];
        var slots = ['head', 'chest', 'mainhand', 'offhand', 'ring1', 'ring2', 'amulet'];

        for (var i = 0; i < count; i++) {
            var isRareEligible = (lvl === 6 || (lvl >= 10 && lvl <= 33));
            var isEpicEligible = (levelNum === "cave1" || (lvl >= 30 && lvl <= 33));

            var quality = 'Common';
            if (isRareEligible && isEpicEligible) {
                var r = Math.random();
                if (r < 0.75) quality = 'Common';
                else if (r < 0.95) quality = 'Rare';
                else quality = 'Epic';
            } else if (isRareEligible) {
                if (Math.random() < 0.15) quality = 'Rare';
            } else if (isEpicEligible) {
                if (Math.random() < 0.20) quality = 'Epic';
            }

            var slot = slots[Math.floor(Math.random() * slots.length)];
            var item = this.generate(lvl, slot, quality);
            droppedItems.push(item);
        }

        return droppedItems;
    }
};

module.exports = LootSystem;
