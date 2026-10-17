const ACCOUNT_PRODUCTS_API_URL = "http://195.26.245.5:9505/api";
const accountProductList = document.getElementById("account-product-list");
const accountProductForm = document.getElementById("account-product-form");
const accountProductFormStatus = document.getElementById("account-product-form-status");
const accountProductsStatus = document.getElementById("account-products-status");
const accountProductFormPanel = document.getElementById("account-product-form-panel");
const accountProductCreate = document.getElementById("account-product-create");
const accountProductFormTitle = document.getElementById("account-product-form-title");
const accountProductSave = document.getElementById("account-product-save");
const accountProductCategory = document.getElementById("account-product-category");
const accountProductCount = document.getElementById("account-products-count");
const accountCategoryCount = document.getElementById("account-products-categories-count");
const accountAveragePrice = document.getElementById("account-products-average-price");
const accountProductsSearch = document.getElementById("account-products-search");
const accountProductsCategoryFilter = document.getElementById("account-products-category-filter");
const accountProductsRefresh = document.getElementById("account-products-refresh");
const accountProductsLogout = document.getElementById("account-products-logout");

let accountProducts = [];
let accountCategories = [];
let editingAccountProductId = null;

class AccountProductsApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = "AccountProductsApiError";
        this.status = status;
    }
}

async function accountProductsRequest(path, options = {}) {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new AccountProductsApiError("Войди в аккаунт, чтобы управлять товарами.", 401);
    }

    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");
    headers.set("Authorization", "Bearer " + token);
    if (options.body) headers.set("Content-Type", "application/json");

    let response;
    try {
        response = await fetch(`${ACCOUNT_PRODUCTS_API_URL}${path}`, { ...options, headers });
    } catch (error) {
        console.error("Не удалось подключиться к API товаров:", error);
        throw new Error("Нет соединения с сервером. Проверь интернет и попробуй ещё раз.");
    }

    const responseText = await response.text();
    let responseBody = null;
    if (responseText) {
        try {
            responseBody = JSON.parse(responseText);
        } catch {
            responseBody = responseText;
        }
    }

    if (!response.ok) {
        const message = typeof responseBody === "string"
            ? responseBody
            : responseBody?.message
                || responseBody?.error
                || `Ошибка API (${response.status}).`;
        throw new AccountProductsApiError(message, response.status);
    }

    return responseBody;
}

function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
}

function productName(product) {
    return [product.brand, product.model].filter(Boolean).join(" ") || "Товар без названия";
}

function categoryName(categoryId) {
    const category = accountCategories.find((category) => String(category.id) === String(categoryId));
    return category?.name || "Категория";
}

function formatProductCount(count) {
    const lastTwoDigits = count % 100;
    const lastDigit = count % 10;
    const suffix = lastTwoDigits >= 11 && lastTwoDigits <= 14
        ? "товаров"
        : lastDigit === 1
            ? "товар"
            : lastDigit >= 2 && lastDigit <= 4
                ? "товара"
                : "товаров";
    return `${count} ${suffix}`;
}

function setProductMessage(message, withLoginLink = false) {
    accountProductList.replaceChildren();
    const text = makeElement("p", "shop-empty-products", message);
    if (withLoginLink) {
        text.append(" ");
        const loginLink = makeElement("a", "", "Войти");
        loginLink.href = "login.html";
        text.append(loginLink, ", чтобы открыть свои товары.");
    }
    accountProductList.append(text);
}

function getVisibleProducts() {
    const query = accountProductsSearch.value.trim().toLocaleLowerCase();
    const categoryId = accountProductsCategoryFilter.value;

    return accountProducts.filter((product) => {
        const matchesQuery = !query || [
            product.brand,
            product.model,
            product.description,
            categoryName(product.categoryId)
        ].some((value) => String(value || "").toLocaleLowerCase().includes(query));
        const matchesCategory = !categoryId || String(product.categoryId) === categoryId;
        return matchesQuery && matchesCategory;
    });
}

