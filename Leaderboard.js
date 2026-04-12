import { db } from "./scripts/global.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

async function loadLeaderboard() {


    const tbody = document.querySelector("#leaderboard-table tbody");

    // show spinner
    tbody.innerHTML = `
    <tr>
        <td colspan="4" style="text-align:center; padding:40px;">
            <div class="leaderboard-loading">
                <div class="spinner"></div>
                <p>Loading leaderboard...</p>
            </div>
        </td>
    </tr>
    `;

    // allow DOM to render spinner
    await new Promise(resolve => setTimeout(resolve, 300));

    try {

        const snapshot = await getDocs(collection(db, "gachaItems"));

        let users = {};

        snapshot.forEach(doc => {

            const data = doc.data();
            const uid = data.uid;
            const points = data.points;
            const charId = data.id;

            if (!users[uid]) {
                users[uid] = {
                    points: 0,
                    rarest: "",
                    rarestScore: 0
                };
            }

            users[uid].points += points;

            if (points > users[uid].rarestScore) {
                users[uid].rarestScore = points;
                users[uid].rarest = charId;
            }

        });

        let leaderboard = [];

        // fetch usernames in parallel
        const userPromises = Object.keys(users).map(async uid => {

            const username = await getUsername(uid);

            return {
                username: username,
                points: users[uid].points,
                rarest: users[uid].rarest,
                rarestScore: users[uid].rarestScore
            };

        });

        leaderboard = await Promise.all(userPromises);

        leaderboard.sort((a, b) => b.points - a.points);

        displayLeaderboard(leaderboard);

    } catch (error) {
        console.error(error);
    }

}

async function getUsername(uid) {

    const q = query(collection(db, "users"), where("id", "==", uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return "Unknown";
    }

    return snapshot.docs[0].data().username;
}

async function getCharacterName(id) {

    try {
        const res = await fetch(`https://last-airbender-api.fly.dev/api/v1/characters/${id}`);
        const data = await res.json();
        return data.name;
    } catch {
        return "Unknown";
    }

}

async function displayLeaderboard(data) {

    const tbody = document.querySelector("#leaderboard-table tbody");

    let html = "";

    // fetch all character names in parallel
    const charPromises = data.map(user => getCharacterName(user.rarest));
    const charNames = await Promise.all(charPromises);

    let rank = 1;

    for (let i = 0; i < data.length; i++) {

        const user = data[i];
        const rareChar = charNames[i];

        let rankDisplay = rank;
        let rankClass = "rank-col";

        if (rank === 1) {
            rankDisplay = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffd966" class="rank-1">
                            <path d="M200-160v-80h560v80H200Zm0-140-51-321q-2 0-4.5.5t-4.5.5q-25 0-42.5-17.5T80-680q0-25 17.5-42.5T140-740q25 0 42.5 17.5T200-680q0 7-1.5 13t-3.5 11l125 56 125-171q-11-8-18-21t-7-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820q0 15-7 28t-18 21l125 171 125-56q-2-5-3.5-11t-1.5-13q0-25 17.5-42.5T820-740q25 0 42.5 17.5T880-680q0 25-17.5 42.5T820-620q-2 0-4.5-.5t-4.5-.5l-51 321H200Zm68-80h424l26-167-105 46-133-183-133 183-105-46 26 167Zm212 0Z"/>
                        </svg>`;
            rankClass += " rank-top-1";
        } 
        else if (rank === 2) {
            rankDisplay =  `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#c0cfe0" class="rank-2">
                            <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320ZM360-280h240v-80H440v-80h80q33 0 56.5-23.5T600-520v-80q0-33-23.5-56.5T520-680H360v80h160v80h-80q-33 0-56.5 23.5T360-440v160Z"/></svg>`;
            rankClass += " rank-top-2";
        } 
        else if (rank === 3) {
            rankDisplay = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#cd9f6e" class="rank-3">
                            <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320ZM360-280h160q33 0 56.5-23.5T600-360v-60q0-26-17-43t-43-17q26 0 43-17t17-43v-60q0-33-23.5-56.5T520-680H360v80h160v80h-80v80h80v80H360v80Z"/></svg>`;
            rankClass += " rank-top-3";
        }

        html += `
        <tr>
            <td class="${rankClass}">${rankDisplay}</td>
            <td>
                <div class="player-name">
                    <span>${user.username}</span>
                </div>
            </td>
            <td class="pull-badge">${rareChar}</td>
            <td class="score-cell">${user.points}</td>
        </tr>
        `;

        rank++;

    }

    tbody.innerHTML = html;

}

loadLeaderboard();