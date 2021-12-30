let sub_menu_names = [
	"skola", "zamestnanci", "ziaci", "studium", "bilingvalne", "komisie", "aktivity", "archiv", "kontakt"
];


let sub_menu_count = sub_menu_names.length;

let menu_items = [];
let sub_menus = [];

for (let i = 0; i < sub_menu_count; i++) {
	let menu_name = sub_menu_names[i];

	let sub_menu = document.getElementById("sub-menu-" + menu_name);
	let menu_item = document.getElementById("menu-item-" + menu_name);

	menu_item.addEventListener("mouseenter", () => {
        active_sub_menu.style.display = "none";
		sub_menu.style.display = "block";
        active_sub_menu = sub_menu
	});

	menu_items.push(menu_item);
	sub_menus.push(sub_menu);

}

for (let sub_menu of sub_menus) {
    sub_menu.style.display = "none";
}

active_sub_menu = sub_menus[0];
