const API_URL = "http://195.26.245.5:9505/api"
async function register(event) {
    event.preventDefault()
    const user = {
        name: document.getElementById("name").value,
        surname: document.getElementById("surname").value,
        email: document.getElementById("email").value,
        username: document.getElementById("username").value,
        password: document.getElementById("password").value
    }
    const response=await fetch(API_URL+ "/clients",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(user)
    })
    if(response.ok){
        alert("Готово! теперь войдите")
    }else{
        alert("ошибка")
    }
}