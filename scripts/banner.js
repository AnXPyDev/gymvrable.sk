let banner_img = document.getElementById("banner-script-enabled")

banner_img.style.display = "block"

banner_img.src = "/img/banners/" + (1 + Math.floor(Math.random() * 21)) + ".jpg"
