import { Controller } from "stimulus"

import { getLocale } from "../../js/utils"
import dataAPI from "../../api/data"

export default class extends Controller {
  // generate all groups
  connect() {
    this.renderContent()
  }

  createLetterGroup(groupId) {
    const group = document.createElement("div")
    group.dataset.group = groupId
    group.className = "donors__group"
    this.element.appendChild(group)

    const groupHeading = document.createElement("h3")
    groupHeading.textContent = groupId
    group.appendChild(groupHeading)
    return group
  }

  renderContent() {
    dataAPI.getData("donators").then(d => {
      const { data } = d
      const nameLabel = getLocale() === "he" ? "hebrew_name" : "name"

      const dataSorted = data.sort((a, b) => {
        return a[nameLabel].localeCompare(b[nameLabel], getLocale(), { ignorePunctuation: false })
      })

      dataSorted.forEach(itemData => {
        // create link node
        const itemNode = document.createElement("a")
        itemNode.innerHTML = `<span class="donors__donor__name">${itemData[nameLabel]}</span>`
        itemNode.href = `/${getLocale()}/photos/?donatedby=${encodeURIComponent(itemData[nameLabel])}`
        itemNode.className = "donors__donor"

        const groupId = itemData[nameLabel].slice(0, 1)

        // inject item into the corresponding group
        let group = this.element.querySelector(`.donors__group[data-group=${groupId}]`)
        if (!group) group = this.createLetterGroup(groupId)
        group.appendChild(itemNode)
      })
    })
  }
}
