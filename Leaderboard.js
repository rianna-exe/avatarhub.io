import { db } from "./scripts/global.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

async function loadLeaderboard() {

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
            rankDisplay = "🥇 1";
            rankClass += " rank-top-1";
        } 
        else if (rank === 2) {
            rankDisplay = "🥈 2";
            rankClass += " rank-top-2";
        } 
        else if (rank === 3) {
            rankDisplay = "🥉 3";
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