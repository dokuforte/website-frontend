import { Controller } from "@hotwired/stimulus"

import searchAPI from "../../api/search"
import { numberWithCommas } from "../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["total", "totalVal"]
  }

  connect() {
    this.getTotalItemsNumber()
  }

  /**
   * Get the total number of photos and inject the result
   */
  getTotalItemsNumber() {
    searchAPI.getTotal().then(data => {
      this.totalValTarget.textContent = numberWithCommas(data.hits.total.value)
      this.totalTarget.classList.add("is-visible")
    })
  }
}
