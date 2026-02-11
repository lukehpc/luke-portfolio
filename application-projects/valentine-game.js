// 1. DATA & SKINS
let totalCoins = parseInt(localStorage.getItem('totalCoins')) || 0;
let unlockedSkins = JSON.parse(localStorage.getItem('unlockedSkins')) || ['classic'];
let activeColor = localStorage.getItem('activeColor') || '#ff6b6b';

const shopSkins = [
    { id: 'classic', name: 'Classic Red', hex: '#ff6b6b', price: 0 },
    { id: 'blue', name: 'Thrifter Blue', hex: '#38bdf8', price: 200 },
    { id: 'gold', name: 'Vintage Gold', hex: '#fbbf24', price: 500 },
    { id: 'rose', name: 'Velvet Rose', hex: '#f472b6', price: 750 },
    { id: 'midnight', name: 'Midnight', hex: '#6366f1', price: 1000 },
    { id: 'neon', name: 'Neon Synth', hex: '#2dd4bf', price: 1500 }
];

const bgMusic = document.getElementById('bgMusic');
const buySound = document.getElementById('buySound');
const deathSound = document.getElementById('deathSound');
const menuSound = document.getElementById('menuSound');
let isMuted = false;

// IMAGES
const imgBackground = new Image(); imgBackground.src = 'images/background.png';
const imgCloud = new Image(); imgCloud.src = 'images/clouds.png';
const imgTable = new Image(); imgTable.src = 'images/tables.png';
const imgWoodTable = new Image(); imgWoodTable.src = 'images/wood-tables.png';
const imgVehicles = new Image(); imgVehicles.src = 'images/vehicles.png';
const imgTrees = new Image(); imgTrees.src = 'images/trees.png';
const imgCar = new Image(); imgCar.src = 'images/car.png';
const imgRail = new Image(); imgRail.src = 'images/rail.png';
const imgPigeon = new Image(); imgPigeon.src = 'images/pigeons.png';
const imgClothes = new Image(); imgClothes.src = 'images/clothes.png';
const imgVinyl = new Image(); imgVinyl.src = 'images/vinyls.png';
const imgPin = new Image(); imgPin.src = 'images/pins.png';

