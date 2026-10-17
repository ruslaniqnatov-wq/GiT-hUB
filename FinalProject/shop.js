const contactForm = document.getElementById("shop-contact-form");
const contactStatus = document.getElementById("shop-form-status");

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

    const subject = encodeURIComponent(`Contact message from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    contactStatus.textContent = "Your email app is opening with your message.";
    window.location.href = `mailto:ruslaniqnatov@gmail.com?subject=${subject}&body=${body}`;
});
