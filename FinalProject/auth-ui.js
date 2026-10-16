function updateAuthCartVisibility() {
    document.body.classList.toggle(
        "is-authenticated",
        Boolean(localStorage.getItem("token"))
    );
}

updateAuthCartVisibility();

window.addEventListener("storage", (event) => {
    if (event.key === "token") {
        updateAuthCartVisibility();
    }
});
