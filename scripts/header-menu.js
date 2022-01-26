let menu_items = Array.from(document.getElementsByClassName("menu-item"));
let sub_menus = Array.from(document.getElementsByClassName("sub-menu-div"));

let sub_menu_count = Math.min(menu_items.length, sub_menus.length);

menu_items.splice(sub_menu_count);
sub_menus.splice(sub_menu_count);

for (let i = 0; i < sub_menu_count; i++) {
	let sub_menu = sub_menus[i];
	let menu_item = menu_items[i];

	menu_item.addEventListener("mouseenter", () => {
        active_sub_menu.style.display = "none";
		sub_menu.style.display = "block";
        active_sub_menu = sub_menu
	});
}

for (let sub_menu of sub_menus) {
    sub_menu.style.display = "none";
}

active_sub_menu = sub_menus[0];
