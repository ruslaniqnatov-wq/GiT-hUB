
const API_URL = "http://195.26.245.5:9505/api";

async function login(event) {
    event.preventDefault();

    const user = {
        username: document.getElementById("username").value,
        password: document.getElementById("password").value
    };

    try {
        const response = await fetch(API_URL + "/auth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        });

        const result = await response.json();

        if (!response.ok) {
            alert("Ошибка входа");
            return;
        }

        if (!result.body || !result.body.token) {
            alert("Токен не найден в ответе сервера");
            console.log(result);
            return;
        }

        localStorage.setItem("token", result.body.token);
        location.href = "home.html";

    } catch (error) {
        console.error(error);
        alert("Ошибка соединения с сервером");
    }
}
