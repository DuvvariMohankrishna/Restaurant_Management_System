function getAccessToken() {

    return localStorage.getItem(
        "access_token"
    );

}


function isLoggedIn() {

    return !!getAccessToken();

}


function logout() {

    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "refresh_token"
    );

    window.location.href =
        "/login/";

}


document.addEventListener(
    "DOMContentLoaded",
    function () {

        const accessToken =
            getAccessToken();


        const loginNavItem =
            document.getElementById(
                "login-nav-item"
            );


        const registerNavItem =
            document.getElementById(
                "register-nav-item"
            );


        const logoutNavItem =
            document.getElementById(
                "logout-nav-item"
            );


        const ordersNavItem =
            document.getElementById(
                "orders-nav-item"
            );


        const reservationsNavItem =
            document.getElementById(
                "reservations-nav-item"
            );


        if (accessToken) {

            if (loginNavItem) {

                loginNavItem.classList.add(
                    "d-none"
                );

            }


            if (registerNavItem) {

                registerNavItem.classList.add(
                    "d-none"
                );

            }


            if (logoutNavItem) {

                logoutNavItem.classList.remove(
                    "d-none"
                );

            }


            if (ordersNavItem) {

                ordersNavItem.classList.remove(
                    "d-none"
                );

            }


            if (reservationsNavItem) {

                reservationsNavItem.classList.remove(
                    "d-none"
                );

            }

        }

        else {

            if (logoutNavItem) {

                logoutNavItem.classList.add(
                    "d-none"
                );

            }


            if (ordersNavItem) {

                ordersNavItem.classList.add(
                    "d-none"
                );

            }


            if (reservationsNavItem) {

                reservationsNavItem.classList.add(
                    "d-none"
                );

            }

        }

    }
);