import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import firebaseConfig from "../firebaseConfig.js";
import { collection, getDoc, addDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getFirestore(app);

import {
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

export async function register(username, email, password) {
    try {
        const userCredentials = await createUserWithEmailAndPassword(auth, email, password)
        console.log(userCredentials.user, username)
        await createUser(userCredentials.user.uid, username)
        window.location.href = "../gacha.html"
    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage)
    }
}



async function createUser(id, username){
    try {
        await addDoc(collection(db, "users"), { id, username })
    } catch (e) {
        console.error('Failed to create user', e)
    }
}

export async function login(email, password) {
    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            console.log(`successfully logged in as ${email}!`)
            window.location.href = "../gacha.html"
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error(errorCode, errorMessage)
        });
}
