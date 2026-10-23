document.addEventListener("DOMContentLoaded", () => {
    const menuContainer = document.getElementById("menu-container");
    const paginationContainer =
    document.getElementById("menu-pagination");
    const modalElement = document.getElementById("addToCartModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    const modalImage = document.getElementById("modal-food-image");
    const modalTitle = document.getElementById("addToCartModalLabel");
    const modalDescription = document.getElementById("modal-food-description");
    const modalPrice = document.getElementById("modal-food-price");
    const modalTotal = document.getElementById("modal-food-total");
    const quantityOutput = document.getElementById("selected-quantity");
    const quantityDecrease = document.getElementById("quantity-decrease");
    const quantityIncrease = document.getElementById("quantity-increase");
    const confirmButton = document.getElementById("confirm-add-to-cart");
    const modalMessage = document.getElementById("modal-cart-message");
    const placeholderImage = "/static/frontend/img/food-placeholder.svg";

    let selectedItem = null;
    let selectedQuantity = 1;
    let isSubmitting = false;

    const money = (amount) => new Intl.NumberFormat("en-IN", {
        style: "currency", currency: "INR", maximumFractionDigits: 2,
    }).format(Number(amount) || 0);

    const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[character]);

    function itemImage(item) {
        if (!item.image) return placeholderImage;
        // DRF usually returns an absolute media URL. Handle relative URLs too.
        try {
            return new URL(item.image, window.location.origin).href;
        } catch (_) {
            return placeholderImage;
        }
    }

    function updateQuantity() {
        quantityOutput.textContent = String(selectedQuantity);
        quantityDecrease.disabled = selectedQuantity <= 1;
        quantityIncrease.disabled = selectedQuantity >= 20;
        modalTotal.textContent = money(Number(selectedItem?.price || 0) * selectedQuantity);
    }

    function openItemDialog(item) {
        selectedItem = item;
        selectedQuantity = 1;
        modalTitle.textContent = item.name;
        modalDescription.textContent = item.description || "A delicious choice, prepared fresh for you.";
        modalPrice.textContent = money(item.price);
        modalImage.src = itemImage(item);
        modalImage.alt = item.name;
        modalImage.onerror = () => { modalImage.onerror = null; modalImage.src = placeholderImage; };
        modalMessage.textContent = "";
        confirmButton.disabled = false;
        confirmButton.querySelector(".button-label").textContent = "Add to cart";
        updateQuantity();
        modal.show();
    }

    async function loadMenu() {
        try {
            const response = await fetch("/api/v1/menu-items/");
            if (!response.ok) throw new Error("The menu could not be loaded.");
            const payload = await response.json();
            const items = (payload.results || payload).filter((item) => item.is_available !== false);
            menuContainer.innerHTML = "";

            if (!items.length) {
                menuContainer.innerHTML = `<div class="col-12"><div class="menu-empty-state"><span class="empty-plate">✦</span><h3>Our menu is being refreshed</h3><p class="text-muted mb-0">Please check back soon for today’s dishes.</p></div></div>`;
                return;
            }

            items.forEach((item, index) => {
                const column = document.createElement("div");
                column.className = "col-sm-6 col-lg-4 menu-card-column";
                column.style.setProperty("--card-index", index);
                const imageURL = itemImage(item);
                column.innerHTML = `
                    <article class="card menu-food-card h-100">
                        <div class="menu-card-image-wrap">
                            <img class="menu-card-image" src="${escapeHTML(imageURL)}" alt="${escapeHTML(item.name)}" loading="lazy">
                            <span class="menu-card-price">${escapeHTML(money(item.price))}</span>
                        </div>
                        <div class="card-body d-flex flex-column p-4">
                            <div class="menu-card-kicker">FRESH FROM OUR KITCHEN</div>
                            <h2 class="menu-card-title">${escapeHTML(item.name)}</h2>
                            <p class="menu-card-description">${escapeHTML(item.description || "Prepared fresh with carefully selected ingredients.")}</p>
                            <div class="mt-auto pt-3">
                                <button type="button" class="btn btn-warning w-100 menu-add-button">
                                    <span>Add to cart</span><span class="menu-add-icon" aria-hidden="true">+</span>
                                </button>
                            </div>
                        </div>
                    </article>`;
                const image = column.querySelector(".menu-card-image");
                image.addEventListener("error", () => { image.onerror = null; image.src = placeholderImage; });
                column.querySelector(".menu-add-button").addEventListener("click", () => openItemDialog(item));
                menuContainer.appendChild(column);
            });
        } catch (error) {
            console.error("Menu loading error:", error);
            menuContainer.innerHTML = `<div class="col-12"><div class="alert alert-warning text-center" role="alert">We couldn’t load the menu. Please refresh the page and try again.</div></div>`;
        }
    }

    quantityDecrease.addEventListener("click", () => {
        if (selectedQuantity > 1) { selectedQuantity -= 1; updateQuantity(); }
    });
    quantityIncrease.addEventListener("click", () => {
        if (selectedQuantity < 20) { selectedQuantity += 1; updateQuantity(); }
    });

    confirmButton.addEventListener("click", async () => {
        if (!selectedItem || isSubmitting) return;
        const accessToken = localStorage.getItem("access_token");
        if (!accessToken) {
            modal.hide();
            window.location.href = "/login/";
            return;
        }

        isSubmitting = true;
        confirmButton.disabled = true;
        confirmButton.querySelector(".button-label").textContent = "Adding…";
        modalMessage.className = "small mt-3 text-muted";
        modalMessage.textContent = "Adding your selection to the cart…";

        try {
            const response = await fetch(`${API_BASE_URL}cart/add/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ menu_item: selectedItem.id, quantity: selectedQuantity }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || data.detail || "Could not add this item to your cart.");

            modalMessage.className = "small mt-3 text-success fw-semibold";
            modalMessage.textContent = `${selectedQuantity} × ${selectedItem.name} added to your cart.`;
            confirmButton.querySelector(".button-label").textContent = "Added to cart ✓";
            window.setTimeout(() => modal.hide(), 850);
        } catch (error) {
            modalMessage.className = "small mt-3 text-danger";
            modalMessage.textContent = error.message || "Something went wrong. Please try again.";
            confirmButton.querySelector(".button-label").textContent = "Try again";
            confirmButton.disabled = false;
        } finally {
            isSubmitting = false;
        }
    });

    modalElement.addEventListener("hidden.bs.modal", () => {
        selectedItem = null;
        selectedQuantity = 1;
        isSubmitting = false;
        confirmButton.disabled = false;
    });

    
async function loadMenu(url = "/api/v1/menu-items/") {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("The menu could not be loaded.");
        }

        const payload = await response.json();

        // Support paginated and non-paginated API responses.
        const items = (payload.results || payload)
            .filter(item => item.is_available !== false);

        menuContainer.innerHTML = "";
        paginationContainer.innerHTML = "";

        // Render the food cards.
        if (!items.length) {
            menuContainer.innerHTML = `
                <div class="col-12">
                    <div class="menu-empty-state">
                        <span class="empty-plate">✦</span>
                        <h3>No available menu items</h3>
                        <p class="text-muted mb-0">
                            Please check back soon.
                        </p>
                    </div>
                </div>`;
        } else {
            items.forEach((item, index) => {
                const column = document.createElement("div");

                // Four cards per row on large screens.
                column.className =
                    "col-12 col-sm-6 col-lg-3 menu-card-column";

                column.style.setProperty("--card-index", index);

                const imageURL = itemImage(item);

                column.innerHTML = `
                    <article class="card menu-food-card h-100">
                        <div class="menu-card-image-wrap">
                            <img
                                class="menu-card-image"
                                src="${escapeHTML(imageURL)}"
                                alt="${escapeHTML(item.name)}"
                                loading="lazy">

                            <span class="menu-card-price">
                                ${escapeHTML(money(item.price))}
                            </span>
                        </div>

                        <div class="card-body d-flex flex-column p-4">
                            <div class="menu-card-kicker">
                                FRESH FROM OUR KITCHEN
                            </div>

                            <h2 class="menu-card-title">
                                ${escapeHTML(item.name)}
                            </h2>

                            <p class="menu-card-description">
                                ${escapeHTML(
                                    item.description ||
                                    "Prepared fresh with carefully selected ingredients."
                                )}
                            </p>

                            <div class="mt-auto pt-3">
                                <button
                                    type="button"
                                    class="btn btn-warning w-100 menu-add-button">
                                    <span>Add to cart</span>
                                    <span class="menu-add-icon"
                                          aria-hidden="true">+</span>
                                </button>
                            </div>
                        </div>
                    </article>`;

                const image = column.querySelector(".menu-card-image");

                image.addEventListener("error", () => {
                    image.onerror = null;
                    image.src = placeholderImage;
                });

                column.querySelector(".menu-add-button")
                    .addEventListener("click", () => openItemDialog(item));

                menuContainer.appendChild(column);
            });
        }

        // Render pagination only when the API provides paginated results.
        if (payload.results && payload.count !== undefined) {
            renderPagination(payload);
        }

    } catch (error) {
        console.error("Menu loading error:", error);

        menuContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning text-center" role="alert">
                    We couldn't load the menu. Please refresh the page and try again.
                </div>
            </div>`;

        paginationContainer.hidden = true;
    }
}

function renderPagination(payload) {
    const pageSize = 12;
    const totalPages = Math.ceil(payload.count / pageSize);

    paginationContainer.innerHTML = "";

    if (totalPages <= 1) {
        paginationContainer.hidden = true;
        return;
    }

    paginationContainer.hidden = false;

    const currentPage = payload.next
        ? Number(new URL(payload.next).searchParams.get("page")) - 1
        : totalPages;

    const nav = document.createElement("ul");
    nav.className = "pagination justify-content-center flex-wrap gap-2";

    function addButton(label, pageURL, disabled, active = false) {
        const li = document.createElement("li");
        li.className = `page-item${disabled ? " disabled" : ""}${active ? " active" : ""}`;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "page-link";
        button.textContent = label;
        button.disabled = disabled;

        if (active) {
            button.setAttribute("aria-current", "page");
        }

        button.addEventListener("click", () => {
            if (pageURL && !disabled) {
                loadMenu(pageURL);
                document.getElementById("menu-container")
                    .scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });

        li.appendChild(button);
        nav.appendChild(li);
    }

    addButton("Previous", payload.previous, !payload.previous);

    for (let page = 1; page <= totalPages; page++) {
        const pageURL = `/api/v1/menu-items/?page=${page}`;

        addButton(
            String(page),
            pageURL,
            page === currentPage,
            page === currentPage
        );
    }

    addButton("Next", payload.next, !payload.next);

    paginationContainer.appendChild(nav);
}

});
