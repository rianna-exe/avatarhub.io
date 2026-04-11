import { getAuth} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import firebaseConfig from "../firebaseConfig.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getFirestore(app);