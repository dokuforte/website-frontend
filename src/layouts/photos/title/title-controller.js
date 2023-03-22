import { Controller } from "@hotwired/stimulus"
import { lang, getURLParams, numberWithCommas, setPageMeta } from "../../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["title", "searchExpression", "count", "subtitle"]
  }

  async setTitle(e) {
    const photosCount = e.detail.total || 0
    const q = getURLParams()

    // set main title
    if (typeof q.latest !== "undefined") {
      this.titleTarget.textContent = await lang("latest")
    } else if (Object.keys(q).length === 0 || !q.q || (q.q === "" && !q.latest === "")) {
      this.titleTarget.textContent = await lang("photos")
    } else {
      this.titleTarget.textContent = await lang("search")
    }

    setPageMeta(this.titleTarget.textContent)

    // set search expression tag content
    if (Object.keys(q).length === 0 || q.q === "" || Object.keys(q).indexOf("latest") > -1) {
      this.searchExpressionTarget.classList.remove("is-visible")
    } else if (Object.keys(q).indexOf("advancedSearch") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${await lang("advanced_search")}`
    } else if (Object.keys(q).indexOf("donatedby") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${await lang("donor")}: <em>${q.donatedby}</em>`
    } else if (Object.keys(q).indexOf("source") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${await lang("photographer")}: <em>${q.source}</em>`
    } else if (Object.keys(q).indexOf("year") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${await lang("year")}: <em>${q.year}</em>`
    } else if (Object.keys(q).indexOf("location") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${await lang("location")}: <em>${q.location}</em>`
    } else if (Object.keys(q).indexOf("tag") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${await lang("tag")}: <em>${q.tag}</em>`
    } else if (Object.keys(q).indexOf("q") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${await lang("search_phrase")}: <em>${q.q}</em>`
    }

    // set photo counter
    this.countTarget.textContent = numberWithCommas(photosCount)

    // fade in subtitle
    this.subtitleTarget.classList.add("is-visible")
  }
}
