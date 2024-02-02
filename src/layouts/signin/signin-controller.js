import { Controller } from "@hotwired/stimulus"
import { trigger, lang, redirectTo, getLocale } from "../../js/utils"
import auth from "../../api/auth"

export default class extends Controller {
  static get targets() {
    return ["form", "userName", "password", "submitButton", "rememberMe"]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)

    // check if user is already signed in
    auth.querySignedInUser().then((userData) => {
      if (userData && userData.count === 1) {
        this.success()
      }
    })
  }

  submit(e) {
    if (e) e.preventDefault()
    const credentials = new FormData()
    credentials.append("username", this.userNameTarget.value)
    credentials.append("password", this.passwordTarget.value)
    credentials.append("remember_me", this.rememberMeTarget.checked ? "1" : "0")

    trigger("loader:show", { id: "loaderBase" })
    this.element.classList.add("is-disabled")

    auth.signin(credentials).then(this.success.bind(this)).catch(this.error.bind(this))
  }

  // the server response returns a string based error message in English
  // so it needs to be localized
  async errorMessageHandler(text) {
    const errorMessages = {
      "Username or password is incorrect": await lang("user_signin_error"),
    }
    return errorMessages[text.replace(/\n/g, "<br/>")]
  }

  async error(respMessage) {
    this.element.classList.remove("is-disabled")
    trigger("loader:hide", { id: "loaderBase" })

    // show snackbar message
    trigger("snackbar:show", {
      message: await this.errorMessageHandler(respMessage),
      status: "error",
      autoHide: true,
    })
  }

  success() {
    this.element.classList.remove("is-disabled")
    trigger("loader:hide", { id: "loaderBase" })

    // redirectTo(`/${getLocale()}/profile/my-photos/`)
    redirectTo(`/${getLocale()}/profile/edit/`)
  }
}
