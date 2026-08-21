document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const menuContainer =
            document.getElementById(
                "menu-container"
            );

        try {

            const response = await fetch(
                "/api/v1/menu-items/"
            );

            if (!response.ok) {

                throw new Error(
                    "Failed to load menu items."
                );

            }

            const data =
                await response.json();


            const menuItems =
                data.results || data;


            menuContainer.innerHTML = "";


            if (
                !menuItems ||
                menuItems.length === 0
            ) {

                menuContainer.innerHTML = `

                    <div class="col-12 text-center">

                        <p class="text-muted">

                            No menu items available.

                        </p>

                    </div>

                `;

                return;

            }


            menuItems.forEach(
                function (item) {

                    const menuItemHTML = `

                        <div class="col-md-6 col-lg-4">

                            <div class="card h-100 shadow-sm">

                                <div
                                    class="
                                        card-body
                                        d-flex
                                        flex-column
                                    "
                                >

                                    <h4 class="card-title">

                                        ${item.name}

                                    </h4>


                                    <p
                                        class="
                                            card-text
                                            text-muted
                                        "
                                    >

                                        ${
                                            item.description ||
                                            "No description available."
                                        }

                                    </p>


                                    <div class="mt-auto">

                                        <h5
                                            class="
                                                fw-bold
                                                mb-3
                                            "
                                        >

                                            ₹${item.price}

                                        </h5>


                                        <button
                                            class="
                                                btn
                                                btn-warning
                                                w-100
                                            "
                                            onclick="
                                                addToCart(
                                                    ${item.id}
                                                )
                                            "
                                        >

                                            Add to Cart

                                        </button>

                                    </div>

                                </div>

                            </div>

                        </div>

                    `;


                    menuContainer.insertAdjacentHTML(
                        "beforeend",
                        menuItemHTML
                    );

                }
            );

        } catch (error) {

            console.error(error);


            menuContainer.innerHTML = `

                <div class="col-12 text-center">

                    <div class="alert alert-danger">

                        Failed to load menu items.
                        Please try again later.

                    </div>

                </div>

            `;

        }

    }
);


async function addToCart(
    menuItemId
) {

    const accessToken =
        localStorage.getItem(
            "access_token"
        );


    if (!accessToken) {

        alert(
            "Please log in before adding items to your cart."
        );

        window.location.href =
            "/login/";

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}cart/add/`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${accessToken}`,

                    },

                    body: JSON.stringify(
                        {

                            menu_item:
                                menuItemId,

                            quantity: 1,

                        }
                    ),

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Failed to add item to cart."
            );

        }


        alert(
            "Item added to cart successfully."
        );


        console.log(
            "Cart response:",
            data
        );

    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Unable to add item to cart."
        );

    }

}