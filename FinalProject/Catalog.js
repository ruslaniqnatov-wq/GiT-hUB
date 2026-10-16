const API_URL = "http://195.26.245.5:9505/api";

let allproduct = [];
let categoriesList = [];
let selectedCategory = "";
let minimumRating = 0;
let sortByPriceAscending = false;

const productsBox = document.getElementById("products");
const catalogCount = document.getElementById("catalog-count");

productsBox.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const productId = button.dataset.productId;
    if (button.dataset.action === "details") {
        openProduct(productId);
    } else if (button.dataset.action === "add-to-cart") {
        addProductToCart(productId);
    }
});

async function loadProducts() {
    productsBox.setAttribute("aria-busy", "true");

    try {
        const response = await fetch(API_URL + "/products");
        if (!response.ok) {
            throw new Error(`Не удалось загрузить товары: ${response.status}`);
        }

        const products = await response.json();
        if (!Array.isArray(products)) {
            throw new Error("Сервер вернул некорректный список товаров.");
        }

        allproduct = products;
        applyCatalogFilters();
    } catch (error) {
        console.error("Catalog products error:", error);
        productsBox.innerHTML = '<p class="catalog-message">Не удалось загрузить каталог. Попробуйте обновить страницу.</p>';
        catalogCount.textContent = "";
    } finally {
        productsBox.removeAttribute("aria-busy");
    }
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getRating(product) {
    const rating = Number(product.averageRating);
    return Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 0;
}

function productCard(product, index) {
    const rating = getRating(product);
    const ratingLabel = rating > 0 ? `${rating.toFixed(1)} из 5` : "Пока без оценок";
    const starsFill = `${rating * 20}%`;
    const imageUrl = escapeHtml(product.imageUrl);
    const productName = `${product.brand ?? ""} ${product.model ?? ""}`.trim();
    const categoryName = categoriesList.find(
        (category) => String(category.id) === String(product.categoryId)
    )?.name ?? "Техника";
    const price = Number(product.price);
    const formattedPrice = Number.isFinite(price) ? `${price.toFixed(2)} AZN` : "Цена уточняется";
    const cardVariant = index % 4;

    return `
        <article class="card catalog-card catalog-card-tone-${cardVariant}">
            <div class="catalog-card-visual">
                <span class="catalog-card-category">${escapeHtml(categoryName)}</span>
                <span class="catalog-card-number">${String(index + 1).padStart(2, "0")}</span>
                <img class="card_img" src="${imageUrl}" alt="${escapeHtml(productName)}" loading="lazy">
            </div>
            <div class="catalog-card-content">
                <h3 class="card_title">${escapeHtml(productName)}</h3>
                <div class="catalog-card-rating" aria-label="Рейтинг: ${escapeHtml(ratingLabel)}">
                    <span class="catalog-stars" style="--stars-fill: ${starsFill}" aria-hidden="true">★★★★★</span>
                    <span class="catalog-rating-value">${rating > 0 ? rating.toFixed(1) : "Новый"}</span>
                </div>
                <p class="card_price">${formattedPrice}</p>
                <div class="catalog-card-actions">
                    <button type="button" class="catalog-details-button" data-action="details" data-product-id="${escapeHtml(product.id)}">
                        Подробнее
                    </button>
                    <button type="button" class="catalog-cart-button" data-action="add-to-cart" data-product-id="${escapeHtml(product.id)}">
                        <span aria-hidden="true">＋</span> В корзину
                    </button>
                </div>
            </div>
        </article>
    `;
}

function showProducts(products) {
    if (products.length === 0) {
        productsBox.innerHTML = '<p class="catalog-message">По выбранным параметрам товаров не найдено. Попробуйте изменить фильтры.</p>';
    } else {
        productsBox.innerHTML = products.map(productCard).join("");
    }

    catalogCount.textContent = `Показано ${products.length} из ${allproduct.length} товаров`;
}

function applyCatalogFilters() {
    const searchText = document.getElementById("search").value.trim().toLocaleLowerCase();

    let filtered = allproduct.filter((product) => {
        const name = `${product.brand ?? ""} ${product.model ?? ""}`.toLocaleLowerCase();
        const matchesSearch = name.includes(searchText);
        const matchesCategory = !selectedCategory || String(product.categoryId) === selectedCategory;
        const matchesRating = getRating(product) >= minimumRating;

        return matchesSearch && matchesCategory && matchesRating;
    });

    if (sortByPriceAscending) {
        filtered = [...filtered].sort((first, second) => {
            const firstPrice = Number(first.price);
            const secondPrice = Number(second.price);
            return (Number.isFinite(firstPrice) ? firstPrice : Infinity)
                - (Number.isFinite(secondPrice) ? secondPrice : Infinity);
        });
    }

    showProducts(filtered);
}

function searchProducts() {
    applyCatalogFilters();
}

function filterByRating(value) {
    minimumRating = Number(value) || 0;
    applyCatalogFilters();
}

function sortByPrice() {
    sortByPriceAscending = true;
    applyCatalogFilters();
}

function resetCatalogFilters() {
    document.getElementById("search").value = "";
    document.getElementById("rating-filter").value = "0";
    selectedCategory = "";
    minimumRating = 0;
    sortByPriceAscending = false;
    updateCategoryButtons();
    applyCatalogFilters();
}

async function loadCategories() {
    const box = document.getElementById("categories");

    try {
        const response = await fetch(API_URL + "/categories");
        if (!response.ok) {
            throw new Error(`Не удалось загрузить категории: ${response.status}`);
        }

        const categories = await response.json();
        if (!Array.isArray(categories)) {
            throw new Error("Сервер вернул некорректный список категорий.");
        }

        categoriesList = categories;
        box.innerHTML = `
            <button class="category-chip is-active" type="button" data-category-id="">Все товары</button>
            ${categories.map((category) => `
                <button class="category-chip" type="button" data-category-id="${escapeHtml(category.id)}">
                    ${escapeHtml(category.name)}
                </button>
            `).join("")}
        `;

        box.addEventListener("click", (event) => {
            const button = event.target.closest("button[data-category-id]");
            if (!button) return;

            selectedCategory = button.dataset.categoryId;
            updateCategoryButtons();
            applyCatalogFilters();
        });

        applyCatalogFilters();
    } catch (error) {
        console.error("Catalog categories error:", error);
        box.innerHTML = '<p class="catalog-message">Не удалось загрузить категории.</p>';
    }
}

function updateCategoryButtons() {
    document.querySelectorAll("#categories [data-category-id]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.categoryId === selectedCategory);
    });
}

function openProduct(id) {
    window.location.href = "product.html?id=" + encodeURIComponent(id);
}

function addProductToCart(id) {
    const product = allproduct.find((item) => String(item.id) === String(id));

    if (!product) {
        console.error("Cannot add missing product to cart:", id);
        return;
    }

    let cart;
    try {
        cart = JSON.parse(localStorage.getItem("cart") || "[]");
        if (!Array.isArray(cart)) {
            throw new Error("Cart storage is not an array.");
        }
    } catch (error) {
        console.error("Could not read cart from local storage:", error);
        alert("Не удалось прочитать корзину. Обновите страницу и попробуйте снова.");
        return;
    }

    const item = cart.find((cartProduct) => String(cartProduct.id) === String(id));

    if (item) {
        item.quantity = (Number(item.quantity) || 1) + 1;
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

    try {
        localStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) {
        console.error("Could not save cart:", error);
        alert("Не удалось сохранить корзину. Проверьте свободное место в браузере.");
        return;
    }

    alert("Товар добавлен в корзину!");
}

loadProducts();
loadCategories();
