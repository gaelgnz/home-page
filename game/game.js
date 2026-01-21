const WIDTH = 800;
const HEIGHT = 600;
const SCREEN_ZERO = 125;
const ROOM_WIDTH = 800 - 125;
const ROOM_HEIGHT = 600;
const TILE_WIDTH = WIDTH / 15;  // 800 / 15 ≈ 53
const TILE_HEIGHT = (HEIGHT - 125) / 10; // (600-125)/10 ≈ 47.5
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

const keys = {}; // track key states



const mcFont = new FontFace('MC', 'url(mc.otf)');
mcFont.load().then(function(loadedFont) {
    document.fonts.add(loadedFont);
    console.log("Font loaded!");

    // Start main loop only after font is loaded
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
        trend: Math.random() < 0.5 ? -1 : 1,   // -1 down, +1 up
        trendTime: rand(50, 100),             // how long trend lasts
        volatility: rand(1, 3),                // roadbumps
        power: rand(0.3, 0.9)                  // how aggressive
    };
}

function rand(a, b) {
    return Math.random() * (b - a) + a;
}


let marketUI = {
    open: false,
    selected: null
};
const shopUpgrades = [
    { id: "hp", label: "+1 HEALTH", cost: 30 },
    { id: "firerate", label: "FIRE RATE +", cost: 40 },
    { id: "speed", label: "SPEED +", cost: 25 }
];

const roomsPresets = [

    /* NORMAL 1 */
    {
        tiles: [
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
        ],
        type: "not_cleared",
        enemies: [{ x: 250, y: 420, type: "zombie" }]
    },

    /* NORMAL 2 */
    {
        tiles: [
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,1,1,1,0,0,1,1,1,0,0,0,1],
            [0,0,0,0,1,0,0,0,0,0,1,0,0,0,0],
            [0,0,0,0,1,0,0,0,0,0,1,0,0,0,0],
            [0,0,0,0,1,1,1,0,1,1,1,0,0,0,0],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
        ],
        type: "not_cleared",
        enemies: [
            { x: 200, y: 450, type: "zombie" },
            { x: 350, y: 450, type: "zombie" }
        ]
    },

    /* NORMAL 3 */
    {
        tiles: [
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
            [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
        ],
        type: "not_cleared",
        enemies: [{ x: 300, y: 380, type: "zombie" }]
    },

    /* NORMAL 4 */
    {
        tiles: [
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,1,1,0,0,0,0,0,1,1,0,0,1],
            [0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
            [0,0,0,1,1,0,0,0,0,0,1,1,0,0,0],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
        ],
        type: "not_cleared",
        enemies: [
            { x: 220, y: 420, type: "zombie" },
            { x: 380, y: 420, type: "zombie" }
        ]
    },

    /* SHOP 1 */
    {
        tiles: [
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
        ],
        type: "shop",
        enemies: [],
        objects: shopUpgrades.map((u, i) => ({
            type: "upgrade",
            upgrade: u,
            x: 200 + i * 150,
            y: 350,
            bought: false
        }))
    },

    /* SHOP 2 */
    {
        tiles: [
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
        ],
        type: "shop",
        enemies: [],
        objects: shopUpgrades.map((u, i) => ({
            type: "upgrade",
            upgrade: u,
            x: 250 + i * 150,
            y: 350,
            bought: false
        }))
    }

];

const MAP_SIZE = 20; // 3x3 grid
let map = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(null));

// Fill map with random rooms from presets
for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
        const randomRoom = roomsPresets[Math.floor(Math.random() * roomsPresets.length)];

        // deep clone the room
        const newRoom = {
            tiles: randomRoom.tiles.map(row => [...row]),
            type: randomRoom.type,
            enemies: randomRoom.enemies.map(e => ({ ...e })),
            objects: randomRoom.objects ? randomRoom.objects.map(o => ({ ...o })) : []
        };


        map[y][x] = newRoom;
    }
}
let player = {
    health: 5,
    cash: 0,
    x: WIDTH / 2,
    y: HEIGHT / 2,
    room: [0, 0],
    fire_rate: 0.5,
    fire_speed: 5,
    speed: 5,
    projectiles: [],
    lastShot: 0,
    invincible: false,
    invTimer: 0,
    invDuration: 1000,
    inventory: [],       // <--- add this
    message: ""          // <--- for pickup messages
};
const playerImg = new Image();
const catIndex = Math.floor(Math.random() * 4) + 1; // 1–4
playerImg.src = `cat${catIndex}.png`;



