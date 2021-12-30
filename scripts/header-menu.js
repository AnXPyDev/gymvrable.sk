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

let main_menu_bar = document.getElementById("main-menu-bar");
let sub_menu_bar = document.getElementById("sub-menu-bar");
let main_menu_wrapper = document.getElementById("main-menu-wrapper");
let sub_menu_wrapper = document.getElementById("sub-menu-wrapper");
let body = document.getElementsByTagName("body")[0];

main_menu_bar.style.display = "block";
sub_menu_bar.style.display = "block";

let observer = new ResizeObserver((entries) => {
    for (let entry of entries) {
        if (entry.target == main_menu_wrapper) {
            main_menu_bar.style.height = (entry.contentRect.height) + "px";
        } else if (entry.target == sub_menu_wrapper) {
            sub_menu_bar.style.height = (entry.contentRect.height) + "px";
        } else if (entry.target == body) {
            let width = entry.contentRect.width + "px";
            main_menu_bar.style.width = width;
            sub_menu_bar.style.width = width;
        }
    }
})

observer.observe(main_menu_wrapper);
observer.observe(sub_menu_wrapper);
observer.observe(body)
