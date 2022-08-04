import { Controller } from "stimulus"
import scrollTo from "../../js/scrollTo"

export default class ScrollView extends Controller {
  connect() {
    // Find the bg svg in the DOM as it's not inside of the controller and it can't be a target
    this.backgroundSVG = document.querySelector(".background__icon__svg")
  }

  static elementForHash(hash) {
    const id = hash.match(/^#([^#][.\-\w]+)$/)[1]
    return document.getElementById(id)
  }

  async scrollToTarget(element, options) {
    // Account for top margin when calcuating target element’s position
    const elementTop =
      this.element.scrollTop +
      element.getBoundingClientRect().top -
      parseFloat(window.getComputedStyle(element).getPropertyValue("margin-top"))

    const offset = 96
    const scrollPosition = elementTop - offset

    return scrollTo(scrollPosition, this.element, options)
  }

  /**
   * Process click anywhere in the scrollable
   * @param {MouseEvent} event
   */
  navigate(event) {
    // event source element must have an href to a page fragment
    const href = event.target.closest("[href]")?.getAttribute("href")
    if (!href || !REGEX.anchorHref.test(href)) return

    // and the fragment must exist on the page
    const targetElement = ScrollView.elementForHash(href)
    if (!targetElement) return

    event.preventDefault()
    // Use history instead of location.hash so goToHash isn’t be needlessly called
    window.history.pushState(null, null, href)
    this.scrollToTarget(targetElement)
  }

  /**
   * Nudge the container’s scroll to the element specified in location.hash
   * This is called on dom ready or hash change
   */
  goToHash() {
    if (!window.location.hash || window.location.hash === "") return
    const targetElement = ScrollView.elementForHash(window.location.hash)
    if (!targetElement) return

    this.scrollToTarget(targetElement, { duration: 0 })
  }

  handleScroll() {
    // Transform the background SVG icon when scrollview is scrolling
    if (this.backgroundSVG) {
      this.backgroundSVG.style.transform = `rotateY(${Math.min(90, this.element.scrollTop / 10)}deg) translateZ(-${this
        .element.scrollTop / 10}px)`
      this.backgroundSVG.style.opacity = Math.max(0, 100 - this.element.scrollTop / 20) / 100
    }
  }
}
