for (let year of document.getElementsByClassName("archive-year-wrapper")) {
    let button = year.getElementsByClassName("archive-year-button")[0];
    let content = year.getElementsByClassName("archive-year-content")[0];

    content.style.display = "none";

    let display_state = false;

    button.onclick = () => {
        display_state = !display_state;

        if (display_state) {
            content.style.display = "block";
        } else {
            content.style.display = "none";
        }
    };

}
