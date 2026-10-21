document.addEventListener("DOMContentLoaded", loadOrders);

let orderResultModal;
let ordersCache = new Map();

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function money(value) {
    return `₹${Number(value || 0).toFixed(2)}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleString([], {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true
    });
}

function readableStatus(status) {
    return String(status || "PENDING").toLowerCase().replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function loadOrders() {
    const loading = document.getElementById("orders-loading");
    const error = document.getElementById("orders-error");
    const empty = document.getElementById("empty-orders");
    const container = document.getElementById("orders-container");

    if (window.bootstrap) {
        orderResultModal = new bootstrap.Modal(document.getElementById("orderResultModal"));
    }

    const notice = sessionStorage.getItem("order_notice");
    if (notice) {
        sessionStorage.removeItem("order_notice");
        error.className = "alert alert-success mb-4";
        error.textContent = notice;
        error.classList.remove("d-none");
        window.setTimeout(() => error.classList.add("d-none"), 5000);
    }

    try {
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
            window.location.href = "/login/";
            return;
        }

        const response = await fetch("/api/v1/orders/", {
            method: "GET",
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" }
        });

        if (response.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.href = "/login/";
            return;
        }
        if (!response.ok) throw new Error("Unable to load your orders. Please try again.");

        const data = await response.json();
        const orders = data.results || [];
        loading.classList.add("d-none");
        container.replaceChildren();
        ordersCache = new Map(orders.map((order) => [Number(order.id), order]));

        if (!orders.length) {
            empty.classList.remove("d-none");
            return;
        }
        empty.classList.add("d-none");
        orders.forEach((order, index) => container.appendChild(createOrderCard(order, index)));
    } catch (errorObject) {
        loading.classList.add("d-none");
        error.textContent = errorObject.message || "Unable to load orders.";
        error.className = "alert alert-danger";
    }
}

function createOrderCard(order, index) {
    const card = document.createElement("article");
    card.className = "order-card";
    card.style.setProperty("--order-index", index);

    const items = Array.isArray(order.items) ? order.items : [];
    const itemsHtml = items.map((item) => `
        <div class="order-item-row">
            <div class="order-item-description">
                <span class="order-item-name">${escapeHtml(item.menu_item_name || "Menu item")}</span>
                <span class="order-item-quantity">Qty ${Number(item.quantity) || 0}</span>
            </div>
            <strong class="order-item-price">${money(Number(item.price) * Number(item.quantity))}</strong>
        </div>
    `).join("");

    const status = String(order.status || "PENDING").toUpperCase();
    const canCancel = ["PENDING", "CONFIRMED"].includes(status);
    const statusClass = status.toLowerCase().replaceAll("_", "-");
    const paymentMethod = order.payment_method || "Cash";

    card.innerHTML = `
        <div class="order-card-header">
            <div class="order-heading-group">
                <span class="order-number-label">ORDER REFERENCE</span>
                <h2 class="order-number">${escapeHtml(order.order_number || `#${order.id}`)}</h2>
                <p class="order-date mb-0"><span aria-hidden="true">◷</span> ${escapeHtml(formatDate(order.created_at))}</p>
            </div>
            <span class="order-status-badge status-${escapeHtml(statusClass)}">${escapeHtml(readableStatus(status))}</span>
        </div>
        <div class="order-items-section">
            <div class="order-section-label">ITEMS ORDERED <span>${items.length} ${items.length === 1 ? "item" : "items"}</span></div>
            <div class="order-items-list">${itemsHtml || '<p class="text-muted mb-0">No item details available.</p>'}</div>
        </div>
        <div class="order-card-bottom">
            <div class="order-payment"><span class="order-bottom-label">PAYMENT METHOD</span><strong><span aria-hidden="true">💵</span> ${escapeHtml(paymentMethod)}</strong></div>
            <div class="order-total"><span class="order-bottom-label">TOTAL AMOUNT</span><strong>${money(order.total_amount)}</strong></div>
        </div>
        ${canCancel ? `<div class="order-card-actions"><button type="button" class="btn order-cancel-button" data-order-id="${Number(order.id)}">Cancel Order <span aria-hidden="true">×</span></button></div>` : ""}
    `;

    const cancelButton = card.querySelector("[data-order-id]");
    if (cancelButton) cancelButton.addEventListener("click", () => cancelOrder(Number(order.id), cancelButton));
    return card;
}

function showCancellationResult(order) {
    const items = Array.isArray(order.items) ? order.items : [];
    document.getElementById("orderResultTitle").textContent = "Order cancelled";
    document.getElementById("orderResultMessage").textContent = "Your order has been cancelled successfully. Here are the cancelled order details.";
    document.getElementById("cancelled-order-number").textContent = order.order_number || `#${order.id}`;
    document.getElementById("cancelled-order-total").textContent = money(order.total_amount);
    document.getElementById("cancelled-order-items").innerHTML = items.map((item) => `
        <div class="cancelled-order-item">
            <div><strong>${escapeHtml(item.menu_item_name || "Menu item")}</strong><small>Qty ${Number(item.quantity) || 0} × ${money(item.price)}</small></div>
            <strong>${money(Number(item.price) * Number(item.quantity))}</strong>
        </div>
    `).join("") || '<p class="text-muted mb-0">No item details available.</p>';

    if (orderResultModal) orderResultModal.show();
}

async function cancelOrder(orderId, button) {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        window.location.href = "/login/";
        return;
    }

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Cancelling…";
    try {
        const response = await fetch(`/api/v1/orders/${orderId}/cancel/`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" }
        });
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.href = "/login/";
            return;
        }
        if (!response.ok) throw new Error(data.message || "Unable to cancel this order.");

        const cancelledOrder = data.order || ordersCache.get(orderId);
        if (cancelledOrder) {
            ordersCache.set(orderId, cancelledOrder);
            // Refresh the card/status behind the modal while preserving the cancellation details.
            const oldCard = button.closest(".order-card");
            const newCard = createOrderCard(cancelledOrder, 0);
            if (oldCard) oldCard.replaceWith(newCard);
            showCancellationResult(cancelledOrder);
        } else {
            await loadOrders();
            document.getElementById("orderResultTitle").textContent = "Order cancelled";
            document.getElementById("orderResultMessage").textContent = data.message || "Your order has been cancelled successfully.";
            if (orderResultModal) orderResultModal.show();
        }
    } catch (error) {
        button.disabled = false;
        button.textContent = originalText;
        const errorElement = document.getElementById("orders-error");
        errorElement.textContent = error.message || "Unable to cancel this order.";
        errorElement.className = "alert alert-danger";
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}
