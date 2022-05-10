import { Controller } from "stimulus"

export default class extends Controller {
  static get targets() {
    return ["textarea"]
  }

  keypress(e) {
    if (e.key === "Enter") {
      e.preventDefault()
      if (this.textareaTarget.value.length > 0) {
        this.textareaTarget.form.submit()
      }
    }
  }
}