function renderProductCard(product) {
    const card = makeElement("article", "shop-product-card");
    const visual = makeElement("div", "shop-product-visual");

    if (product.imageUrl) {
        const image = document.createElement("img");
        image.src = product.imageUrl;
        image.alt = productName(product);
        image.loading = "lazy";
        image.addEventListener("error", () => {
            image.remove();
            const icon = makeElement("span", "", "✦");
            icon.setAttribute("aria-hidden", "true");
            visual.prepend(icon);
        }, { once: true });
        visual.append(image);
    } else {
        visual.classList.add("shop-product-visual-empty");
        visual.textContent = "✦";
    }
    visual.append(makeElement("span", "shop-product-category", categoryName(product.categoryId)));

    const content = makeElement("div", "shop-product-content");
    content.append(
        makeElement("h3", "shop-product-name", productName(product)),
        makeElement("p", "shop-product-description", product.description || "Описание не добавлено.")
    );
    const footer = makeElement("div", "shop-product-card-footer");
    footer.append(makeElement("strong", "shop-product-price", `${Number(product.price).toFixed(2)} AZN`));

    const actions = makeElement("div", "shop-product-actions");
    const editButton = makeElement("button", "shop-product-edit", "Редактировать");
    editButton.type = "button";
    editButton.dataset.action = "edit";
    editButton.dataset.productId = String(product.id);
    const deleteButton = makeElement("button", "shop-product-delete", "Удалить");
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.productId = String(product.id);
    actions.append(editButton, deleteButton);
    footer.append(actions);
    content.append(footer);
    card.append(visual, content);
    return card;
}

function renderAccountProducts() {
    accountProductList.replaceChildren();
    accountProductCount.textContent = formatProductCount(accountProducts.length);

    const categoriesInUse = new Set(accountProducts.map((product) => String(product.categoryId))).size;
    accountCategoryCount.textContent = String(categoriesInUse);

    const averagePrice = accountProducts.length
        ? accountProducts.reduce((sum, product) => sum + Number(product.price || 0), 0) / accountProducts.length
        : 0;
    accountAveragePrice.textContent = accountProducts.length ? `${averagePrice.toFixed(2)} AZN` : "—";

    if (accountProducts.length === 0) {
        setProductMessage("Пока нет своих товаров. Создай первый — он появится в твоём аккаунте и общем каталоге.");
        return;
    }

    const visibleProducts = getVisibleProducts();
    if (visibleProducts.length === 0) {
        setProductMessage("По этому запросу товары не найдены. Измени поиск или фильтр.");
        return;
    }

    visibleProducts.forEach((product) => accountProductList.append(renderProductCard(product)));
}

async function loadAccountCategories() {
    const result = await accountProductsRequest("/categories");
    if (!Array.isArray(result)) {
        throw new Error("Сервер вернул некорректный список категорий.");
    }

    accountCategories = result;
    accountProductCategory.replaceChildren(new Option("Выбери категорию", ""));
    accountProductsCategoryFilter.replaceChildren(new Option("Все категории", ""));

    accountCategories.forEach((category) => {
        accountProductCategory.add(new Option(category.name, String(category.id)));
        accountProductsCategoryFilter.add(new Option(category.name, String(category.id)));
    });
    accountProductCategory.disabled = false;
    accountProductsCategoryFilter.disabled = false;
}

async function loadAccountProducts() {
    accountProductCreate.disabled = true;
    accountProductsRefresh.disabled = true;
    accountProductsStatus.textContent = "Загружаем твои товары из API...";

    try {
        const firstPage = await accountProductsRequest("/products/myProducts?page=0&size=100");
        if (!firstPage || !Array.isArray(firstPage.content)) {
            throw new Error("Сервер вернул некорректный список товаров.");
        }

        const loadedProducts = [...firstPage.content];
        const totalPages = Number(firstPage.totalPages);
        if (Number.isFinite(totalPages) && totalPages > 1) {
            for (let page = 1; page < totalPages; page += 1) {
                const nextPage = await accountProductsRequest(`/products/myProducts?page=${page}&size=100`);
                if (!nextPage || !Array.isArray(nextPage.content)) {
                    throw new Error("Сервер вернул некорректную страницу списка товаров.");
                }
                loadedProducts.push(...nextPage.content);
            }
        }

        accountProducts = loadedProducts;
        renderAccountProducts();
        accountProductsStatus.textContent = "";
        accountProductCreate.disabled = accountProductCategory.disabled;
        return true;
    } catch (error) {
        console.error("Не удалось загрузить товары аккаунта:", error);
        accountProducts = [];
        renderAccountProducts();
        accountProductCreate.disabled = true;
        if (error.status === 401 || error.status === 403) {
            accountProductsStatus.textContent = "Токен недействителен или сервер запретил доступ. Войди заново.";
        } else {
            accountProductsStatus.textContent = error.message || "Не удалось загрузить товары. Попробуй ещё раз.";
        }
        return false;
    } finally {
        accountProductsRefresh.disabled = false;
    }
}

