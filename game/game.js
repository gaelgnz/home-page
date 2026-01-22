const WIDTH = 800;
const HEIGHT = 600;
const SCREEN_ZERO = 125;
const ROOM_WIDTH = 800 - 125;
const ROOM_HEIGHT = 600;
const TILE_WIDTH = WIDTH / 15;
const TILE_HEIGHT = (HEIGHT - 125) / 10;
const canvas = document.getElementById("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;

const ctx = canvas.getContext("2d");
const mouse = { x: 0, y: 0 };

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

const keys = {};

const ENEMY_TYPES = {
    zombie: {
        name: "zombie",
        health: 10,
        damage: 1,
        speed: 2.5,
        size: 32,
        color: "green",
        cash: 10,
        spawnChance: 0.6
    },
    skeleton: {
        name: "skeleton",
        health: 8,
        damage: 2,
        speed: 3.5,
        size: 28,
        color: "white",
        cash: 15,
        spawnChance: 0.3
    },
    slime: {
        name: "slime",
        health: 15,
        damage: 0.5,
        speed: 1.8,
        size: 36,
        color: "blue",
        cash: 8,
        spawnChance: 0.1
    }
};

const DIFFICULTY = 1;

const mcFont = new FontFace('MC', 'url(mc.otf)');
mcFont.load().then(function(loadedFont) {
    document.fonts.add(loadedFont);
    console.log("Font loaded!");
    requestAnimationFrame(mainLoop);
}).catch(err => console.error("Font failed to load:", err));

const organTypes = [
    { name: "brain", price: 50 },
    { name: "heart", price: 40 },
    { name: "liver", price: 30 },
    { name: "kidney", price: 25 },
    { name: "lung", price: 20 },
    { name: "stomach", price: 15 }
];
const organMarket = {
    brain:   makeMarket(50),
    heart:   makeMarket(40),
    liver:   makeMarket(30),
    kidney:  makeMarket(25),
    lung:    makeMarket(20),
    stomach: makeMarket(15)
};

function makeMarket(start) {
    return {
        price: start,
        history: [start],
        trend: Math.random() < 0.5 ? -1 : 1,
        trendTime: rand(50, 100),
        volatility: rand(1, 3),
        power: rand(0.3, 0.9)
    };
}

function rand(a, b) {
    return Math.random() * (b - a) + a;
}

let marketUI = {
    open: false,
    selected: null
};
const DOORS = {
    up:    { y: 0, x: [6,7,8] },
    down:  { y: 9, x: [6,7,8] },
    left:  { x: 0, y: [3,4,5,6] },
    right: { x: 14, y: [3,4,5,6] }
};

const ALL_UPGRADES = [
    { id: "hp", label: "+1 HEALTH", cost: 30 },
    { id: "damage", label: "DAMAGE +", cost: 45 },
    { id: "firerate", label: "FIRE RATE +", cost: 40 },
    { id: "speed", label: "SPEED +", cost: 25 },
    { id: "health_regen", label: "HEALTH REGEN", cost: 50 },
    { id: "fire_speed", label: "PROJECTILE SPEED +", cost: 35 },
    { id: "invuln_time", label: "INVULNERABILITY +", cost: 40 },
    { id: "crit_chance", label: "CRIT CHANCE +", cost: 60 }
];

function getRandomUpgrades(count) {
    const shuffled = [...ALL_UPGRADES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

const roomPresets = [
    [
        [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
        [0,0,1,0,0,0,0,0,0,0,0,0,1,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
    ]
];
const shopPresets = [
    [
        [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
    ]
];

let player = {
    health: 5,
    maxHealth: 5,
    damage: 2,
    cash: 0,
    x: WIDTH / 2,
    y: HEIGHT / 2,
    room: [0, 0],
    fire_rate: 5,
    fire_speed: 5,
    speed: 5,
    projectiles: [],
    lastShot: 0,
    invincible: false,
    invTimer: 0,
    invDuration: 1000,
    inventory: [],
    message: "",
    healthRegen: 0,
    healthRegenTimer: 0,
    critChance: 0
};
const playerImg = new Image();
const catIndex = Math.floor(Math.random() * 4) + 1;
playerImg.src = `cat${catIndex}.png`;

const MAP_SIZE = 5;
let map = genMap();

function getRandomEnemyType() {
    const randValue = Math.random();
    let cumulative = 0;
    
    for (const typeName in ENEMY_TYPES) {
        const enemyType = ENEMY_TYPES[typeName];
        cumulative += enemyType.spawnChance;
        if (randValue <= cumulative) {
            return enemyType;
        }
    }
    
    return ENEMY_TYPES.zombie;
}

function genMap() {
    console.log("generating map")
    const map = [];

    function isValidEnemyPosition(x, y, preset, enemySize) {
        const size = enemySize || 32;
        if (x < size/2 || x > WIDTH - size/2 || y < SCREEN_ZERO + size/2 || y > HEIGHT - size/2) {
            return false;
        }
        
        const corners = [
            {x: x - size/2, y: y - size/2},
            {x: x + size/2 - 1, y: y - size/2},
            {x: x - size/2, y: y + size/2 - 1},
            {x: x + size/2 - 1, y: y + size/2 - 1}
        ];
        
        for (const corner of corners) {
            const tileX = Math.floor(corner.x / TILE_WIDTH);
            const tileY = Math.floor((corner.y - SCREEN_ZERO) / TILE_HEIGHT);
            
            if (tileY < 0 || tileY >= preset.length || 
                tileX < 0 || tileX >= preset[0].length) {
                return false;
            }
            
            if (preset[tileY][tileX] === 1) {
                return false;
            }
        }
        
        return true;
    }

    for (let y = 0; y < MAP_SIZE; y++) {
        map[y] = [];

        for (let x = 0; x < MAP_SIZE; x++) {
            const isShop = Math.random() < 0.15;
            let room;

            if (isShop) {
                const preset = shopPresets[Math.floor(Math.random() * shopPresets.length)];
                const shopUpgrades = getRandomUpgrades(3);
                room = {
                    tiles: preset.map(r => [...r]),
                    type: "shop",
                    enemies: [],
                    objects: shopUpgrades.map((upgrade, index) => ({
                        type: "upgrade",
                        upgrade: upgrade,
                        x: 200 + index * 200,
                        y: 200,
                        bought: false
                    }))
                };
            } else {
                const preset = roomPresets[Math.floor(Math.random() * roomPresets.length)];
                const enemyCount = Math.floor(Math.random() * 4) + 1;
                const enemies = [];

                for (let i = 0; i < enemyCount; i++) {
                    let attempts = 0;
                    let foundPosition = false;
                    const enemyType = getRandomEnemyType();
                    
                    while (attempts < 100 && !foundPosition) {
                        const spawnX = rand(enemyType.size, WIDTH - enemyType.size);
                        const spawnY = rand(SCREEN_ZERO + enemyType.size, HEIGHT - enemyType.size);
                        
                        if (isValidEnemyPosition(spawnX, spawnY, preset, enemyType.size)) {
                            const offset = (Math.random() - 0.5) * 4;
                            const baseHealth = enemyType.health;
                            const enemyHealth = (baseHealth * DIFFICULTY) + offset;
                            
                            enemies.push({
                                type: enemyType.name,
                                x: spawnX,
                                y: spawnY,
                                health: enemyHealth,
                                maxHealth: enemyHealth,
                                enemyData: enemyType
                            });
                            foundPosition = true;
                        }
                        attempts++;
                    }
                }

                room = {
                    tiles: preset.map(r => [...r]),
                    type: enemies.length ? "uncleared" : "cleared",
                    enemies,
                    objects: []
                };
            }

            map[y][x] = room;
        }
    }

    return map;
}

function canExit(room, dir) {
    if (room.type === "uncleared") return false;

    switch(dir) {
        case "up": return room.tiles[0].some(t => t === 0);
        case "down": return room.tiles[9].some(t => t === 0);
        case "left": return room.tiles.some(r => r[0] === 0);
        case "right": return room.tiles.some(r => r[14] === 0);
    }
}

function process() {
    let curRoom = map[player.room[1]][player.room[0]];
    if (!curRoom) return;

    if (curRoom.type === "uncleared") {
        setDoors(curRoom, false);
    }

    if (curRoom.type !== "shop" && curRoom.enemies.length === 0) {
        curRoom.type = "cleared";
        setDoors(curRoom, true);
    }

    let newX = player.x;
    let newY = player.y;

    if (keys["w"]) newY -= player.speed;
    if (keys["s"]) newY += player.speed;
    if (keys["a"]) newX -= player.speed;
    if (keys["d"]) newX += player.speed;
    if (keys[" "]) shoot();

    if (Math.random() < 0.02) {
        for (const k in organMarket) {
            const m = organMarket[k];
            m.trendTime--;
            if (m.trendTime <= 0) {
                m.trend *= -1;
                m.trendTime = rand(200, 600);
                m.power = rand(0.3, 1.2);
                m.volatility = rand(1, 4);
            }

            const trendForce = m.trend * m.power * rand(1, 3);
            const noise = (Math.random() - 0.5) * m.volatility * 2;
            let delta = trendForce + noise;
            delta = Math.max(-8, Math.min(8, delta));
            m.price += delta;

            const min = 5;
            const max = m.history[0] * 3;
            m.price = Math.round(Math.max(min, Math.min(max, m.price)));
            m.history.push(m.price);
            if (m.history.length > 50) m.history.shift();
        }
    }

    if (player.healthRegen > 0 && performance.now() - player.healthRegenTimer > 2000) {
        player.health = Math.min(player.health + player.healthRegen, player.maxHealth);
        player.healthRegenTimer = performance.now();
    }

    if (!collidingTile(newX, player.y, curRoom)) player.x = newX;
    if (!collidingTile(player.x, newY, curRoom)) player.y = newY;

    if (curRoom) {
        for (let i = curRoom.objects.length - 1; i >= 0; i--) {
            const obj = curRoom.objects[i];

            if (obj.type === "organ") {
                if (player.x + 16 > obj.x && player.x - 16 < obj.x + 20 &&
                    player.y + 16 > obj.y && player.y - 16 < obj.y + 20) {
                    player.inventory.push(obj);
                    var audio = new Audio('pickup.wav');
                    audio.play();
                    player.message = "You picked up " + obj.name;
                    curRoom.objects.splice(i, 1);
                    setTimeout(() => { player.message = ""; }, 2000);
                }
            }
        }
    }
    
    if (curRoom.type === "shop") {
        for (const obj of curRoom.objects) {
            if (obj.type !== "upgrade" || obj.bought) continue;

            if (
                player.x + 16 > obj.x &&
                player.x - 16 < obj.x + 40 &&
                player.y + 16 > obj.y &&
                player.y - 16 < obj.y + 40
            ) {
                player.message = "Press E to buy";

                if (keys["e"] && player.cash >= obj.upgrade.cost) {
                    player.cash -= obj.upgrade.cost;
                    obj.bought = true;

                    switch (obj.upgrade.id) {
                        case "hp": 
                            player.maxHealth += 1;
                            player.health += 1;
                            break;
                        case "damage": 
                            player.damage += 2; 
                            break;
                        case "firerate": 
                            player.fire_rate += 0.5; 
                            break;
                        case "speed": 
                            player.speed += 1; 
                            break;
                        case "health_regen":
                            player.healthRegen += 1;
                            break;
                        case "fire_speed":
                            player.fire_speed += 1;
                            break;
                        case "invuln_time":
                            player.invDuration += 500;
                            break;
                        case "crit_chance":
                            player.critChance += 0.1;
                            break;
                    }

                    player.message = "Bought " + obj.upgrade.label;
                }
            }
        }
    }

    if (player.y < SCREEN_ZERO && player.room[1] > 0 && canExit(curRoom, "up")) {
        player.room[1] -= 1;
        player.y = HEIGHT - TILE_HEIGHT -32;
    }
    if (player.y > HEIGHT && player.room[1] < MAP_SIZE - 1 && canExit(curRoom, "down")) {
        player.room[1] += 1;
        player.y = SCREEN_ZERO + TILE_HEIGHT + 32;
    }
    if (player.x < 0 && player.room[0] > 0 && canExit(curRoom, "left")) {
        player.room[0] -= 1;
        player.x = WIDTH - TILE_WIDTH - 32;
    }
    if (player.x > WIDTH && player.room[0] < MAP_SIZE - 1 && canExit(curRoom, "right")) {
        player.room[0] += 1;
        player.x = TILE_WIDTH + 32;
    }

    for (let i = player.projectiles.length - 1; i >= 0; i--) {
        const p = player.projectiles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > WIDTH || p.y < SCREEN_ZERO || p.y > HEIGHT) {
            player.projectiles.splice(i, 1);
        }
    }

    for (let i = curRoom.enemies.length - 1; i >= 0; i--) {
        let enemy = curRoom.enemies[i];
        const enemyType = ENEMY_TYPES[enemy.type] || ENEMY_TYPES.zombie;
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy) || 1;
        const vx = (dx / dist) * enemyType.speed;
        const vy = (dy / dist) * enemyType.speed;

        let newX = enemy.x + vx;
        if (!collidingTile(newX, enemy.y, curRoom)) {
            enemy.x = newX;
        }

        let newY = enemy.y + vy;
        if (!collidingTile(enemy.x, newY, curRoom)) {
            enemy.y = newY;
        }

        const halfSize = enemyType.size / 2;
        enemy.x = Math.min(Math.max(enemy.x, halfSize), WIDTH - halfSize);
        enemy.y = Math.min(Math.max(enemy.y, SCREEN_ZERO + halfSize), HEIGHT - halfSize);

        if (!player.invincible &&
            player.x + 16 > enemy.x - halfSize && player.x - 16 < enemy.x + halfSize &&
            player.y + 16 > enemy.y - halfSize && player.y - 16 < enemy.y + halfSize) {
            
            player.health -= enemyType.damage;
            var audio = new Audio('slap.mp3');
            audio.play();
            player.invincible = true;
            player.invTimer = performance.now();
        }

        for (let j = player.projectiles.length - 1; j >= 0; j--) {
            let p = player.projectiles[j];
            if (p.x + 10 > enemy.x - halfSize && p.x < enemy.x + halfSize &&
                p.y + 10 > enemy.y - halfSize && p.y < enemy.y + halfSize) {
                
                let damage = player.damage;
                if (Math.random() < player.critChance) {
                    damage *= 2;
                    p.isCrit = true;
                }
                
                enemy.health -= damage;
                player.projectiles.splice(j, 1);
                
                if (enemy.health <= 0) {
                    enemyDeath(enemy.type, enemy.x, enemy.y);
                    curRoom.enemies.splice(i, 1);
                }
                break;
            }
        }
    }

    if (player.invincible && performance.now() - player.invTimer > player.invDuration) {
        player.invincible = false;
    }
}

function draw() {
    ctx.fillStyle = "grey";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, WIDTH, 125);
    ctx.fillStyle = "white";
    ctx.font = "19px MC";
    if (player.health < 3) ctx.fillStyle = "red";
    ctx.fillText("HEALTH: " + player.health + "/" + player.maxHealth, 10, 30);
    ctx.fillStyle = "white";
    ctx.fillText("CASH: " + player.cash, 10, 50);
    ctx.fillText("DAMAGE: " + player.damage, 10, 70);
    if (player.healthRegen > 0) ctx.fillText("REGEN: " + player.healthRegen, 200, 30);
    if (player.critChance > 0) ctx.fillText("CRIT: " + Math.round(player.critChance * 100) + "%", 200, 50);
    if (player.message) ctx.fillText(player.message, 10, 90);

    drawMinimap();
    const curRoom = map[player.room[1]][player.room[0]];
    if (!curRoom) return;

    for (let y = 0; y < curRoom.tiles.length; y++) {
        for (let x = 0; x < curRoom.tiles[y].length; x++) {
            switch (curRoom.tiles[y][x]) {
                case 0:
                    ctx.fillStyle = "#727272ff"
                    break
                case 1:
                    ctx.fillStyle = "#000000ff"
                    break
                case 3:
                    ctx.fillStyle = "#351500ff"
                    break
            }
            ctx.fillRect(x * TILE_WIDTH, y * TILE_HEIGHT + 125, TILE_WIDTH + 1, TILE_HEIGHT + 1);
        }
    }

    ctx.fillStyle = "white";
    ctx.fillRect(0, SCREEN_ZERO, WIDTH, 3);

    for (const object of curRoom.objects) {
        if (object.type === "organ") {
            switch (object.name) {
                case "brain": ctx.fillStyle = "pink"; break;
                case "heart": ctx.fillStyle = "red"; break;
                case "liver": ctx.fillStyle = "brown"; break;
                case "kidney": ctx.fillStyle = "darkred"; break;
                case "lung": 
                    ctx.fillStyle = "lightgrey";
                    ctx.fillRect(object.x, object.y, 10, 20);
                    ctx.fillRect(object.x + 15, object.y, 10, 20);
                    continue;
                case "stomach": 
                    ctx.fillStyle = "orange";
                    ctx.fillRect(object.x, object.y, 20, 10);
                    continue;
                default: ctx.fillStyle = "white";
            }
            if (object.name !== "lung" && object.name !== "stomach") {
                ctx.fillRect(object.x, object.y, 20, 20);
            }
        }
    }

    for (const enemy of curRoom.enemies) {
        const enemyType = ENEMY_TYPES[enemy.type] || ENEMY_TYPES.zombie;
        const halfSize = enemyType.size / 2;
        
        ctx.fillStyle = enemyType.color;
        ctx.fillRect(enemy.x - halfSize, enemy.y - halfSize, enemyType.size, enemyType.size);
        
        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.fillStyle = "red";
        ctx.fillRect(enemy.x - halfSize, enemy.y - halfSize - 5, enemyType.size, 3);
        ctx.fillStyle = "lime";
        ctx.fillRect(enemy.x - halfSize, enemy.y - halfSize - 5, enemyType.size * healthPercent, 3);
        
        ctx.fillStyle = "white";
        ctx.font = "12px MC";
        ctx.fillText(enemyType.name.toUpperCase(), enemy.x - halfSize, enemy.y - halfSize - 10);
    }

    if (curRoom.type === "shop") {
        for (const obj of curRoom.objects) {
            if (obj.type !== "upgrade") continue;
            ctx.fillStyle = obj.bought ? "#222" : "#444";
            ctx.fillRect(obj.x, obj.y, 40, 40);
            ctx.fillStyle = "white";
            ctx.font = "19px MC";
            ctx.fillText(obj.upgrade.label, obj.x - 20, obj.y - 10);
            ctx.fillText("$" + obj.upgrade.cost, obj.x + 5, obj.y + 60);
        }
    }

    if (!player.invincible || Math.floor(performance.now() / 100) % 2 === 0) {
        ctx.drawImage(playerImg, player.x - 16, player.y - 16, 40, 40);
    }

    for (const projectile of player.projectiles) {
        ctx.fillStyle = projectile.isCrit ? "gold" : "#4797ff";
        ctx.fillRect(projectile.x, projectile.y, 10, 10);
    }

    let i = 0;
    for (const k in organMarket) {
        const count = player.inventory.filter(o => o.name === k).length;
        ctx.fillStyle = "#333";
        ctx.fillRect(10 + i * 110, 90, 100, 30);
        ctx.fillStyle = "white";
        ctx.fillText(k.toUpperCase() + " " + count, 15 + i * 110, 110);
        i++;
    }

    if (marketUI.open && marketUI.selected) {
        const m = organMarket[marketUI.selected];
        ctx.fillStyle = "black";
        ctx.fillRect(80, 150, WIDTH - 160, HEIGHT - 200);
        const hx = m.history;
        const baseX = 120;
        const graphTop = 300;
        const graphBottom = 500;
        const graphHeight = graphBottom - graphTop;
        const min = Math.min(...hx);
        const max = Math.max(...hx);
        const range = Math.max(1, max - min);

        for (let i = 1; i < hx.length; i++) {
            const prev = hx[i - 1];
            const curr = hx[i];
            const x1 = baseX + (i - 1) * 10;
            const x2 = baseX + i * 10;
            const y1 = graphBottom - ((prev - min) / range) * graphHeight;
            const y2 = graphBottom - ((curr - min) / range) * graphHeight;
            ctx.strokeStyle = curr >= prev ? "green" : "red";
            ctx.beginPath();
            ctx.lineWidth = 4;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        const count = player.inventory.filter(o => o.name === marketUI.selected).length;
        ctx.fillStyle = "white";
        ctx.fillText("PRICE: " + m.price, 120, 180);
        ctx.fillText("YOU OWN: " + count, 120, 210);
        ctx.fillText("TOTAL WORTH: " + count * m.price, 120, 240);
        ctx.fillStyle = "#444";
        ctx.fillRect(120, 260, 100, 30);
        ctx.fillRect(240, 260, 100, 30);
        ctx.fillStyle = "white";
        ctx.fillText("SELL", 145, 282);
        ctx.fillText("BUY", 270, 282);
    }
}

function mainLoop() {
    process();
    draw();
    requestAnimationFrame(mainLoop);
}

function shoot() {
    const now = performance.now();
    const cooldown = 1000 / player.fire_rate;

    if (now - player.lastShot < cooldown) return;
    player.lastShot = now;

    const dx = mouse.x - player.x;
    const dy = mouse.y - player.y;
    const dist = Math.hypot(dx, dy);

    var audio = new Audio('dspistol.wav');
    audio.play();
    player.projectiles.push({
        x: player.x,
        y: player.y,
        vx: (dx / dist) * player.fire_speed,
        vy: (dy / dist) * player.fire_speed,
        isCrit: false
    });
}

function collidingTile(x, y, room) {
    const left = x - 16;
    const right = x + 16;
    const top = y - 16 - SCREEN_ZERO;
    const bottom = y + 16 - SCREEN_ZERO;

    for (let ty = 0; ty < room.tiles.length; ty++) {
        for (let tx = 0; tx < room.tiles[0].length; tx++) {
            if (room.tiles[ty][tx] === 1 || room.tiles[ty][tx] === 3 ) {
                const tileLeft = tx * TILE_WIDTH;
                const tileRight = tileLeft + TILE_WIDTH;
                const tileTop = ty * TILE_HEIGHT;
                const tileBottom = tileTop + TILE_HEIGHT;

                if (right > tileLeft && left < tileRight &&
                    bottom > tileTop && top < tileBottom) {
                    return true;
                }
            }
        }
    }
    return false;
}

document.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

function drawMinimap() {
    const MINIMAP_SIZE = 100;
    const GRID = map.length;
    const ROOM_SIZE = MINIMAP_SIZE / GRID;
    const OFFSET_X = WIDTH - MINIMAP_SIZE - 10;
    const OFFSET_Y = 10;

    for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
            let room = map[y][x];
            if (!room) continue;
            ctx.fillStyle = room.type === "cleared" ? "#444" : "#222";
            ctx.fillRect(
                OFFSET_X + x * ROOM_SIZE,
                OFFSET_Y + y * ROOM_SIZE,
                ROOM_SIZE - 1,
                ROOM_SIZE - 1
            );
        }
    }

    ctx.fillStyle = "pink";
    ctx.fillRect(
        OFFSET_X + player.room[0] * ROOM_SIZE,
        OFFSET_Y + player.room[1] * ROOM_SIZE,
        ROOM_SIZE - 1,
        ROOM_SIZE - 1
    );
}

function enemyDeath(type, x, y) {
    const curRoom = map[player.room[1]][player.room[0]];
    if (!curRoom) return;

    const enemyType = ENEMY_TYPES[type] || ENEMY_TYPES.zombie;
    player.cash += enemyType.cash;

    const dropCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < dropCount; i++) {
        const organ = organTypes[Math.floor(Math.random() * organTypes.length)];
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = (Math.random() - 0.5) * 20;

        curRoom.objects.push({
            type: "organ",
            name: organ.name,
            price: organ.price,
            x: x + offsetX,
            y: y + offsetY
        });
    }
}

function message(txt) {
    player.message = txt
    player.message_goaway = 5
}

canvas.addEventListener("click", e => {
    const x = e.offsetX;
    const y = e.offsetY;

    if (y < 125) {
        let i = 0;
        for (const k in organMarket) {
            const bx = 10 + i * 110;
            if (x > bx && x < bx + 100 && y > 90 && y < 120) {
                marketUI.open = true;
                marketUI.selected = k;
            }
            i++;
        }
    }
    if (marketUI.open && marketUI.selected) {
        if (x > 120 && x < 220 && y > 260 && y < 290) {
            const idx = player.inventory.findIndex(o => o.name === marketUI.selected);
            if (idx !== -1) {
                player.inventory.splice(idx, 1);
                player.cash += organMarket[marketUI.selected].price;
                player.message = "Sold " + marketUI.selected;
                var audio = new Audio('money.mp3');
                audio.play();
            }
        }

        if (x > 240 && x < 340 && y > 260 && y < 290) {
            const price = organMarket[marketUI.selected].price;
            if (player.cash >= price) {
                var audio = new Audio('buy.mp3');
                audio.play();
                player.cash -= price;
                player.inventory.push({ name: marketUI.selected });
                player.message = "Bought " + marketUI.selected;
            }
        }
    }
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        marketUI.open = false;
        marketUI.selected = null;
    }
});

function setDoors(room, open) {
    const v = open ? 0 : 3;

    for (const d in DOORS) {
        const door = DOORS[d];
        if (Array.isArray(door.x)) {
            for (const x of door.x) {
                room.tiles[door.y][x] = v;
            }
        }
        if (Array.isArray(door.y)) {
            for (const y of door.y) {
                room.tiles[y][door.x] = v;
            }
        }
    }
}