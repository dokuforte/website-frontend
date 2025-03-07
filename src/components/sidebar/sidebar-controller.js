import { Controller } from "@hotwired/stimulus"

import throttle from "lodash/throttle"
import { getLocale, trigger } from "../../js/utils"
import { setAppState, removeAppState, toggleAppState, appState } from "../../js/app"

export default class extends Controller {
  static get targets() {
    return ["location", "description", "year", "donor", "author", "mid", "tags"]
  }

  connect() {
    this.element.carouselSidebar = this

    // throttle functions
    this.toggleOnResize = throttle(this.toggleOnResize.bind(this), 400)
  }

  init(e) {
    const data = e.detail.photoData

    this.element.classList.remove("is-hidden")

    // fill template with data
    const baseUrl = `/${getLocale()}/photos/`

    // create a string of anchors from array

    const convertToHref = (key) => {
      if (data[key]) {
        const resp = []
        if (typeof data[key] === "string") {
          resp.push(`<a href="${baseUrl}?${key}=${encodeURIComponent(data[key])}">${data[key]}</a>`)
        } else if (typeof data[key] === "object") {
          data[key].forEach((item) => {
            resp.push(`<a href="${baseUrl}?${key}=${encodeURIComponent(item)}">${item}</a>`)
          })
        }
        return resp.join(",<br/>")
      }
      return null
    }

    const locationArray = ["country", "locality", "place"].map((val) => convertToHref(val)).filter(Boolean)

    this.locationTarget.innerHTML = ""
    if (locationArray.length > 0) {
      this.locationTarget.innerHTML = locationArray.join(",<br/>")
      this.locationTarget.parentNode.style.display = "block"
    }

    this.descriptionTarget.innerHTML = ""
    if (data.description || data.context) {
      this.descriptionTarget.innerHTML = data.description + (data.context ? `<br><br>${data.context}` : "")
      this.descriptionTarget.parentNode.style.display = "block"
    } else if (locationArray.length === 0) {
      this.descriptionTarget.parentNode.style.display = "none"
    }

    if (data.tags) {
      this.tagsTarget.innerHTML = data.tags
        .map((tag) => `<a href="${baseUrl}?tag=${encodeURIComponent(tag.name)}">${tag.name}</a>`)
        .join(", ")
    } else {
      this.tagsTarget.innerHTML = `<span class="carousel-sidebar__tags__empty">–</span>`
    }

    this.midTarget.innerHTML = `${data.mid}`
    this.yearTarget.innerHTML = `<a href="${baseUrl}?year=${data.year}">${data.year}</a>`
    this.donorTarget.innerHTML = `<a href="${baseUrl}?donor=${encodeURIComponent(data.donor)}">${data.donor}</a>`

    if (data.author) {
      this.authorTarget.innerHTML = `<a href="${baseUrl}?photographer=${encodeURIComponent(data.author)}">${
        data.author
      }</a>`
      this.authorTarget.parentNode.style.display = "block"
    } else {
      this.authorTarget.parentNode.style.display = "none"
    }

    this.element.querySelectorAll(".carousel-sidebar a:not([class])").forEach((anchorNode) => {
      anchorNode.addEventListener("click", (clickEvent) => {
        clickEvent.preventDefault()
        const url = new URL(clickEvent.currentTarget.href)
        trigger("photos:updateState", { query: url.search, resetPhotosGrid: true })
      })
    })
  }

  show() {
    removeAppState("hide-carousel-sidebar")
  }

  hide() {
    setAppState("hide-carousel-sidebar")
  }

  toggle() {
    toggleAppState("hide-carousel-sidebar")
  }

  toggleOnResize() {
    if (window.innerWidth < 768) this.hide()
    else if (!appState("play-carousel-slideshow") && !appState("carousel-fullscreen")) this.show()
  }
}
