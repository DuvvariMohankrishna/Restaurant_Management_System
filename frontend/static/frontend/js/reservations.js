document.addEventListener(
    "DOMContentLoaded",
    function () {

        const accessToken =
            localStorage.getItem(
                "access_token"
            );


        if (!accessToken) {

            window.location.href =
                "/login/";

            return;

        }


        setMinimumDate();

        loadReservations();


        const reservationForm =
            document.getElementById(
                "reservation-form"
            );


        reservationForm.addEventListener(
            "submit",
            createReservation
        );


        const availabilityButton =
            document.getElementById(
                "check-availability-btn"
            );


        availabilityButton.addEventListener(
            "click",
            checkAvailability
        );

    }
);


function setMinimumDate() {

    const dateInput =
        document.getElementById(
            "reservation-date"
        );


    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    dateInput.min =
        today;

}


function showReservationMessage(
    message,
    type = "success"
) {

    const messageContainer =
        document.getElementById(
            "reservation-message"
        );


    messageContainer.innerHTML =
        `

        <div
            class="
                alert
                alert-${type}
            "
        >

            ${message}

        </div>

    `;

}


async function loadReservations() {

    const reservationsList =
        document.getElementById(
            "reservations-list"
        );


    const accessToken =
        localStorage.getItem(
            "access_token"
        );


    try {

        const response =
            await fetch(
                `${API_BASE_URL}reservations/`,
                {

                    method: "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${accessToken}`,

                    },

                }
            );


        if (!response.ok) {

            if (
                response.status === 401
            ) {

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
                "Unable to load reservations."
            );

        }


        const data =
            await response.json();


        const reservations =
            data.results || data;


        displayReservations(
            reservations
        );

    }

    catch (error) {

        console.error(
            error
        );


        reservationsList.innerHTML =
            `

            <div class="col-12">

                <div class="alert alert-danger">

                    Unable to load reservations.

                </div>

            </div>

        `;

    }

}


function displayReservations(
    reservations
) {

    const reservationsList =
        document.getElementById(
            "reservations-list"
        );


    reservationsList.innerHTML =
        "";


    if (
        !reservations ||
        reservations.length === 0
    ) {

        reservationsList.innerHTML =
            `

            <div class="col-12">

                <div
                    class="
                        card
                        shadow-sm
                    "
                >

                    <div
                        class="
                            card-body
                            text-center
                        "
                    >

                        <h5>

                            No reservations yet

                        </h5>

                        <p
                            class="
                                text-muted
                                mb-0
                            "
                        >

                            Reserve a table to see
                            your reservations here.

                        </p>

                    </div>

                </div>

            </div>

        `;


        return;

    }


    reservations.forEach(
        function (
            reservation
        ) {

            const reservationCard =
                createReservationCard(
                    reservation
                );


            reservationsList.insertAdjacentHTML(
                "beforeend",
                reservationCard
            );

        }
    );

}


function createReservationCard(
    reservation
) {

    let cancelButton =
        "";


    if (
        reservation.status !==
        "CANCELLED"

        &&

        reservation.status !==
        "COMPLETED"
    ) {

        cancelButton =
            `

            <button
                class="
                    btn
                    btn-outline-danger
                    btn-sm
                    mt-3
                "

                onclick="
                    cancelReservation(
                        ${reservation.id}
                    )
                "
            >

                Cancel Reservation

            </button>

        `;

    }


    return `

        <div class="col-12">

            <div
                class="
                    card
                    shadow-sm
                "
            >

                <div class="card-body">

                    <div
                        class="
                            d-flex
                            justify-content-between
                            align-items-start
                        "
                    >

                        <div>

                            <h5>

                                Table
                                ${reservation.table_number}

                            </h5>

                            <p
                                class="
                                    mb-1
                                    text-muted
                                "
                            >

                                Date:
                                ${reservation.reservation_date}

                            </p>

                            <p
                                class="
                                    mb-1
                                    text-muted
                                "
                            >

                                Time:
                                ${reservation.reservation_time}

                            </p>

                            <p
                                class="
                                    mb-0
                                    text-muted
                                "
                            >

                                Guests:
                                ${reservation.number_of_guests}

                            </p>

                        </div>


                        <span
                            class="
                                badge
                                text-bg-secondary
                            "
                        >

                            ${reservation.status}

                        </span>

                    </div>


                    ${cancelButton}

                </div>

            </div>

        </div>

    `;

}


async function createReservation(
    event
) {

    event.preventDefault();


    const reservationDate =
        document.getElementById(
            "reservation-date"
        ).value;


    const reservationTime =
        document.getElementById(
            "reservation-time"
        ).value;


    const tableNumber =
        document.getElementById(
            "table-number"
        ).value;


    const numberOfGuests =
        document.getElementById(
            "number-of-guests"
        ).value;


    const accessToken =
        localStorage.getItem(
            "access_token"
        );


    const reservationData =
        {

            reservation_date:
                reservationDate,

            reservation_time:
                reservationTime,

            table_number:
                Number(
                    tableNumber
                ),

            number_of_guests:
                Number(
                    numberOfGuests
                ),

        };


    try {

        const response =
            await fetch(
                `${API_BASE_URL}reservations/`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${accessToken}`,

                    },

                    body:
                        JSON.stringify(
                            reservationData
                        ),

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            let errorMessage =
                "Unable to create reservation.";


            if (
                typeof data === "object"
            ) {

                errorMessage =
                    Object.values(
                        data
                    )
                        .flat()
                        .join(
                            " "
                        );

            }


            throw new Error(
                errorMessage
            );

        }


        showReservationMessage(
            "Table reserved successfully."
        );


        document
            .getElementById(
                "reservation-form"
            )
            .reset();


        loadReservations();

    }

    catch (error) {

        console.error(
            error
        );


        showReservationMessage(
            error.message,
            "danger"
        );

    }

}


async function checkAvailability() {

    const reservationDate =
        document.getElementById(
            "reservation-date"
        ).value;


    const reservationTime =
        document.getElementById(
            "reservation-time"
        ).value;


    const tableNumber =
        document.getElementById(
            "table-number"
        ).value;


    if (
        !reservationDate
        ||
        !reservationTime
        ||
        !tableNumber
    ) {

        showReservationMessage(
            "Please select date, time and table number first.",
            "warning"
        );


        return;

    }


    const accessToken =
        localStorage.getItem(
            "access_token"
        );


    try {

        const params =
            new URLSearchParams(
                {

                    reservation_date:
                        reservationDate,

                    reservation_time:
                        reservationTime,

                    table_number:
                        tableNumber,

                }
            );


        const response =
            await fetch(
                `${API_BASE_URL}reservations/availability/?${params.toString()}`,
                {

                    method: "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${accessToken}`,

                    },

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message
                ||
                "Unable to check availability."
            );

        }


        if (
            data.available
        ) {

            showReservationMessage(
                "This table is available.",
                "success"
            );

        }

        else {

            showReservationMessage(
                "This table is not available at the selected time.",
                "danger"
            );

        }

    }

    catch (error) {

        console.error(
            error
        );


        showReservationMessage(
            error.message,
            "danger"
        );

    }

}


async function cancelReservation(
    reservationId
) {

    const confirmed =
        confirm(
            "Are you sure you want to cancel this reservation?"
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
                `${API_BASE_URL}reservations/${reservationId}/cancel/`,
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
                "Unable to cancel reservation."
            );

        }


        showReservationMessage(
            "Reservation cancelled successfully."
        );


        loadReservations();

    }

    catch (error) {

        console.error(
            error
        );


        showReservationMessage(
            error.message,
            "danger"
        );

    }

}