function canExit(room, dir) {
    // dir = "up", "down", "left", "right"
    switch(dir) {
        case "up": return room.tiles[0].some(t => t === 0);
        case "down": return room.tiles[room.tiles.length-1].some(t => t === 0);
        case "left": return room.tiles.some(row => row[0] === 0);
        case "right": return room.tiles.some(row => row[row.length-1] === 0);
    }
}

function process() {
    const curRoom = map[player.room[1]][player.room[0]]; // y,x
    if (!curRoom) return;

    let newX = player.x;
    let newY = player.y;

    // Player movement
    if (keys["w"]) newY -= player.speed;
    if (keys["s"]) newY += player.speed;
    if (keys["a"]) newX -= player.speed;
    if (keys["d"]) newX += player.speed;
    if (keys[" "]) shoot();

    if (Math.random() < 0.02) {
        for (const k in organMarket) {
            const m = organMarket[k];

            // Trend countdown
            m.trendTime--;

            // Flip trend when time runs out
            if (m.trendTime <= 0) {
                m.trend *= -1;
                m.trendTime = rand(200, 600);
                m.power = rand(0.3, 1.2);       // new strength
                m.volatility = rand(1, 4);
            }

            // Main directional force
            const trendForce = m.trend * m.power * rand(1, 3);

            // Roadbumps
            const noise = (Math.random() - 0.5) * m.volatility * 2;

            // Big swings, still controlled
            let delta = trendForce + noise;

            // Clamp delta so it feels strong but sane
            delta = Math.max(-8, Math.min(8, delta));

            // Apply
            m.price += delta;

            // Hard clamps per organ
            const min = 5;
            const max = m.history[0] * 3; // 3x max price
            m.price = Math.round(Math.max(min, Math.min(max, m.price)));

            // Store history
            m.history.push(m.price);
            if (m.history.length > 50) m.history.shift();
        }
    }

    // Collision
    if (!collidingTile(newX, player.y, curRoom)) player.x = newX;
    if (!collidingTile(player.x, newY, curRoom)) player.y = newY;

    if (curRoom) {
        for (let i = curRoom.objects.length - 1; i >= 0; i--) {
            const obj = curRoom.objects[i];

            if (obj.type === "organ") {
                // Simple rectangle collision
                if (player.x + 16 > obj.x && player.x - 16 < obj.x + 20 &&
                    player.y + 16 > obj.y && player.y - 16 < obj.y + 20) {

                    // Pick up the organ
                    player.inventory.push(obj);
                    var audio = new Audio('pickup.wav');
                    audio.play();
                    player.message = "You picked up " + obj.name;

                    // Remove from room
                    curRoom.objects.splice(i, 1);

                    // Clear message after 2 seconds
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
                    case "hp": player.health += 1; break;
                    case "firerate": player.fire_rate += 0.2; break;
                    case "speed": player.speed += 1; break;
                }

                player.message = "Bought " + obj.upgrade.label;
            }
        }
    }
}



    // Room transitions
    if (player.y < SCREEN_ZERO && player.room[1] > 0 && canExit(curRoom, "up")) {
        player.room[1] -= 1;
        player.y = HEIGHT - TILE_HEIGHT;
    }
    if (player.y > HEIGHT && player.room[1] < MAP_SIZE - 1 && canExit(curRoom, "down")) {
        player.room[1] += 1;
        player.y = SCREEN_ZERO;
    }
    if (player.x < 0 && player.room[0] > 0 && canExit(curRoom, "left")) {
        player.room[0] -= 1;
        player.x = WIDTH - TILE_WIDTH;
    }
    if (player.x > WIDTH && player.room[0] < MAP_SIZE - 1 && canExit(curRoom, "right")) {
        player.room[0] += 1;
        player.x = TILE_WIDTH;
    }

    // Update projectiles
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

    // Simple AI
    enemy.x += (player.x - enemy.x) * 0.01;
    enemy.y += (player.y - enemy.y) * 0.01;

    // Keep enemy inside room bounds
    enemy.x = Math.min(Math.max(enemy.x, 0), WIDTH - 32);
    enemy.y = Math.min(Math.max(enemy.y, SCREEN_ZERO), HEIGHT - 32);

    // Check collision with player
    if (!player.invincible &&
        player.x + 16 > enemy.x && player.x - 16 < enemy.x + 32 &&
        player.y + 16 > enemy.y && player.y - 16 < enemy.y + 32) {
        
        player.health -= 1;
        var audio = new Audio('slap.mp3');
        audio.play();
        player.invincible = true;
        player.invTimer = performance.now();
    }

    // Check collision with projectiles
    for (let j = player.projectiles.length - 1; j >= 0; j--) {
        let p = player.projectiles[j];
        if (p.x + 10 > enemy.x && p.x < enemy.x + 32 &&
            p.y + 10 > enemy.y && p.y < enemy.y + 32) {

            // Enemy dies
            enemyDeath(enemy.type, enemy.x, enemy.y);

            curRoom.enemies.splice(i, 1);
            player.projectiles.splice(j, 1);
            break;
        }
    }
    }   

    // Handle invincibility timing
    if (player.invincible && performance.now() - player.invTimer > player.invDuration) {
        player.invincible = false;
    }

    // Update enemies only in current room
    for (let i = 0; i < curRoom.enemies.length; i++) {
        let enemy = curRoom.enemies[i];

        // Simple AI: move toward player
        enemy.x += (player.x - enemy.x) * 0.01;
        enemy.y += (player.y - enemy.y) * 0.01;

        // Keep enemy inside room bounds
        enemy.x = Math.min(Math.max(enemy.x, 0), WIDTH - 32);
        enemy.y = Math.min(Math.max(enemy.y, SCREEN_ZERO), HEIGHT - 32);
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = "grey";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Top bar
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, WIDTH, 125);

    ctx.fillStyle = "white";
    ctx.font = "20px MC";
    if (player.health < 3) ctx.fillStyle = "red";
    ctx.fillText("HEALTH: " + "* ".repeat(player.health), 10, 30);
    ctx.fillStyle = "white";
    ctx.fillText("CASH: " + player.cash, 10, 50);
    if (player.message) ctx.fillText(player.message, 10, 70);

    drawMinimap();

    // Current room
    const curRoom = map[player.room[1]][player.room[0]];
    if (!curRoom) return;

    // 1. Draw tiles
    for (let y = 0; y < curRoom.tiles.length; y++) {
        for (let x = 0; x < curRoom.tiles[y].length; x++) {
            ctx.fillStyle = curRoom.tiles[y][x] === 1 ? "#0f0f0f" : "#575757";
            ctx.fillRect(x * TILE_WIDTH, y * TILE_HEIGHT + 125, TILE_WIDTH + 1, TILE_HEIGHT + 1);
        }
    }

    // Separator line
    ctx.fillStyle = "white";
    ctx.fillRect(0, SCREEN_ZERO, WIDTH, 3);

    // 2. Draw objects (organs)
    for (const object of curRoom.objects) {
        if (object.type === "organ") {
            switch (object.name) {
                case "brain":
                    ctx.fillStyle = "pink";
                    ctx.fillRect(object.x, object.y, 20, 20);
                    break;
                case "heart":
                    ctx.fillStyle = "red";
                    ctx.fillRect(object.x, object.y, 20, 20);
                    break;
                case "liver":
                    ctx.fillStyle = "brown";
                    ctx.fillRect(object.x, object.y, 20, 20);
                    break;
                case "kidney":
                    ctx.fillStyle = "darkred";
                    ctx.fillRect(object.x, object.y, 20, 20);
                    break;
                case "lung":
                    ctx.fillStyle = "lightgrey";
                    ctx.fillRect(object.x, object.y, 10, 20);
                    ctx.fillRect(object.x + 15, object.y, 10, 20);
                    break;
                case "stomach":
                    ctx.fillStyle = "orange";
                    ctx.fillRect(object.x, object.y, 20, 10);
                    break;
                default:
                    ctx.fillStyle = "white";
                    ctx.fillRect(object.x, object.y, 20, 20);
            }
        }
    }

    // 3. Draw enemies
    for (const enemy of curRoom.enemies) {
        ctx.fillStyle = "green";
        ctx.fillRect(enemy.x, enemy.y, 32, 32);
    }

