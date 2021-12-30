let sub_menu_names = [
	"skola", "studium", "pre-zaujemcov", "aktivity", "galeria", "kontakt"
];


let sub_menu_count = sub_menu_names.length;

let menu_items = [];
let sub_menus = [];


for (let i = 0; i < sub_menu_count; i++) {
	let menu_name = sub_menu_names[i];

	let sub_menu = document.getElementById("sub-menu-" + menu_name);
	let menu_item = document.getElementById("menu-item-" + menu_name);

	menu_item.addEventListener("mouseenter", () => {

		for (let j = 0; j < sub_menu_count; j++) {
			sub_menus[j].style.display = "none";
		}

		sub_menu.style.display = "inherit";

	});

	menu_items.push(menu_item);
	sub_menus.push(sub_menu);

}
