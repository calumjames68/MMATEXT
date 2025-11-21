class FightEngine {
    constructor(app) {
        this.app = app; // Reference to main app/career state
        this.p1 = null; this.p2 = null;
        this.round = 1; this.time = 300; this.maxRounds = 3;
        this.position = POS.STANDING;
        this.p1Pos = 10; this.p2Pos = 90; // Cage positioning
        this.domFighter = null; // Who is top
        this.turn = 'p1'; // Who acts
        this.aiTimeout = null;
        this.isOver = false;
        this.nextMove = null; // AI plan
    }

    init(p1, p2, title, rounds) {
        this.p1 = p1; this.p2 = p2;
        this.maxRounds = rounds;
        this.resetState();
        
        // UI Setup
        document.getElementById('fight-title').innerText = title;
        document.getElementById('game-log').innerHTML = '<div class="text-neutral-600 text-center italic my-4">--- Fight Starting ---</div>';
        document.getElementById('commentary-feed').innerHTML = '';
        this.updateUI();
        this.nextTurn();
    }

    resetState() {
        if (this.aiTimeout) clearTimeout(this.aiTimeout);
        this.round = 1; this.time = 300; 
        this.position = POS.STANDING;
        this.p1Pos = 10; this.p2Pos = 90;
        this.domFighter = null; 
        this.turn = 'p1'; 
        this.isOver = false;
        this.app.category = 'strike'; // Reset tab
        
        // Full Heal at start of fight (or keep damage if tournament?) -> Full Heal for now
        this.p1.stamina = 100; this.p2.stamina = 100;
        ['head','body','legs'].forEach(p => {
             this.p1.hp[p].cur = this.p1.hp[p].max = 100;
             this.p2.hp[p].cur = this.p2.hp[p].max = 100;
        });
    }

    // --- GAME LOOP ---
    nextTurn() {
        if (this.isOver) return;
        this.time -= 5;
        if (this.time <= 0) { this.endRound(); return; }
        
        this.regenHealth(this.p1); this.regenHealth(this.p2);
        this.handlePassiveMovement();
        this.updateUI();

        if (this.turn === 'p1') {
            this.aiGuessDefense(); // AI reacts to you
            this.app.setTxt('ai-intention', "WAITING..."); 
            this.app.setTxt('read-quality', "--");
            this.renderAttackControls();
        } else {
            this.aiUpdateState(); // AI plans based on state
            this.nextMove = this.aiPlanMove();
            this.generateHint(this.nextMove); // Show hint to player
            this.app.setHtml('controls', `<div class="text-center text-neutral-500 text-xs py-4 animate-pulse">Defend...</div>`);
            this.aiTimeout = setTimeout(() => { this.resolve(this.p2, this.p1, this.nextMove); }, 1500); 
        }
    }

    handlePassiveMovement() {
        if (this.position !== POS.STANDING) return;
        let p1S = STANCES[this.p1.stance].speed;
        let p2S = STANCES[this.p2.stance].speed;
        this.p1Pos = Math.max(0, Math.min(100, this.p1Pos + p1S));
        this.p2Pos = Math.max(0, Math.min(100, this.p2Pos - p2S)); 
        if (this.p1Pos >= this.p2Pos - 5) { 
            let mid = (this.p1Pos + this.p2Pos) / 2;
            this.p1Pos = mid - 2.5; this.p2Pos = mid + 2.5; 
        }
    }

    regenHealth(f) { 
        ['head','body','legs'].forEach(p => { 
            if(f.hp[p].cur < f.hp[p].max) f.hp[p].cur = Math.min(f.hp[p].max, f.hp[p].cur + 1); 
        }); 
    }

    // --- AI LOGIC ---
    aiGuessDefense() {
        let chance = this.p2.iq / 150; 
        let opt = (this.p1.grappling > this.p1.striking) ? 'sprawl' : (Math.random()<0.5 ? 'high' : 'low');
        this.p2.defFocus = (Math.random() < chance) ? opt : ['high','low','sprawl'].filter(d=>d!==opt)[0];
        this.app.setTxt('ai-guess-text', (Math.random() < chance) ? "Opponent reads stance..." : "Opponent seems unsure...");
        this.updateUI(); // To show AI def badge update
    }
    
    aiUpdateState() {
        if (this.position === POS.STANDING) { 
            if (this.p2Pos >= 90) this.p2.stance = 'evasive'; 
            else if (this.p1.hp.head.cur < 60) this.p2.stance = 'pressure'; 
            else this.p2.stance = 'balanced'; 
        }
    }

    aiPlanMove() {
        const moves = this.getValidMoves(this.p2, 'all');
        // Filter based on range
        let dist = this.getDist(); let valid = moves;
        if (dist > 25) valid = moves.filter(k => MOVES[k] && MOVES[k].cat === 'move');
        else if (dist > 15) valid = moves.filter(k => MOVES[k] && (MOVES[k].cat === 'move' || MOVES[k].maxRange > 15));
        
        valid = valid.filter(k => MOVES[k]);
        if (valid.length === 0) valid = ['circle']; 
        return valid[Math.floor(Math.random() * valid.length)];
    }

    generateHint(k) {
        if(!k) return;
        const iq = this.p1.iq; const m = MOVES[k]; if(!m) return;
        let h = ""; let c = "Low"; let col = "text-gray-500";
        
        if (iq < 40) { h = "AGGRESSIVE"; c="20%"; }
        else if (iq < 75) { h = `READ: ${m.cat.toUpperCase()}`; c="50%"; col="text-yellow-500"; }
        else if (iq < 96) { h = `READ: ${m.target ? "TARGET "+m.target.toUpperCase() : m.cat.toUpperCase()}`; c="80%"; col="text-blue-400"; }
        else { 
            // 10% chance of Feint
            if(Math.random() < 0.1) { h=`READ: ${m.cat === 'strike' ? 'TAKEDOWN' : 'STRIKE'} (FEINT?)`; c="90%"; col="text-red-400"; }
            else { h = `READ: ${m.name.toUpperCase()}`; c="99%"; col="text-green-400"; }
        }
        this.app.setTxt('ai-intention', h); 
        this.app.setTxt('read-quality', `IQ ${iq} | Conf: ${c}`);
        const el = document.getElementById('ai-intention'); if(el) el.className = `font-mono text-xs font-bold animate-pulse ${col}`;
    }

    // --- COMBAT MATH ---
    resolve(att, def, k) {
        const m = MOVES[k]; if(!m) return;
        const aSt = STANCES[att.stance]; const dSt = STANCES[def.stance]; const dFoc = DEF_FOCUS[def.defFocus];
        
        // Range Check
        if (m.cat !== 'move' && this.getDist() > (m.maxRange||15) && this.position === POS.STANDING) {
            this.log(`${att.name} out of range`, "log-sys"); this.addCommentary("miss", att.name);
            this.turn = (this.turn==='p1'?'p2':'p1'); this.nextTurn(); return;
        }

        // Calc Defense
        let dVal = def.defense * (1 + dSt.defMod); 
        let badge = "";
        if (m.cat === 'strike' && m.target) {
            if (m.target === 'head') { if(def.defFocus==='high') { dVal *= dFoc.bonusHead; badge="BLOCKED"; } else if(def.defFocus==='low') { dVal*=0.7; badge="OPEN"; } }
            if (['body','legs'].includes(m.target)) { if(def.defFocus==='low') { dVal *= 1.5; badge="CHECKED"; } else if(def.defFocus==='high') { dVal*=0.7; badge="OPEN"; } }
        } else if (m.cat === 'grapple') { 
            if(def.defFocus==='sprawl') { dVal *= dFoc.penaltyGrapple; badge="SPRAWLED"; } else dVal *= 0.9; 
        }

        // Hit Chance
        let hitC = m.acc + aSt.accMod + (( (m.cat==='strike'?att.striking:att.grappling) - dVal)*0.005);
        
        if (Math.random() < hitC) {
            // HIT
            this.applyHit(att, def, m, (att===this.p1?"log-p1":"log-p2"));
            if(m.moveDist || m.pushBack) this.applyMovement(att, def, m);
            if(m.nextPos) this.changePos(att, m);
            if(m.dom) {} else this.turn = (this.turn==='p1'?'p2':'p1');
        } else {
            // MISS / COUNTER
            if (Math.random() < dSt.counterRate) {
                this.log(`${att.name} misses! COUNTER!`, (def===this.p1?"log-p1":"log-p2"), "COUNTER"); 
                this.addCommentary("miss", att.name);
                att.hp.head.cur -= 10; // Basic counter dmg
                this.turn = (att===this.p1?'p2':'p1');
            } else {
                this.log(`${att.name} blocked/missed`, "log-sys", badge||"BLOCKED"); 
                this.addCommentary("miss", att.name);
                this.turn = (this.turn==='p1'?'p2':'p1');
            }
        }
        att.stamina -= m.stamina; 
        this.checkKO(att, def); 
        this.nextTurn();
    }

    applyHit(a, d, m, cls) {
        let dmg = m.dmg || 0; 
        let isBig = false;
        if(dmg>0 && Math.random()<0.05) { dmg*=1.5; isBig=true; }
        
        let tgt = (m.cat==='strike'? (m.target||'body') : 'body'); if(m.cat!=='strike') dmg=1;
        
        d.hp[tgt].cur -= dmg; 
        d.hp[tgt].max -= (dmg*0.2);
        
        let flav = m.flavor ? m.flavor[Math.floor(Math.random()*m.flavor.length)] : "hits";
        this.log(`${a.name} ${flav}`, cls);
        
        if(isBig) this.addCommentary("big_hit", a.name); 
        else if(m.cat==='grapple') this.addCommentary("takedown", a.name); 
        else this.addCommentary("hit", a.name);
    }

    applyMovement(att, def, m) {
        if(this.position!==POS.STANDING) return;
        let dir = (att===this.p1) ? 1 : -1;
        if(m.moveDist) { let amt=m.moveDist*dir; if(att===this.p1) this.p1Pos+=amt; else this.p2Pos+=amt; }
        else if(m.pushBack) { let amt=m.pushBack*dir; if(att===this.p1) this.p2Pos+=amt; else this.p1Pos+=amt; }
        this.p1Pos = Math.max(0, Math.min(100, this.p1Pos)); this.p2Pos = Math.max(0, Math.min(100, this.p2Pos));
        if(this.p1Pos >= this.p2Pos-2) { let mid=(this.p1Pos+this.p2Pos)/2; this.p1Pos=mid-2.5; this.p2Pos=mid+2.5; }
    }

    changePos(att, m) {
        this.position = m.nextPos;
        if(m.dom) this.domFighter = att; 
        else if(m.flipDom) this.domFighter = att; 
        else if(this.position===POS.STANDING) this.domFighter=null;
        this.log(`Position: ${this.position}`, "log-sys");
    }

    checkKO(att, def) {
        if(def.hp.head.cur<=0) this.end(att, "KO Head"); 
        if(def.hp.body.cur<=0) this.end(att, "TKO Body"); 
        if(def.hp.legs.cur<=0) this.end(att, "TKO Legs"); 
        if(att.hp.head.cur<=0) this.end(def, "KO Counter");
    }

    end(w, m) { 
        this.isOver=true; 
        this.log(`${w.name} wins by ${m}`, "log-ko", "FINISH"); 
        this.app.setHtml('controls', `<div class="text-center p-4 text-white font-bold bg-neutral-800 rounded">WINNER: ${w.name}</div><button onclick="game.returnToMenu()" class="mt-2 w-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-2 rounded text-xs">RETURN TO MENU</button>`); 
        this.addCommentary("sub", w.name); 
        
        // Update Career
        this.app.career.handleResult(w === this.p1);
    }

    endRound() { 
        this.log("End Round "+this.round, "log-sys"); 
        this.round++; this.time=300; 
        this.p1Pos=10; this.p2Pos=90; this.position=POS.STANDING; this.domFighter=null; 
        this.nextTurn(); 
    }

    // --- HELPERS ---
    getDist() { return Math.abs(this.p2Pos - this.p1Pos); }
    getPosName() { if(this.position===POS.STANDING) return this.getDist()>20?"LONG":"POCKET"; if(!this.domFighter) return this.position; return `${this.position} (${this.domFighter.name} Top)`; }
    getValidMoves(f, c) {
        const p = this.position; const top = (this.domFighter===f); const dist = this.getDist(); let k = [];
        if(p===POS.STANDING) {
            if(dist>25) k=['step_in','dash','circle'];
            else if(dist>15) k=['step_in','dash','circle','legkick'];
            else k=['jab','cross','legkick','bodyhook','clinch','takedown','step_in','circle'];
        } else if(p===POS.CLINCH) k=['knee','break','takedown'];
        else { if(top) k=['gnp_guard','pass_half','stand_bot']; else k=['sweep_scissor','stand_bot','break']; }
        
        // Unlocks
        let unlocked = k.filter(key => f.knownMoves.includes(key));
        f.knownMoves.forEach(km => {
             if (SPECIAL_MOVES[km] && !k.includes(km)) {
                 const m = MOVES[km];
                 if (m.cat === 'strike' && p===POS.STANDING && dist <= m.maxRange) unlocked.push(km);
                 if (m.cat === 'sub' && p !== POS.STANDING) unlocked.push(km);
             }
        });
        if(c && c!=='all') return unlocked.filter(x=>MOVES[x] && MOVES[x].cat===c);
        return unlocked;
    }

    log(msg, cls, badgeText="") {
        const d = document.createElement('div'); d.className = `log-entry ${cls}`;
        let badgeHTML = "";
        if (badgeText) {
            let bClass = "tac-fail";
            if (badgeText.includes("COUNTER")) bClass = "tac-counter";
            else if (badgeText.includes("CRITICAL")) bClass = "tac-crit";
            else if (badgeText.includes("BLOCKED")) bClass = "tac-read";
            else if (badgeText.includes("OPEN")) bClass = "tac-exploit";
            badgeHTML = `<span class="tac-badge ${bClass}">${badgeText}</span>`;
        }
        d.innerHTML = `<span>${msg}</span>${badgeHTML}`;
        const logCont = document.getElementById('game-log');
        if(logCont) logCont.prepend(d);
    }
    addCommentary(type, attName) {
        if (this.isOver) return;
        const box = document.getElementById('commentary-feed'); if (!box) return;
        const pbpLine = COMM[type].pbp[Math.floor(Math.random() * COMM[type].pbp.length)];
        const colorLine = Math.random() > 0.5 ? COMM[type].color[Math.floor(Math.random() * COMM[type].color.length)] : null;
        let html = `<div class="comm-box flex items-start mb-1"><span class="comm-name comm-jon">JON:</span><span class="text-neutral-300">${pbpLine}</span></div>`;
        if (colorLine) html += `<div class="comm-box flex items-start mb-1"><span class="comm-name comm-joe">JOE:</span><span class="text-neutral-400 italic">${colorLine}</span></div>`;
        box.innerHTML = html;
    }
    
    updateUI() {
        if(!this.p1 || !this.p2) return;
        const p1 = this.p1; const p2 = this.p2;
        this.app.setStyle('p1-st-bar', 'width', `${p1.stamina}%`); this.app.setStyle('p2-st-bar', 'width', `${p2.stamina}%`);
        ['head','body','legs'].forEach(p => {
            this.app.setStyle(`p1-hp-${p}`, 'width', `${(p1.hp[p].cur/100)*100}%`); this.app.setTxt(`p1-val-${p}`, Math.floor(p1.hp[p].cur));
            this.app.setStyle(`p2-hp-${p}`, 'width', `${(p2.hp[p].cur/100)*100}%`); this.app.setTxt(`p2-val-${p}`, Math.floor(p2.hp[p].cur));
        });
        this.app.setTxt('clock-display', `${Math.floor(this.time/60)}:${(this.time%60).toString().padStart(2,'0')}`);
        this.app.setTxt('range-text', `RANGE: ${Math.floor(this.getDist())}`);
        this.app.setTxt('position-indicator', this.position); this.app.setTxt('position-sub', this.getPosName());
        this.app.setTxt('p1-name', p1.name); this.app.setTxt('p1-rank', p1.rank); this.app.setTxt('p1-style', p1.style);
        this.app.setTxt('p2-name', p2.name); this.app.setTxt('p2-rank', p2.rank); this.app.setTxt('p2-style', p2.style);
        this.app.setTxt('p1-name-meter', p1.name); this.app.setTxt('p2-name-meter', p2.name);
        this.app.setStyle('p1-marker', 'left', `${this.p1Pos}%`); this.app.setStyle('p2-marker', 'left', `${this.p2Pos}%`);
        
        // Stance/Def UI
        ['pressure','balanced','evasive'].forEach(s => { const b = document.getElementById(`btn-st-${s}`); if(b) b.className = `tgl-btn st-${s} bg-neutral-800 p-2 rounded flex flex-col items-center justify-center ${p1.stance===s?'active':''}`; });
        ['high','low','sprawl'].forEach(d => { const b = document.getElementById(`btn-def-${d}`); if(b) b.className = `tgl-btn def-${d} bg-neutral-800 p-2 rounded flex flex-col items-center justify-center ${p1.defFocus===d?'active':''}`; });
        ['high','low','sprawl'].forEach(d => { const el = document.getElementById(`ai-def-${d}`); if(el) { if(p2.defFocus===d) el.classList.add('active'); else el.classList.remove('active'); } });
        
        if(document.getElementById('tab-strike')) { ['strike','grapple','sub','move'].forEach(t => { const btn = document.getElementById(`tab-${t}`); if(btn) { if(this.app.category===t) btn.classList.add('border-white','text-white'); else btn.classList.remove('border-white','text-white'); } }); }
        this.app.setTxt('stance-effect', STANCES[this.p1.stance].desc); this.app.setTxt('def-desc', DEF_FOCUS[this.p1.defFocus].desc);
        this.app.setTxt('ai-stance-display', this.p2.stance); this.app.setTxt('ai-def-display', this.p2.defFocus);
        
        const rCont = document.getElementById('round-bar-container');
        if(rCont) { let h=''; for(let i=1; i<=this.maxRounds; i++) { let c='round-bar'; if(i<this.round) c+=' past'; else if(i===this.round) c+=this.app.isChampBout?' active-gold':' active'; h+=`<div class="${c}"></div>`; } rCont.innerHTML=h; }
    }

    renderAttackControls() {
        const c = document.getElementById('controls'); if(!c) return; c.innerHTML = '';
        const valid = this.getValidMoves(this.p1, this.app.category);
        if (valid.length === 0) c.innerHTML = `<div class="text-center text-neutral-500 text-xs py-4">No moves in range.</div>`;
        else {
            valid.forEach(k => {
                const m = MOVES[k]; if(!m) return;
                const b = document.createElement('button');
                b.className = "w-full text-left px-3 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 mb-1 rounded flex justify-between items-center group";
                b.onclick = () => this.app.handleAttack(k);
                let tb = m.target ? `<span class="target-badge tgt-${m.target}">${m.target}</span>` : "";
                b.innerHTML = `<div><div class="font-bold text-sm text-white">${m.name}${tb}</div></div><div class="text-xs text-neutral-500">${Math.floor(m.acc*100)}%</div>`;
                c.appendChild(b);
            });
        }
    }
}
