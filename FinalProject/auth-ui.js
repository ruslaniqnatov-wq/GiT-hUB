function updateAuthCartVisibility() {
    document.body.classList.toggle(
        "is-authenticated",
        Boolean(localStorage.getItem("token"))
    );
}

async function updateAccountNavigation() {
    const accountLinks = document.querySelectorAll('header a[href="account.html"]');
    const token = localStorage.getItem("token");

    if (!token) {
        accountLinks.forEach((link) => {
            link.classList.remove("account-nav-link");
            link.removeAttribute("aria-label");
            link.textContent = "My account";
        });
        return;
    }

    try {
        const response = await fetch("http://195.26.245.5:9505/api/clients/get-details", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error("Не удалось загрузить имя пользователя для навигации:", response.status);
            return;
        }

        const profile = await response.json();
        if (localStorage.getItem("token") !== token) return;

        const user = profile.body || profile;
        const name = user.name || user.username;

        if (!name) {
            console.error("В профиле отсутствует имя пользователя.");
            return;
        }

        const displayName = String(name).trim();
        if (!displayName) {
            console.error("В профиле отсутствует имя пользователя.");
            return;
        }

        accountLinks.forEach((link) => {
            const avatar = document.createElement("span");
            avatar.className = "account-nav-avatar";
            avatar.setAttribute("aria-hidden", "true");
            avatar.textContent = displayName.charAt(0).toLocaleUpperCase();

            const label = document.createElement("span");
            label.textContent = "My account";

            const userName = document.createElement("span");
            userName.className = "account-nav-name";
            userName.textContent = displayName;

            link.classList.add("account-nav-link");
            link.setAttribute("aria-label", `My account: ${displayName}`);
            link.replaceChildren(avatar, label, userName);
        });
    } catch (error) {
        console.error("Ошибка загрузки имени пользователя для навигации:", error);
    }
}

updateAuthCartVisibility();
updateAccountNavigation();

window.addEventListener("storage", (event) => {
    if (event.key === "token") {
        updateAuthCartVisibility();
        updateAccountNavigation();
    }
});