function openAccountProductForm(product = null) {
    editingAccountProductId = product?.id ?? null;
    accountProductForm.reset();
    accountProductFormStatus.textContent = "";
    accountProductsStatus.textContent = "";

    if (product) {
        accountProductForm.elements.brand.value = product.brand || "";
        accountProductForm.elements.model.value = product.model || "";
        accountProductForm.elements.price.value = product.price;
        accountProductForm.elements.categoryId.value = String(product.categoryId ?? "");
        accountProductForm.elements.imageUrl.value = product.imageUrl || "";
        accountProductForm.elements.description.value = product.description || "";
    }

    const title = product ? "Редактировать товар" : "Создать товар";
    accountProductFormTitle.textContent = title;
    accountProductSave.innerHTML = `${title} <span aria-hidden="true">↗</span>`;
    accountProductFormPanel.hidden = false;
    accountProductCreate.setAttribute("aria-expanded", "true");
    accountProductForm.elements.brand.focus();
}

function closeAccountProductForm() {
    accountProductFormPanel.hidden = true;
    accountProductCreate.setAttribute("aria-expanded", "false");
    editingAccountProductId = null;
    accountProductForm.reset();
    accountProductFormStatus.textContent = "";
}

function setAccountProductFormBusy(isBusy) {
    accountProductSave.disabled = isBusy;
    accountProductForm.querySelectorAll("input, select, textarea, button").forEach((control) => {
        if (control !== accountProductSave) control.disabled = isBusy;
    });
}

async function submitAccountProduct(event) {
    event.preventDefault();
    if (!accountProductForm.reportValidity()) return;

    const price = Number(accountProductForm.elements.price.value);
    if (!Number.isFinite(price) || price <= 0) {
        accountProductFormStatus.textContent = "Укажи цену больше нуля.";
        return;
    }

    const imageUrl = accountProductForm.elements.imageUrl.value.trim();
    if (imageUrl) {
        try {
            const protocol = new URL(imageUrl).protocol;
            if (protocol !== "https:" && protocol !== "http:") {
                throw new Error("Поддерживаются только HTTP и HTTPS ссылки.");
            }
        } catch {
            accountProductFormStatus.textContent = "Укажи корректную HTTP или HTTPS ссылку на изображение.";
            return;
        }
    }

    const product = {
        brand: accountProductForm.elements.brand.value.trim(),
        model: accountProductForm.elements.model.value.trim(),
        price,
        categoryId: Number(accountProductForm.elements.categoryId.value),
        imageUrl,
        description: accountProductForm.elements.description.value.trim()
    };

    if (!product.brand || !product.model || !Number.isInteger(product.categoryId) || product.categoryId <= 0) {
        accountProductFormStatus.textContent = "Заполни бренд, название и категорию товара.";
        return;
    }

    const isEditing = editingAccountProductId !== null;
    const requestBody = isEditing ? { id: editingAccountProductId, ...product } : product;
    setAccountProductFormBusy(true);
    accountProductFormStatus.textContent = isEditing ? "Сохраняем изменения..." : "Создаём товар...";

    try {
        await accountProductsRequest("/products", {
            method: isEditing ? "PUT" : "POST",
            body: JSON.stringify(requestBody)
        });

        closeAccountProductForm();
        const refreshed = await loadAccountProducts();
        if (!refreshed) {
            accountProductsStatus.textContent = "Изменение сохранено, но список не обновился. Нажми «Обновить».";
        }
    } catch (error) {
        console.error("Не удалось сохранить товар через API:", error);
        accountProductFormStatus.textContent = error.message || "Не удалось сохранить товар.";
        if (error.status === 401 || error.status === 403) {
            accountProductFormStatus.textContent += " Проверь вход и права на свой товар.";
        }
    } finally {
        setAccountProductFormBusy(false);
    }
}

