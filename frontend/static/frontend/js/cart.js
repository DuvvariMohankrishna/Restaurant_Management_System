const cartItemsContainer = document.getElementById("cart-items");
const cartSummary = document.getElementById("cart-summary");
const cartTotal = document.getElementById("cart-total");
const cartMessage = document.getElementById("cart-message");
const clearCartButton = document.getElementById("clear-cart-btn");
const checkoutButton = document.getElementById("checkout-btn");
const confirmOrderButton = document.getElementById("confirm-order-btn");

let currentCartItems = [];
let noticeModalInstance = null;
let checkoutModalInstance = null;
let noticeHideTimer = null;

document.addEventListener("DOMContentLoaded", () => {
    if (window.bootstrap) {
        noticeModalInstance = new bootstrap.Modal(document.getElementById("cartNoticeModal"));
        checkoutModalInstance = new bootstrap.Modal(document.getElementById("checkoutModal"));
    }
    loadCart();
});

function getAccessToken() {
    return localStorage.getItem("access_token");
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function formatPrice(value) {
    return `₹${Number(value || 0).toFixed(2)}`;
}

function showNotice(title, message, symbol = "✓") {
    document.getElementById("cartNoticeTitle").textContent = title;
    document.getElementById("cartNoticeText").textContent = message;
    document.getElementById("cartNoticeSymbol").textContent = symbol;
    if (noticeHideTimer) window.clearTimeout(noticeHideTimer);

    if (noticeModalInstance) {
        noticeModalInstance.show();
        noticeHideTimer = window.setTimeout(() => {
            if (document.getElementById("cartNoticeModal").classList.contains("show")) {
                noticeModalInstance.hide();
            }
        }, 1800);
    } else {
        cartMessage.textContent = `${title}: ${message}`;
    }
}

function showInlineError(message) {
    cartMessage.innerHTML = "";
    const alert = document.createElement("div");
    alert.className = "alert alert-danger";
    alert.setAttribute("role", "alert");
    alert.textContent = message;
    cartMessage.appendChild(alert);
}

async function authorizedFetch(url, options = {}) {
    const token = getAccessToken();
    const headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`
    };
    if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login/";
        throw new Error("Your session has expired. Please log in again.");
    }
    return response;
}

async function loadCart() {
    const token = getAccessToken();
    if (!token) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty-state">
                <div class="cart-empty-icon" aria-hidden="true">🛍️</div>
                <h2>Please log in to view your cart</h2>
                <p>Your selected food items will be waiting after you sign in.</p>
                <a href="/login/" class="btn btn-warning cart-place-order-btn">Login</a>
            </div>`;
        cartSummary.classList.add("d-none");
        clearCartButton.classList.add("d-none");
        return;
    }

    cartItemsContainer.innerHTML = `<div class="cart-loading"><span class="spinner-border spinner-border-sm me-2" role="status"></span>Loading your cart...</div>`;

    try {
        const response = await authorizedFetch(`${API_BASE_URL}cart/`);
        if (response.status === 404) {
            currentCartItems = [];
            displayEmptyCart();
            return;
        }
        if (!response.ok) throw new Error("Unable to load your cart. Please try again.");

        const cart = await response.json();
        displayCart(cart);
    } catch (error) {
        if (error.message.includes("session has expired")) return;
        showInlineError(error.message || "Unable to load your cart.");
    }
}

function displayEmptyCart() {
    currentCartItems = [];
    cartItemsContainer.innerHTML = `
        <div class="cart-empty-state">
            <div class="cart-empty-icon" aria-hidden="true">🛍️</div>
            <p class="cart-eyebrow mb-2">NOTHING HERE YET</p>
            <h2>Your cart is waiting for something delicious</h2>
            <p>Explore the menu and add your favourites.</p>
            <a href="/menu/" class="btn btn-warning cart-place-order-btn">Browse Menu <span aria-hidden="true">→</span></a>
        </div>`;
    cartSummary.classList.add("d-none");
    clearCartButton.classList.add("d-none");
}

