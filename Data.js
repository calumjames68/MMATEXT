const POS = { STANDING: 'STANDING', CLINCH: 'CLINCH', GUARD: 'CLOSED GUARD', HALF: 'HALF GUARD', SIDE: 'SIDE CONTROL', MOUNT: 'FULL MOUNT', BACK: 'BACK CONTROL', TURTLE: 'TURTLE', CAGE_CLINCH: 'AGAINST CAGE' };

const STANCES = { 
    pressure: { name: "PRESSURE", speed: 6, accMod: 0.15, defMod: -0.2, counterRate: 0.7, desc: "Aggressive. Auto-Counter." }, 
    balanced: { name: "BALANCED", speed: 2, accMod: 0, defMod: 0, counterRate: 0.3, desc: "Neutral stats." }, 
    evasive: { name: "EVASIVE", speed: -4, accMod: -0.1, defMod: 0.25, counterRate: 0.0, desc: "Defensive. Hard to hit." } 
};

const DEF_FOCUS = { 
    high: { name: "HIGH BLOCK", bonusHead: 1.5, penaltyLeg: 0.7, penaltyGrapple: 0.8, desc: "+Head Def, -Leg/TD Def" }, 
    low: { name: "LOW BLOCK", bonusHead: 0.7, penaltyLeg: 1.5, penaltyGrapple: 0.9, desc: "+Leg/Body Def, -Head Def" }, 
    sprawl: { name: "SPRAWL", bonusHead: 0.8, penaltyLeg: 0.8, penaltyGrapple: 1.6, desc: "++Takedown Def, -Strike Def" } 
};