async function handleAccountProductAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const product = accountProducts.find((item) => String(item.id) === button.dataset.productId);
    if (!product) return;

    if (button.dataset.action === "edit") {
        openAccountProductForm(product);
        accountProductFormPanel.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    if (button.dataset.action !== "delete" || !window.confirm(`Удалить товар «${productName(product)}»?`)) {
        return;
    }

    button.disabled = true;
    accountProductsStatus.textContent = "Удаляем товар...";
    try {
        await accountProductsRequest(`/products/delete/${encodeURIComponent(product.id)}`, {
            method: "DELETE"
        });
        const refreshed = await loadAccountProducts();
        if (refreshed) accountProductsStatus.textContent = "Товар удалён из твоего аккаунта.";
    } catch (error) {
        console.error("Не удалось удалить свой товар:", error);
        accountProductsStatus.textContent = error.message || "Не удалось удалить товар.";
        button.disabled = false;
    }
}

async function initializeAccountProducts() {
    if (!localStorage.getItem("token")) {
        accountProductCreate.disabled = true;
        accountProductsRefresh.disabled = true;
        accountProductCategory.replaceChildren(new Option("Сначала войди в аккаунт", ""));
        accountProductCategory.disabled = true;
        setProductMessage("Войди в аккаунт, чтобы создавать и управлять своими товарами.", true);
        accountProductsStatus.textContent = "";
        accountProductCount.textContent = "—";
        accountCategoryCount.textContent = "—";
        accountAveragePrice.textContent = "—";
        return;
    }

    const results = await Promise.allSettled([
        loadAccountCategories(),
        loadAccountProducts()
    ]);

    const categoriesResult = results[0];
    const productsResult = results[1];
    if (categoriesResult.status === "rejected") {
        console.error("Не удалось загрузить категории:", categoriesResult.reason);
        accountProductCategory.replaceChildren(new Option("Категории недоступны", ""));
        accountProductCategory.disabled = true;
        accountProductCreate.disabled = true;
        accountProductsStatus.textContent = "Не удалось загрузить категории из API. Обнови страницу.";
    } else if (productsResult.status === "fulfilled" && productsResult.value) {
        accountProductCreate.disabled = false;
    }
}

accountProductCreate.addEventListener("click", () => {
    if (accountProductCategory.disabled) {
        accountProductsStatus.textContent = "Категории ещё не загружены. Обнови страницу и попробуй снова.";
        return;
    }
    if (accountProductFormPanel.hidden) {
        openAccountProductForm();
    } else {
        closeAccountProductForm();
    }
});

async function refreshAccountProducts() {
    accountProductsStatus.textContent = "";
    try {
        await loadAccountCategories();
    } catch (error) {
        console.error("Не удалось обновить категории:", error);
        accountProductCategory.disabled = true;
        accountProductCreate.disabled = true;
        accountProductsStatus.textContent = "Категории не удалось обновить. Попробуй ещё раз.";
        return;
    }
    if (await loadAccountProducts()) accountProductCreate.disabled = false;
}
accountProductsRefresh.addEventListener("click", refreshAccountProducts);
accountProductsSearch.addEventListener("input", renderAccountProducts);
accountProductsCategoryFilter.addEventListener("change", renderAccountProducts);
accountProductsLogout.addEventListener("click", logout);
document.getElementById("account-product-cancel").addEventListener("click", closeAccountProductForm);
document.getElementById("account-product-cancel-secondary").addEventListener("click", closeAccountProductForm);
accountProductForm.addEventListener("submit", submitAccountProduct);
accountProductList.addEventListener("click", handleAccountProductAction);

initializeAccountProducts();
