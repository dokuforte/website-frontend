import { Controller } from "stimulus"
import { trigger, lang, redirectTo, getLocale } from "../../js/utils"
import auth from "../../api/auth"

export default class extends Controller {
  static get targets() {
    return [
      "form",
      "firstName",
      "lastName",
      "email",
      "phone",
      "password",
      "submitButton",
      "checkboxRead",
      "checkboxAge",
    ]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)
  }

  get formIsValid() {
    const formElements = this.formTarget.elements
    let isValid = true
    let i = 0
    while (isValid && i < formElements.length) {
      if (formElements[i].value === "" && formElements[i].hasAttribute("required")) {
        isValid = false
        formElements[i].focus()
        trigger("snackbar:show", { message: "All fields must be filled out.", status: "error", autoHide: true })
      }

      console.log(isValid, formElements.length)

      i += 1
    }

    return isValid
  }

  async submit(e) {
    e.preventDefault()

    if (this.formIsValid) {
      this.credentials = {}
      if (this.firstNameTarget.value.length > 0) {
        this.credentials.first_name = this.firstNameTarget.value
      }
      if (this.lastNameTarget.value.length > 0) {
        this.credentials.last_name = this.lastNameTarget.value
      }
      if (this.emailTarget.value.length > 0) {
        this.credentials.email = this.emailTarget.value
      }
      if (this.phoneTarget.value.length > 0) {
        this.credentials.phone = this.phoneTarget.value
      }
      if (this.passwordTarget.value.length > 0) {
        this.credentials.password = this.passwordTarget.value
      }
      this.credentials.role = "eca918be-4232-4b66-96f4-3501507f5b97"

      trigger("loader:show", { id: "loaderBase" })
      this.element.classList.add("is-disabled")

      const resp = await auth.signup(this.credentials).catch(err => {
        this.error(err.message)
      })

      if (resp.status === 204) {
        this.success()
      }
    }
  }

  enable() {
    if (this.checkboxReadTarget.checked && this.checkboxAgeTarget.checked) {
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

  async success() {
    trigger("loader:hide", { id: "loaderBase" })
    this.element.classList.remove("is-disabled")

    trigger("snackbar:show", { message: await lang("user_signup_success"), status: "success", autoHide: true })

    // sign in and redirect to profile
    setTimeout(() => {
      auth
        .signin(this.credentials)
        .then(() => {
          // redirectTo(`/${getLocale()}/profile/my-photos/`)
          redirectTo(`/${getLocale()}/profile/edit/`)
        })
        .catch(err => {
          this.error(err)
        })
    }, 2000)
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  show() {
    this.element.classList.add("is-visible")
    this.firstNameTarget.focus()
  }
}
