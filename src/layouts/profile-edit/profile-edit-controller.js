import { Controller } from "stimulus"
import auth from "../../api/auth"
import { trigger, getLocale, comeBackAfterSignIn, lang } from "../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["personalField", "firstName", "lastName", "email", "tel", "savePersonalChanges"]
  }

  connect() {
    auth.querySignedInUser().then(data => {
      if (data) {
        this.userData = data
        this.initPersonalFields()
      } else {
        comeBackAfterSignIn()
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

    this.telTarget.value = this.userData.phone ? this.userData.phone : ""
    this.telTarget.dataset.defaultValue = this.telTarget.value
    trigger("keyup", {}, this.telTarget)
  }

  onPersonalFieldChange(e) {
    this.changedProfileParams = {}
    this.personalFieldTargets.forEach(field => {
      if (field.dataset.defaultValue !== field.value && field.value !== undefined) {
        this.changedProfileParams[field.name] = field.value
      }
    })

    if (Object.keys(this.changedProfileParams).length > 0) {
      this.savePersonalChangesTarget.removeAttribute("disabled")
    } else {
      this.savePersonalChangesTarget.setAttribute("disabled", "")
    }

    if (e.key === "Enter") {
      this.updateAuthProfile()
    }
  }

  async updateAuthProfile() {
    if (!this.savePersonalChangesTarget.hasAttribute("disabled")) {
      this.savePersonalChangesTarget.setAttribute("disabled", "")
      auth.updateAuthProfile(this.userData.id, this.changedProfileParams).then(async resp => {
        if (resp.errors) {
          this.savePersonalChangesTarget.removeAttribute("disabled")
          trigger("snackbar:show", { message: resp.errors[0].message, status: "error" })
        } else if (resp.data) {
          // this.userData = resp.data
          this.userData = await auth.querySignedInUser()
          this.initPersonalFields()
          trigger("snackbar:show", { message: await lang("profile_updated") })
        }
      })
    }
  }

  redirectToHome() {
    document.location.href = `/${getLocale()}/`
  }

  showDeleteAccountDialog(e) {
    e.preventDefault()
    trigger("dialogs:hide")
    trigger("dialogDeleteAccount:show")
  }
}
