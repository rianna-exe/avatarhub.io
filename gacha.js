import { auth, db } from "./scripts/global.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { collection, getDoc, addDoc, getDocs, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

let slideCards = [];
const carouselContainer = document.getElementById("carousel");
const navContainer = document.getElementById("carousel-nav");
const prevBtn = document.querySelector('.slider-btn:first-child');
const nextBtn = document.querySelector('.slider-btn:last-child');
const nav = document.getElementById('carousel-nav');

//rolling variables
let rollCount = 0;
let lastRollTime = null;
let cooldownTimer = null;
const ROLL_LIMIT = 10;
const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

let uid; 

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in
    uid = user.uid;
    const email = user.email;
    const username = await getUsername(uid);
    document.getElementById("welcome").innerHTML=`Welcome, ${username}!`;
    console.log(user)
  } else {
    // User is signed out
  }
});

async function fetchDataFromDB(userid) {
    try {
        let items = [];
        const q = query(collection(db, "gachaItems"), where("uid", "==", userid));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log("No gacha items found");
            return;
        }
        const invList = document.getElementById("inventory-list");
        let html = '';

        snapshot.forEach(doc => {
            items.push(doc.data());
        });

        for await (const element of items) {
            let request = await fetch(`https://last-airbender-api.fly.dev/api/v1/characters/${element.id}`);
            let response = await request.json();
            console.log(response)

            html += `
                <div class="characterpage-card" id="card-${response._id}">
                <img src="${response.photoUrl}">
                <p>${response.name}</p>
                </div>
            `;
        }

        invList.innerHTML = html;

    } catch (error) {
        console.error(error);
    }
}

async function getUsername(userid){
    try {
        const q = query(collection(db, "users"), where("id", "==", userid));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log("No user found");
            return null;
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        console.log(userData.username);

        await fetchDataFromDB(userid);

        return userData.username;

    } catch(error){
        console.error(error);
    }
}

const rollBtn = document.getElementById('roll-btn');
let currentRolledCharacter = null;

//overlay
const gachaOverlay = document.createElement('div');
gachaOverlay.id = 'gacha-overlay';
gachaOverlay.className = 'spotlight-overlay';
gachaOverlay.innerHTML = `
    <div class="spotlight-card">
        <button class="close-btn" onclick="closeGachaPopup(event)">x</button>
        <div id="gacha-popup-content"></div>
        <button id="save-character-btn" class="save-btn" style="padding: 10px; background-color: #fcdc7b; color: 1c1c1c; border-radius: 5px; margin: 2px;">Save Character</button>
    </div>
`;
document.body.appendChild(gachaOverlay);

// to fetch a random character
async function rollRandomCharacter() {
    try {
       const response = await fetch('https://last-airbender-api.fly.dev/api/v1/characters?perPage=300');
        const characters = await response.json();
        
        // Pick a random character from the first 100
        const randomIndex = Math.floor(Math.random() * characters.length);
        const randomCharacter = characters[randomIndex];
        
        currentRolledCharacter = randomCharacter;
        displayGachaResult(randomCharacter);
        console.log(currentRolledCharacter)
    } catch (error) {
        console.error('Error rolling character:', error);
        alert('Failed to roll a character. Please try again.');
    }
}

// Function to display the rolled character in a popup
function displayGachaResult(character) {
    const popupContent = document.getElementById('gacha-popup-content');
    const overlay = document.getElementById('gacha-overlay');

    const isAvatar = avatarNames.some(avatarName => 
        character.name.includes(avatarName)
    );

    
    if (isAvatar) {
        popupContent.innerHTML = `
        <div style="padding: 20px 15px; border-radius: 5px; color: var(--yellow); font-family: 'avatar-subfont'; font-size: 1.5em;">LEGENDARY</div>
        <img src="${character.photoUrl}">
        <h2>${character.name}</h2>
        <p><b>Affiliation:</b> ${character.affiliation || "Unknown"}</p>
        <p><b>Allies:</b> ${(character.allies || []).join(", ") || "None"}</p>
        <p><b>Enemies:</b> ${(character.enemies || []).join(", ") || "None"}</p>
    `;
    }
    else if (rareCharacters.some(rareName => 
        character.name.includes(rareName)
    )) {
                popupContent.innerHTML = `
        <div style="padding: 20px 15px; border-radius: 5px; color: var(--yellow); font-family: 'avatar-subfont'; font-size: 1.5em;">RARE</div>
        <img src="${character.photoUrl}">
        <h2>${character.name}</h2>
        <p><b>Affiliation:</b> ${character.affiliation || "Unknown"}</p>
        <p><b>Allies:</b> ${(character.allies || []).join(", ") || "None"}</p>
        <p><b>Enemies:</b> ${(character.enemies || []).join(", ") || "None"}</p>
    `;
    }
    else {
                popupContent.innerHTML = `
        <div style="padding: 20px 15px; border-radius: 5px; color: var(--yellow); font-family: 'avatar-subfont'; font-size: 1.5em;">COMMON</div>
        <img src="${character.photoUrl}">
        <h2>${character.name}</h2>
        <p><b>Affiliation:</b> ${character.affiliation || "Unknown"}</p>
        <p><b>Allies:</b> ${(character.allies || []).join(", ") || "None"}</p>
        <p><b>Enemies:</b> ${(character.enemies || []).join(", ") || "None"}</p>
    `;
    }
    
    
    overlay.classList.add('active');
}

