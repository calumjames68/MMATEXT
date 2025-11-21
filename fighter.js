function generateName() { 
    const fn = FIRST_NAMES[Math.floor(Math.random()*FIRST_NAMES.length)];
    const ln = LAST_NAMES[Math.floor(Math.random()*LAST_NAMES.length)];
    const nn = Math.random() < 0.3 ? `"${NICKNAMES[Math.floor(Math.random()*NICKNAMES.length)]}"` : "";
    return `${fn} ${nn} ${ln}`.replace("  ", " "); 
}

class Fighter {
    constructor(name, style, stats, rank) {
        this.name = name;
        this.style = style;
        this.striking = stats.str;
        this.grappling = stats.grp;
        this.defense = stats.def;
        this.iq = stats.iq || 50;
        this.rank = rank || "";
        this.stamina = 100;
        
        // HP System: Cur/Max allow for permanent damage accumulation
        this.hp = { 
            head: { cur: 100, max: 100 }, 
            body: { cur: 100, max: 100 }, 
            legs: { cur: 100, max: 100 } 
        };
        
        // Tactical State
        this.stance = 'balanced';
        this.defFocus = 'sprawl';
        
        // Moves List (Base + Unlockables)
        this.knownMoves = Object.keys(BASE_MOVES);
    }
}
