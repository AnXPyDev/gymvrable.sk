let overlay = document.getElementById("gallery-overlay");
let images = Array.from(document.getElementsByClassName("gallery-image-wrapper"));
let thumbnails = Array.from(document.getElementsByClassName("gallery-thumbnail-wrapper"));

let next_button = document.getElementById("gallery-button-next");
let prev_button = document.getElementById("gallery-button-prev");
let exit_button = document.getElementById("gallery-button-exit");


for (let img of images) {
    img.style.display = "none";
}

images[0].style.display = "flex";

let overlayActive = false;

let activeImage = {
    id: 0,
    image: images[0]
};

function showOverlay() {
    overlay.style.display = "block";
    overlayActive = true;
}

function hideOverlay() {
    overlay.style.display = "none";
    overlayActive = false;
}

function showImage(i) {
    if (i < 0 || i >= images.length) {
        console.log("Tried to show image outside range");
        return;
    }
    activeImage.image.style.display = "none";
    activeImage.id = i;
    activeImage.image = images[i];
    activeImage.image.style.display = "flex";
}

for (let i = 0; i < thumbnails.length; i++) {
    thumbnails[i].onclick = () => {
        showOverlay()
        showImage(i);
    }
}


function prevImage() {
    let newId = activeImage.id - 1;
    if (newId < 0) {
        newId = images.length - 1;
    }

    showImage(newId)
}

function nextImage() {
    let newId = activeImage.id + 1;
    if (newId >= images.length) {
        newId = 0;
    }

    showImage(newId)
}

window.addEventListener("keydown", (event) => {
    if (event.key == "ArrowRight") {
        nextImage();
    } else if (event.key == "ArrowLeft") {
        prevImage();
    } else if (event.key == "Escape") {
        hideOverlay();
    }
})

let touch;

overlay.addEventListener("touchstart", (event) => {
    touch = event;
})

overlay.addEventListener("touchmove", (event) => {
    event.preventDefault();
})

overlay.addEventListener("touchend", (event) => {
    if (event.timeStamp - touch.timeStamp > 500) {
        return;
    }
    let distX = touch.changedTouches[0].screenX - event.changedTouches[0].screenX;
    let distY = touch.changedTouches[0].screenY - event.changedTouches[0].screenY;
    if (Math.abs(distX) > 50 && Math.abs(distY) < Math.abs(distX)) {
        if (distX < 0) {
            prevImage();
        } else if (distX > 0) {
            nextImage();
        }
    }
})



exit_button.onclick = () => {
    hideOverlay();
}

prev_button.onclick = () => {
    prevImage();
}

next_button.onclick = () => {
    nextImage();
}
