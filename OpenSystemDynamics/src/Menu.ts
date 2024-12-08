/*

This file may distributed and/or modified under the
terms of the Affero General Public License (http://www.gnu.org/licenses/agpl-3.0.html).

*/
declare var $: any

export class Menu {
	static init() {
		$(".eMenu").each(function (_: number, menu: HTMLElement) {
			Menu.create(menu)
		})
		// Hide menu when not clicking on menu button
		$(window).click(function (event) {
			if (!$(event.target).hasClass('menuButton')) {
				$(".menuContent").hide();
			}
		});
	}

	private static create(menu: HTMLElement) {
		// Toggle the visibility of the menu
		$(menu).find(".menuButton").on("click", function () {
			if ($(menu).find(".menuContent").is(":visible")) {
				// Hide all menus
				$(".menuContent").hide();
			} else {
				// Hide all menus
				$(".menuContent").hide();
				// Show the clicked menu
				$(menu).find(".menuContent").show();
			}
		});
	}
}

(window as any).Menu = Menu;
