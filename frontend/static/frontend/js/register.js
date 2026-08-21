document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("register-form");
    const message = document.getElementById("register-message");
    const submitButton = document.getElementById("register-submit");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        message.innerHTML = "";
        submitButton.disabled = true;
        submitButton.textContent = "Creating account...";
        const payload = {
            username: document.getElementById("register-username").value.trim(),
            email: document.getElementById("register-email").value.trim(),
            password: document.getElementById("register-password").value,
        };
        try {
            const response = await fetch(`${API_BASE_URL}accounts/register/`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) {
                const errors = Object.values(data).flat().join(" ") || "Registration failed.";
                throw new Error(errors);
            }
            message.innerHTML = '<div class="alert alert-success">Account created successfully. Redirecting to login...</div>';
            setTimeout(() => { window.location.href = "/login/"; }, 900);
        } catch (error) {
            message.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
            submitButton.disabled = false;
            submitButton.textContent = "Register";
        }
    });
});