function displayCart(cart) {
    const items = Array.isArray(cart.items) ? cart.items : [];
    if (!items.length) {
        displayEmptyCart();
        return;
    }

    currentCartItems = items;
    clearCartButton.classList.remove("d-none");
    let total = 0;

    cartItemsContainer.innerHTML = items.map((item, index) => {
        const quantity = Number(item.quantity);
        const price = Number(item.price);
        const subtotal = Number(item.subtotal ?? price * quantity);
        total += subtotal;
        const name = item.item_name || item.menu_item || "Menu item";
        const image = item.image_url || "/static/frontend/img/food-placeholder.svg";

        return `
            <article class="cart-item-card" style="--cart-item-index:${index}">
                <div class="cart-item-image-wrap">
                    <img class="cart-item-image" src="${escapeHtml(image)}" alt="${escapeHtml(name)}"
                         onerror="this.onerror=null;this.src='/static/frontend/img/food-placeholder.svg'">
                </div>
                <div class="cart-item-details">
                    <p class="cart-item-kicker mb-1">FRESHLY MADE</p>
                    <h2 class="cart-item-name">${escapeHtml(name)}</h2>
                    <p class="cart-item-unit-price mb-1">Unit price <strong>${formatPrice(price)}</strong></p>
                    <p class="cart-item-subtotal mb-0">Subtotal <strong>${formatPrice(subtotal)}</strong></p>
                </div>
                <div class="cart-item-actions">
                    <div class="cart-quantity-control" aria-label="Quantity for ${escapeHtml(name)}">
                        <button class="quantity-btn" type="button" aria-label="Decrease ${escapeHtml(name)} quantity"
                                onclick="updateQuantity(${Number(item.id)}, ${quantity - 1})" ${quantity <= 1 ? "disabled" : ""}>−</button>
                        <span class="quantity-value" aria-live="polite">${quantity}</span>
                        <button class="quantity-btn" type="button" aria-label="Increase ${escapeHtml(name)} quantity"
                                onclick="updateQuantity(${Number(item.id)}, ${quantity + 1})">+</button>
                    </div>
                    <button class="btn btn-sm cart-remove-btn" type="button"
                            onclick="removeCartItem(${Number(item.id)})">
                        <span aria-hidden="true">×</span> Remove
                    </button>
                </div>
            </article>`;
    }).join("");

    cartTotal.textContent = formatPrice(total);
    cartSummary.classList.remove("d-none");
    checkoutButton.disabled = false;
}

