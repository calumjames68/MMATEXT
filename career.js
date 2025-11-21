class CareerManager {
    constructor(app) {
        this.app = app;
        // State
        this.record = { w: 0, l: 0 };
        this.money = 100; // Start with gym fee money
        this.fans = 0;
        this.fighter = null;
        this.currentPromoId = 0;
        this.playerRank = 12; // Start unranked (below top 10)
        this.campEnergy = 4;
        
        // World Building - Expanded Promotions
        this.promotions = [
            { 
                id: 1, 
                name: "Iron Cage", 
                desc: "The Proving Grounds. Grimy, aggressive, and low-tech.",
                roster: [], 
                diff: 0.8, 
                payMult: 1.0,
                styleBias: "Brawler" 
            },
            { 
                id: 2, 
                name: "Valhalla FC", 
                desc: "European Prestige. Where technical strikers go to become legends.",
                roster: [], 
                diff: 1.1, 
                payMult: 2.5,
                styleBias: "Striker"
            },
            { 
                id: 3, 
                name: "Sub-X", 
                desc: "The Shark Tank. Elite grapplers and submission wizards only.",
                roster: [], 
                diff: 1.4, 
                payMult: 5.0,
                styleBias: "Grappler"
            }
        ];
        
        // Check Local Storage
        if (localStorage.getItem('textmma_save')) {
            document.getElementById('btn-load-career').classList.remove('hidden');
        }
    }

    init() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('career-screen').classList.remove('hidden');
        
        // Dynamic Promo Selection UI
        let promoHTML = '';
        this.promotions.forEach(p => {
            promoHTML += `
                <div onclick="game.career.selectPromotion(${p.id})" 
                     class="promo-card bg-neutral-800 p-4 rounded cursor-pointer border border-neutral-700 hover:border-red-500 transition group">
                    <div class="text-xl font-bold text-gray-200 group-hover:text-white mb-1">${p.name}</div>
                    <div class="text-xs text-gray-500 mb-2 italic">"${p.desc}"</div>
                    <div class="grid grid-cols-2 gap-2 text-xs mt-3 border-t border-neutral-700 pt-2">
                        <div class="text-gray-400">Base Pay: <span class="text-green-500">$${500 * p.payMult}</span></div>
                        <div class="text-gray-400">Focus: <span class="text-blue-400">${p.styleBias}</span></div>
                    </div>
                </div>`;
        });

        document.getElementById('career-content').innerHTML = `
            <div class="coach-dialogue text-sm text-gray-300 mb-4 border-l-2 border-red-500 pl-3 italic">
                "Look kid, you're fresh meat. Pick a league. Iron Cage is brutal but easy to enter. Valhalla pays better but they hit harder."
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                ${promoHTML}
            </div>`;
        
        this.updateHeader();
    }

    updateHeader() {
        // Calculate rank display
        const rankDisplay = this.playerRank > 10 ? "Unranked" : `#${this.playerRank}`;
        const rankColor = this.playerRank === 0 ? "text-yellow-500" : (this.playerRank <= 5 ? "text-blue-400" : "text-gray-400");
        
        this.app.setTxt('car-record', `Rec: ${this.record.w}-${this.record.l}`);
        this.app.setTxt('car-money', `Bank: $${this.money}`);
        // Assuming there is a generic header slot or we append to record
        // Ideally, main HTML would have a 'car-rank' element. If not, we append to record for now.
        const recordEl = document.getElementById('car-record');
        if(recordEl) recordEl.innerHTML = `Rec: ${this.record.w}-${this.record.l} <span class="ml-2 ${rankColor}">[${rankDisplay}]</span>`;
    }

    selectPromotion(id) {
        this.currentPromoId = id;
        this.generateRoster(id);
        document.getElementById('career-screen').classList.add('hidden');
        document.getElementById('create-char-screen').classList.remove('hidden');
        this.app.selectStyle('Balanced'); // Default selection
    }
    
    // --- ROSTER GENERATION ---
    generateRoster(promoId) {
        const promo = this.promotions.find(p => p.id === promoId);
        if(promo.roster.length > 0) return; // Don't regenerate if exists

        // Generate Champion (Rank 0) + Top 11 Contenders
        for(let i=0; i<=11; i++) {
            let isChamp = i === 0;
            let rankDisplay = isChamp ? "(C)" : `(#${i})`;
            let name = generateName(); // Global helper
            
            // Base Stats influenced by Promotion Style
            let stats = { str: 50, grp: 50, def: 50, iq: 50 };
            
            // Apply Promotion Bias
            if (promo.styleBias === "Brawler") { stats.str += 15; stats.def += 10; stats.iq -= 10; }
            else if (promo.styleBias === "Striker") { stats.str += 10; stats.def += 10; stats.iq += 10; }
            else if (promo.styleBias === "Grappler") { stats.grp += 20; stats.def += 5; stats.str -= 5; }

            // Apply Rank Buff (Lower i = Higher Rank = Better Stats)
            // The Champ (i=0) gets a massive buff. Rank 11 gets basically nothing.
            let rankBuff = (12 - i) * 3; 
            
            // Apply Difficulty Multiplier
            let finalStats = {
                str: Math.floor((stats.str + rankBuff) * promo.diff),
                grp: Math.floor((stats.grp + rankBuff) * promo.diff),
                def: Math.floor((stats.def + rankBuff) * promo.diff),
                iq: Math.floor((stats.iq + rankBuff) * promo.diff)
            };

            // Assign Style string based on stats
            let style = promo.styleBias; 
            if (finalStats.str > finalStats.grp + 10) style = "Striker";
            if (finalStats.grp > finalStats.str + 10) style = "Grappler";

            // Create Fighter Instance
            // Storing actual numeric rank in the object for easy sorting later
            let fighter = new Fighter(name, style, finalStats, rankDisplay);
            fighter.numericRank = i; 
            
            promo.roster.push(fighter);
        }
    }

    // --- MATCHMAKING LOGIC ---
    showFightOffers() {
        document.getElementById('fight-offer-screen').classList.remove('hidden');
        const cont = document.getElementById('offer-container'); 
        cont.innerHTML = "";
        
        const promo = this.promotions.find(p => p.id === this.currentPromoId);
        const roster = promo.roster;
        
        let potentialOpponents = [];

        // Matchmaking Algorithm
        if (this.playerRank === 0) {
            // If Champion: Defend against #1
            potentialOpponents.push(roster.find(f => f.numericRank === 1));
        } else if (this.playerRank > 10) {
            // Unranked: Fight low tier gatekeepers (#11, #10, #9)
            potentialOpponents = roster.filter(f => f.numericRank >= 9 && f.numericRank <= 11);
        } else {
            // Ranked:
            // 1. The Gatekeeper (Rank below you, or slightly above)
            let gatekeeper = roster.find(f => f.numericRank === this.playerRank + 1) || roster.find(f => f.numericRank === this.playerRank + 2);
            // 2. The Rival (Rank immediately above you)
            let rival = roster.find(f => f.numericRank === this.playerRank - 1);
            // 3. The Reach (3 Ranks above you - High Risk/Reward)
            let reach = roster.find(f => f.numericRank === Math.max(1, this.playerRank - 3));
            
            if(gatekeeper) potentialOpponents.push(gatekeeper);
            if(rival) potentialOpponents.push(rival);
            if(reach && reach !== rival) potentialOpponents.push(reach);
            
            // If #1 Contender, force Title Fight offer
            if (this.playerRank === 1) {
                potentialOpponents = [roster.find(f => f.numericRank === 0)];
            }
        }

        // Render Cards
        potentialOpponents.forEach((op) => {
            if (!op) return;
            const div = document.createElement('div');
            div.className = "bg-neutral-800 p-4 rounded border border-neutral-700 hover:border-blue-500 cursor-pointer transition relative overflow-hidden";
            
            // Dynamic difficulty label based on stats comparison roughly
            let threat = "BALANCED";
            const pStr = this.fighter.striking;
            const oStr = op.striking;
            if (oStr > pStr + 10) threat = "DANGEROUS";
            if (pStr > oStr + 15) threat = "FAVORABLE";

            div.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-bold text-white text-lg">${op.name}</div> 
                        <div class="text-yellow-500 text-sm font-mono">${op.rank}</div>
                    </div>
                    <div class="text-[10px] px-2 py-1 rounded bg-neutral-900 border border-neutral-600 text-gray-400">
                        ${threat}
                    </div>
                </div>
                <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>STR: ${Math.floor(op.striking)}</div>
                    <div>GRP: ${Math.floor(op.grappling)}</div>
                </div>
                <div class="mt-2 text-xs text-blue-400">Pay: $${500 * promo.payMult}</div>
            `;
            div.onclick = () => this.startCamp(op);
            cont.appendChild(div);
        });
        
        // Update Header Text
        let headerTxt = this.playerRank === 0 ? "DEFEND YOUR BELT" : "SELECT YOUR OPPONENT";
        document.querySelector('#fight-offer-screen h2').innerText = headerTxt;
    }

    // --- CAMP LOGIC (Preserved & Connected) ---
    startCamp(opp) {
        this.app.p2 = opp; 
        this.campEnergy = 4;
        document.getElementById('fight-offer-screen').classList.add('hidden');
        document.getElementById('camp-screen').classList.remove('hidden');
        this.app.setTxt('camp-opp-name', opp.name);
        
        // Shop Logic
        const shop = document.getElementById('move-shop'); shop.innerHTML = '';
        Object.keys(SPECIAL_MOVES).forEach(key => {
            if (!this.fighter.knownMoves.includes(key)) {
                const m = SPECIAL_MOVES[key];
                // Cost check? Future feature.
                const btn = document.createElement('button');
                btn.className = "text-xs text-left p-2 bg-neutral-800 rounded border border-neutral-700 text-gray-400 hover:text-white hover:border-blue-500 flex justify-between w-full mb-1";
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
        // Diminishing returns soft cap check (Example: slower gains after 80)
        let gain = 2;
        let currentVal = 0;
        if(attr==='str') currentVal = this.fighter.striking;
        if(attr==='grp') currentVal = this.fighter.grappling;
        if(attr==='def') currentVal = this.fighter.defense;
        if(attr==='iq') currentVal = this.fighter.iq;

        if(currentVal > 80) gain = 1; // Soft cap logic
        
        if(attr==='str') this.fighter.striking += gain;
        if(attr==='grp') this.fighter.grappling += gain;
        if(attr==='def') this.fighter.defense += gain;
        if(attr==='iq') this.fighter.iq += gain;
        
        this.updateCampUI();
    }
    
    learnMove(key, btn) {
        if(this.campEnergy <= 0) return;
        this.campEnergy--;
        this.fighter.knownMoves.push(key);
        btn.disabled = true; btn.classList.add('opacity-50'); btn.innerHTML = "LEARNED";
        this.updateCampUI();
    }
    
    scoutOpponent() {
        if(this.campEnergy <= 0) return;
        this.campEnergy--;
        this.app.setTxt('scout-result', `STR:${Math.floor(this.app.p2.striking)} GRP:${Math.floor(this.app.p2.grappling)} DEF:${Math.floor(this.app.p2.defense)}`);
        this.updateCampUI();
    }
    
    coachTalk() {
        if(this.campEnergy <= 0) return;
        this.campEnergy--;
        this.fighter.iq += 3; // Nerfed from 5 to 3
        this.app.setTxt('coach-advice', "Good work. Keep your head in the game.");
        this.updateCampUI();
    }

    updateCampUI() {
        this.app.setTxt('camp-energy', this.campEnergy);
        this.app.setTxt('camp-str', Math.floor(this.fighter.striking));
        this.app.setTxt('camp-grp', Math.floor(this.fighter.grappling));
        this.app.setTxt('camp-def', Math.floor(this.fighter.defense));
        this.app.setTxt('camp-iq', Math.floor(this.fighter.iq));
        const btn = document.getElementById('btn-finish-camp');
        if(btn) { 
            btn.disabled = (this.campEnergy > 0); 
            btn.style.opacity = (this.campEnergy > 0) ? "0.5" : "1"; 
            btn.innerText = (this.campEnergy > 0) ? "Finish Training..." : "Go To Gameplan";
        }
    }
    
    // --- FIGHT TRANSITION ---
    goToGamePlan() {
        document.getElementById('camp-screen').classList.add('hidden');
        document.getElementById('game-plan-screen').classList.remove('hidden');
    }
    
    preSetStance(s) { this.fighter.stance = s; this.app.updatePlanUI(); }
    preSetDef(d) { this.fighter.defFocus = d; this.app.updatePlanUI(); }
    
    enterFight() {
        document.getElementById('game-plan-screen').classList.add('hidden');
        const promo = this.promotions.find(p => p.id === this.currentPromoId);
        const fightTitle = this.playerRank === 0 ? `${promo.name}: TITLE DEFENSE` : `${promo.name} - Rank #${this.playerRank} vs ${this.app.p2.rank}`;
        this.app.setupFight(this.fighter, this.app.p2, fightTitle);
    }

    // --- POST FIGHT & PERSISTENCE ---
    handleResult(win) {
        const promo = this.promotions.find(p => p.id === this.currentPromoId);
        const opponent = this.app.p2;

        if (win) { 
            this.record.w++; 
            this.money += (1000 * promo.payMult); 
            this.fans += 50; 

            // RANKING UPDATE LOGIC
            // If we beat someone with a better rank (lower numericRank), we take their spot
            if (opponent.numericRank < this.playerRank) {
                const oldPlayerRank = this.playerRank;
                const oldOppRank = opponent.numericRank;
                
                // Swap Ranks
                this.playerRank = oldOppRank;
                opponent.numericRank = oldPlayerRank;
                
                // Update display strings
                opponent.rank = oldPlayerRank > 10 ? "(#NR)" : `(#${oldPlayerRank})`;
                
                alert(`VICTORY! You have taken the ${this.playerRank === 0 ? "CHAMPIONSHIP" : "#" + this.playerRank + " Ranking"}!`);
            } else {
                alert("VICTORY! Good win, but you need to beat higher ranked opponents to climb.");
            }

        } else { 
            this.record.l++; 
            this.money += (500 * promo.payMult); 
            alert("DEFEAT. Back to the gym.");
            // Potential rank drop logic could go here (e.g. if you lose 3 in a row)
        }
        this.save();
        this.updateHeader();
    }
    
    save() {
        const data = { 
            record: this.record, 
            money: this.money, 
            fans: this.fans, 
            fighter: this.fighter, 
            promoId: this.currentPromoId,
            playerRank: this.playerRank,
            // Save roster state to persist rank swaps
            rosterState: this.promotions.map(p => ({id: p.id, roster: p.roster}))
        };
        localStorage.setItem('textmma_save', JSON.stringify(data));
    }
    
    load() {
        const raw = localStorage.getItem('textmma_save'); if (!raw) return;
        const data = JSON.parse(raw);
        
        this.record = data.record; 
        this.money = data.money; 
        this.fans = data.fans; 
        this.currentPromoId = data.promoId;
        this.playerRank = data.playerRank || 12; // Default for backwards compat
        
        // Restore Fighter
        this.fighter = new Fighter(data.fighter.name, data.fighter.style, {str:data.fighter.striking, grp:data.fighter.grappling, def:data.fighter.defense, iq:data.fighter.iq}, data.fighter.rank);
        this.fighter.knownMoves = data.fighter.knownMoves;
        this.app.p1 = this.fighter; 
        
        // Restore Rosters if saved, otherwise regenerate
        if (data.rosterState) {
            data.rosterState.forEach(savedPromo => {
                const localPromo = this.promotions.find(p => p.id === savedPromo.id);
                localPromo.roster = savedPromo.roster.map(f => {
                    // Re-hydrate fighters in roster
                    let nf = new Fighter(f.name, f.style, {str:f.striking, grp:f.grappling, def:f.defense, iq:f.iq}, f.rank);
                    nf.numericRank = f.numericRank;
                    return nf;
                });
            });
        } else {
             this.generateRoster(this.currentPromoId);
        }

        this.init();
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('career-screen').classList.add('hidden');
        
        // Safety check: ensure roster exists before showing offers
        if (this.promotions.find(p => p.id === this.currentPromoId).roster.length === 0) {
             this.generateRoster(this.currentPromoId);
        }
        
        this.showFightOffers();
    }
    
    cancelCreation() { 
        document.getElementById('create-char-screen').classList.add('hidden'); 
        document.getElementById('career-screen').classList.remove('hidden'); 
    }
}
