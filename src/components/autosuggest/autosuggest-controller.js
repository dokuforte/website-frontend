import { Controller } from "@hotwired/stimulus"
import throttle from "lodash/throttle"

import autoSuggest from "../../api/autosuggest"

const AUTOSUGGEST_ITEM_LIMIT = 9

export default class extends Controller {
  static get targets() {
    return ["input", "autosuggest"]
  }

  connect() {
    this.keyup = throttle(this.keyup.bind(this), 200)
  }

  keyup(e) {
    if (typeof this.inputTarget.dataset.autosuggest !== "undefined") {
      // find the currently selected autosuggest item
      const selectedNode = this.autosuggestTarget.querySelector(".autosuggest__item.is-selected")

      // show the autosuggest result container except if the up or down keys were pressed
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") {
        this.showAutosuggestPanel()
      }

      // if down arrow key was pressed
      if (e.key === "ArrowDown" && selectedNode) {
        const nextNode = selectedNode.nextElementSibling || this.autosuggestTarget.querySelector(".autosuggest__item")
        selectedNode.classList.remove("is-selected")
        nextNode.classList.add("is-selected")
        this.inputTarget.value = nextNode.textContent
      }

      // if up arrow key was pressed
      if (e.key === "ArrowUp" && selectedNode) {
        const previousNode =
          selectedNode.previousElementSibling || this.autosuggestTarget.querySelector(".autosuggest__item:last-child")
        selectedNode.classList.remove("is-selected")
        previousNode.classList.add("is-selected")

        // move cursor to the end of input value

        this.inputTarget.value = previousNode.textContent
      }

      // hide the autosuggest result panel if enter or ESC keys were pressed
      if (e.key === "Enter" || e.key === "Escape") {
        this.autosuggestTarget.classList.remove("is-visible")
      }
    }
  }

  createAutoSuggestItem(label) {
    const itemNode = document.createElement("div")
    itemNode.className = "autosuggest__item"
    itemNode.innerHTML = label.replace(this.inputTarget.value, `<span class="autosuggest__item__highlight">$&</span>`)
    itemNode.addEventListener("click", (e) => {
      const selectedNode = this.autosuggestTarget.querySelector(".autosuggest__item.is-selected")
      if (selectedNode) {
        selectedNode.classList.remove("is-selected")
      }
      e.currentTarget.classList.add("is-selected")
      this.autosuggestTarget.classList.remove("is-visible")

      this.inputTarget.value = e.currentTarget.textContent
      if (this.element.selectizeControl) {
        this.element.selectizeControl.addTagNode(this.inputTarget.value)
      }
    })

    return itemNode
  }

  showAutosuggestPanel() {
    if (this.inputTarget.value.length > 2) {
      // get filtered results based on the autosuggest data attribute of the input field
      autoSuggest(this.inputTarget.value, this.inputTarget.dataset.autosuggest, AUTOSUGGEST_ITEM_LIMIT)
        .then((res) => {
          // show autosuggest result container and clear it's content
          this.autosuggestTarget.innerHTML = ""
          this.autosuggestTarget.classList.add("is-visible")

          // add the current value of the input field as the first item of the autosuggest result container
          this.autosuggestTarget.appendChild(this.createAutoSuggestItem(this.inputTarget.value))

          // add items from the autosuggest filter results
          res.forEach((label) => {
            if (label.word !== this.inputTarget.value && label.word !== "") {
              this.autosuggestTarget.appendChild(this.createAutoSuggestItem(label.word))
            }
          })

          // select the first item
          this.autosuggestTarget.querySelector(".autosuggest__item").classList.add("is-selected")
        })
        .catch(() => {
          this.autosuggestTarget.classList.remove("is-visible")
        })
    } else {
      // hide autosuggest result container when the input field is empty
      this.autosuggestTarget.classList.remove("is-visible")
    }
  }
}
