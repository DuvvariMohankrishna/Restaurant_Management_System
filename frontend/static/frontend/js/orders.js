document.addEventListener(
    "DOMContentLoaded",
    loadOrders
);


async function loadOrders() {

    const orderNotice = sessionStorage.getItem("order_notice");
    if (orderNotice) {
        sessionStorage.removeItem("order_notice");
        const notice = document.createElement("div");
        notice.className = "alert alert-success container mt-4";
        notice.setAttribute("role", "status");
        notice.textContent = orderNotice;
        const main = document.querySelector("main");
        if (main) main.prepend(notice);
    }

    const loadingElement =
        document.getElementById(
            "orders-loading"
        );

    const errorElement =
        document.getElementById(
            "orders-error"
        );

    const emptyElement =
        document.getElementById(
            "empty-orders"
        );

    const container =
        document.getElementById(
            "orders-container"
        );


    try {

        const accessToken =
            localStorage.getItem(
                "access_token"
            );


        if (!accessToken) {

            window.location.href =
                "/login/";

            return;
        }


        const response =
            await fetch(
                "/api/v1/orders/",
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${accessToken}`,
                        "Content-Type":
                            "application/json",
                    },
                }
            );


        if (!response.ok) {

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
                "Unable to load orders."
            );
        }


        const data =
            await response.json();


        loadingElement.classList.add(
            "d-none"
        );


        const orders =
            data.results || [];


        if (orders.length === 0) {

            emptyElement.classList.remove(
                "d-none"
            );

            return;
        }


        orders.forEach(
            function(order) {

                const orderCard =
                    createOrderCard(
                        order
                    );

                container.appendChild(
                    orderCard
                );

            }
        );


    } catch (error) {

        loadingElement.classList.add(
            "d-none"
        );

        errorElement.textContent =
            error.message;

        errorElement.classList.remove(
            "d-none"
        );

    }

}


function createOrderCard(order) {

    const column =
        document.createElement(
            "div"
        );

    column.className =
        "col-lg-6";


    let itemsHtml = "";


    order.items.forEach(
        function(item) {

            itemsHtml += `

                <li
                    class="
                        list-group-item
                        d-flex
                        justify-content-between
                    "
                >

                    <span>

                        ${item.menu_item_name}
                        × ${item.quantity}

                    </span>

                    <span>

                        ₹${item.price}

                    </span>

                </li>

            `;

        }
    );


    let cancelButton = "";


    if (
        order.status === "PENDING"
        ||
        order.status === "CONFIRMED"
    ) {

        cancelButton = `

            <button
                class="
                    btn
                    btn-outline-danger
                    btn-sm
                    mt-3
                "
                onclick="
                    cancelOrder(
                        ${order.id}
                    )
                "
            >

                Cancel Order

            </button>

        `;

    }


    column.innerHTML = `

        <div class="card shadow-sm h-100">

            <div class="card-body">

                <div
                    class="
                        d-flex
                        justify-content-between
                        align-items-start
                    "
                >

                    <div>

                        <h5
                            class="card-title"
                        >

                            Order
                            #${order.order_number}

                        </h5>

                        <p
                            class="
                                text-muted
                                small
                            "
                        >

                            ${formatDate(
                                order.created_at
                            )}

                        </p>

                    </div>


                    <span
                        class="
                            badge
                            text-bg-secondary
                        "
                    >

                        ${order.status}

                    </span>

                </div>


                <ul
                    class="
                        list-group
                        list-group-flush
                        mt-3
                    "
                >

                    ${itemsHtml}

                </ul>


                <div
                    class="
                        d-flex
                        justify-content-between
                        align-items-center
                        mt-3
                    "
                >

                    <strong>

                        Total:
                        ₹${order.total_amount}

                    </strong>

                </div>


                ${cancelButton}

            </div>

        </div>

    `;


    return column;

}


function formatDate(dateString) {

    const date =
        new Date(dateString);


    return date.toLocaleString();

}


async function cancelOrder(orderId) {

    const confirmed =
        confirm(
            "Are you sure you want to cancel this order?"
        );


    if (!confirmed) {

        return;

    }


    const accessToken =
        localStorage.getItem(
            "access_token"
        );


    try {

        const response =
            await fetch(
                `/api/v1/orders/${orderId}/cancel/`,
                {
                    method: "PATCH",

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
                "Unable to cancel order."
            );

        }


        alert(
            data.message
        );


        window.location.reload();


    } catch (error) {

        alert(
            error.message
        );

    }

}