// Function to close the popup
window.closeGachaPopup = function(e) {
    if (e && e.stopPropagation) {
        e.stopPropagation();
    }
    const overlay = document.getElementById('gacha-overlay');
    overlay.classList.remove('active');
}

// Close popup when clicking outside
gachaOverlay.addEventListener('click', function(e) {
    if (e.target === gachaOverlay) {
        closeGachaPopup();
    }
});

// Points system========================

const rareCharacters = ["Azula","Zuko","Katara","Sokka","Toph","Appa","Asami","Kuvira","Lin","Mako","Bolin","Momo","Foo"]; 

let avatarNames = []; 

async function loadAvatars() {
    try {
        const response = await fetch('https://last-airbender-api.fly.dev/api/v1/characters/avatar');
        const avatars = await response.json();
        avatarNames = avatars.map(avatar => avatar.name);
        console.log("Avatars loaded:", avatarNames);
    } catch(error) {
        console.error("Failed to load avatars:", error);
    }
}

await loadAvatars();

function addPoints(currChar) {
    console.log("CURRENT CHAR:", currChar);
    
    // Check if it's an Avatar (20 points)
    const isAvatar = avatarNames.some(avatarName => 
        currChar.name.includes(avatarName)
    );
    
    if (isAvatar) {
        return 20; // Legendary pull!
    }
    // Check if it's a rare character (10 points)
    else if (rareCharacters.some(rareName => 
        currChar.name.includes(rareName)
        
    )) {
        return 10;
    }
    // Regular character (5 points)
    else {
        return 5;
    }
}

//toast function for saving characters
function toast(characterName,points) {
    const message = `Saved: ${characterName} (+${points})`;

    console.log(`%c ${message} `, "background: #dc8c24; color: #fbf9df; padding: 4px 8px; border-radius: 4px; font-weight: bold;");

    //styling toast
    const toastEl = document.createElement("div");
    toastEl.textContent = message;
    toastEl.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #dc8c24;
        color: #fbf9df;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: bold;
        font-family: 'Verdana', 'Segoe UI', Geneva, Tahoma, sans-serif;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: fadeInOut 2s ease forwards;
    `;

    document.body.appendChild(toastEl);
    
    // Remove after 2 seconds
    setTimeout(() => toastEl.remove(), 2000);
}


// Save character button functionality
document.getElementById('save-character-btn').addEventListener('click', function() {

    if(!uid) {
        alert("You must be logged in to save characters");
        window.location.href = "Login.html";  //sendthem to log in page
        return;
    }
    
    if (currentRolledCharacter) { 
      //  save logic here
        const id = currentRolledCharacter._id;
        const points = addPoints(currentRolledCharacter);
        console.log(points);

        //notifying the save
        toast(`${currentRolledCharacter.name}`, points);

        addDoc(collection(db, "gachaItems"), { id, points , uid })
        fetchDataFromDB(uid);
        
        // Close the popup after saving
        closeGachaPopup();
    }
});

// Modified roll function
async function handleRollWithLimit() {
    // Check if user has roll limit in localStorage
    const savedData = localStorage.getItem(`rollData_${uid}`);
    
    if (savedData) {
        const data = JSON.parse(savedData);
        rollCount = data.rollCount;
        lastRollTime = new Date(data.lastRollTime);
        
        // Check if cooldown has expired
        const timeSinceLastRoll = new Date() - lastRollTime;
        
        if (rollCount >= ROLL_LIMIT && timeSinceLastRoll < COOLDOWN_MS) {
            const remainingSeconds = Math.ceil((COOLDOWN_MS - timeSinceLastRoll) / 1000);
            alert(`You've used all ${ROLL_LIMIT} rolls! Please wait ${remainingSeconds} seconds.`);
            startCooldownDisplay(remainingSeconds);
            return;
        } else if (timeSinceLastRoll >= COOLDOWN_MS) {
            // Reset rolls after cooldown
            rollCount = 0;
        }
    }
    
    if (rollCount >= ROLL_LIMIT) {
        alert(`You've reached the maximum of ${ROLL_LIMIT} rolls. Please wait 2 minutes!`);
        startCooldownDisplay(120);
        return;
    }
    
    // Perform the roll
    await rollRandomCharacter();
    rollCount++;
    lastRollTime = new Date();
    
    // Save to localStorage
    localStorage.setItem(`rollData_${uid}`, JSON.stringify({
        rollCount: rollCount,
        lastRollTime: lastRollTime.toISOString()
    }));
    
    // If reached roll limit, start cooldown
    if (rollCount >= ROLL_LIMIT) {
        startCooldownDisplay(120);
    }
}

