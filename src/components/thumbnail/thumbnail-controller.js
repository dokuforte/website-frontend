import { Controller } from "@hotwired/stimulus"

import config from "../../data/siteConfig"
import { trigger, isElementInViewport, getLocale, getImgAltText, photoRes } from "../../js/utils"
import { appState } from "../../js/app"

const THUMBNAIL_HEIGHT = 160
export default class extends Controller {
  static get targets() {
    return ["link", "image", "container", "description", "location"]
  }

  connect() {
    // role defines if the thumbnail is loaded on the photos page or on the lists page
    // possible values (strict): [ lists | photos (default) ]
    this.role = appState("is-lists") ? "lists" : "photos"

    // add stimulus class reference to node
    this.element.photosThumbnail = this

    this.linkTarget.addEventListener("click", (e) => {
      if (e) e.preventDefault()
    })

    // apply element data & setting up loading event listeners
    this.initThumbnail()

    // load thumbnail image
    this.loadThumbnailImage()
  }

  clicked(e) {
    if (this.element.classList.contains("age-restricted")) {
      // if age-restricted do nothing
      return
    }

    // select thumbnail in photos list
    trigger("photos:selectThumbnail", { mid: this.element.mid })

    // Load photo in Carousel
    trigger("photosThumbnail:select", { photoData: this.element.photoData })
  }

  // resize thumbnail when the browser window gets resized
  resize() {
    const h = window.innerWidth < 640 || this.element.forceSmallSize ? (THUMBNAIL_HEIGHT * 2) / 3 : THUMBNAIL_HEIGHT

    if (!this.naturalWidth) return
    const w = Math.min(240, (this.naturalWidth / this.naturalHeight) * h)

    this.containerTarget.style.height = `${h}px`

    this.element.style.flex = `${w}`
    this.element.style.minWidth = `${w}px`
    this.element.classList.toggle(
      "img-fit-contain",
      h > this.naturalHeight && this.naturalWidth / this.naturalHeight > 16 / 9
    )
  }

  initThumbnail() {
    // applying thumbnail meta data
    let data = this.element.photoData

    this.linkTarget.href = `/${getLocale()}/photos/?id=${this.element.mid}`

    const locationArray = [data.year, data.country, data.locality, data.place]
    this.locationTarget.textContent = locationArray.filter(Boolean).join(" · ")
    this.descriptionTarget.innerHTML = data.description || ""

    this.imageTarget.alt = getImgAltText(data)

    // fading the thumbnail in after displaying it
    Promise.resolve(true).then(() => {
      this.element.classList.add("is-visible")
    })

    // age-restriction
    if (!data.ageRestrictionRemoved && data.tags && data.tags.indexOf(config.AGE_RESTRICTION_TAG) > -1) {
      this.element.classList.remove("is-loading")
      this.element.classList.add("is-loaded", "no-image", "age-restricted")
      const el = document.getElementById("age-restriction-template").content.firstElementChild.cloneNode(true)
      el.querySelector(".age-restriction__link").dataset.action = "click->thumbnail#showAgeRestrictionDialog"
      this.containerTarget.appendChild(el)
    }

    this.imageTarget.addEventListener("load", () => {
      this.naturalWidth = this.imageTarget.naturalWidth
      this.naturalHeight = this.imageTarget.naturalHeight
      this.resize()

      this.element.classList.remove("is-loading")
      this.element.classList.add("is-loaded")

      trigger("thumbnail:loaded")
    })

    this.imageTarget.addEventListener("error", () => {
      this.element.classList.remove("is-loading")
      this.element.classList.add("is-failed-loading")

      trigger("thumbnail:loaded")
    })
  }

  // load thumbnail image
  loadThumbnailImage() {
    if (
      !this.element.classList.contains("is-loaded") &&
      !this.loadInitiated &&
      isElementInViewport(this.element, false)
    ) {
      const photoId = this.element.photoId

      this.imageTarget.srcset = `${photoRes(240, photoId)} 1x, ${photoRes(480, photoId)} 2x`
      this.imageTarget.src = photoRes(240, photoId)

      this.element.classList.add("is-loading")
      this.loadInitiated = true
    }
  }

  showAgeRestrictionDialog(e) {
    if (e) e.preventDefault()

    trigger("dialogAgeRestriction:show", { mid: this.element.mid })
  }

  removeAgeRestriction(e) {
    if (this.element.classList.contains("age-restricted") && e?.detail?.mid === this.element.mid) {
      this.element.classList.remove("is-loaded", "no-image", "age-restricted")
      this.containerTarget.querySelector(".age-restriction").remove()
      this.loadThumbnailImage()
    }
  }
}
