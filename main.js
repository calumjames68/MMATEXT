class Game {
    constructor() {
        this.fight = new FightEngine(this);
        this.career = new CareerManager(this);
        this.p1 = null; this.p2 = null;
        this.category = 'strike';
        this.creationStyle = 'Balanced';
        this.isChampBout = false;
    }

    // --- DOM HELPERS ---
    setTxt(id, t) { const el = document.getElementById(id); if(el) el.innerText = t; }
    setHtml(id, h) { const el = document.getElementById(id); if(el) el.innerHTML = h; }
    setStyle(id, prop, val) { const el = document.getElementById(id); if(el) el.style[prop] = val; }

    // --- ROUTING ---
    startQuickFight() {
        const p1 = new Fighter("Islam", "Sambo", { str: 85, grp: 98, def: 90, iq: 100 }, "(C)");
        const p2 = new Fighter("JDM", "Boxing", { str: 92, grp: 80, def: 88, iq: 85 }, "(#4)");
        this.setupFight(p1, p2, "UFC 302: Championship");
    }
    
    setupFight(p1, p2, title) {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        this.setTxt('fight-title', title);
        this.isChampBout = title.includes("Championship");
        this.fight.init(p1, p2, title, (this.isChampBout ? 5 : 3));
    }

    returnToMenu() {
        document.getElementById('game-ui').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        if(this.fight.aiTimeout) clearTimeout(this.fight.aiTimeout);
        this.fight.isOver = true;
    }

    // --- PROXIES TO FIGHT ENGINE ---
    setStance(s) { this.fight.p1.stance = s; this.fight.updateUI(); }
    setDefense(d) { this.fight.p1.defFocus = d; this.fight.updateUI(); }
    setCategory(c) { this.category = c; this.fight.renderAttackControls(); }
    handleAttack(k) { this.fight.resolve(this.fight.p1, this.fight.p2, k); }
    
    // --- PROXIES TO CAREER ---
    selectPromotion(id) { this.career.selectPromotion(id); }
    selectStyle(style) {
        this.creationStyle = style;
        ['Striker', 'Grappler', 'BJJ', 'Balanced'].forEach(s => {
            const btn = document.getElementById(`style-${s}`);
            if(btn) { if (s===style) btn.classList.add('selected'); else btn.classList.remove('selected'); }
        });
        let txt="";
        if(style==='Striker') txt="STR:85 GRP:60 DEF:70 IQ:60";
        else if(style==='Grappler') txt="STR:60 GRP:85 DEF:70 IQ:60";
        else if(style==='BJJ') txt="STR:65 GRP:80 DEF:75 IQ:65";
        else txt="STR:75 GRP:75 DEF:75 IQ:65";
        this.setTxt('style-preview', txt);
    }
    cancelCreation() { this.career.cancelCreation(); }
    confirmCharacter() {
        const name = document.getElementById('char-name').value || "The Rookie";
        let s = { str: 75, grp: 75, def: 75, iq: 65 };
        if (this.creationStyle === 'Striker') s = { str: 85, grp: 60, def: 70, iq: 60 };
        else if (this.creationStyle === 'Grappler') s = { str: 60, grp: 85, def: 70, iq: 60 };
        else if (this.creationStyle === 'BJJ') s = { str: 65, grp: 80, def: 75, iq: 65 };
        
        this.career.fighter = new Fighter(name, this.creationStyle, s, "(NR)");
        this.p1 = this.career.fighter;
        document.getElementById('create-char-screen').classList.add('hidden');
        this.career.showFightOffers();
    }
    startCamp(opp) { this.career.startCamp(opp); }
    train(attr) { this.career.train(attr); }
    learnMove(k,b) { this.career.learnMove(k,b); }
    scoutOpponent() { this.career.scoutOpponent(); }
    coachTalk() { this.career.coachTalk(); }
    goToGamePlan() { this.career.goToGamePlan(); }
    preSetStance(s) { this.career.preSetStance(s); }
    preSetDef(d) { this.career.preSetDef(d); }
    enterFight() { this.career.enterFight(); }
}

const game = new Game();