const dogImages = [[], []];
for(let i=1; i<=2; i++) {
    ['a','b','c'].forEach(frame => {
        let img = new Image();
        img.src = `images/whippet${i}${frame}.png`;
        dogImages[i-1].push(img);
    });
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false; 

// GAME ARRAYS
let obstacles = [];
let collectables = [];
let bgDecor = []; 
let dustParticles = [];
let windLines = [];

let frameCount = 0;
let score = 0;
let gameActive = false; 
let isDucking = false;
let runInventory = { Clothes: 0, Vinyls: 0, Pins: 0 };
let collectStreak = 0;
let whippetActive = false;
let whippetX = -300;
let wasGroundedLastFrame = true;

let gameSpeed = 6; 
let nextObstacleSpawn = 100;
let nextCollectableSpawn = 150;
let nextBgSpawn = 20;

let clouds = [{ x: 100, y: 40, s: 0.2 }, { x: 600, y: 80, s: 0.3 }, { x: 1100, y: 50, s: 0.1 }];

const player = {
    x: 80, y: 350, width: 50, height: 50, 
    color: activeColor, dy: 0, jumpForce: 15,
    gravity: 0.7, grounded: false
};

function startGame() {
    gameActive = true;
    document.getElementById('start-screen').style.display = 'none';
    if (!isMuted) { bgMusic.play(); menuSound.play(); }
    if (frameCount === 0) animate();
}

function playAgain() {
    document.getElementById('game-ui-overlay').style.display = 'none';
    nextObstacleSpawn = 100; nextCollectableSpawn = 150; nextBgSpawn = 20;
    obstacles = []; collectables = []; bgDecor = []; dustParticles = []; windLines = [];
    frameCount = 0; score = 0; gameSpeed = 6;
    runInventory = { Clothes: 0, Vinyls: 0, Pins: 0 }; collectStreak = 0;
    localStorage.setItem('unsoldValue', 0);
    player.y = 350; player.dy = 0; player.grounded = true;
    gameActive = true;
    if (!isMuted) { bgMusic.currentTime = 0; bgMusic.play(); menuSound.play(); }
}

function resetProgress() {
    if(confirm("DANGER: Wiping all coins and skins. Proceed?")) {
        localStorage.clear(); location.reload();
    }
}

function createDust(x, y, count, speedMult = 1) {
    for(let i=0; i<count; i++) {
        const colors = ['rgba(165, 124, 94,', 'rgba(139, 94, 60,', 'rgba(115, 84, 56,'];
        const chosenColor = colors[Math.floor(Math.random() * colors.length)];
        dustParticles.push({ 
            x: x, y: y, size: 4 + Math.random() * 5, life: 1, 
            vx: speedMult * (Math.random() * -3 - 1), vy: speedMult * (Math.random() * -2.5),
            color: chosenColor
        });
    }
}

function animate() {
    if (!gameActive) { requestAnimationFrame(animate); return; }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frameCount++; 
    if (frameCount % 10 === 0) score++;
    if (frameCount % 500 === 0) gameSpeed += 0.5;

    // --- 1. BACKGROUND ---
    let bgScale = Math.max(canvas.width / imgBackground.width, canvas.height / imgBackground.height);
    ctx.drawImage(imgBackground, (canvas.width - imgBackground.width * bgScale) / 2, (canvas.height - imgBackground.height * bgScale) / 2, imgBackground.width * bgScale, imgBackground.height * bgScale);

    // --- 2. WIND LINES ---
    if (frameCount % 50 === 0) {
        windLines.push({ x: canvas.width, y: Math.random() * 320, w: 150 + Math.random() * 200 });
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1.5;
    windLines.forEach((line, i) => {
        line.x -= gameSpeed * 2.8;
        ctx.beginPath(); ctx.moveTo(line.x, line.y); ctx.lineTo(line.x + line.w, line.y); ctx.stroke();
        if (line.x + line.w < 0) windLines.splice(i, 1);
    });

    // --- 3. CLOUDS ---
    clouds.forEach(c => {
        c.x -= (gameSpeed * c.s);
        ctx.drawImage(imgCloud, Math.floor(c.x), c.y, 100, 50);
        if (c.x < -200) c.x = canvas.width + 100;
    });

    // --- 4. PARALLAX SPAWNING ---
    if (frameCount >= nextBgSpawn) {
        let rand = Math.random();
        let item = null;
        const getLastInLane = (lane) => {
            const laneItems = bgDecor.filter(d => d.lane === lane);
            return laneItems.length > 0 ? laneItems[laneItems.length - 1] : null;
        };

        if (rand < 0.20) {
            const last = getLastInLane('trees');
            if (!last || last.x < canvas.width - (500 + Math.random() * 500)) {
                item = { x: canvas.width, y: 70, w: 450, h: 180, img: imgTrees, speed: 0.02, lane: 'trees' };
            }
        } else if (rand < 0.45) {
            const last = getLastInLane('mid');
            if (!last || last.x < canvas.width - (650 + Math.random() * 400)) {
                item = { x: canvas.width, y: 130, w: 550, h: 140, img: imgWoodTable, speed: 0.10, lane: 'mid' };
            }
        } else if (rand < 0.70) {
            const last = getLastInLane('far');
            if (!last || last.x < canvas.width - (450 + Math.random() * 500)) {
                item = { x: canvas.width, y: 160, w: 280, h: 150, img: imgVehicles, speed: 0.15, lane: 'far' };
            }
        } else {
            const last = getLastInLane('front');
            if (!last || last.x < canvas.width - (500 + Math.random() * 600)) {
                item = { x: canvas.width, y: 230, w: 250, h: 140, img: imgTable, speed: 0.4, lane: 'front' };
            }
        }
        if (item) { bgDecor.push(item); nextBgSpawn = frameCount + 20 + Math.floor(Math.random() * 40); }
        else { nextBgSpawn = frameCount + 5; }
    }

    // --- 5. RENDER LAYERS ---
    bgDecor.filter(d => d.lane === 'trees').forEach(d => { d.x -= (gameSpeed * d.speed); ctx.drawImage(d.img, Math.floor(d.x), d.y, d.w, d.h); });
    bgDecor.filter(d => d.lane === 'mid').forEach(d => { d.x -= (gameSpeed * d.speed); ctx.drawImage(d.img, Math.floor(d.x), d.y, d.w, d.h); });
    bgDecor.filter(d => d.lane === 'far').forEach(d => { d.x -= (gameSpeed * d.speed); ctx.drawImage(d.img, Math.floor(d.x), d.y, d.w, d.h); });
    if (whippetActive) {
        whippetX += (gameSpeed * 1.1);
        let frame = Math.floor(frameCount / 5) % 3;
        ctx.drawImage(dogImages[0][frame], whippetX, 260, 110, 65);
        ctx.drawImage(dogImages[1][frame], whippetX - 90, 280, 110, 65);
        if (whippetX > canvas.width + 200) { whippetActive = false; whippetX = -300; }
    }
    bgDecor.filter(d => d.lane === 'front').forEach(d => { d.x -= (gameSpeed * d.speed); ctx.drawImage(d.img, Math.floor(d.x), d.y, d.w, d.h); });

    bgDecor = bgDecor.filter(d => d.x > -600);

    // --- 6. DUST ---
    if (player.grounded && !isDucking && frameCount % 6 === 0) { createDust(player.x + 5, player.y + player.height, 1); }
    dustParticles.forEach((p, i) => {
        p.x += p.vx - (gameSpeed * 0.5); p.y += p.vy; p.life -= 0.04;
        ctx.fillStyle = p.color + p.life + ')';
        ctx.fillRect(p.x, p.y - p.size, p.size, p.size);
        if (p.life <= 0) dustParticles.splice(i, 1);
    });

    // --- 7. OBSTACLES ---
    if (frameCount >= nextObstacleSpawn) {
        let rand = Math.random();
        let type, yPos, w, h, img;
        if (rand < 0.25) { type = 'pigeon'; yPos = 220; w = 80; h = 60; img = imgPigeon; }
        else { type = 'ground'; yPos = 300; w = 120; h = 100; img = rand < 0.6 ? imgCar : imgRail; }
        obstacles.push({ x: canvas.width, y: yPos, width: w, height: h, img: img, type: type });
        nextObstacleSpawn = frameCount + 80 + Math.floor(Math.random() * 50);
    }
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i]; obs.x -= gameSpeed;
        ctx.drawImage(obs.img, Math.floor(obs.x), obs.y, obs.width, obs.height);
        if (player.x < obs.x + obs.width - 30 && player.x + player.width > obs.x + 30 && player.y < obs.y + obs.height - 20 && player.y + player.height > obs.y + 20) {
            if (!(obs.type === 'pigeon' && isDucking)) { gameOver(); collectStreak = 0; }
        }
        if (obs.x < -150) { obstacles.splice(i, 1); i--; }
    }

    // --- 8. COLLECTABLES ---
    if (frameCount >= nextCollectableSpawn) {
        const itemTypes = [{ name: 'Clothes', value: 5, img: imgClothes }, { name: 'Vinyls', value: 10, img: imgVinyl }, { name: 'Pins', value: 20, img: imgPin }];
        let rand = Math.random();
        let selected = rand < 0.6 ? itemTypes[0] : (rand < 0.9 ? itemTypes[1] : itemTypes[2]);
        collectables.push({ x: canvas.width, y: 280, width: 65, height: 65, ...selected });
        nextCollectableSpawn = frameCount + 100 + Math.floor(Math.random() * 70);
    }
    for (let j = 0; j < collectables.length; j++) {
        let item = collectables[j]; item.x -= gameSpeed;
        ctx.drawImage(item.img, Math.floor(item.x), item.y, item.width, item.height);
        if (player.x < item.x + item.width && player.x + player.width > item.x && player.y < item.y + item.height && player.y + player.height > item.y) {
            runInventory[item.name]++;
            let currentVal = parseInt(localStorage.getItem('unsoldValue')) || 0;
            localStorage.setItem('unsoldValue', currentVal + item.value);
            collectables.splice(j, 1); j--;
            collectStreak++;
            if (collectStreak >= 3) { whippetActive = true; collectStreak = 0; }
        }
    }

    // --- 9. PHYSICS ---
    if (isDucking && player.grounded) { player.height = 25; player.y = canvas.height - 25; } 
    else { player.height = 50; player.dy += player.gravity; player.y += player.dy; }
    if (player.y + player.height >= canvas.height) { 
        player.y = canvas.height - player.height; player.dy = 0; 
        if (!player.grounded && !wasGroundedLastFrame) { createDust(player.x + player.width/2, canvas.height, 12, 1.8); }
        player.grounded = true; 
    } else { player.grounded = false; }
    wasGroundedLastFrame = player.grounded;

    ctx.fillStyle = player.color;
    ctx.fillRect(Math.floor(player.x), Math.floor(player.y), player.width, player.height);
    ctx.fillStyle = 'white'; ctx.font = 'bold 20px Arial'; ctx.fillText(`Distance: ${score}m`, 20, 40);
    requestAnimationFrame(animate);
}

