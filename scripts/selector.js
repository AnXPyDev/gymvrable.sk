let buttons = Array.from(document.getElementsByClassName("selector-button"));
let contents = Array.from(document.getElementsByClassName("selector-content"));

let count = Math.min(buttons.length, contents.length);

let active_item = 0;

let params = new URLSearchParams(document.location.search);
let preselect = params.get("selector");

contents.splice(count);

for (let i = 0; i < count; i++) {
	let button = buttons[i];
	let content = contents[i];

	if (preselect != null && button.getAttribute("selector-id") == preselect) {
		active_item = i;
	}

	/*let href = button.getAttribute("selector-href");
	let target = button.getAttribute("selector-target");*/

	button.onclick = () => {
		contents[active_item].style.display = "none";
		buttons[active_item].classList.remove("selector-selected");

		/*if (href != null) {
			window.open(href, target);
		}*/

		button.classList.add("selector-selected");
		content.style.display = "";
		active_item = i;
	}

	content.style.display = "none";
}

contents[active_item].style.display = "";
buttons[active_item].classList.add("selector-selected");

for (let elm of Array.from(document.getElementsByClassName("selector-hide"))) {
	elm.style.display = "none";
}
