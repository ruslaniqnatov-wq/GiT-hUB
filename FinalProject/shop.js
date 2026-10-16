const contactForm = document.getElementById("shop-contact-form");
const contactStatus = document.getElementById("shop-form-status");
const productForm = document.getElementById("shop-product-form");
const productStatus = document.getElementById("shop-product-status");
const productList = document.getElementById("shop-product-list");
const productFormPanel = document.getElementById("shop-product-form-panel");
const createToggle = document.getElementById("shop-create-toggle");
const productFormTitle = document.getElementById("shop-product-form-title");
const productSaveButton = document.getElementById("shop-product-save");

const token = localStorage.getItem("token");
let ownerKey = "guest";
let products = [];
let editingProductId = null;

function makeOwnerKey() {
    if (!token) return "guest";

    try {
        const payload = token.split(".")[1];
        if (payload) {
            const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
            const decodedPayload = JSON.parse(atob(normalizedPayload));
            const identity = decodedPayload.sub
                ?? decodedPayload.userId
                ?? decodedPayload.clientId
                ?? decodedPayload.username
                ?? decodedPayload.email;

            if (identity != null && String(identity).trim()) {
                return `user-${String(identity).trim()}`;
            }
        }
    } catch (error) {
        console.warn("Could not read user identity from token; using a browser-local product list.", error);
    }

    let tokenHash = 0;
    for (let index = 0; index < token.length; index += 1) {
        tokenHash = (tokenHash * 31 + token.charCodeAt(index)) | 0;
    }
    return `token-${tokenHash >>> 0}`;
}

function storageKey() {
    return `shop-products:${ownerKey}`;
}

function readProducts() {
    try {
        const storedProducts = JSON.parse(localStorage.getItem(storageKey()) || "[]");
        if (!Array.isArray(storedProducts)) {
            throw new Error("Saved products are not a list.");
        }

        products = storedProducts.filter((product) =>
            product && typeof product.id === "string" && typeof product.name === "string"
        );
    } catch (error) {
        console.error("Could not load saved products:", error);
        productStatus.textContent = "Could not load your saved products. Check browser storage.";
        products = [];
    }
}

function saveProducts() {
    try {
        localStorage.setItem(storageKey(), JSON.stringify(products));
        return true;
    } catch (error) {
        console.error("Could not save products:", error);
        productStatus.textContent = "Could not save changes. Check available browser storage.";
        return false;
    }
}

function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
}

function renderProducts() {
    productList.replaceChildren();

    if (products.length === 0) {
        productList.append(
            makeElement("p", "shop-empty-products", "No products yet. Create your first product to see it here.")
        );
        return;
    }

    products.forEach((product) => {
        const card = makeElement("article", "shop-product-card");
        const visual = makeElement("div", "shop-product-visual");

        if (product.imageUrl) {
            const image = document.createElement("img");
            image.src = product.imageUrl;
            image.alt = product.name;
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

        const category = makeElement("span", "shop-product-category", product.category);
        visual.append(category);

        const content = makeElement("div", "shop-product-content");
        content.append(
            makeElement("h3", "shop-product-name", product.name),
            makeElement("p", "shop-product-description", product.description || "No description provided.")
        );

        const footer = makeElement("div", "shop-product-card-footer");
        footer.append(makeElement("strong", "shop-product-price", `${Number(product.price).toFixed(2)} AZN`));

        const actions = makeElement("div", "shop-product-actions");
        const editButton = makeElement("button", "shop-product-edit", "Edit");
        editButton.type = "button";
        editButton.dataset.action = "edit";
        editButton.dataset.productId = product.id;

        const deleteButton = makeElement("button", "shop-product-delete", "Delete");
        deleteButton.type = "button";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.productId = product.id;

        actions.append(editButton, deleteButton);
        footer.append(actions);
        content.append(footer);
        card.append(visual, content);
        productList.append(card);
    });
}

function openProductForm(product = null) {
    editingProductId = product?.id ?? null;
    productForm.reset();
    productStatus.textContent = "";

    if (product) {
        productForm.elements.name.value = product.name;
        productForm.elements.price.value = product.price;
        productForm.elements.category.value = product.category;
        productForm.elements.imageUrl.value = product.imageUrl || "";
        productForm.elements.description.value = product.description || "";
    }

    const title = product ? "Edit product" : "Create product";
    productFormTitle.textContent = title;
    productSaveButton.innerHTML = `${title} <span aria-hidden="true">↗</span>`;
    productFormPanel.hidden = false;
    createToggle.setAttribute("aria-expanded", "true");
    productForm.elements.name.focus();
}

function closeProductForm() {
    productFormPanel.hidden = true;
    createToggle.setAttribute("aria-expanded", "false");
    editingProductId = null;
    productForm.reset();
    productStatus.textContent = "";
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
    if (productFormPanel.hidden) {
        openProductForm();
    } else {
        closeProductForm();
    }
});

productForm.addEventListener("submit", (event) => {
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
            const imageProtocol = new URL(imageUrl).protocol;
            if (imageProtocol !== "https:" && imageProtocol !== "http:") {
                throw new Error("Unsupported image URL protocol.");
            }
        } catch {
            productStatus.textContent = "Enter a valid HTTP or HTTPS image URL.";
            return;
        }
    }

    const product = {
        id: editingProductId || (window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
        ownerKey,
        name: productForm.elements.name.value.trim(),
        price,
        category: productForm.elements.category.value,
        imageUrl,
        description: productForm.elements.description.value.trim()
    };

    if (!product.name || !product.category) {
        productStatus.textContent = "Add a product name and choose a category.";
        return;
    }

    const previousProducts = products;
    products = [...products];
    const existingIndex = products.findIndex((item) => item.id === editingProductId);
    if (existingIndex >= 0) {
        products[existingIndex] = product;
    } else {
        products.unshift(product);
    }

    if (!saveProducts()) {
        products = previousProducts;
        renderProducts();
        return;
    }

    renderProducts();
    closeProductForm();
});

document.getElementById("shop-product-cancel").addEventListener("click", closeProductForm);
document.getElementById("shop-product-cancel-secondary").addEventListener("click", closeProductForm);

productList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const product = products.find((item) => item.id === button.dataset.productId);
    if (!product || product.ownerKey !== ownerKey) return;

    if (button.dataset.action === "edit") {
        openProductForm(product);
        productFormPanel.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (button.dataset.action === "delete") {
        const confirmed = window.confirm(`Delete "${product.name}"?`);
        if (!confirmed) return;

        const previousProducts = products;
        products = products.filter((item) => item.id !== product.id);
        if (saveProducts()) {
            renderProducts();
        } else {
            products = previousProducts;
            renderProducts();
        }
    }
});

ownerKey = makeOwnerKey();
readProducts();
renderProducts();
