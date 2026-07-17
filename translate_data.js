const fs = require('fs');

const path = 'c:/Users/Klara/Desktop/dragaMP/danger_ghost_mobile/www/js/game/ghostdex_data.js';
let content = fs.readFileSync(path, 'utf8');

const prefix = 'window.g_ghostdexDB = ';
if (!content.startsWith(prefix)) {
    console.error("Unexpected file format");
    process.exit(1);
}

let jsonStr = content.slice(prefix.length, content.lastIndexOf(';'));
let db = JSON.parse(jsonStr);

const typeMap = {
    "Espectro": "Specter",
    "Sombra": "Shadow",
    "Neon": "Neon",
    "Urbano": "Urban",
    "Cibernético": "Cybernetic",
    "Fogo-Fátuo": "Wisp",
    "Sombrio": "Dark",
    "Cristal": "Crystal",
    "Tóxico": "Toxic",
    "Sucata": "Scrap",
    "Pixação": "Graffiti",
    "Holográfico": "Holographic",
    "Virtual": "Virtual",
    "Caos": "Chaos"
};

const catMap = {
    "Assombração Urbana": "Urban Haunt",
    "Anomalia Cibernética": "Cybernetic Anomaly",
    "Vulto de Rua": "Street Specter",
    "Espírito Marginal": "Fringe Spirit",
    "Poltergeist Digital": "Digital Poltergeist",
    "Eco do Passado": "Echo of the Past",
    "Aparição Tóxica": "Toxic Apparition",
    "Entidade Neon": "Neon Entity",
    "Entidade Primordial DeSo": "DeSo Primordial Entity"
};

const habMap = {
    "Estação Abandonada de Charitas": "Abandoned Charitas Station",
    "Fábrica Desativada do Barreto": "Deactivated Barreto Factory",
    "MAC - Museu de Arte Contemporânea (Subterrâneo)": "MAC - Contemporary Art Museum (Underground)",
    "Rua Ator Paulo Gustavo (Madrugada)": "Ator Paulo Gustavo Street (Late Night)",
    "Esconderijo Hacker de Icaraí": "Icaraí Hacker Hideout",
    "Lixão Digital": "Digital Junkyard",
    "Beco do Neon - Zona Leste": "Neon Alley - East Zone",
    "Complexo de Favelas (Servidor Central)": "Favela Complex (Central Server)",
    "Laboratório Secreto Web3": "Secret Web3 Lab",
    "Praça Araribóia - Caos": "Araribóia Square - Chaos",
    "Ruínas da Cantareira": "Cantareira Ruins",
    "Terminal João Goulart": "João Goulart Terminal",
    "Pista de Skate Carlos Ermelindo": "Carlos Ermelindo Skatepark",
    "MAC - Museu de Arte Contemporânea (Subterrâneo Profundo)": "MAC - Contemporary Art Museum (Deep Underground)"
};

const loreDict = {
    "Uma massa de dados blockchain que escapou da rede DeSo.": "A mass of blockchain data that escaped the DeSo network.",
    "Atraído pelo som de batidas de rap e hip-hop no subsolo.": "Attracted to the sound of underground rap and hip-hop beats.",
    "Assombração comum nas ruas de Niterói durante a madrugada.": "A common apparition in the streets of Niterói during late night.",
    "Manifesta-se em locais com alta eletricidade estática.": "Manifests in places with high static electricity.",
    "Uma inteligência artificial corrompida que ganhou forma ectoplasmática.": "A corrupted artificial intelligence that gained ectoplasmic form.",
    "Nasce de latas de spray descartadas incorretamente.": "Born from improperly discarded spray cans.",
    "Ecos de grafiteiros que desapareceram na década de 90.": "Echoes of graffiti artists who disappeared in the 90s.",
    "Formado pela energia de celulares quebrados e abandonados.": "Formed by the energy of broken and abandoned cellphones.",
    "Uma lenda urbana colossal de Niterói.": "A colossal urban legend of Niterói.",
    
    "Gosta de assustar skatistas mudando a gravidade dos obstáculos.": "Likes to scare skaters by changing the gravity of obstacles.",
    "Causa interferência em fones de ouvido bluetooth quando se aproxima.": "Causes interference in bluetooth headphones when approaching.",
    "Seus olhos brilham no escuro em tons neon ameaçadores.": "Its eyes glow in the dark in threatening neon tones.",
    "Alimenta-se da luz de placas de publicidade à noite.": "Feeds on the light of billboards at night.",
    "Sua presença é notada pelo forte cheiro de ozônio e tinta fresca.": "Its presence is noticed by a strong smell of ozone and fresh paint.",
    "Deixa um rastro de tinta fluorescente por onde passa.": "Leaves a trail of fluorescent paint wherever it goes.",
    "Dizem que absorve as más vibrações da poluição urbana.": "It's said to absorb the bad vibrations of urban pollution.",
    "Pode possuir caixas eletrônicos para distribuir moedas digitais falsas.": "Can possess ATMs to distribute fake digital coins.",
    "Poucos o viram, e os que viram tiveram seus dispositivos completamente resetados.": "Few have seen it, and those who did had their devices completely reset."
};

function translateLore(text) {
    let result = text;
    for (let pt in loreDict) {
        result = result.replace(pt, loreDict[pt]);
    }
    return result;
}

db.forEach(ghost => {
    if (ghost.tipos) {
        ghost.tipos = ghost.tipos.map(t => typeMap[t] || t);
    }
    if (ghost.categoria) {
        ghost.categoria = catMap[ghost.categoria] || ghost.categoria;
    }
    if (ghost.habitat) {
        ghost.habitat = habMap[ghost.habitat] || ghost.habitat;
    }
    if (ghost.lore) {
        ghost.lore = translateLore(ghost.lore);
    }
});

const newContent = prefix + JSON.stringify(db) + ';';
fs.writeFileSync(path, newContent, 'utf8');
console.log("Translation complete!");
