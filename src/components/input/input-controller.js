import { Controller } from "stimulus"

export default class extends Controller {
  static get targets() {
    return ["label", "input"]
  }

  keyup() {
    // show the label of the input field when the input value is not empty
    if (this.hasLabelTarget) {
      if (this.inputTarget.value.length > 0) {
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
}
