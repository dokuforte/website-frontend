import { Controller } from "@hotwired/stimulus"

import throttle from "lodash/throttle"
import config from "../../data/siteConfig"
import { lang, trigger, getURLParams, isElementInViewport } from "../../js/utils"
import searchAPI from "../../api/search"

export default class extends Controller {
  static get targets() {
    return ["grid", "bottomActions", "thumbnail"]
  }

  connect() {
    this.selectedThumbnail = null
    this.photosLoading = true
    this.thumbnailsCount = 0

    // Throttle resize and scroll functions
    this.onScroll = throttle(this.onScroll, 200)
    this.resizeThumbnails = throttle(this.resizeThumbnails, 500)

    // populate page content for the first time
    this.onPopState()
  }

  // resize thumbnails when window gets resized
  resizeThumbnails() {
    this.thumbnailTargets.forEach(thumbnail => {
      thumbnail.photosThumbnail.resize()
    })
    this.toggleLoadMoreButton()
  }

  // auto-load new items when scrolling reaches the bottom of the page
  onScroll() {
    if (
      this.element.scrollTop + this.element.offsetHeight >= this.element.scrollHeight - 150 &&
      this.thumbnailsCount % config.THUMBNAILS_QUERY_LIMIT === 0 &&
      this.thumbnailsCount > 0 &&
      this.photosLoading === false
    ) {
      this.photosLoading = true
      this.loadPhotos()
    }

    this.loadThumbnails()
  }

  loadThumbnails() {
    this.thumbnailTargets
      .filter(thumbnail => !thumbnail.classList.contains("is-loaded"))
      .forEach(thumbnail => {
        thumbnail.photosThumbnail.loadThumbnailImage()
      })
  }

  toggleLoadMoreButton() {
    if (
      this.thumbnailsCount % config.THUMBNAILS_QUERY_LIMIT === 0 &&
      this.thumbnailsCount > 0 &&
      this.element.offsetHeight - this.element.scrollHeight >= 0
    ) {
      this.bottomActionsTarget.classList.remove("is-hidden")
    } else {
      this.bottomActionsTarget.classList.add("is-hidden")
    }
  }

  loadMorePhotos(e) {
    e.currentTarget.classList.add("is-hidden")
    this.loadPhotos()
  }

  // this method generates the thumbnails from the data attribute
  // and starts loading the thumbnails with Promise.all
  generateThumbnailsFromData(data) {
    trigger("photosTitle:setTitle", { total: data.total })

    data.data.forEach(item => {
      // count results
      this.thumbnailsCount += 1

      // clone thumbnail template
      const template = document.getElementById("photos-thumbnail")
      const thumbnail = template.content.firstElementChild.cloneNode(true)
      this.gridTarget.appendChild(thumbnail)

      // set thumbnail node element index
      thumbnail.index = Array.prototype.indexOf.call(thumbnail.parentElement.children, thumbnail) + 1

      // apply thumbnail data to node
      // eslint-disable-next-line no-underscore-dangle
      thumbnail.itemData = item
    })

    trigger("loader:hide", { id: "loaderBase" })
    this.photosLoading = false
    this.toggleLoadMoreButton()
  }

  // async function that loads thumbnail data based on the search query
  async loadPhotos() {
    // get default and search query params
    const params = {}
    const defaultParams = {
      limit: config.THUMBNAILS_QUERY_LIMIT,
      offset: this.thumbnailsCount,
    }

    const urlParams = getURLParams()

    // merge default params with query params
    Object.assign(params, defaultParams, urlParams)

    // init timeline with the requested url query params
    trigger("timeline:reset")

    // if year url query filter is present, the timeline should be hidden
    if (params.year) {
      trigger("timeline:disable")
    }

    if (!params.q) {
      // clear all search fields if query is not defined in the request
      trigger("search:clear")
    } else {
      // set all search fields' value if query param is set
      setTimeout(() => {
        trigger("search:setValue", { value: params.q })
      }, 20)
    }

    // show loading indicator
    setTimeout(() => {
      trigger("loader:show", { id: "loaderBase" })
    }, 10)

    // search for photos
    const respData = await searchAPI.search(params)

    // generate thumbnails
    this.generateThumbnailsFromData(respData)
  }

  // Custom event to load content and update page meta tag
  async historyPushState(e) {
    window.history.pushState(null, await lang("search"), e.detail.url)
    this.onPopState(e)
  }

  // Load new photos when address bar url changes
  onPopState(e) {
    // Empty photosNode and reset counters when resetPhotosGrid parameter is set
    if ((e && e.detail && e.detail.resetPhotosGrid === true) || (e && e.type)) {
      while (this.gridTarget.firstChild) {
        this.gridTarget.firstChild.remove()
      }
      this.scrollTop = 0
      this.thumbnailsCount = 0
    }

    // load photos then...
    this.loadPhotos().then(() => {
      // open carousel if @id parameter is present in the url's query string
      if (getURLParams().id > 0) {
        // show carousel with an image
        if (this.thumbnailTarget) this.thumbnailTarget.click()
      } else {
        trigger("photosCarousel:hide")
      }
    })

    // track page view when page url changes
    // but skip tracking when page loads for the first time as GA triggers a page view when it gets initialized
    if (e) trigger("analytics:trackPageView")
  }

  // The carousel communicates with the photos page through events and
  // and the next/prev pagers trigger these actions below:

  // Show next photo in carousel
  showNextPhotoInCarousel() {
    let next = this.selectedThumbnail.nextElementSibling
    if (next) {
      trigger("photosCarousel:hidePhotos")
      next.click()
    } else if (this.thumbnailsCount % config.THUMBNAILS_QUERY_LIMIT === 0 && this.thumbnailsCount > 0) {
      this.photosLoading = true
      this.loadPhotos().then(() => {
        next = this.selectedThumbnail.nextElementSibling
        if (next) {
          trigger("photosCarousel:hidePhotos")
          next.click()
        }
      })
    }
  }

  // Show previous photo in carousel
  showPrevPhotoInCarousel() {
    const prev = this.selectedThumbnail.previousElementSibling
    if (prev) {
      trigger("photosCarousel:hidePhotos")
      prev.click()
    }
  }

  // Set a thumbnail's selected state
  selectThumbnail(e) {
    if (e.detail && e.detail.node) {
      // change status of the currently selected thumbnail
      if (this.selectedThumbnail) this.selectedThumbnail.classList.remove("is-selected")

      // set a new selected thumbnail based on event data
      this.selectedThumbnail = e.detail.node
      this.selectedThumbnail.classList.add("is-selected")
    }
  }

  // when carousel gets closed...
  scrollToSelectedThumbnail() {
    // ...scroll to thumbnail if it's not in the viewport
    if (this.selectedThumbnail) {
      if (!isElementInViewport(this.selectedThumbnail.querySelector(".photos-thumbnail__image"))) {
        this.scrollTop = this.selectedThumbnail.offsetTop - 16 - document.querySelector(".header-nav").offsetHeight
      }
    }
  }
}
