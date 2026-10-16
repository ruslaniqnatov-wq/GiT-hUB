const API_URL = "http://195.26.245.5:9505/api";
const productId = new URLSearchParams(window.location.search).get("id");
const productBox = document.getElementById("product");
const reviewsBox = document.getElementById("reviews");
const reviewsSummary = document.getElementById("reviews-summary");

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getRating(value) {
    const rating = Number(value);
    return Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 0;
}

function renderProduct(product) {
    const title = `${product.brand ?? ""} ${product.model ?? ""}`.trim();
    const price = Number(product.price);
    const formattedPrice = Number.isFinite(price) ? `${price.toFixed(2)} AZN` : "Цена уточняется";
    const rating = getRating(product.averageRating);
    const ratingLabel = rating > 0 ? `${rating.toFixed(1)} из 5` : "Пока без оценок";

    productBox.innerHTML = `
        <img class="product_img" src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(title)}">
        <div class="product-details">
            <span class="product-eyebrow">RUSLAN'S FINAL PROJECT / ВЫБОР ДЛЯ ТЕБЯ</span>
            <h1>${escapeHtml(title || "Товар")}</h1>
            <p class="product-detail-price">${formattedPrice}</p>
            <div class="product-average-rating" aria-label="Рейтинг: ${escapeHtml(ratingLabel)}">
                <span class="catalog-stars" style="--stars-fill: ${rating * 20}%" aria-hidden="true">★★★★★</span>
                <strong>${rating > 0 ? rating.toFixed(1) : "Новый товар"}</strong>
                <span>общий рейтинг</span>
            </div>
            <p class="product-description">${escapeHtml(product.description || "Описание пока не добавлено.")}</p>
            <a class="btn product-catalog-button" href="catalog.html">Продолжить покупки <span aria-hidden="true">↗</span></a>
        </div>
    `;

    renderReviewsSummary(rating);
}

function renderReviewsSummary(rating, count = null) {
    if (rating > 0) {
        reviewsSummary.innerHTML = `
            <span class="catalog-stars" style="--stars-fill: ${rating * 20}%" aria-hidden="true">★★★★★</span>
            <strong>${rating.toFixed(1)}</strong>
            ${count == null ? "<span>общий рейтинг</span>" : `<span>${count} ${getReviewCountLabel(count)}</span>`}
        `;
    } else {
        reviewsSummary.innerHTML = "<span>Пока нет оценок</span>";
    }
}

function getReviewCountLabel(count) {
    const remainder = count % 10;
    const lastTwoDigits = count % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "отзывов";
    if (remainder === 1) return "отзыв";
    if (remainder >= 2 && remainder <= 4) return "отзыва";
    return "отзывов";
}

function renderReviews(reviews, totalElements) {
    if (reviews.length === 0) {
        reviewsBox.innerHTML = '<p class="reviews-message">Пока никто не оставил отзыв. Будьте первым!</p>';
        return;
    }

    reviewsBox.innerHTML = `
        <div class="review-list">
            ${reviews.map((review) => {
                const title = review.title?.trim() || "Отзыв о товаре";
                const comment = review.comment?.trim() || "Покупатель не добавил текстовый комментарий.";

                return `
                    <article class="review-card">
                        <div class="review-avatar" aria-hidden="true">П</div>
                        <div class="review-content">
                            <div class="review-card-heading">
                                <div>
                                    <h3>${escapeHtml(title)}</h3>
                                    <span class="review-author">Покупатель</span>
                                </div>
                                <span class="review-label"><span aria-hidden="true">✦</span> Отзыв</span>
                            </div>
                            <p>${escapeHtml(comment)}</p>
                        </div>
                    </article>
                `;
            }).join("")}
        </div>
        ${totalElements > reviews.length
            ? `<p class="reviews-more">Показаны ${reviews.length} из ${totalElements} отзывов.</p>`
            : ""}
    `;
}

async function loadReviews(rating) {
    reviewsBox.setAttribute("aria-busy", "true");

    try {
        const response = await fetch(`${API_URL}/reviews/product/${encodeURIComponent(productId)}`);
        if (!response.ok) {
            throw new Error(`Не удалось загрузить отзывы: ${response.status}`);
        }

        const result = await response.json();
        const reviews = Array.isArray(result) ? result : result.content;
        if (!Array.isArray(reviews)) {
            throw new Error("Сервер вернул некорректный список отзывов.");
        }

        const totalElements = Number.isFinite(Number(result.totalElements))
            ? Number(result.totalElements)
            : reviews.length;

        renderReviews(reviews, totalElements);
        renderReviewsSummary(rating, totalElements);
    } catch (error) {
        console.error("Product reviews error:", error);
        reviewsBox.innerHTML = '<p class="reviews-message reviews-error">Не удалось загрузить отзывы. Попробуйте обновить страницу.</p>';
    } finally {
        reviewsBox.removeAttribute("aria-busy");
    }
}

async function loadProduct() {
    if (!productId) {
        productBox.innerHTML = '<p class="product-error">Не указан товар. Вернитесь в каталог и выберите устройство.</p>';
        productBox.removeAttribute("aria-busy");
        reviewsBox.innerHTML = '<p class="reviews-message">Отзывы появятся после выбора товара.</p>';
        reviewsBox.removeAttribute("aria-busy");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/products/${encodeURIComponent(productId)}`);
        if (!response.ok) {
            throw new Error(`Не удалось загрузить товар: ${response.status}`);
        }

        const product = await response.json();
        if (!product || typeof product !== "object") {
            throw new Error("Сервер вернул некорректные данные товара.");
        }

        renderProduct(product);
        await loadReviews(getRating(product.averageRating));
    } catch (error) {
        console.error("Product load error:", error);
        productBox.innerHTML = '<p class="product-error">Не удалось загрузить товар. Попробуйте вернуться в каталог.</p>';
        reviewsBox.innerHTML = '<p class="reviews-message reviews-error">Отзывы недоступны, так как товар не загрузился.</p>';
    } finally {
        productBox.removeAttribute("aria-busy");
        reviewsBox.removeAttribute("aria-busy");
    }
}

loadProduct();
