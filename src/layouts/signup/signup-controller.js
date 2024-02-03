import { Controller } from "@hotwired/stimulus"
import { trigger, lang, redirectTo, getLocale } from "../../js/utils"
import auth from "../../api/auth"

export default class extends Controller {
  static get targets() {
    return [
      "form",
      "userName",
      "firstName",
      "lastName",
      "email",
      "phone",
      "password",
      "passwordConfirm",
      "submitButton",
      "checkboxRead",
      "checkboxAge",
      "checkboxNewsletter",
    ]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)
  }

  async formIsValid() {
    const formElements = this.formTarget.elements
    let isValid = true
    let i = 0
    while (isValid && i < formElements.length) {
      if (formElements[i].value === "" && formElements[i].hasAttribute("required")) {
        isValid = false
        formElements[i].focus()
      }

      i += 1
    }

    if (!isValid) {
      trigger("snackbar:show", { message: await lang("user_signup_must_filled"), status: "error", autoHide: true })
    }

    if (this.passwordTarget.value !== this.passwordConfirmTarget.value) {
      isValid = false
      trigger("snackbar:show", {
        message: await lang("user_signup_passwords_must_match"),
        status: "error",
        autoHide: true,
      })
    }

    return isValid
  }

  async submit(e) {
    e.preventDefault()

    if (await this.formIsValid()) {
      this.credentials = new FormData()

      this.credentials.append("username", this.userNameTarget.value)
      this.credentials.append("first_name", this.firstNameTarget.value)
      this.credentials.append("last_name", this.lastNameTarget.value)
      this.credentials.append("email", this.emailTarget.value)
      this.credentials.append("phone", this.phoneTarget.value)
      this.credentials.append("password", this.passwordTarget.value)
      this.credentials.append("password_confirm", this.passwordConfirmTarget.value)
      this.credentials.append("newsletter", this.checkboxNewsletterTarget.checked)
      this.credentials.append("tos", this.checkboxReadTarget.checked)

      trigger("loader:show", { id: "loaderBase" })
      this.element.classList.add("is-disabled")

      await auth
        .signup(this.credentials)
        .then(() => {
          console.log("signup success")
          this.success()
        })
        .catch((err) => {
          console.log("signup error")
          this.error(err)
        })
    }
  }

  enable() {
    if (this.checkboxReadTarget.checked && this.checkboxAgeTarget.checked) {
      this.submitButtonTarget.disabled = false
    } else {
      this.submitButtonTarget.disabled = true
    }
  }

  async errorMessageHandler(text) {
    const errorMessages = {
      "The user could not be saved": await lang("user_signup_username_taken"),
      "Username or password is incorrect": await lang("user_signin_error"),
    }
    return errorMessages[text]
  }

  async error(statusText) {
    trigger("loader:hide", { id: "loaderBase" })
    this.element.classList.remove("is-disabled")

    trigger("snackbar:show", { message: await this.errorMessageHandler(statusText), status: "error", autoHide: true })
  }

  async success() {
    trigger("loader:hide", { id: "loaderBase" })
    this.element.classList.remove("is-disabled")

    trigger("snackbar:show", { message: await lang("user_signup_success"), status: "success", autoHide: true })

    // sign in and redirect to profile
    setTimeout(() => {
      this.credentials.append("remember_me", "1")
      auth
        .signin(this.credentials)
        .then(() => {
          // redirectTo(`/${getLocale()}/profile/my-photos/`)
          redirectTo(`/${getLocale()}/profile/edit/`)
        })
        .catch((err) => {
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
