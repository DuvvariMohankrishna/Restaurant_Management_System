
document.addEventListener("DOMContentLoaded", () => {
    const menuContainer = document.getElementById("menu-container");
    const paginationContainer = document.getElementById("menu-pagination");

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
    const pageSize = 12;

    let selectedItem = null;
    let selectedQuantity = 1;
    let isSubmitting = false;

    // Format prices in Indian Rupees.
    const money = (amount) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(Number(amount) || 0);

    // Escape text before inserting it into HTML.
    const escapeHTML = (value) =>
        String(value ?? "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        })[character]);

    // Get the food image URL.
    function itemImage(item) {
        if (!item.image) {
            return placeholderImage;
        }

        try {
            return new URL(item.image, window.location.origin).href;
        } catch (error) {
            return placeholderImage;
        }
    }

    // Update the selected quantity and total price.
    function updateQuantity() {
        quantityOutput.textContent = String(selectedQuantity);

        quantityDecrease.disabled = selectedQuantity <= 1;
        quantityIncrease.disabled = selectedQuantity >= 20;

        modalTotal.textContent = money(
            Number(selectedItem?.price || 0) * selectedQuantity
        );
    }

    // Open the add-to-cart modal.
    function openItemDialog(item) {
        selectedItem = item;
        selectedQuantity = 1;

        modalTitle.textContent = item.name;
        modalDescription.textContent =
            item.description || "A delicious choice, prepared fresh for you.";

        modalPrice.textContent = money(item.price);

        modalImage.src = itemImage(item);
        modalImage.alt = item.name;

        modalImage.onerror = () => {
            modalImage.onerror = null;
            modalImage.src = placeholderImage;
        };

        modalMessage.textContent = "";

        confirmButton.disabled = false;
        confirmButton.querySelector(".button-label").textContent = "Add to cart";

        updateQuantity();
        modal.show();
    }

    // Render menu cards.
    function renderMenuItems(items) {
        menuContainer.innerHTML = "";

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
                </div>
            `;
            return;
        }

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
                            loading="lazy"
                        >

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
                                class="btn btn-warning w-100 menu-add-button"
                            >
                                <span>Add to cart</span>
                                <span class="menu-add-icon" aria-hidden="true">+</span>
                            </button>
                        </div>
                    </div>
                </article>
            `;

            const image = column.querySelector(".menu-card-image");

            image.addEventListener("error", () => {
                image.onerror = null;
                image.src = placeholderImage;
            });

            column.querySelector(".menu-add-button").addEventListener(
                "click",
                () => openItemDialog(item)
            );

            menuContainer.appendChild(column);
        });
    }

    // Load menu items from the paginated API.
    async function loadMenu(url = "/api/v1/menu-items/") {
        menuContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-warning" role="status">
                    <span class="visually-hidden">Loading menu...</span>
                </div>
                <p class="mt-3 text-muted">Loading our menu...</p>
            </div>
        `;

        paginationContainer.hidden = true;

        try {
            console.time("Menu API");

            const response = await fetch(url);

            console.timeEnd("Menu API");

            if (!response.ok) {
                throw new Error(
                    `Menu API returned status ${response.status}`
                );
            }

            const payload = await response.json();

            // Support paginated and non-paginated responses.
            const allItems = Array.isArray(payload.results)
                ? payload.results
                : payload;

            const items = allItems.filter(
                (item) => item.is_available !== false
            );

            renderMenuItems(items);

            // Render pagination for DRF paginated responses.
            if (
                !Array.isArray(payload) &&
                payload.results &&
                payload.count !== undefined
            ) {
                renderPagination(payload);
            } else {
                paginationContainer.hidden = true;
            }

        } catch (error) {
            console.error("Menu loading error:", error);

            menuContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning text-center" role="alert">
                        We couldn't load the menu.
                        Please refresh the page and try again.
                    </div>
                </div>
            `;

            paginationContainer.hidden = true;
        }
    }

    // Render Previous, numbered, and Next pagination controls.
    function renderPagination(payload) {
        const totalPages = Math.ceil(payload.count / pageSize);

        paginationContainer.innerHTML = "";

        if (totalPages <= 1) {
            paginationContainer.hidden = true;
            return;
        }

        paginationContainer.hidden = false;

        // Derive the current page from the API navigation URLs.
        let currentPage = 1;

        if (payload.next) {
            const nextURL = new URL(payload.next, window.location.origin);
            currentPage = Number(nextURL.searchParams.get("page")) - 1;
        } else if (payload.previous) {
            const previousURL = new URL(
                payload.previous,
                window.location.origin
            );
            currentPage = Number(previousURL.searchParams.get("page")) + 1;
        }

        const nav = document.createElement("ul");
        nav.className =
            "pagination justify-content-center flex-wrap gap-2";

        function addButton(label, pageURL, disabled, active = false) {
            const li = document.createElement("li");

            li.className = [
                "page-item",
                disabled ? "disabled" : "",
                active ? "active" : "",
            ].filter(Boolean).join(" ");

            const button = document.createElement("button");
            button.type = "button";
            button.className = "page-link";
            button.textContent = label;
            button.disabled = disabled;

            if (active) {
                button.setAttribute("aria-current", "page");
            }

            button.addEventListener("click", () => {
                if (!pageURL || disabled) {
                    return;
                }

                loadMenu(pageURL);

                menuContainer.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
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

    // Decrease quantity.
    quantityDecrease.addEventListener("click", () => {
        if (selectedQuantity > 1) {
            selectedQuantity--;
            updateQuantity();
        }
    });

    // Increase quantity.
    quantityIncrease.addEventListener("click", () => {
        if (selectedQuantity < 20) {
            selectedQuantity++;
            updateQuantity();
        }
    });

    // Add the selected menu item to the cart.
    confirmButton.addEventListener("click", async () => {
        if (!selectedItem || isSubmitting) {
            return;
        }

        const accessToken = localStorage.getItem("access_token");

        if (!accessToken) {
            modal.hide();
            window.location.href = "/login/";
            return;
        }

        isSubmitting = true;
        confirmButton.disabled = true;

        confirmButton.querySelector(".button-label").textContent =
            "Adding…";

        modalMessage.className = "small mt-3 text-muted";
        modalMessage.textContent = "Adding your selection to the cart…";

        try {
            const response = await fetch(`${API_BASE_URL}cart/add/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    menu_item: selectedItem.id,
                    quantity: selectedQuantity,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.detail ||
                    "Could not add this item to your cart."
                );
            }

            modalMessage.className =
                "small mt-3 text-success fw-semibold";

            modalMessage.textContent =
                `${selectedQuantity} × ${selectedItem.name} added to your cart.`;

            confirmButton.querySelector(".button-label").textContent =
                "Added to cart ✓";

            window.setTimeout(() => modal.hide(), 850);

        } catch (error) {
            console.error("Add to cart error:", error);

            modalMessage.className = "small mt-3 text-danger";
            modalMessage.textContent =
                error.message || "Something went wrong. Please try again.";

            confirmButton.querySelector(".button-label").textContent =
                "Try again";

            confirmButton.disabled = false;

        } finally {
            isSubmitting = false;
        }
    });

    // Reset modal state when closed.
    modalElement.addEventListener("hidden.bs.modal", () => {
        selectedItem = null;
        selectedQuantity = 1;
        isSubmitting = false;
        confirmButton.disabled = false;
    });

    // IMPORTANT: Load the menu when the page opens.
    loadMenu();
});