function startCooldownDisplay(remainingSeconds) {
    const rollBtn = document.getElementById('roll-btn');
    rollBtn.disabled = true;
    rollBtn.style.opacity = '0.6';
    
    let timerDisplay = document.getElementById('cooldown-timer');
    if (!timerDisplay) {
        timerDisplay = document.createElement('div');
        timerDisplay.id = 'cooldown-timer';
        timerDisplay.style.marginTop = '10px';
        rollBtn.parentNode.insertBefore(timerDisplay, rollBtn.nextSibling);
    }
    
    if (cooldownTimer) clearInterval(cooldownTimer);
    
    let remaining = remainingSeconds;
    cooldownTimer = setInterval(() => {
        remaining--;
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        timerDisplay.textContent = `⏱️ Cooldown: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (remaining <= 0) {
            clearInterval(cooldownTimer);
            rollBtn.disabled = false;
            rollBtn.style.opacity = '1';
            timerDisplay.remove();
            alert("Cooldown finished! You can roll again!");
        }
    }, 1000);
}

// Add click event to the roll button
rollBtn.addEventListener('click', handleRollWithLimit);

async function loadSlides(){
    let featuredCharacters = ["Aang", "Katara","Sokka","Toph","Zuko", "Korra","Asami","Mako","Bolin"];
    let characterData = [];
    let rarity = ["LEGENDARY", "RARE"];

    carouselContainer.innerHTML = "<h3>Loading...</h3>"

    for(let character of featuredCharacters){
        try{
            let characterResponse = await fetch(`https://last-airbender-api.fly.dev/api/v1/characters?name=${character}`)

            if(!characterResponse.ok){
                throw new Error(`Could not fetch ${character}'s data`);
            }

            characterData = await characterResponse.json();
            if(character === "Aang" || character === "Katara" || character === "Sokka" || character === "Zuko"){
                slideCards.push(characterData[1]);
            } else {
                slideCards.push(characterData[0]);
            }

            renderSlides(rarity);
            renderNav();

            
        } catch(error){
            console.error(error);
        }
    }

    console.log(slideCards);

}

function renderSlides(rarity){
    let html = "";
    let i = 1;
    for(let character of slideCards){
        if(character.name.includes("Aang") || character.name.includes("Korra")){
        html+=`
        <div id="slide-${i}" class="slide">
            <div class="slide-image">
                <img src="${character.photoUrl}">
            </div>
            <div class="slide-stats">
                <h2>${character.name}</h2>
                <p><strong>Affiliation</strong>: ${character.affiliation}</p>
                <p><strong>Allies</strong>: ${character.allies}</p>
                <p><strong>Enemies</strong>: ${character.enemies}</p>
            </div>
            <span class="badge">${rarity[0]}</span>
        </div>
        `
        }else{
        html+=`
        <div id="slide-${i}" class="slide">
            <div class="slide-image">
                <img src="${character.photoUrl}">
            </div>
            <div class="slide-stats">
                <h2>${character.name}</h2>
                <p><strong>Affiliation</strong>: ${character.affiliation}</p>
                <p><strong>Allies</strong>: ${character.allies}</p>
                <p><strong>Enemies</strong>: ${character.enemies}</p>
            </div>
            <span class="badge">${rarity[1]}</span>
        </div>
        `
        }
        i = i + 1;
    }
    carouselContainer.innerHTML = html;
    setTimeout(updateActiveNav, 100);

}

function renderNav(){
    let html = "";
    let i = 1;

    for(let character of slideCards){
        html+=`
        <a href="#slide-${i}"></a>
        `
        i = i + 1;
    }
    navContainer.innerHTML = html;
}

function updateActiveNav() {
    let scrollPos = carouselContainer.scrollLeft;
    let slideWidth = carouselContainer.clientWidth;
    let activeIndex = Math.round(scrollPos / slideWidth);
    
    let dots = document.querySelectorAll('#carousel-nav a');
    dots.forEach((dot, i) => {
        if (i === activeIndex) {
            dot.style.opacity = '1';
            dot.style.backgroundColor = '#dc8c24';
        } else {
            dot.style.opacity = '0.5';
            dot.style.backgroundColor = '#5c3026';
        }
    });
}

prevBtn.onclick = () => {
    carouselContainer.scrollBy({ left: -500, behavior: 'smooth' });
    setTimeout(updateActiveNav, 200);
};

nextBtn.onclick = () => {
    carouselContainer.scrollBy({ left: 500, behavior: 'smooth' });
    setTimeout(updateActiveNav, 200);
};

setTimeout(updateActiveNav, 200);

loadSlides();