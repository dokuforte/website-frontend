import { Controller } from "stimulus"
import { trigger, lang } from "../../js/utils"
import auth from "../../api/auth"

export default class extends Controller {
  static get targets() {
    return ["form", "firstName", "lastName", "email", "password", "submitButton", "checkboxTerms"]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)
  }

  async submit(e) {
    e.preventDefault()
    const credentials = {}
    if (this.firstNameTarget.value.length > 0) {
      credentials.first_name = this.firstNameTarget.value
    }
    if (this.lastNameTarget.value.length > 0) {
      credentials.last_name = this.lastNameTarget.value
    }
    if (this.emailTarget.value.length > 0) {
      credentials.email = this.emailTarget.value
    }
    if (this.passwordTarget.value.length > 0) {
      credentials.password = this.passwordTarget.value
    }
    credentials.role = "eca918be-4232-4b66-96f4-3501507f5b97"

    trigger("loader:show", { id: "loaderBase" })
    this.element.classList.add("is-disabled")

    const resp = await auth.signup(credentials).catch(err => {
      this.error(err.message)
    })

    if (resp.status === 200) {
      this.success()
    }
  }

  enable(e) {
    if (e.target.checked) {
      this.submitButtonTarget.disabled = false
    } else {
      this.submitButtonTarget.disabled = true
    }
  }

  error(statusText) {
    trigger("loader:hide", { id: "loaderBase" })
    this.element.classList.remove("is-disabled")

    trigger("snackbar:show", { message: statusText, status: "error", autoHide: true })
  }

  success() {
    trigger("loader:hide", { id: "loaderBase" })
    this.element.classList.remove("is-disabled")

    trigger("snackbar:show", { message: lang("user_signup_success"), status: "success", autoHide: true })
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  show() {
    this.element.classList.add("is-visible")
    this.firstNameTarget.focus()
  }
}