async function updateQuantity(itemId, quantity) {
    if (quantity < 1) return;
    const button = document.querySelector(`button[onclick^="updateQuantity(${itemId},"]`);
    if (button) button.disabled = true;

    try {
        const response = await authorizedFetch(`${API_BASE_URL}cart/items/${itemId}/`, {
            method: "PATCH",
            body: JSON.stringify({ quantity })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Unable to update quantity.");
        await loadCart();
    } catch (error) {
        if (!error.message.includes("session has expired")) showInlineError(error.message);
        await loadCart();
    }
}

async function removeCartItem(itemId) {
    const item = currentCartItems.find((entry) => Number(entry.id) === Number(itemId));
    const itemName = item ? (item.item_name || item.menu_item) : "Item";

    try {
        const response = await authorizedFetch(`${API_BASE_URL}cart/items/${itemId}/delete/`, {
            method: "DELETE"
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Unable to remove this item.");
        await loadCart();
        showNotice("Item removed", `${itemName} has been removed from your cart.`, "✓");
    } catch (error) {
        if (!error.message.includes("session has expired")) showNotice("Could not remove item", error.message, "!");
    }
}

clearCartButton.addEventListener("click", async () => {
    if (!currentCartItems.length) return;
    clearCartButton.disabled = true;
    try {
        const response = await authorizedFetch(`${API_BASE_URL}cart/clear/`, { method: "DELETE" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Unable to clear cart.");
        await loadCart();
        showNotice("Cart cleared", "All items have been removed from your cart.", "✓");
    } catch (error) {
        if (!error.message.includes("session has expired")) showNotice("Unable to clear cart", error.message, "!");
    } finally {
        clearCartButton.disabled = false;
    }
});

function openCheckout() {
    if (!currentCartItems.length) return;
    const itemsContainer = document.getElementById("checkout-items");
    let total = 0;

    itemsContainer.innerHTML = currentCartItems.map((item) => {
        const quantity = Number(item.quantity);
        const price = Number(item.price);
        const subtotal = Number(item.subtotal ?? price * quantity);
        total += subtotal;
        const name = item.item_name || item.menu_item || "Menu item";
        const image = item.image_url || "/static/frontend/img/food-placeholder.svg";
        return `
            <div class="checkout-item-row">
                <img src="${escapeHtml(image)}" alt="" onerror="this.onerror=null;this.src='/static/frontend/img/food-placeholder.svg'">
                <div class="checkout-item-info">
                    <strong>${escapeHtml(name)}</strong>
                    <span>Qty ${quantity} × ${formatPrice(price)}</span>
                </div>
                <strong class="checkout-item-subtotal">${formatPrice(subtotal)}</strong>
            </div>`;
    }).join("");

    document.getElementById("checkout-total").textContent = formatPrice(total);
    document.getElementById("checkout-error").classList.add("d-none");
    document.getElementById("checkout-error").textContent = "";
    document.getElementById("payment-cash").checked = true;
    document.querySelector('label[for="payment-cash"]').classList.add("payment-option-selected");
    document.querySelector('label[for="payment-online"]').classList.remove("payment-option-selected");
    if (checkoutModalInstance) checkoutModalInstance.show();
}

checkoutButton.addEventListener("click", async () => {
    if (!getAccessToken()) {
        window.location.href = "/login/";
        return;
    }
    if (!currentCartItems.length) {
        showNotice("Your cart is empty", "Add a menu item before placing an order.", "!");
        return;
    }
    openCheckout();
});

document.querySelectorAll('input[name="payment-method"]').forEach((radio) => {
    radio.addEventListener("change", () => {
        document.querySelectorAll(".payment-option").forEach((option) => option.classList.remove("payment-option-selected"));
        const selectedLabel = document.querySelector(`label[for="${radio.id}"]`);
        if (selectedLabel) selectedLabel.classList.add("payment-option-selected");
    });
});

confirmOrderButton.addEventListener("click", async () => {
    const selectedMethod = document.querySelector('input[name="payment-method"]:checked');
    const errorElement = document.getElementById("checkout-error");
    if (!selectedMethod || selectedMethod.disabled || selectedMethod.value !== "CASH") {
        errorElement.textContent = "Please select an available payment method.";
        errorElement.classList.remove("d-none");
        return;
    }

    confirmOrderButton.disabled = true;
    document.getElementById("confirm-order-label").textContent = "Placing order...";
    errorElement.classList.add("d-none");

    try {
        const orderResponse = await authorizedFetch(`${API_BASE_URL}orders/create/`, {
            method: "POST",
            body: JSON.stringify({ payment_method: selectedMethod.value })
        });
        const orderData = await orderResponse.json().catch(() => ({}));
        if (!orderResponse.ok) throw new Error(orderData.message || "Unable to place your order.");

        // The current backend creates the order first; create its cash-payment record next.
        let paymentWarning = "";
        const orderId = orderData.order && orderData.order.id;
        if (orderId) {
            try {
                const paymentResponse = await authorizedFetch(`${API_BASE_URL}payments/create/`, {
                    method: "POST",
                    body: JSON.stringify({ order_id: orderId })
                });
                const paymentData = await paymentResponse.json().catch(() => ({}));
                if (!paymentResponse.ok) paymentWarning = paymentData.message || "Your order was placed, but the cash-payment record could not be created.";
            } catch (paymentError) {
                paymentWarning = "Your order was placed, but the payment record could not be created.";
            }
        }

        if (checkoutModalInstance) checkoutModalInstance.hide();
        if (paymentWarning) {
            sessionStorage.setItem("order_notice", paymentWarning);
        } else {
            sessionStorage.setItem("order_notice", orderData.message || "Your order was placed successfully.");
        }
        window.location.href = "/orders/";
    } catch (error) {
        errorElement.textContent = error.message || "Something went wrong while placing your order.";
        errorElement.classList.remove("d-none");
        confirmOrderButton.disabled = false;
        document.getElementById("confirm-order-label").textContent = "Confirm Order";
    }
});
