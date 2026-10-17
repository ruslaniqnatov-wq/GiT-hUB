const API_URL = "http://195.26.245.5:9505/api";
async function loadProducts() {
  const box = document.getElementById("products");
  const response = await fetch(API_URL + "/products");
  const products = await response.json();
  let html = "";
  for (const product of products.slice(0, 4)) {
    html += productCard(product);
  }
  box.innerHTML = html;
}
loadProducts();

function productCard(product) {
  return `
<div class="card">
<img class="card_img" src="${product.imageUrl}"> 
<h3 class="card_title">${product.brand} ${product.model} </h3>
<p class="card_price">${product.price} </p>
</div>

`;
}
