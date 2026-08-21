const loginForm =
    document.getElementById("login-form");


loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const username =
            document
                .getElementById("username")
                .value;

        const password =
            document
                .getElementById("password")
                .value;

        const messageElement =
            document.getElementById(
                "login-message"
            );


        try {

            const response = await fetch(
                `${API_BASE_URL}accounts/login/`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        username: username,
                        password: password,
                    }),
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                messageElement.innerHTML = `

                    <div class="alert alert-danger">

                        ${
                            data.detail ||
                            "Login failed."
                        }

                    </div>

                `;

                return;
            }


            localStorage.setItem(
                "access_token",
                data.access
            );


            localStorage.setItem(
                "refresh_token",
                data.refresh
            );


            messageElement.innerHTML = `

                <div class="alert alert-success">

                    Login successful.
                    Redirecting...

                </div>

            `;


            setTimeout(
                function () {

                    window.location.href = "/";

                },
                1000
            );

        } catch (error) {

            console.error(error);


            messageElement.innerHTML = `

                <div class="alert alert-danger">

                    Something went wrong.
                    Please try again.

                </div>

            `;
        }
    }
);