let homepageCards = [];
const cardContainer = document.getElementById("card-container");

async function loadFeatured(){
    let featuredCharacters = ["Aang", "Katara","Sokka","Toph", "Korra","Asami","Mako","Bolin"];
    let characterData = [];

    for(character of featuredCharacters){
        try{
            let characterResponse = await fetch(`https://last-airbender-api.fly.dev/api/v1/characters?name=${character}`)

            if(!characterResponse.ok){
                throw new Error(`Could not fetch ${character}'s data`);
            }

            characterData = await characterResponse.json();
            if(character === "Aang" || character === "Katara" || character === "Sokka"){
                homepageCards.push(characterData[1]);
            } else {
                homepageCards.push(characterData[0]);
            }
            
        } catch(error){
            console.error(error);
        }
    }

    console.log(homepageCards);
    renderCards();

}

function renderCards(){
    let html = "";
    for(character of homepageCards){
        html+=`
        <div class = character-card>
            <img src="${character.photoUrl}">
            <h1 class="character-name">${character.name}</h1>
            <ul>
                    <li>Affiliation: ${character.affiliation}</li>
                    <li>Allies: ${character.allies}</li>
                    <li>Enemies: ${character.enemies}</li>
            </ul>
        </div>
        `
    }

    cardContainer.innerHTML = html;
}

loadFeatured();