if (curRoom.type === "shop") {
    for (const obj of curRoom.objects) {
        if (obj.type !== "upgrade") continue;

        ctx.fillStyle = obj.bought ? "#222" : "#444";
        ctx.fillRect(obj.x, obj.y, 40, 40);

        ctx.fillStyle = "white";
        ctx.fillText(obj.upgrade.label, obj.x - 20, obj.y - 10);
        ctx.fillText("$" + obj.upgrade.cost, obj.x + 5, obj.y + 60);
    }
}


    // 4. Draw player
    if (!player.invincible || Math.floor(performance.now() / 100) % 2 === 0) {
        ctx.drawImage(
            playerImg,
            player.x - 16,
            player.y - 16,
            40,
            40
        );
    }

    // 5. Draw projectiles on top
    for (const projectile of player.projectiles) {
        ctx.fillStyle = "#4797ff";
        ctx.fillRect(projectile.x, projectile.y, 10, 10);
    }

    let i = 0;
    for (const k in organMarket) {
        const count = player.inventory.filter(o => o.name === k).length;

        ctx.fillStyle = "#333";
        ctx.fillRect(10 + i * 110, 90, 100, 30);

        ctx.fillStyle = "white";
        ctx.fillText(
            k.toUpperCase() + " " + count,
            15 + i * 110,
            110
        );

        i++;
    }



    if (marketUI.open && marketUI.selected) {
        const m = organMarket[marketUI.selected];

        ctx.fillStyle = "black";
        ctx.fillRect(80, 150, WIDTH - 160, HEIGHT - 200);

        // GRAPH
        const hx = m.history;
        const baseX = 120;

const graphTop = 200;
const graphBottom = 420;
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
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}



        // INFO
        const count = player.inventory.filter(o => o.name === marketUI.selected).length;
        ctx.fillStyle = "white";
        ctx.fillText("PRICE: " + m.price, 120, 180);
        ctx.fillText("YOU OWN: " + count, 120, 210);
        ctx.fillText("TOTAL WORTH: " + count * m.price, 120, 240);

        // BUTTONS
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
    requestAnimationFrame(mainLoop); // ~60 FPS
}

