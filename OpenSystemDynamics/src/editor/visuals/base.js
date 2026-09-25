class BaseObject {
		/**
	 * @param {string} id 
	 * @param {string} type 
	 * @param {[number, number]} pos 
	 */
	constructor(id, type, pos) {
		this.id = id;
		this.type = type;
		this.selected = false;
		this.name_radius = 30;
		this.superClass = "baseobject";
		this.color = defaultStroke;
		// Warning: this.primitive can be null, since all DIM objects does not have a IM object such as anchors and flow_auxiliarys
		// We should therefor check if this.primitive is null, in case we dont know which class we are dealing with
		this.primitive = findID(this.id);

		this.element_array = [];
		this.selector_array = [];
		this.icons; 	// SVG.group with icons such as ghost and questionmark
		this.group = null;

		this.namePosList = [[0, this.name_radius + 8], [this.name_radius, 0], [0, -this.name_radius], [-this.name_radius, 0]];
	}

	setColor(color) {
		this.color = color;
		for (let element of this.element_array) {
			if (element.getAttribute("class") == "element") {
				element.setAttribute("stroke", this.color);
			} else if (element.getAttribute("class") == "name_element") {
				element.setAttribute("fill", this.color);
			} else if (element.getAttribute("class") == "highlight") {
				element.setAttribute("fill", this.color);
			}
		}
		// AnchorPoint has no primitive
		// TODO: this should be replaced with a subscribe pattern instead - where plots can subscribe to primitives
		this.primitive?.setAttribute("Color", this.color);
		if (this.color) {
			Visuals.twoPointers()
				.filter(twoP => ["table", "timeplot", "xyplot", "compareplot", "histoplot"].includes(twoP.type))
				.filter(p => getDisplayIds(p.primitive).includes(this.id))
				.map(p => p.render())
		}
	}

	updateDefinitionError() {
		let definitionErrorTypes = ["stock", "variable", "constant", "flow", "converter"];
		if (definitionErrorTypes.includes(this.type)) {
			DefinitionError.check(this.primitive);
			DefinitionError.has(this.primitive);
		}
	}

	getBoundRect() {
		// Override this function
		// This functions returns a hash map, e.i. {"minX": 10, "maxX": 20, "minY": 40, "maxY": 50}
		// The hashmap dictates in what rect mouse can click to create connections
	}

	getLinkMountPos(closeToPoint) {
		return this.getPos();
	}

	isSelected() {
		return this.selected;
	}

	/** The top level visual this belongs to, e.g. the flow of an anchor. A top level visual is its own parent. */
	getParent() {
		return Visuals.get(Visuals.getParentId(this.id));
	}

	clean() {
		// Clean all children
		let children = getChildren(this.id);
		for (let id in children) {
			children[id].clean();
			Visuals.remove(id);
		}

		this.clearImage();
	}
	clearImage() {
		// Do the cleaning
		for (let i in this.selector_array) {
			this.selector_array[i].remove();
		}
		for (let key in this.element_array) {
			this.element_array[key].remove();
		}
		if (!this.group)
			console.log(this.id, this.name, this.type);
		this.group.remove();
	}
	doubleClick() {
		// This function has to be overriden
	}
	afterNameChange() {
		// Do nothing. this method is supposed to be overriden by subclasses
	}
	afterMove(diff_x, diff_y) {
		// Override this		
	}
	attachEvent() {
		// This happens every time a connection is connected or disconnected
		// Or when the connections starting point is connected or disconnected
		// Override this
	}
	get name_pos() {
		return this._name_pos;
	}

	set name_pos(value) {
		//~ alert("name pos for "+this.id+" "+getStackTrace());
		//~ do_global_log("updating name pos to "+value);
		this._name_pos = Number(value);
		if (this.primitive) {
			this.primitive.setAttribute("RotateName", value.toString());
		}
	}
	getType() {
		return this.type;
	}
	nameDoubleClick() {

		if (this.is_ghost) {
			errorPopUp("You must rename a ghost by renaming the original.");
			return;
		}
		let id = Visuals.getParentId(this.id)
		definitionEditor.open(id, ".name-field");
		event.stopPropagation();
	}

	setName(new_name) {
		if (this.name_element == null) {
			do_global_log("Element has no name");
			return;
		}
		this.name_element.innerHTML = new_name;
		Visuals.twoPointers()
			.filter(twoP => ["table", "timeplot", "xyplot", "compareplot", "histoplot"].includes(twoP.type))
			.map(p => p.updateChart())
	}

	attributeChangeHandler(attributeName, value) {
		// Override this
	}
}

