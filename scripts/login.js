import { login } from "./auth.js";

document.getElementById('login').addEventListener('click', (e)=>{
e.preventDefault();
    console.log("works")

    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');
    
    login(emailInput.value, passwordInput.value).catch(e, () => {
            console.error(`Failed to login user: ${userInput.value}`)
            console.error(`Error: ${error.code}, message: ${error.message}`)
        })


})