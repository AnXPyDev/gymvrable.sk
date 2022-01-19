let buttons = Array.from(document.getElementsByClassName("selector-button"));
let contents = Array.from(document.getElementsByClassName("selector-content"));

let count = Math.min(buttons.length, contents.length);

contents.splice(count);

for (let i = 0; i < count; i++) {
	let button = buttons[i];
	let content = contents[i];

	button.onclick = () => {
		for (let content of contents) {
			content.style.display = "none";
		}

		content.style.display = "block";
	}

	content.style.display = "none";
}

contents[0].style.display = "block";
