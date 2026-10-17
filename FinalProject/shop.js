const API_URL = "http://195.26.245.5:9505/api";
const contactForm = document.getElementById("shop-contact-form");
const contactStatus = document.getElementById("shop-form-status");
const productForm = document.getElementById("shop-product-form");
const productStatus = document.getElementById("shop-product-status");
const apiStatus = document.getElementById("shop-api-status");
const productList = document.getElementById("shop-product-list");
const productFormPanel = document.getElementById("shop-product-form-panel");
const createToggle = document.getElementById("shop-create-toggle");
const productFormTitle = document.getElementById("shop-product-form-title");
const productSaveButton = document.getElementById("shop-product-save");
const categorySelect = document.getElementById("shop-product-category");

let products = [];
let categories = [];
let editingProductId = null;

class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

function getToken() {
    return localStorage.getItem("token");
}

async function apiRequest(path, options = {}) {
    const token = getToken();
    if (!token) {
        throw new ApiError("Please sign in to manage your products.", 401);
    }

    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");
    headers.set("Authorization", `Bearer ${token}`);
    if (options.body) headers.set("Content-Type", "application/json");

    let response;
    try {
        response = await fetch(`${API_URL}${path}`, { ...options, headers });
    } catch (error) {
        console.error("Shop API request failed:", error);
        throw new Error("Could not connect to the product API. Please try again.");
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
            : responseBody?.message || responseBody?.error || `API request failed (${response.status}).`;
        throw new ApiError(message, response.status);
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
    return [product.brand, product.model].filter(Boolean).join(" ") || "Unnamed product";
}

function categoryName(categoryId) {
    const category = categories.find((item) => String(item.id) === String(categoryId));
    return category?.name || "Category";
}

function setProductMessage(message, withLoginLink = false) {
    productList.replaceChildren();
    const text = makeElement("p", "shop-empty-products", message);
    if (withLoginLink) {
        text.append(" ");
        const loginLink = makeElement("a", "", "Sign in");
        loginLink.href = "login.html";
        text.append(loginLink, " to view and manage the catalog.");
    }
    productList.append(text);
}

function renderProducts() {
    productList.replaceChildren();

    if (products.length === 0) {
        productList.append(makeElement(
            "p",
            "shop-empty-products",
            "No products are available in the catalog."
        ));
        return;
    }

    products.forEach((product) => {
        const card = makeElement("article", "shop-product-card");
        const visual = makeElement("div", "shop-product-visual");

        if (product.imageUrl) {
            const image = document.createElement("img");
            image.src = product.imageUrl;
            image.alt = productName(product);
            image.loading = "lazy";
            image.addEventListener("error", () => {
                image.remove();
                const fallbackIcon = makeElement("span", "", "✦");
                fallbackIcon.setAttribute("aria-hidden", "true");
                visual.prepend(fallbackIcon);
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
            makeElement("p", "shop-product-description", product.description || "No description provided.")
        );

        const footer = makeElement("div", "shop-product-card-footer");
        footer.append(makeElement("strong", "shop-product-price", `${Number(product.price).toFixed(2)} AZN`));

        const actions = makeElement("div", "shop-product-actions");
        const editButton = makeElement("button", "shop-product-edit", "Edit");
        editButton.type = "button";
        editButton.dataset.action = "edit";
        editButton.dataset.productId = String(product.id);

        const deleteButton = makeElement("button", "shop-product-delete", "Delete");
        deleteButton.type = "button";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.productId = String(product.id);

        actions.append(editButton, deleteButton);
        footer.append(actions);
        content.append(footer);
        card.append(visual, content);
        productList.append(card);
    });
}

async function loadCategories() {
    categorySelect.disabled = true;
    categorySelect.replaceChildren(new Option("Loading categories...", ""));

    const result = await apiRequest("/categories");
    if (!Array.isArray(result)) {
        throw new Error("The API returned an invalid category list.");
    }

    categories = result;
    categorySelect.replaceChildren(new Option("Choose a category", ""));
    categories.forEach((category) => {
        categorySelect.add(new Option(category.name, String(category.id)));
    });
    categorySelect.disabled = false;
}

async function loadProducts() {
    apiStatus.textContent = "Loading catalog products...";
    createToggle.disabled = true;

    try {
        const result = await apiRequest("/products");
        if (!Array.isArray(result)) {
            throw new Error("The API returned an invalid product list.");
        }

        products = result;

        renderProducts();
        apiStatus.textContent = "";
        createToggle.disabled = false;
        return true;
    } catch (error) {
        console.error("Could not load catalog products:", error);
        products = [];
        if (error.status === 401) {
            setProductMessage("Sign in to view the product catalog.", true);
            apiStatus.textContent = "";
        } else if (error.status === 403) {
            setProductMessage("The API denied access to the product catalog.");
            apiStatus.textContent = "";
        } else {
            setProductMessage("Products could not be loaded.");
            apiStatus.textContent = error.message || "Could not load products. Please try again.";
        }
        createToggle.disabled = true;
        return false;
    }
}

function openProductForm(product = null) {
    editingProductId = product?.id ?? null;
    productForm.reset();
    productStatus.textContent = "";

    if (product) {
        productForm.elements.brand.value = product.brand || "";
        productForm.elements.model.value = product.model || "";
        productForm.elements.price.value = product.price;
        productForm.elements.categoryId.value = String(product.categoryId ?? "");
        productForm.elements.imageUrl.value = product.imageUrl || "";
        productForm.elements.description.value = product.description || "";
    }

    const title = product ? "Edit product" : "Create product";
    productFormTitle.textContent = title;
    productSaveButton.innerHTML = `${title} <span aria-hidden="true">↗</span>`;
    productFormPanel.hidden = false;
    createToggle.setAttribute("aria-expanded", "true");
    productForm.elements.brand.focus();
}

function closeProductForm() {
    productFormPanel.hidden = true;
    createToggle.setAttribute("aria-expanded", "false");
    editingProductId = null;
    productForm.reset();
    productStatus.textContent = "";
}

function setFormBusy(isBusy) {
    productSaveButton.disabled = isBusy;
    productForm.querySelectorAll("input, select, textarea, button").forEach((control) => {
        if (control.id !== "shop-product-save") control.disabled = isBusy;
    });
}

contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;

    const name = contactForm.elements.name.value.trim();
    const email = contactForm.elements.email.value.trim();
    const message = contactForm.elements.message.value.trim();

    if (!name || !email || !message) {
        contactStatus.textContent = "Please fill in all fields.";
        return;
    }

    const subject = encodeURIComponent(`Shop message from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    contactStatus.textContent = "Your email app is opening with your message.";
    window.location.href = `mailto:ruslaniqnatov@gmail.com?subject=${subject}&body=${body}`;
});

createToggle.addEventListener("click", () => {
    if (!getToken()) {
        window.location.href = "login.html";
        return;
    }
    if (categorySelect.disabled) {
        apiStatus.textContent = "Categories are not available yet. Please try again shortly.";
        return;
    }
    if (productFormPanel.hidden) {
        openProductForm();
    } else {
        closeProductForm();
    }
});

productForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!productForm.reportValidity()) return;

    const price = Number(productForm.elements.price.value);
    if (!Number.isFinite(price) || price <= 0) {
        productStatus.textContent = "Enter a price greater than zero.";
        return;
    }

    const imageUrl = productForm.elements.imageUrl.value.trim();
    if (imageUrl) {
        try {
            const protocol = new URL(imageUrl).protocol;
            if (protocol !== "https:" && protocol !== "http:") {
                throw new Error("Unsupported image URL protocol.");
            }
        } catch {
            productStatus.textContent = "Enter a valid HTTP or HTTPS image URL.";
            return;
        }
    }

    const product = {
        brand: productForm.elements.brand.value.trim(),
        model: productForm.elements.model.value.trim(),
        price,
        categoryId: Number(productForm.elements.categoryId.value),
        imageUrl,
        description: productForm.elements.description.value.trim()
    };

    if (!product.brand || !product.model || !Number.isInteger(product.categoryId) || product.categoryId <= 0) {
        productStatus.textContent = "Enter the brand and product name, then choose a category.";
        return;
    }

    setFormBusy(true);
    productStatus.textContent = editingProductId == null ? "Creating product..." : "Saving product changes...";

    try {
        const isEditing = editingProductId != null;
        const method = isEditing ? "PUT" : "POST";
        const body = isEditing ? { id: editingProductId, ...product } : product;
        await apiRequest("/products", {
            method,
            body: JSON.stringify(body)
        });

        closeProductForm();
        const loaded = await loadProducts();
        if (!loaded) {
            apiStatus.textContent = isEditing
                ? "Product was updated, but the list could not be refreshed."
                : "Product was created, but the list could not be refreshed.";
        }
    } catch (error) {
        console.error("Could not save product:", error);
        productStatus.textContent = error.message || "Could not save the product. Please try again.";
    } finally {
        setFormBusy(false);
    }
});

document.getElementById("shop-product-cancel").addEventListener("click", closeProductForm);
document.getElementById("shop-product-cancel-secondary").addEventListener("click", closeProductForm);

productList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const product = products.find((item) => String(item.id) === button.dataset.productId);
    if (!product) return;

    if (button.dataset.action === "edit") {
        openProductForm(product);
        productFormPanel.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (button.dataset.action === "delete") {
        if (!window.confirm(`Delete "${productName(product)}"?`)) return;

        button.disabled = true;
        apiStatus.textContent = "Deleting product...";
        try {
            await apiRequest(`/products/delete/${encodeURIComponent(product.id)}`, { method: "DELETE" });
            await loadProducts();
        } catch (error) {
            console.error("Could not delete product:", error);
            apiStatus.textContent = error.message || "Could not delete the product. Please try again.";
            button.disabled = false;
        }
    }
});

async function initializeShop() {
    if (!getToken()) {
        createToggle.disabled = true;
        setProductMessage("Sign in to view the product catalog.", true);
        categorySelect.replaceChildren(new Option("Sign in to load categories", ""));
        return;
    }

    const results = await Promise.allSettled([loadCategories(), loadProducts()]);
    const categoryResult = results[0];
    if (categoryResult.status === "rejected") {
        console.error("Could not load product categories:", categoryResult.reason);
        categorySelect.replaceChildren(new Option("Categories unavailable", ""));
        categorySelect.disabled = true;
        apiStatus.textContent = "Product categories could not be loaded. Check the API connection and try again.";
    }
}

initializeShop();
