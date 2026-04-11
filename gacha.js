import { auth, db } from "./scripts/global.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { collection, getDoc, addDoc, getDocs, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

let slideCards = [];
const carouselContainer = document.getElementById("carousel");
const navContainer = document.getElementById("carousel-nav");
const prevBtn = document.querySelector('.slider-btn:first-child');
const nextBtn = document.querySelector('.slider-btn:last-child');
const nav = document.getElementById('carousel-nav');

let uid; 

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in
    uid = user.uid;
    const email = user.email;
    const username = await getUsername(uid);
    document.getElementById("welcome").innerHTML=`Welcome ${username}`;
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
            let request = await fetch(`https:/last-airbender-api.fly.dev/api/v1/characters/${element.id}`);
            let response = await request.json();
            console.log(response)

            html += `
                <div class="characterpage-card" id="card-${response._id}">
                <img src="${response.photoUrl}">
                <p>${response.name}</p>
                <div class="character-details" id="details-${response._id}"></div>
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
        <button id="save-character-btn" class="save-btn">Save Character</button>
    </div>
`;
document.body.appendChild(gachaOverlay);

// to fetch a random character
async function rollRandomCharacter() {
    try {
       const response = await fetch('https://last-airbender-api.fly.dev/api/v1/characters?perPage=100');
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
    
    popupContent.innerHTML = `
        <img src="${character.photoUrl}">
        <h2>${character.name}</h2>
        <p><b>Affiliation:</b> ${character.affiliation}</p>
        <p><b>Allies:</b> ${character.allies}</p>
        <p><b>Enemies:</b> ${character.enemies}</p>
    `;
    
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

function addPoints(currChar) {
    if(currChar.name.includes("Zuko")) return 10;
    else if(currChar.name.includes("Dee")) return 100;
    else return 5;
}

// Save character button functionality
document.getElementById('save-character-btn').addEventListener('click', function() {
    if (currentRolledCharacter) {
        // handle saving the character
        alert(`${currentRolledCharacter.name}" has been added to your collection!`);
        
      //  save logic here
        const id = currentRolledCharacter._id;
        const points = addPoints(currentRolledCharacter);

        addDoc(collection(db, "gachaItems"), { id, points , uid })
        fetchDataFromDB(uid);
        
        // Close the popup after saving
        closeGachaPopup();
    }
});

// Add click event to the roll button
rollBtn.addEventListener('click', rollRandomCharacter);

async function loadSlides(){
    let featuredCharacters = ["Aang", "Katara","Sokka","Toph","Zuko", "Korra","Asami","Mako","Bolin"];
    let characterData = [];

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

            renderSlides();
            renderNav();

            
        } catch(error){
            console.error(error);
        }
    }

    console.log(slideCards);

}

function renderSlides(){
    let html = "";
    let i = 1;
    for(let character of slideCards){
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
            <span class="badge">RARE</span>
        </div>
        `
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