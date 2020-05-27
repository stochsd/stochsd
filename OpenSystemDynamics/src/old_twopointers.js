/** Tools start here */

class HistoPlotTool extends TwoPointerTool {
	static create_TwoPointer_start(x,y,name) {
		this.primitive = createConnector(name, "HistoPlot", null, null);
		this.current_connection = new HistoPlotVisual(this.primitive.id, this.getType(), [x,y]);
	}
	static init() {
		this.initialSelectedIds = [];
		super.init();
	}
	static leftMouseDown(x,y) {
		this.initialSelectedIds = Object.keys(get_selected_root_objects());
		super.leftMouseDown(x,y);
		this.current_connection.dialog.setIdsToDisplay(this.initialSelectedIds);
		this.current_connection.render();
	}
	static getType() {
		return "histoplot";
	}


}