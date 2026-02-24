import { Controller } from "@hotwired/stimulus"
import { getLocale, getApiUrl, lang, getURLParams } from "../../js/utils"

export default class extends Controller {
  static get targets() {
    return [
      "statusSection",
      "statusBox",
      "statusIcon",
      "statusMessage",
      "formSection",
      "errorMessage",
      "currencyStep",
      "currencyOptions",
      "amountStep",
      "amountOptions",
      "otherAmountSection",
      "otherAmountInput",
      "frequencyStep",
      "finalStep",
      "termsCheckbox",
      "submitButton",
      "submitText",
    ]
  }

  connect() {
    this.selectedCurrency = null
    this.selectedAmount = null
    this.selectedFrequency = "onetime"
    this.donationData = null
    this.pollingInterval = null

    // // Check for paymentId in URL path (e.g., /en/donate/abc123)
    // const pathValues = window.location.pathname.split('/').filter(Boolean)
    // const paymentId = pathValues[pathValues.length - 1]
    
    // // Check if the last segment is a valid paymentId (not 'donate')
    // const isPaymentIdInPath = pathValues.length >= 2 && pathValues[pathValues.length - 2] === 'donate' && paymentId !== 'donate'
    
    // if (isPaymentIdInPath) {
    //   // Phase 2: Show payment status
    //   this.showPaymentStatus(paymentId)
    // } else {
    //   // Phase 1: Show donation form
    //   this.loadDonationOptions()
    // }
    const urlParams = getURLParams()
    console.log("URL Params:", urlParams.paymentId);
    if (urlParams.paymentId) {
      // Phase 2: Show payment status
      this.showPaymentStatus(urlParams.paymentId)
    } else {
      // Phase 1: Show donation form
      this.loadDonationOptions()
    }
  }

