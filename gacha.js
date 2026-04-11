let slideCards = [];
const carouselContainer = document.getElementById("carousel");
const navContainer = document.getElementById("carousel-nav");
const prevBtn = document.querySelector('.slider-btn:first-child');
const nextBtn = document.querySelector('.slider-btn:last-child');
const nav = document.getElementById('carousel-nav');


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