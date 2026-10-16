
const API_URL = "http://195.26.245.5:9505/api";

let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allproduct = [];

async function loadProducts() {
    try {
        const response = await fetch(API_URL + "/products");

        if (!response.ok) {
            throw new Error("Ошибка загрузки товаров");
        }

        allproduct = await response.json();
    } catch (error) {
        console.error("API error:", error);
    }
}

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(id) {
    const product = allproduct.find(p => String(p.id) === String(id));

    if (!product) {
        alert("Товар не найден. Проверь загрузку API.");
        return;
    }

    const item = cart.find(p => String(p.id) === String(id));

    if (item) {
        item.quantity++;
    } else {
        cart.push({
            id: product.id,
            brand: product.brand,
            model: product.model,
            price: Number(product.price) || 0,
            imageUrl: product.imageUrl || "",
            quantity: 1
        });
    }

    saveCart();
    renderCart();
    alert("Товар добавлен в корзину!");
}

function renderCart() {
    const box = document.getElementById("cart-items");
    const totalBox = document.getElementById("cart-total");
    const countBox = document.getElementById("cart-count");

    let total = 0;
    let count = 0;

    if (box) {
        if (cart.length === 0) {
            box.innerHTML = "<h2>Корзина пуста</h2>";
        } else {
            box.innerHTML = cart.map((item, index) => {
                const price = Number(item.price) || 0;
                const quantity = Number(item.quantity) || 1;

                total += price * quantity;
                count += quantity;

                return `
                    <div class="cart-item">
                        <img src="${item.imageUrl || ""}" width="100">
                        <h3>${item.brand || ""} ${item.model || ""}</h3>
                        <p>${price.toFixed(2)} AZN</p>
                        <button onclick="changeQuantity(${index}, -1)">−</button>
                        <span>${quantity}</span>
                        <button onclick="changeQuantity(${index}, 1)">+</button>
                        <button onclick="removeItem(${index})">Удалить</button>
                    </div>
                `;
            }).join("");
        }
    } else {
        count = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    }

    if (totalBox) totalBox.textContent = total.toFixed(2);
    if (countBox) countBox.textContent = count;
}

function changeQuantity(index, amount) {
    if (!cart[index]) return;

    cart[index].quantity += amount;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    saveCart();
    renderCart();
}

function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

function clearCart() {
    cart = [];
    saveCart();
    renderCart();
}

loadProducts().then(renderCart);
