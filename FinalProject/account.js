
const API_URL = "http://195.26.245.5:9505/api";
const token = localStorage.getItem("token");

async function loadProfile() {
    const box = document.getElementById("profile");

    if (!box) return;

    if (!token) {
        alert("Войдите заново");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/clients/get-details`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            alert("Не удалось загрузить профиль");
            return;
        }

        const user = await response.json();

        box.innerHTML = `
            <div class="account-profile-field">
                <span class="account-field-icon" aria-hidden="true">✦</span>
                <span class="account-field-copy"><small>Имя</small><strong id="user-name"></strong></span>
            </div>
            <div class="account-profile-field">
                <span class="account-field-icon account-field-icon-coral" aria-hidden="true">◈</span>
                <span class="account-field-copy"><small>Фамилия</small><strong id="user-surname"></strong></span>
            </div>
            <div class="account-profile-field">
                <span class="account-field-icon account-field-icon-mint" aria-hidden="true">@</span>
                <span class="account-field-copy"><small>Логин</small><strong id="user-username"></strong></span>
            </div>
            <div class="account-profile-field account-profile-field-email">
                <span class="account-field-icon account-field-icon-yellow" aria-hidden="true">✉</span>
                <span class="account-field-copy"><small>Email</small><strong id="user-email"></strong></span>
            </div>
        `;

        document.getElementById("user-name").textContent = user.name || "";
        document.getElementById("user-surname").textContent = user.surname || "";
        document.getElementById("user-username").textContent = user.username || "";
        document.getElementById("user-email").textContent = user.email || "";
        document.getElementById("profile-avatar").textContent =
            (user.name || user.username || "R").trim().charAt(0).toLocaleUpperCase();

    } catch (error) {
        console.error("Ошибка загрузки профиля:", error);
        box.textContent = "Ошибка подключения к серверу.";
    }
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}
function showCart() {
    const cartContainer = document.getElementById("cart-container");

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
        cartContainer.innerHTML = "<p>Корзина пока пуста</p>";
        return;
    }

    cartContainer.innerHTML = cart.map((product, index) => `
        <div class="cart-card">
            <img src="${product.imageUrl || product.image || ""}" alt="${product.model || product.name || "Товар"}">

            <div class="cart-info">
                <h3>${product.brand || ""} ${product.model || product.name || "Товар"}</h3>
                <p>Цена: ${product.price} AZN</p>
                <button onclick="removeFromCart(${index})">
                    Удалить
                </button>
            </div>
        </div>
    `).join("");
}

function removeFromCart(index) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));

    showCart();
}

document.addEventListener("DOMContentLoaded", showCart);
loadProfile();
