// ------------------------------------------
// 1. FETCH USING PROMISES
// ------------------------------------------

fetch("https://jsonplaceholder.typicode.com/users/1")
    .then(response => {

        if (!response.ok) {
            throw new Error("Network response was not OK");
        }

        return response.json();
    })
    .then(data => {

        console.log("Promise API Response:");
        console.log(data);

    })
    .catch(error => {

        console.error("Promise Fetch Error:", error);

    });


// ------------------------------------------
// 2. FETCH USING ASYNC / AWAIT
// ------------------------------------------

async function fetchUser() {

    try {

        const response = await fetch(
            "https://jsonplaceholder.typicode.com/users/2"
        );

        if (!response.ok) {
            throw new Error("Network response was not OK");
        }

        const data = await response.json();

        console.log("Async/Await API Response:");
        console.log(data);

    } catch (error) {

        console.error("Async/Await Fetch Error:", error);

    }
}

fetchUser();