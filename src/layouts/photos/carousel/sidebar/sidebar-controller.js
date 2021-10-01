import { Controller } from "stimulus"

import throttle from "lodash/throttle"
import { trigger } from "../../../../js/utils"
import { setAppState, removeAppState, toggleAppState, appState } from "../../../../js/app"

export default class extends Controller {
  static get targets() {
    return ["location", "description", "year", "donor", "author", "mid", "tags"]
  }

  connect() {
    this.element.carouselSidebar = this

    // throttle functions
    this.toggleOnResize = throttle(this.toggleOnResize.bind(this), 400)
  }

  get selectedThumbnail() {
    return document.querySelector(".photos-thumbnail.is-selected")
  }

  init() {
    const data = this.selectedThumbnail.itemData

    // fill template with data

    // create a string of anchors from array
    const convertToHref = key => {
      if (data[key]) {
        const resp = []
        data[key].forEach(item => {
          resp.push(`<a href="?${key}=${encodeURIComponent(item)}">${item}</a>`)
        })
        return resp.join(",<br/>")
      }
      return null
    }

    const locationArray = data.addressline
      .split(", ")
      .map(val => convertToHref(val))
      .filter(Boolean)

    this.locationTarget.innerHTML = ""
    if (locationArray.length > 0) {
      this.locationTarget.innerHTML = locationArray.join(",<br/>")
      this.locationTarget.parentNode.style.display = "block"
    }

    this.descriptionTarget.innerHTML = ""
    if (data.description) {
      this.descriptionTarget.innerHTML = data.description
      this.descriptionTarget.parentNode.style.display = "block"
    } else if (locationArray.length === 0) {
      this.descriptionTarget.parentNode.style.display = "none"
    }

    if (data.tag) {
      this.tagsTarget.innerHTML = data.tag
        .map(tag => `<a href="?tag=${encodeURIComponent(tag.tag)}">${tag.tag}</a>`)
        .join(", ")
    } else {
      this.tagsTarget.innerHTML = `<span class="carousel-sidebar__tags__empty">–</span>`
    }

    this.midTarget.innerHTML = `<a href="?id=${data.id}">${data.id}</a>`

    if (data.year) {
      this.yearTarget.innerHTML = `<a href="?year=${data.year}">${data.year}</a>`
    } else {
      this.yearTarget.innerHTML = `<span class="carousel-sidebar__tags__empty">–</span>`
    }

    if (data.donated_by.length > 0) {
      this.donorTarget.innerHTML = data.donated_by
        .map(donator => `<a href="?donatedby=${encodeURIComponent(donator.name)}">${donator.name}</a>`)
        .join(", ")
    } else {
      this.donorTarget.innerHTML = `<span class="carousel-sidebar__tags__empty">–</span>`
    }

    if (data.photographer.length > 0) {
      this.authorTarget.innerHTML = data.photographer
        .map(photographer => `<a href="?source=${encodeURIComponent(photographer.name)}">${photographer.name}</a>`)
        .join(", ")
      this.authorTarget.parentNode.style.display = "block"
    } else {
      this.authorTarget.parentNode.style.display = "none"
    }

    // bind history api calls to sidebar anchors
    this.element.querySelectorAll(".carousel-sidebar a:not([class])").forEach(anchorNode => {
      anchorNode.addEventListener("click", event => {
        event.preventDefault()
        trigger("photos:historyPushState", { url: event.currentTarget.href, resetPhotosGrid: true })
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
    else if (!appState("play-carousel-slideshow")) this.show()
  }
}
