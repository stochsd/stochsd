export class CoordRect<El extends Element | undefined> {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  constructor(public element: El) {
    this.x1 = 0;
    this.y1 = 0;
    this.x2 = 0;
    this.y2 = 0;
  }
  setVisible(visible: boolean) {
    this.element?.setAttribute("visibility", visible ? "visible" : "hidden");
  }
  xmin() {
    return this.x1 < this.x2 ? this.x1 : this.x2;
  }
  ymin() {
    return this.y1 < this.y2 ? this.y1 : this.y2;
  }
  width() {
    return Math.abs(this.x2 - this.x1);
  }
  height() {
    return Math.abs(this.y2 - this.y1);
  }
  update() {
    this.element?.setAttribute("x", `${this.xmin()}`);
    this.element?.setAttribute("y", `${this.ymin()}`);

    this.element?.setAttribute("width", `${this.width()}`);
    this.element?.setAttribute("height", `${this.height()}`);
  }
}

(window as any).CoordRect = CoordRect