function shoot() {
    const now = performance.now(); // current time in ms
    const cooldown = 1000 / player.fire_rate; // ms between shots

    if (now - player.lastShot < cooldown) return; // still cooling down
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
        vy: (dy / dist) * player.fire_speed
    });
}

function collidingTile(x, y, room) {
    // Player rectangle (32x32 assumed)
    const left = x - 16;
    const right = x + 16;
    const top = y - 16 - SCREEN_ZERO;
    const bottom = y + 16 - SCREEN_ZERO;

    for (let ty = 0; ty < room.tiles.length; ty++) {
        for (let tx = 0; tx < room.tiles[0].length; tx++) {
            if (room.tiles[ty][tx] === 1) {
                const tileLeft = tx * TILE_WIDTH;
                const tileRight = tileLeft + TILE_WIDTH;
                const tileTop = ty * TILE_HEIGHT;
                const tileBottom = tileTop + TILE_HEIGHT;

                // Check rectangle collision
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
    const MINIMAP_SIZE = 100;          // width/height of minimap square
    const GRID = map.length;           // number of rooms in a row/column
    const ROOM_SIZE = MINIMAP_SIZE / GRID; // size of each room on minimap
    const OFFSET_X = WIDTH - MINIMAP_SIZE - 10; // right margin
    const OFFSET_Y = 10;               // top margin in black bar

    for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
            let room = map[y][x];
            if (!room) continue;
            ctx.fillStyle = room.cleared ? "#444" : "#222"; // cleared vs uncleared
            ctx.fillRect(
                OFFSET_X + x * ROOM_SIZE,
                OFFSET_Y + y * ROOM_SIZE,
                ROOM_SIZE - 1,
                ROOM_SIZE - 1
            );
        }
    }

    // draw current player room
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

    // Add cash based on enemy type
    switch (type) {
        case "zombie":
            player.cash += 10;
            break;
    }

    // Chance to drop 0, 1, or 2 organs
    const dropCount = Math.floor(Math.random() * 3); // 0, 1, or 2
    for (let i = 0; i < dropCount; i++) {
        const organ = organTypes[Math.floor(Math.random() * organTypes.length)];
        // Slight random offset so they don't all stack exactly on enemy
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
            // SELL
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
            // BUY
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
