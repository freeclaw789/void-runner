const shopBtn = document.getElementById('shop-btn');
const shopMenu = document.getElementById('shop-menu');
const closeShop = document.getElementById('close-shop');
const totalGemsDisplay = document.getElementById('total-gems-display');
const shieldLvlDisplay = document.getElementById('shield-lvl');
const magnetLvlDisplay = document.getElementById('magnet-lvl');
const buyShield = document.getElementById('buy-shield');
const buyMagnet = document.getElementById('buy-magnet');

function updateShopUI() {
    totalGemsDisplay.innerText = `GEMS: ${totalGems}`;
    shieldLvlDisplay.innerText = shieldLevel;
    magnetLvlDisplay.innerText = magnetLevel;
    buyShield.innerText = `BUY: ${50 * shieldLevel}`;
    buyMagnet.innerText = `BUY: ${50 * magnetLevel}`;
}

shopBtn.addEventListener('click', () => {
    updateShopUI();
    shopMenu.style.display = 'block';
});

closeShop.addEventListener('click', () => {
    shopMenu.style.display = 'none';
});

buyShield.addEventListener('click', () => {
    const cost = 50 * shieldLevel;
    if (totalGems >= cost) {
        totalGems -= cost;
        shieldLevel++;
        localStorage.setItem('voidRunnerTotalGems', totalGems);
        localStorage.setItem('voidRunnerShieldLvl', shieldLevel);
        updateShopUI();
        showToast('UPGRADE', 'Shield Duration Increased!');
    } else {
        showToast('ERROR', 'Not enough gems!');
    }
});

buyMagnet.addEventListener('click', () => {
    const cost = 50 * magnetLevel;
    if (totalGems >= cost) {
        totalGems -= cost;
        magnetLevel++;
        localStorage.setItem('voidRunnerTotalGems', totalGems);
        localStorage.setItem('voidRunnerMagnetLvl', magnetLevel);
        updateShopUI();
        showToast('UPGRADE', 'Magnet Range Increased!');
    } else {
        showToast('ERROR', 'Not enough gems!');
    }
});