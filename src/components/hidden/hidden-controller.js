import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static get targets() {
    return ["label", "hidden"]
  }
}
