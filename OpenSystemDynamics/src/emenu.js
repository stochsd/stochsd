/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/

function makeMenu(menu) {
	// Toggle the visiblity of the menu
	$(menu).find(".menuButton").click(function() {
		if($(menu).find(".menuContent").is(":visible")) {
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
$(document).ready(function() {
	$(".eMenu").each(function() {
		makeMenu(this);
	});
});

// Hide menu when not clicking on menu button
$(window).click(function(event) {
  if (!$(event.target).hasClass('menuButton')) {
	$(".menuContent").hide();
  }
});
