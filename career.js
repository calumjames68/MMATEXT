class CareerManager {
    constructor(app) {
        this.app = app;
        this.record = { w: 0, l: 0 };
        this.money = 0;
        this.fans = 0;
        this.fighter = null;
        this.currentPromoId = 0;
        this.campEnergy = 4;
        this.promotions = [
            { id: 1, name: "Iron Cage", roster: [], diff: 0.8 },
            { id: 2, name: "Valhalla FC", roster: [], diff: 1.0 },
            { id: 3, name: "Sub-X", roster: [], diff: 1.2 }
        ];
        
        // Check Local Storage
        if (localStorage.getItem('textmma_save')) {
            document.getElementById('btn-load-career').classList.remove('hidden');
        }
    }

    init() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('career-screen').classList.remove('hidden');
        document.getElementById('career-content').innerHTML = `
            <div class="coach-dialogue text-sm text-gray-300">"We got contracts on the table. Choose wisely."</div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div onclick="game.career.selectPromotion(1)" class="promo-card"><div class="text-red-500 font-bold mb-1">IRON CAGE</div><div class="text-xs text-gray-400">PAY: $500</div></div>
                <div onclick="game.career.selectPromotion(2)" class="promo-card"><div class="text-blue-500 font-bold mb-1">VALHALLA FC</div><div class="text-xs text-gray-400">PAY: $800</div></div>
                <div onclick="game.career.selectPromotion(3)" class="promo-card"><div class="text-purple-500 font-bold mb-1">SUB-X</div><div class="text-xs text-gray-400">PAY: $1000</div></div>
            </div>`;
        this.updateHeader();
    }

    updateHeader() {
        this.app.setTxt('car-record', `Record: ${this.record.w}-${this.record.l}`);
        this.app.setTxt('car-money', `Money: $${this.money}`);
    }

    selectPromotion(id) {
        this.currentPromoId = id;
        this.generateRoster(id);
        document.getElementById('career-screen').classList.add('hidden');
        document.getElementById('create-char-screen').classList.remove('hidden');
        this.app.selectStyle('Balanced');
    }
    
    generateRoster(promoId) {
        const promo = this.promotions.find(p => p.id === promoId);
        if(promo.roster.length > 0) return;
        for(let i=0; i<=10; i++) {
            let rank = i===0 ? "(C)" : `(#${i})`;
            let name = generateName();
            let style = "Balanced"; let stats = { str: 70, grp: 70, def: 70, iq: 70 };
            if (promoId === 1) { style = "Brawler"; stats = { str: 75, grp: 65, def: 65, iq: 60 }; }
            else if (promoId === 2) { style = "Striker"; stats = { str: 80, grp: 55, def: 70, iq: 65 }; }
            else { style = "Grappler"; stats = { str: 60, grp: 85, def: 75, iq: 70 }; }
            let buff = (11-i) * 2; stats.str += buff; stats.grp += buff; stats.def += buff;
            promo.roster.push(new Fighter(name, style, stats, rank));
        }
    }

    showFightOffers() {
        document.getElementById('fight-offer-screen').classList.remove('hidden');
        const cont = document.getElementById('offer-container'); cont.innerHTML = "";
        const roster = this.promotions.find(p => p.id === this.currentPromoId).roster;
        [roster[10], roster[9], roster[8]].forEach((op) => {
            const div = document.createElement('div');
            div.className = "bg-neutral-800 p-4 rounded border border-neutral-700 hover:border-blue-500 cursor-pointer transition";
            div.innerHTML = `<div class="font-bold text-white text-lg">${op.name} <span class="text-yellow-500 text-xs">${op.rank}</span></div><div class="text-xs text-gray-400 mb-2">${op.style}</div><div class="text-xs text-gray-500">STR: ${Math.floor(op.striking)} | GRP: ${Math.floor(op.grappling)}</div>`;
            div.onclick = () => this.startCamp(op);
            cont.appendChild(div);
        });
    }

    startCamp(opp) {
        this.app.p2 = opp; this.campEnergy = 4;
        document.getElementById('fight-offer-screen').classList.add('hidden');
        document.getElementById('camp-screen').classList.remove('hidden');
        this.app.setTxt('camp-opp-name', opp.name);
        
        const shop = document.getElementById('move-shop'); shop.innerHTML = '';
        Object.keys(SPECIAL_MOVES).forEach(key => {
            if (!this.fighter.knownMoves.includes(key)) {
                const m = SPECIAL_MOVES[key];
                const btn = document.createElement('button');
                btn.className = "text-xs text-left p-2 bg-neutral-800 rounded border border-neutral-700 text-gray-400 hover:text-white hover:border-blue-500 flex justify-between";
                btn.innerHTML = `<span>${m.name}</span><span class="text-[9px] text-neutral-600">${m.cat.toUpperCase()}</span>`;
                btn.onclick = () => this.learnMove(key, btn);
                shop.appendChild(btn);
            }
        });
        this.updateCampUI();
    }

    train(attr) {
        if(this.campEnergy <= 0) return;
        this.campEnergy--;
        if(attr==='str') this.fighter.striking += 2;
        if(attr==='grp') this.fighter.grappling += 2;
        if(attr==='def') this.fighter.defense += 2;
        if(attr==='iq') this.fighter.iq += 2;
        this.updateCampUI();
    }
    learnMove(key, btn) {
        if(this.campEnergy <= 0) return;
        this.campEnergy--;
        this.fighter.knownMoves.push(key);
        btn.disabled = true; btn.innerHTML += " (LEARNED)";
        this.updateCampUI();
    }
    updateCampUI() {
        this.app.setTxt('camp-energy', this.campEnergy);
        this.app.setTxt('camp-str', this.fighter.striking);
        this.app.setTxt('camp-grp', this.fighter.grappling);
        this.app.setTxt('camp-def', this.fighter.defense);
        this.app.setTxt('camp-iq', this.fighter.iq);
        const btn = document.getElementById('btn-finish-camp');
        if(btn) { btn.disabled = (this.campEnergy > 0); btn.style.opacity = (this.campEnergy > 0) ? "0.5" : "1"; }
    }
    handleResult(win) {
        if (win) { this.record.w++; this.money += 1000; this.fans += 50; }
        else { this.record.l++; this.money += 500; }
        this.save();
    }
    save() {
        const data = { record: this.record, money: this.money, fans: this.fans, fighter: this.fighter, promoId: this.currentPromoId };
        localStorage.setItem('textmma_save', JSON.stringify(data));
        alert("Game Saved");
    }
    load() {
        const raw = localStorage.getItem('textmma_save'); if (!raw) return;
        const data = JSON.parse(raw);
        this.record = data.record; this.money = data.money; this.fans = data.fans; this.currentPromoId = data.promoId;
        this.fighter = new Fighter(data.fighter.name, data.fighter.style, {str:data.fighter.striking, grp:data.fighter.grappling, def:data.fighter.defense, iq:data.fighter.iq}, data.fighter.rank);
        this.fighter.knownMoves = data.fighter.knownMoves;
        this.app.p1 = this.fighter;
        this.init();
    }
}
