import { Controller } from "@hotwired/stimulus"
// import { initUploader, findElementByClassName } from "./multiupload.js"

export default class extends Controller {
  static get targets() {
    return ["label", "input"]
  }

  keyup(e) {
    // show the label of the input field when the input value is not empty
    if (this.hasLabelTarget) {
      if (e.currentTarget.value.length > 0) {
        this.labelTarget.classList.add("is-visible")
      } else {
        this.labelTarget.classList.remove("is-visible")
      }
    }
  }

  keypress(e) {
    if (e.key === "Enter") {
      e.preventDefault()
      if (this.inputTarget.value.length > 0) {
        if (this.inputTarget.form) this.inputTarget.form.submit()
      }
    }
  }

  initialize() {
    console.log("### connect")
    this.initUploader = initUploader
  }
}