  disconnect() {
    // Clean up polling when controller is disconnected
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }
  }

  async loadDonationOptions() {
    try {
      const response = await fetch(`${getApiUrl()}/api/donations/amounts`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch donation options")
      }

      this.donationData = await response.json()
      this.renderCurrencyOptions()
    } catch (error) {
      console.error("Error loading donation options:", error)
      this.showError(lang("donate_error_loading"))
    }
  }

  renderCurrencyOptions() {
    const currencies = this.donationData.currencies
    this.currencyOptionsTarget.innerHTML = currencies
      .map(
        (currency) => `
        <button class="button" data-action="click->donate#selectCurrency" data-currency="${currency}">
          ${currency}
        </button>
      `
      )
      .join("")
  }

  selectCurrency(event) {
    const currency = event.currentTarget.dataset.currency
    this.selectedCurrency = currency

    // Update active state
    this.currencyOptionsTarget.querySelectorAll(".button").forEach((btn) => {
      btn.classList.remove("button--primary")
    })
    event.currentTarget.classList.add("button--primary")

    // Show amount step
    this.renderAmountOptions(currency)
    this.amountStepTarget.style.display = "block"

    // Reset subsequent steps
    this.frequencyStepTarget.style.display = "none"
    this.finalStepTarget.style.display = "none"
    this.otherAmountSectionTarget.style.display = "none"
    this.otherAmountInputTarget.value = ""
    this.selectedAmount = null
    this.hideError()
  }

  renderAmountOptions(currency) {
    const amounts = this.donationData.amounts_per_currency[currency].amounts
    this.amountOptionsTarget.innerHTML = amounts
      .map(
        (amount) => `
        <button class="button" data-action="click->donate#selectAmount" data-amount="${amount}">
          ${currency} ${amount}
        </button>
      `
      )
      .join("")

    this.amountOptionsTarget.innerHTML += `
      <button class="button" data-action="click->donate#showOtherAmount" data-amount="other">
        ${lang("donate_other_amount")}
      </button>
    `
  }

  selectAmount(event) {
    const amount = event.currentTarget.dataset.amount
    this.selectedAmount = amount

    // Update active state
    this.amountOptionsTarget.querySelectorAll(".button").forEach((btn) => {
      btn.classList.remove("button--primary")
    })
    event.currentTarget.classList.add("button--primary")

    this.otherAmountSectionTarget.style.display = "none"
    this.otherAmountInputTarget.value = ""

    // Show frequency step
    this.frequencyStepTarget.style.display = "block"

    // Reset subsequent steps
    this.finalStepTarget.style.display = "none"
    this.hideError()
  }

  showOtherAmount(event) {
    this.selectedAmount = null

    this.amountOptionsTarget.querySelectorAll(".button").forEach((btn) => {
      btn.classList.remove("button--primary")
    })
    event.currentTarget.classList.add("button--primary")

    this.otherAmountSectionTarget.style.display = "block"
    this.otherAmountInputTarget.focus()

    this.frequencyStepTarget.style.display = "none"
    this.finalStepTarget.style.display = "none"
    this.hideError()
  }

  onOtherAmountInput(event) {
    const value = event.currentTarget.value.trim()
    const amount = Number(value)

    if (value && Number.isFinite(amount) && amount > 0) {
      this.selectedAmount = value
      this.frequencyStepTarget.style.display = "block"
    } else {
      this.selectedAmount = null
      this.frequencyStepTarget.style.display = "none"
      this.finalStepTarget.style.display = "none"
    }
  }

  selectFrequency(event) {
    const frequency = event.currentTarget.dataset.frequency
    this.selectedFrequency = frequency

    // Update active state
    this.frequencyStepTarget.querySelectorAll(".button").forEach((btn) => {
      btn.classList.remove("button--primary")
    })
    event.currentTarget.classList.add("button--primary")

    // Show final step
    this.finalStepTarget.style.display = "block"
    this.updateSubmitButtonText()
    this.hideError()
  }

  onTermsChange() {
    this.submitButtonTarget.disabled = !this.termsCheckboxTarget.checked
  }

  updateSubmitButtonText() {
    const isRecurring = this.selectedFrequency !== "onetime"
    const textKey = isRecurring ? "donate_proceed_regular" : "donate_proceed_payment"
    const text = lang(textKey)
      .replace("{currency}", this.selectedCurrency)
      .replace("{amount}", this.selectedAmount)
    this.submitTextTarget.textContent = text
  }

  async submitDonation() {
    // Validate selections
    if (!this.selectedCurrency) {
      this.showError(lang("donate_error_select_currency"))
      return
    }

    if (!this.selectedAmount) {
      this.showError(lang("donate_error_select_amount"))
      return
    }

    if (!this.termsCheckboxTarget.checked) {
      this.showError(lang("donate_error_accept_terms"))
      return
    }

    // Disable button during request
    this.submitButtonTarget.disabled = true
    this.submitButtonTarget.classList.add("donate__submit--loading")

    try {
      const url = `${getApiUrl()}/api/donations/get-payment-url?amount=${this.selectedAmount}&currency=${this.selectedCurrency}&frequency=${this.selectedFrequency}&lang=${getLocale()}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        // Redirect to payment URL
        window.location.href = data.url
      } else {
        this.showError(data.error || lang("donate_payment_failed"))
        this.submitButtonTarget.disabled = false
        this.submitButtonTarget.classList.remove("donate__submit--loading")
      }
    } catch (error) {
      console.error("Error submitting donation:", error)
      this.showError(lang("donate_payment_failed"))
      this.submitButtonTarget.disabled = false
      this.submitButtonTarget.classList.remove("donate__submit--loading")
    }
  }

  showPaymentStatus(paymentId) {
    // Hide form and show status section
    this.formSectionTarget.style.display = "none"
    this.statusSectionTarget.style.display = "block"

    // Start polling for payment status
    this.pollPaymentStatus(paymentId)
  }

  async pollPaymentStatus(paymentId) {
    try {
      const response = await fetch(`${getApiUrl()}/api/donations/get-payment-status/${paymentId}`)
      const data = await response.json()

      this.updatePaymentStatus(data)

      if (!data.final) {
        // Continue polling if not final
        setTimeout(() => this.pollPaymentStatus(paymentId), 2000) // Poll every 2 seconds
      }
    } catch (error) {
      console.error("Error polling payment status:", error)
      this.updatePaymentStatus({
        final: true,
        success: false,
        status: "Error",
      })
    }
  }

  updatePaymentStatus(data) {
    const { final, success, status } = data

    // Update status message
    const messageKey = this.getStatusMessageKey(status)
    this.statusMessageTarget.textContent = lang(messageKey)

    // Update status box appearance
    this.statusBoxTarget.classList.remove(
      "donate__status-box--pending",
      "donate__status-box--success",
      "donate__status-box--error"
    )

    if (final) {
      if (success) {
        this.statusBoxTarget.classList.add("donate__status-box--success")
        this.statusIconTarget.innerHTML = `
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="4"/>
            <path d="M20 32L28 40L44 24" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `
      } else {
        this.statusBoxTarget.classList.add("donate__status-box--error")
        this.statusIconTarget.innerHTML = `
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="4"/>
            <path d="M24 24L40 40M40 24L24 40" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
          </svg>
        `
      }
    } else {
      this.statusBoxTarget.classList.add("donate__status-box--pending")
      this.statusIconTarget.innerHTML = `
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="donate__spinner">
          <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="175" stroke-dashoffset="100" stroke-linecap="round"/>
        </svg>
      `
    }
  }

  getStatusMessageKey(status) {
    const statusMap = {
      Prepared: "donate_payment_prepared",
      Started: "donate_payment_started",
      Succeeded: "donate_payment_succeeded",
      Failed: "donate_payment_failed",
      Canceled: "donate_payment_canceled",
      Expired: "donate_payment_expired",
    }

    return statusMap[status] || "donate_payment_pending"
  }

  showError(message) {
    this.errorMessageTarget.textContent = message
    this.errorMessageTarget.style.display = "block"
  }

  hideError() {
    this.errorMessageTarget.style.display = "none"
  }
}
