import { Controller } from "stimulus"
import { comeBackAfterSignIn } from "../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["nav", "navItem"]
  }

  onNavItemClick(e) {
    e.preventDefault()
    const authData = JSON.parse(localStorage.getItem("auth")) || {}
    if (authData.access_token) {
      window.location.href = e.currentTarget.href
    } else {
      comeBackAfterSignIn(e.currentTarget.href)
    }
  }
}
