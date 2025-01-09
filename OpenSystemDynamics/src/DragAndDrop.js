
class DragAndDrop {
  /** @type {HTMLElement} */
  static #dropArea;
  /** @type {HTMLElement} */
  static #overlay;


  static init() {
    this.#dropArea = document.body;
    this.#overlay = document.getElementById("overlay");

    this.#dropArea.addEventListener("dragenter", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.#showOverlay();
    });
    this.#dropArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    this.#overlay.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.#hideOverlay();
    });
    this.#overlay.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.#hideOverlay();

      const file = e.dataTransfer.files[0]
      fileManager.loadFromFile(file);
    });
  }
  static #showOverlay() {
    this.#overlay.classList.remove("hidden");
  }
  static #hideOverlay() {
    this.#overlay.classList.add("hidden");
  }
}


