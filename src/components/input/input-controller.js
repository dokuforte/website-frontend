import { Controller } from "stimulus"

export default class extends Controller {
  static get targets() {
    return ["input"]
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
