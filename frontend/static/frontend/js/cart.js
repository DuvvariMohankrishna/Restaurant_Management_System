const cartItemsContainer =
    document.getElementById("cart-items");

const cartSummary =
    document.getElementById("cart-summary");

const cartTotal =
    document.getElementById("cart-total");

const cartMessage =
    document.getElementById("cart-message");

const clearCartButton =
    document.getElementById("clear-cart-btn");

const checkoutButton =
    document.getElementById("checkout-btn");


function showMessage(
    message,
    type = "success"
) {

    cartMessage.innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;

}


async function loadCart() {

    const accessToken =
        localStorage.getItem(
            "access_token"
        );


    if (!accessToken) {

        cartItemsContainer.innerHTML = `
            <div class="col-12 text-center">

                <h4>
                    Please log in to view your cart.
                </h4>

                <a
                    href="/login/"
                    class="btn btn-warning mt-3"
                >
                    Login
                </a>

            </div>
        `;

        cartSummary.classList.add(
            "d-none"
        );

        return;
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}cart/`,
            {
                headers: {
                    "Authorization":
                        `Bearer ${accessToken}`,
                },
            }
        );


        if (!response.ok) {

            if (response.status === 404) {

                displayEmptyCart();

                return;
            }


            if (response.status === 401) {

                localStorage.removeItem(
                    "access_token"
                );

                localStorage.removeItem(
                    "refresh_token"
                );

                window.location.href =
                    "/login/";

                return;

            }


            throw new Error(
                "Unable to load cart."
            );

        }


        const cart =
            await response.json();


        displayCart(cart);

    } catch (error) {

        console.error(error);

        showMessage(
            "Unable to load your cart.",
            "danger"
        );

    }

}


function displayEmptyCart() {

    cartItemsContainer.innerHTML = `
        <div class="col-12 text-center">

            <h4>
                Your cart is empty.
            </h4>

            <a
                href="/menu/"
                class="btn btn-warning mt-3"
            >
                Browse Menu
            </a>

        </div>
    `;


    cartSummary.classList.add(
        "d-none"
    );

}


function displayCart(cart) {

    const items = cart.items;


    if (!items || items.length === 0) {

        displayEmptyCart();

        return;

    }


    let total = 0;


    cartItemsContainer.innerHTML =
        items.map(function (item) {

            const subtotal =
                Number(item.subtotal);

            total += subtotal;


            return `

                <div class="col-12">

                    <div class="card shadow-sm">

                        <div
                            class="
                                card-body
                                d-flex
                                justify-content-between
                                align-items-center
                            "
                        >

                            <div>

                                <h5>
                                    ${item.menu_item}
                                </h5>

                                <p class="mb-1">

                                    Price:
                                    ₹${item.price}

                                </p>

                                <p class="mb-0">

                                    Subtotal:
                                    ₹${subtotal.toFixed(2)}

                                </p>

                            </div>


                            <div
                                class="
                                    d-flex
                                    align-items-center
                                    gap-2
                                "
                            >

                                <button
                                    class="
                                        btn
                                        btn-outline-secondary
                                    "
                                    onclick="
                                        updateQuantity(
                                            ${item.id},
                                            ${item.quantity - 1}
                                        )
                                    "
                                >
                                    −
                                </button>


                                <span class="fw-bold">

                                    ${item.quantity}

                                </span>


                                <button
                                    class="
                                        btn
                                        btn-outline-secondary
                                    "
                                    onclick="
                                        updateQuantity(
                                            ${item.id},
                                            ${item.quantity + 1}
                                        )
                                    "
                                >
                                    +
                                </button>


                                <button
                                    class="
                                        btn
                                        btn-outline-danger
                                    "
                                    onclick="
                                        removeCartItem(
                                            ${item.id}
                                        )
                                    "
                                >
                                    Remove
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            `;

        }).join("");


    cartTotal.textContent =
        `₹${total.toFixed(2)}`;


    cartSummary.classList.remove(
        "d-none"
    );

}


async function updateQuantity(
    itemId,
    quantity
) {

    if (quantity < 1) {

        await removeCartItem(
            itemId
        );

        return;

    }


    const accessToken =
        localStorage.getItem(
            "access_token"
        );


    try {

        const response = await fetch(
            `${API_BASE_URL}cart/items/${itemId}/`,
            {
                method: "PATCH",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${accessToken}`,

                },

                body: JSON.stringify({
                    quantity: quantity,
                }),

            }
        );


        if (!response.ok) {

            throw new Error(
                "Unable to update cart."
            );

        }


        await loadCart();

    } catch (error) {

        console.error(error);

        showMessage(
            "Unable to update quantity.",
            "danger"
        );

    }

}


async function removeCartItem(
    itemId
) {

    const accessToken =
        localStorage.getItem(
            "access_token"
        );


    try {

        const response = await fetch(
            `${API_BASE_URL}cart/items/${itemId}/delete/`,
            {
                method: "DELETE",

                headers: {
                    "Authorization":
                        `Bearer ${accessToken}`,
                },

            }
        );


        if (!response.ok) {

            throw new Error(
                "Unable to remove item."
            );

        }


        showMessage(
            "Item removed successfully."
        );


        await loadCart();

    } catch (error) {

        console.error(error);

        showMessage(
            "Unable to remove item.",
            "danger"
        );

    }

}


clearCartButton.addEventListener(
    "click",
    async function () {

        const accessToken =
            localStorage.getItem(
                "access_token"
            );


        if (!accessToken) {

            window.location.href =
                "/login/";

            return;

        }


        try {

            const response = await fetch(
                `${API_BASE_URL}cart/clear/`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${accessToken}`,
                    },

                }
            );


            if (!response.ok) {

                throw new Error(
                    "Unable to clear cart."
                );

            }


            showMessage(
                "Cart cleared successfully."
            );


            await loadCart();

        } catch (error) {

            console.error(error);

            showMessage(
                "Unable to clear cart.",
                "danger"
            );

        }

    }
);


checkoutButton.addEventListener(
    "click",
    async function () {

        const accessToken =
            localStorage.getItem(
                "access_token"
            );


        if (!accessToken) {

            window.location.href =
                "/login/";

            return;

        }


        const confirmed =
            confirm(
                "Are you sure you want to place this order?"
            );


        if (!confirmed) {

            return;

        }


        checkoutButton.disabled = true;

        checkoutButton.textContent =
            "Placing Order...";


        try {

            const response = await fetch(
                `${API_BASE_URL}orders/create/`,
                {
                    method: "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${accessToken}`,

                        "Content-Type":
                            "application/json",

                    },

                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message
                    ||
                    "Unable to place order."
                );

            }


            showMessage(
                data.message
                ||
                "Order placed successfully."
            );


            setTimeout(
                function () {

                    window.location.href =
                        "/orders/";

                },
                800
            );

        } catch (error) {

            console.error(error);

            showMessage(
                error.message,
                "danger"
            );


            checkoutButton.disabled = false;

            checkoutButton.textContent =
                "Proceed to Checkout";

        }

    }
);


loadCart();