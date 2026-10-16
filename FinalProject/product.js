const API_URL = "http://195.26.245.5:9505/api";

const id = new URLSearchParams(window.location.search).get("id");

async function loadProduct() {
    const box = document.getElementById("product");

    try {
        const response = await fetch(API_URL + "/products/" + id);
        const product = await response.json();

        box.innerHTML = `
            <img class="product_img" src="${product.imageUrl}" alt="">

            <h1>${product.brand} ${product.model}</h1>

            <p>${product.price} AZN</p>

            <p>${product.description || "Описание отсутствует"}</p>
        `;

    } catch (error) {
        console.log(error);
        box.innerHTML = "<p>Ошибка загрузки товара</p>";
    }
}

loadProduct();