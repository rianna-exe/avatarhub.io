import { register } from "./auth.js";

document.getElementById('signup').addEventListener('click', (e)=>{
e.preventDefault();
    console.log("works")

    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    const userInput = document.getElementById('username-input');

    register(userInput.value, emailInput.value, passwordInput.value).catch(e, () => {
            console.error(`Failed to login user: ${userInput.value}`)
            console.error(`Error: ${error.code}, message: ${error.message}`)
        })


})