const BASE_MOVES = {
    step_in: { name: "Step In", cat: 'move', stamina: 2, acc: 1.0, moveDist: 5, flavor: ["inches forward"] },
    dash: { name: "Dash", cat: 'move', stamina: 8, acc: 0.9, moveDist: 15, flavor: ["explodes forward"] },
    circle: { name: "Circle", cat: 'move', stamina: 5, acc: 1.0, moveDist: -5, flavor: ["circles out"] },
    jab: { name: "Jab", cat: 'strike', target: 'head', stamina: 2, dmg: 5, acc: 0.95, pushBack: 2, maxRange: 15, flavor: ["snaps the jab"] },
    cross: { name: "Cross", cat: 'strike', target: 'head', stamina: 6, dmg: 15, acc: 0.6, pushBack: 5, maxRange: 15, flavor: ["fires the cross"] },
    legkick: { name: "Leg Kick", cat: 'strike', target: 'legs', stamina: 5, dmg: 8, acc: 0.9, pushBack: 1, maxRange: 25, flavor: ["chops the leg"] },
    bodyhook: { name: "Body Hook", cat: 'strike', target: 'body', stamina: 7, dmg: 12, acc: 0.7, pushBack: 3, maxRange: 15, flavor: ["digs to the body"] },
    knee: { name: "Knee", cat: 'strike', target: 'body', stamina: 8, dmg: 18, acc: 0.7, pushBack: 2, maxRange: 10, flavor: ["drives a knee"] },
    cage_elbow: { name: "Cage Elbow", cat: 'strike', target: 'head', reqCage: true, stamina: 8, dmg: 20, acc: 0.7, maxRange: 5, flavor: ["slices an elbow"] },
    takedown: { name: "Double Leg", cat: 'grapple', stamina: 15, acc: 0.5, nextPos: POS.GUARD, dom: true, pushBack: 5, maxRange: 15, flavor: ["blasts a double leg"] },
    clinch: { name: "Clinch", cat: 'grapple', stamina: 10, acc: 0.6, nextPos: POS.CLINCH, maxRange: 10, flavor: ["grabs the clinch"] },
    break: { name: "Break", cat: 'grapple', stamina: 5, acc: 0.8, nextPos: POS.STANDING, flavor: ["shoves off"] },
    defend: { name: "Defend", cat: 'grapple', stamina: -5, acc: 1.0, flavor: ["defends"] },
    stand_bot: { name: "Stand Up", cat: 'grapple', stamina: 12, acc: 0.4, nextPos: POS.STANDING, flavor: ["scrambles up"] },
    gnp_guard: { name: "GnP", cat: 'strike', target: 'head', stamina: 8, dmg: 10, acc: 0.7, flavor: ["rains down punches"] },
    pass_half: { name: "Pass", cat: 'grapple', stamina: 10, acc: 0.5, nextPos: POS.HALF, flavor: ["passes to half"] },
    sweep: { name: "Sweep", cat: 'grapple', stamina: 15, acc: 0.3, nextPos: POS.MOUNT, flipDom: true, flavor: ["sweeps them"] },
    sub: { name: "Submission", cat: 'sub', stamina: 20, acc: 0.2, flavor: ["attempts a submission"] },
    cage_press: { name: "Cage Press", cat: 'grapple', stamina: 8, acc: 0.8, nextPos: POS.CAGE_CLINCH, pushBack: 10, maxRange: 5, flavor: ["drives them into the fence"] },
    trip: { name: "Trip", cat: 'grapple', stamina: 12, acc: 0.6, nextPos: POS.SIDE, dom: true, flavor: ["hits an outside trip"] },
    cage_takedown: { name: "Cage Double", cat: 'grapple', reqCage: true, stamina: 12, acc: 0.7, nextPos: POS.GUARD, dom: true, flavor: ["slams them against the fence"] },
    wall_walk: { name: "Wall Walk", cat: 'grapple', reqCage: true, stamina: 12, acc: 0.6, nextPos: POS.STANDING, flavor: ["wall walks back"] },
    mount_knee: { name: "Take Mount", cat: 'grapple', stamina: 12, acc: 0.5, nextPos: POS.MOUNT, flavor: ["slides to mount"] },
    sweep_scissor: { name: "Scissor Sweep", cat: 'grapple', stamina: 15, acc: 0.35, nextPos: POS.MOUNT, flipDom: true, flavor: ["hits a scissor sweep"] },
    kimura: { name: "Kimura", cat: 'sub', stamina: 15, acc: 0.25, flavor: ["cranks the kimura"] },
    triangle: { name: "Triangle", cat: 'sub', stamina: 20, acc: 0.2, flavor: ["locks a triangle"] },
    rnc: { name: "RNC", cat: 'sub', stamina: 10, acc: 0.6, flavor: ["sinks the choke"] },
    armbar: { name: "Armbar", cat: 'sub', stamina: 15, acc: 0.5, flavor: ["snaps the armbar"] },
    gnp_mount: { name: "Finish GnP", cat: 'strike', target: 'head', stamina: 15, dmg: 30, acc: 0.7, flavor: ["unloads heavy gnp"] },
    trap_roll: { name: "Trap & Roll", cat: 'grapple', stamina: 20, acc: 0.3, nextPos: POS.GUARD, flipDom: true, flavor: ["bridges explosively"] },
    elbow_escape: { name: "Elbow Escape", cat: 'grapple', stamina: 15, acc: 0.4, nextPos: POS.HALF, flavor: ["uses elbow escape"] },
    flatten: { name: "Flatten Out", cat: 'strike', target: 'head', stamina: 12, dmg: 20, acc: 0.8, flavor: ["flattens and punches"] },
    turn_in: { name: "Turn In", cat: 'grapple', stamina: 15, acc: 0.3, nextPos: POS.GUARD, flavor: ["turns into guard"] },
    reguard_side: { name: "Reguard", cat: 'grapple', stamina: 12, acc: 0.4, nextPos: POS.HALF, flavor: ["creates a frame"] },
    turtle: { name: "Turtle Up", cat: 'grapple', stamina: 5, acc: 0.9, nextPos: POS.TURTLE, flavor: ["rolls to knees"] },
    gnp_side: { name: "Knees to Body", cat: 'strike', target: 'body', stamina: 8, dmg: 15, acc: 0.8, flavor: ["drives knees"] },
    americana: { name: "Americana", cat: 'sub', stamina: 15, acc: 0.4, flavor: ["cranks americana"] },
    pass_side: { name: "Pass to Side", cat: 'grapple', stamina: 12, acc: 0.5, nextPos: POS.SIDE, flavor: ["slices the knee"] },
    darce: { name: "D'Arce Choke", cat: 'sub', stamina: 18, acc: 0.3, flavor: ["snaps on a D'Arce"] },
    gnp_half: { name: "Short Elbows", cat: 'strike', target: 'head', stamina: 6, dmg: 10, acc: 0.8, flavor: ["drops elbows"] },
    recover_guard: { name: "Recover Guard", cat: 'grapple', stamina: 10, acc: 0.5, nextPos: POS.GUARD, flavor: ["recovers guard"] },
    sweep_coyote: { name: "Dogfight Sweep", cat: 'grapple', stamina: 18, acc: 0.3, nextPos: POS.SIDE, flipDom: true, flavor: ["wrestles up"] },
    take_back: { name: "Take Back", cat: 'grapple', stamina: 10, acc: 0.7, nextPos: POS.BACK, flavor: ["takes the back"] },
    clock_choke: { name: "Clock Choke", cat: 'sub', stamina: 15, acc: 0.4, flavor: ["applies clock choke"] },
    roll_guard: { name: "Roll to Guard", cat: 'grapple', stamina: 10, acc: 0.5, nextPos: POS.GUARD, flavor: ["rolls to guard"] },
};

