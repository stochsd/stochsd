class ClipboardItem {
	constructor(id) {
		this.id = id;
		this.absolutePosition = [0, 0];
		this.relativePosition = [0, 0];
	}
}

class Clipboard {
	static init() {
		this.copiedItems = [];
	}
	static copyObject(clipboardItem) {
		let parent = graph.children[0].children[0];
		let vertex = simpleCloneNode2(findID(clipboardItem.id), parent);
		let relativePosition = clipboardItem.relativePosition;
		setCenterPosition(vertex, [mouse.x + relativePosition[0], mouse.y + relativePosition[1]]);
		let oldName = getName(vertex);
		setName(vertex, findFreeName(oldName + "_"));
		syncAllVisuals();
	}
	static copy() {
		this.copiedItems = [];
		let rawSelectedIdArray = get_selected_ids();

		// Create parentIdArray as we are only intressted in copying parent nodes
		let parentIdArray = [];
		for (let i in rawSelectedIdArray) {
			let parentId = get_parent_id(rawSelectedIdArray[i]);
			if (parentIdArray.indexOf(parentId) == -1) {
				parentIdArray.push(parentId);
			}
		}

		// Create clipboard items
		for (let i in parentIdArray) {
			let clipboardItem = new ClipboardItem(parentIdArray[i]);
			let tmp_object = Visuals.get(parentIdArray[i]);

			let absolutePosition = tmp_object.getPos();
			clipboardItem.absolutePosition = absolutePosition;

			this.copiedItems.push(clipboardItem);
		}

		// Create position list to calculate relative positions
		let positionList = [];
		for (let i in this.copiedItems) {
			positionList.push(this.copiedItems[i].absolutePosition);
			do_global_log(JSON.stringify(positionList));
		}
		let centerPosition = centerCoordinates(positionList);
		do_global_log("Center positio" + JSON.stringify(centerPosition));


		// Calculate rel positions for objects
		for (let i in this.copiedItems) {
			do_global_log("hoj " + JSON.stringify(positionDifference(this.copiedItems[i].absolutePosition, centerPosition)));
			this.copiedItems[i].relativePosition = positionDifference(this.copiedItems[i].absolutePosition, centerPosition);
		}
	}
	static paste() {
		for (let i in this.copiedItems) {
			this.copyObject(this.copiedItems[i]);
		}
	}
}
Clipboard.init();

