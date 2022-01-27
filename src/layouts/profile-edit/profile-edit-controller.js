import { Controller } from "stimulus"
import auth from "../../api/auth"
import { trigger, getLocale } from "../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["personalField", "firstName", "lastName", "email", "tel", "savePersonalChanges"]
  }

  connect() {
    auth.querySignedInUser().then(userData => {
      if (userData) {
        this.userData = userData.data
        this.initPersonalFields()
      } else {
        // redirect to login
        localStorage.setItem("redirectAfterSignin", document.location.href)
        document.location.href = `/${getLocale()}/signin/`
      }
    })
  }

  initPersonalFields() {
    this.firstNameTarget.value = this.userData.first_name
    this.firstNameTarget.dataset.defaultValue = this.firstNameTarget.value
    trigger("keyup", {}, this.firstNameTarget)

    this.lastNameTarget.value = this.userData.last_name
    this.lastNameTarget.dataset.defaultValue = this.lastNameTarget.value
    trigger("keyup", {}, this.lastNameTarget)

    this.emailTarget.value = this.userData.email
    this.emailTarget.dataset.defaultValue = this.emailTarget.value
    trigger("keyup", {}, this.emailTarget)

    this.telTarget.value = this.userData.tel ? this.userData.tel : ""
    this.telTarget.dataset.defaultValue = this.telTarget.value
    trigger("keyup", {}, this.telTarget)
  }

  onPersonalFieldChange() {
    let formHasChange = false
    this.personalFieldTargets.forEach(field => {
      if (field.dataset.defaultValue !== field.value && field.value !== undefined) {
        formHasChange = true
      }
    })
    if (formHasChange) {
      this.savePersonalChangesTarget.removeAttribute("disabled")
    } else {
      this.savePersonalChangesTarget.setAttribute("disabled", "")
    }
  }

  updateAuthProfile() {
    this.savePersonalChangesTarget.setAttribute("disabled", "")
    auth
      .updateAuthProfile(this.userData.id, {
        first_name: this.firstNameTarget.value,
        last_name: this.lastNameTarget.value,
        email: this.emailTarget.value,
      })
      .then(resp => {
        if (resp.errors) {
          this.savePersonalChangesTarget.removeAttribute("disabled")
          trigger("snackbar:show", { message: resp.errors[0].message, status: "error" })
        } else if (resp.data) {
          this.userData = resp.data
          this.initPersonalFields()
          trigger("snackbar:show", { message: "Saved" })
        }
      })
  }

  redirectToHome() {
    document.location.href = `/${getLocale()}/`
  }
}