const SPECIAL_MOVES = {
    head_kick: { name: "Head Kick", cat: 'strike', target: 'head', stamina: 12, dmg: 35, acc: 0.4, maxRange: 20, flavor: ["launches a head kick!"] },
    flying_knee: { name: "Flying Knee", cat: 'strike', target: 'head', stamina: 15, dmg: 40, acc: 0.3, maxRange: 10, flavor: ["flies through the air!"] },
    spinning_elbow: { name: "Spin Elbow", cat: 'strike', target: 'head', stamina: 10, dmg: 30, acc: 0.4, maxRange: 5, flavor: ["spins with the elbow!"] },
    imanari_roll: { name: "Imanari Roll", cat: 'sub', stamina: 20, acc: 0.3, flavor: ["rolls for the legs!"] },
    guillotine: { name: "Guillotine", cat: 'sub', stamina: 15, acc: 0.4, flavor: ["snaps the neck down!"] },
    superman_punch: { name: "Superman Punch", cat: 'strike', target: 'head', stamina: 10, dmg: 20, acc: 0.5, maxRange: 20, flavor: ["leaps in with a punch!"] }
};

const MOVES = { ...BASE_MOVES, ...SPECIAL_MOVES };

const COMM = {
    hit: { pbp: ["Clean hit!", "Nice shot!"], color: ["That hurt!", "Good power."] },
    miss: { pbp: ["Missed.", "Swings wide."], color: ["Great defense.", "Making him miss."] },
    takedown: { pbp: ["Big takedown!", "Dumps him!"], color: ["Perfect technique.", "Changing levels well."] },
    big_hit: { pbp: ["HE'S HURT!", "HUGE SHOT!"], color: ["HE'S WOBBLY!", "TROUBLE!"] },
    sub: { pbp: ["It's tight!", "He might tap!"], color: ["Nowhere to go!", "Squeezing tight!"] }
};

const FIRST_NAMES = ["Kai", "Jax", "Leo", "Max", "Ace", "Zane", "Rex", "Tytus", "Bruno", "Dante", "Cesar", "Diego", "Fedor", "GSP", "Hulk", "Ivan", "Jon", "Khabib", "Liam", "Mike", "Nick", "Omar", "Piotr", "Quinn", "Rory", "Sean", "Tony", "Ulysses", "Vito", "Wanderlei", "Xander", "Yuri", "Zach"];
const LAST_NAMES = ["Silva", "Jones", "Smith", "Nurmagomedov", "St-Pierre", "Emelianenko", "Penn", "Liddell", "Ortiz", "Couture", "Rua", "Gracie", "Diaz", "McGregor", "Volkanovski", "Adesanya", "Usman", "Ngannou", "Miocic", "Cormier", "Holloway", "Poirier", "Gaethje", "Oliveira", "Makhachev", "Chimaev", "Edwards", "Pereira", "Prochazka", "Ankalaev"];
const NICKNAMES = ["The Hammer", "The Spider", "Bones", "The Eagle", "Rush", "The Last Emperor", "The Prodigy", "The Iceman", "The Natural", "Shogun", "The Notorious", "The Great", "The Nightmare", "The Predator", "Stone Cold", "DC", "Blessed", "The Diamond", "The Highlight", "Do Bronx", "Borz", "Rocky", "Poatan", "BJP", "Pitbull"];
