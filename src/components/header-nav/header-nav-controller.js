import { Controller } from "stimulus"
import throttle from "lodash/throttle"
import auth from "../../api/auth"
import siteConfig from "../../data/siteConfig"
import { redirectTo, trigger, getLocale } from "../../js/utils"

export default class extends Controller {
  static get targets() {
    return [
      "notification",
      "popup",
      "profileName",
      "profileEmail",
      "menu",
      "notifications",
      "profile",
      "notificationIcon",
      "language",
    ]
  }

  connect() {
    // throttle
    this.hidePopups = throttle(this.hidePopups.bind(this), 100)

    this.showNotificationIconBadge()
    this.autoHideNavShadowOnScroll()

    this.checkIfUserIsSignedIn()
  }

  // show a popup
  togglePopup(e) {
    e.preventDefault()
    if (this.activePopup) this.activePopup.classList.remove("is-visible")
    if (this.activePopup === this[`${e.currentTarget.dataset.popup}Target`]) {
      this.activePopup = null
      return
    }
    this.activePopup = this[`${e.currentTarget.dataset.popup}Target`]
    this.activePopup.classList.add("is-visible")

    // translate popup under the icon
    if (window.innerWidth < 480) {
      this.activePopup.style.left = ""
      this.activePopup.style.right = ""
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      switch (getLocale()) {
        case "he":
          this.activePopup.style.left = `${rect.x + this.activePopup.offsetWidth - rect.width / 2}px`
          break
        default:
          this.activePopup.style.left = `${rect.x + rect.width / 2}px`
      }
    }
  }

  // hide all popups that are opened and visible
  hidePopups(e) {
    if (this.navTimer) clearTimeout(this.navTimer)
    this.navTimer = setTimeout(() => {
      this.popupTargets.forEach(popup => {
        if (popup.classList.contains("is-visible")) {
          const bounds = popup.getBoundingClientRect()
          if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY > bounds.bottom) {
            popup.classList.remove("is-visible")
          }
        }
      })
      this.activePopup = null
    }, 200)
  }

  addNavShadow() {
    this.element.classList.add("header-nav--carousel-show")
  }

  removeNavShadow() {
    this.element.classList.remove("header-nav--carousel-show")
  }

  autoHideNavShadowOnScroll() {
    const scrollview = document.querySelector(".scrollview")
    if (scrollview) {
      scrollview.addEventListener(
        "scroll",
        throttle(() => {
          if (scrollview.scrollTop > 0) {
            this.element.classList.add("has-shadow")
          } else {
            this.element.classList.remove("has-shadow")
          }
        }, 100)
      )
    }
  }

  signOut(e) {
    e.preventDefault()
    auth.signout().then(() => redirectTo(`/${getLocale()}`))
  }

  showSearchDialog(e) {
    e.preventDefault()
    trigger("dialogSearch:show")
  }

  checkIfUserIsSignedIn() {
    auth.querySignedInUser().then(userData => {
      if (userData) {
        this.profileNameTarget.textContent = `${userData.first_name} ${userData.last_name}`
        this.profileEmailTarget.textContent = userData.email
      }
    })
  }

  // switch language
  switchLocale(e) {
    e.preventDefault()
    const l = e.currentTarget.dataset.lang
    let href = document.location.href
      .split("/")
      .map(s => (Object.keys(siteConfig.LOCALES).indexOf(s) > -1 ? l : s))
      .join("/")

    // if location is the siteroot
    if (href.indexOf(l) === -1) href += `${l}/`

    document.location.href = href
  }

  // show badge on the notification icon when there's a new notification
  showNotificationIconBadge() {
    const lastSeen = localStorage.getItem("notificationsLastSeen")
    const lastMessageTimestamp = this.hasNotificationTarget ? this.notificationTarget.dataset.date : undefined
    if (lastSeen < lastMessageTimestamp) {
      setTimeout(() => {
        this.notificationIconTarget.classList.add("has-badge")
      }, 500)
    }
  }

  // hide new notifiction badge
  hideNotificationIconBadge() {
    const lastMessageTimestamp = this.hasNotificationTarget ? this.notificationTarget.dataset.date : undefined
    if (lastMessageTimestamp) {
      localStorage.setItem("notificationsLastSeen", lastMessageTimestamp.toString())
    }
    this.notificationIconTarget.classList.remove("has-badge")
  }
}