class OnePointer extends BaseObject {
		/**
	 * @param {string} id 
	 * @param {string} type 
	 * @param {[number, number]} pos 
	 */
	constructor(id, type, pos, extras = false) {
		super(id, type, pos);
		Visuals.addOnePointer(this);
		this.id = id;
		this.type = type;
		this.element_array = [];
		this.selector_array = [];
		this.group = null;
		this.superClass = "OnePointer";
		this.draggable = true; // Default value, change it afterwords if you want
		this.name_centered = false;
		this.pos = pos;
		this.is_ghost = false; // Default value
		if (extras != false) {
			do_global_log("has extras");
			if ("is_ghost" in extras) {
				this.is_ghost = extras["is_ghost"];
			}
		}
		do_global_log("is ghost " + this.is_ghost);

		this.loadImage();

		this.select();

		// Handled for when attribute changes in corresponding SimpleNode
		this.changeAttributeHandler = (attribute, value) => {
			if (attribute == "name") {
				this.setName(value);
			}
		}
	}

	getBoundRect() {
		let [x, y] = this.getPos();
		return { "minX": x - 10, "maxX": x + 10, "minY": y - 10, "maxY": y + 10 };
	}

	setPos(pos) {
		if (pos[0] == this.pos[0] && pos[1] == this.pos[1]) {
			// If the position has not changed we should not update it
			// This turned out to be a huge optimisation
			return;
		}
		// Recreating the array is intentional to avoid copying a reference
		//~ alert(" old pos "+this.pos[0]+","+this.pos[1]+" new pos "+pos[0]+","+pos[1]);
		this.pos = [pos[0], pos[1]];
	}

	/** @returns {[number, number]} */
	getPos() {
		// This must be done by splitting up the array and joining it again to avoid sending a reference
		// Earlier we had a bug that was caused by getPos was sent as reference and we got unwanted updates of the values
		return [this.pos[0], this.pos[1]];
	}


	loadImage() {
		let element_array = this.getImage();
		if (element_array == false) {
			alert("getImage() must be overriden to add graphics to this object");
		}

		this.element_array = element_array;

		for (let key in element_array) {
			if (element_array[key].getAttribute("class") == "highlight") {
				this.selector_array.push(element_array[key]);
			}
		}

		for (let key in element_array) {
			if (element_array[key].getAttribute("class") == "icons") {
				this.icons = this.element_array[key]
				break;
			}
		}

		if (this.is_ghost && this.icons) {
			this.icons.set("ghost", "visible");
		}


		// Set name element
		this.name_element = null;
		for (let key in element_array) {
			if (element_array[key].getAttribute("class") == "name_element") {
				this.name_element = element_array[key];
				$(this.name_element).dblclick((event) => {
					this.nameDoubleClick();
				});
			}
		}
		this.group = SVG.append(this.getLayer(), SVG.group(this.element_array));
		if (!this.group)
			console.log("group", this.id, this.primitive, this.name, this.type, this.getLayer() ,this.group);
		this.group.setAttribute("node_id", this.id);

		this.update();

		for (let key in this.element_array) {
			let element = this.element_array[key];
			$(element).on("mousedown", (event) => {
				primitive_mousedown(this.id, event);
			});
		}
		$(this.group).dblclick((event) => {
			if (!$(event.target).hasClass("name_element")) {
				this.doubleClick(this.id);
			}
		});
	}
	getLayer() {
		return false;
	}