// UI FUNCTIONS
function openShop() {
    if (!isMuted) menuSound.play();
    document.getElementById('game-ui-overlay').style.display = 'none';
    document.getElementById('shop-overlay').style.display = 'block';
    updateShopUI();
}
function closeShop() {
    if (!isMuted) menuSound.play();
    document.getElementById('shop-overlay').style.display = 'none';
    document.getElementById('game-ui-overlay').style.display = 'block';
}
function updateShopUI() {
    document.getElementById('shop-coins').innerText = (totalCoins / 100).toFixed(2);
    const grid = document.getElementById('skin-grid'); grid.innerHTML = ''; 
    shopSkins.forEach(skin => {
        const isUnlocked = unlockedSkins.includes(skin.id);
        const isActive = activeColor === skin.hex;
        const card = document.createElement('div');
        card.style = `background: rgba(15, 23, 42, 0.9); padding: 15px; border-radius: 12px; border: 2px solid ${isActive ? skin.hex : '#334155'};`;
        let btnStr = isActive ? `<button disabled style="background:#1e293b; color:#94a3b8; border:none; padding:8px; width:100%; border-radius:5px;">Equipped</button>` :
                     isUnlocked ? `<button onclick="equipSkin('${skin.hex}')" style="background:#475569; color:white; border:none; padding:8px; width:100%; border-radius:5px; cursor:pointer;">Equip</button>` :
                     `<button onclick="buySkin('${skin.id}', ${skin.price}, '${skin.hex}')" style="background:#22c55e; color:white; border:none; padding:8px; width:100%; border-radius:5px; cursor:pointer;">£${(skin.price/100).toFixed(2)}</button>`;
        card.innerHTML = `<div style="width: 35px; height: 35px; background: ${skin.hex}; border-radius: 50%; margin: 0 auto 10px;"></div><div style="font-size: 0.85rem; margin-bottom: 10px; font-weight: bold;">${skin.name}</div>${btnStr}`;
        grid.appendChild(card);
    });
}
function buySkin(id, price, hex) {
    if (totalCoins >= price) {
        if (!isMuted) { buySound.currentTime = 0; buySound.play(); }
        totalCoins -= price; unlockedSkins.push(id);
        localStorage.setItem('totalCoins', totalCoins); localStorage.setItem('unlockedSkins', JSON.stringify(unlockedSkins));
        equipSkin(hex);
    } else { alert("Not enough coins!"); }
}
function equipSkin(hex) {
    if (!isMuted) menuSound.play();
    activeColor = hex; player.color = hex; localStorage.setItem('activeColor', hex); updateShopUI();
}
function gameOver() {
    gameActive = false; if (!isMuted) deathSound.play(); bgMusic.pause();
    document.getElementById('game-ui-overlay').style.display = 'block';
    document.getElementById('run-clothes').innerText = runInventory.Clothes;
    document.getElementById('run-vinyls').innerText = runInventory.Vinyls;
    document.getElementById('run-pins').innerText = runInventory.Pins;
    document.getElementById('val-clothes').innerText = (runInventory.Clothes * 0.05).toFixed(2);
    document.getElementById('val-vinyls').innerText = (runInventory.Vinyls * 0.10).toFixed(2);
    document.getElementById('val-pins').innerText = (runInventory.Pins * 0.20).toFixed(2);
    document.getElementById('total-coins').innerText = (totalCoins / 100).toFixed(2);
}
function sellItems() {
    let valueToSell = parseInt(localStorage.getItem('unsoldValue')) || 0;
    if (valueToSell > 0) {
        if (!isMuted) { buySound.currentTime = 0; buySound.play(); }
        totalCoins += valueToSell; localStorage.setItem('totalCoins', totalCoins);
        localStorage.setItem('unsoldValue', 0);
        document.getElementById('total-coins').innerText = (totalCoins / 100).toFixed(2);
        ['run-clothes','run-vinyls','run-pins'].forEach(id => document.getElementById(id).innerText = "0");
        ['val-clothes','val-vinyls','val-pins'].forEach(id => document.getElementById(id).innerText = "0.00");
    }
}
function showInfo() { document.getElementById('info-popup').style.display = 'block'; }
function hideInfo() { document.getElementById('info-popup').style.display = 'none'; }
function toggleMute() { isMuted = !isMuted; bgMusic.muted = isMuted; document.getElementById('muteBtn').innerText = isMuted ? "Unmute" : "Mute"; }

// KEYBOARD
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && player.grounded && gameActive) { player.dy = -player.jumpForce; player.grounded = false; }
    if (e.code === 'ArrowDown') isDucking = true;
});
window.addEventListener('keyup', (e) => { if (e.code === 'ArrowDown') isDucking = false; });

// TOUCH
window.addEventListener('touchstart', (e) => {
    if (!gameActive) return;
    const touchY = e.touches[0].clientY;
    const screenHeight = window.innerHeight;
    if (touchY < screenHeight * 0.66) { if (player.grounded) { player.dy = -player.jumpForce; player.grounded = false; } } 
    else { isDucking = true; }
    if (e.target.tagName !== 'BUTTON') e.preventDefault();
}, { passive: false });
window.addEventListener('touchend', () => { isDucking = false; }, { passive: false });