	select() {
		this.selected = true;
		for (let i in this.selector_array) {
			this.selector_array[i].setAttribute("visibility", "visible");
		}
		if (this.icons) {
			this.icons.setColor("white");
		}
	}
	unselect() {
		this.selected = false;
		for (let i in this.selector_array) {
			this.selector_array[i].setAttribute("visibility", "hidden");
		}
		if (this.icons) {
			this.icons.setColor(this.color);
		}
	}
	update() {
		this.group.setAttribute("transform", "translate(" + this.pos[0] + "," + this.pos[1] + ")");

		let prim = this.is_ghost ? findID(this.primitive.getAttribute("Source")) : this.primitive;
		if (this.icons && prim) {
			const hasDefError = DefinitionError.has(prim);
			this.icons.set("questionmark", hasDefError ? "visible" : "hidden");
			this.icons.set("dice", (!hasDefError && hasRandomFunction(getValue(prim))) ? "visible" : "hidden");
		}

		if (!this.is_ghost) {
			this.updateGhosts();
		}
	}
	updateGhosts() {
		let ghostIds = findGhostsOfID(this.id);
		ghostIds.map(gId => {
			Visuals.getOnePointer(gId)?.update();
		});
	}
	updatePosition() {
		this.update();
	}
	getImage() {
		return false;
	}
}

class BasePrimitive extends OnePointer {
	constructor(id, type, pos, extras) {
		super(id, type, pos, extras);
	}
	doubleClick() {
		openPrimitiveDialog(Visuals.getParentId(this.id));
	}
}

/** @typedef {"invalid" | "start" | "end" | "bezier1" | "bezier2" | "orthoMiddle"} AnchorType */
class AnchorPoint extends OnePointer {
	/**
	 * @param {string} id 
	 * @param {string} type 
	 * @param {[number, number]} pos 
	 * @param {AnchorType} anchorType 
	 */
	constructor(id, type, pos, anchorType) {
		super(id, type, pos);
		this.anchorType = anchorType;
		this.isSquare = false;
	}
	isAttached() {
		let parent = this.getParent();
		if (!parent.getStartAttach) {
			return;
		}
		switch (this.anchorType) {
			case "start":
				return !!parent.getStartAttach();
			case "end":
				return !!parent.getEndAttach()
			default:
				// It's not a start or end anchor so it cannot be attached
				return false;
		}
	}
	setAnchorType(anchorType) {
		this.anchorType = anchorType;
	}
	getAnchorType() {
		return this.anchorType;
	}
	setVisible(newVisible) {
		if (newVisible) {
			for (let element of this.element_array) {
				// Show all elements except for selectors
				if (element.getAttribute("class") != "highlight") {
					element.setAttribute("visibility", "visible");
				}
			}
		}
		else {
			// Hide elements
			for (let element of this.element_array) {
				element.setAttribute("visibility", "hidden");
			}
		}
	}
	updatePosition() {
		this.update();
		let parent = this.getParent();
		if (parent.start_anchor && parent.end_anchor) {
			parent.syncAnchorToPrimitive(this.anchorType);
		}
	}
	getImage() {
		if (this.isSquare) {
			return [
				SVG.rect(-4, -4, 8, 8, this.color, "white", "element"),
				SVG.rect(-4, -4, 8, 8, "none", this.color, "highlight")
			];
		} else {
			return [
				SVG.circle(0, 0, 5, this.color, "white", "element"),
				SVG.circle(0, 0, 5, "none", this.color, "highlight")
			];
		}

	}
	getLayer() {
		return SVG.anchorLayer;
	}
	makeSquare() {
		this.isSquare = true;
		this.reloadImage();
	}
	reloadImage() {
		this.clearImage();
		this.loadImage();
	}
	afterMove(diff_x, diff_y) {
		// This is an attempt to make bezier points move with the anchors points but id does not work well with undo
		// commented out until fixed
		let parent = this.getParent();

		if (parent.type == "link") {
			switch (this.anchorType) {
				case "start":
					{
						const [x, y] = parent.b1_anchor.getPos();
						parent.b1_anchor.setPos([x + diff_x, y + diff_y]);
					}
					break;
				case "end":
					{
						const [x, y] = parent.b2_anchor.getPos();
						parent.b2_anchor.setPos([x + diff_x, y + diff_y]);
					}
					break;
			}
		}
	}
}

class OrthoAnchorPoint extends AnchorPoint {
	constructor(id, type, pos, anchorType, index) {
		super(id, type, pos, anchorType);
		this.changed = true;
		this.index = index;
	}
}

function safeDivision(nominator, denominator) {
	// Make sure division by Zero does not happen 
	return denominator == 0 ? 9999999 : (nominator / denominator);
}

function sign(value) {
	return (value < 0) ? -1 : 1;
}

