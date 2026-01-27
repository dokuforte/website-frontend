export const selectedThumbnail = () => {
  return document.querySelector(".photos-thumbnail.is-selected")
}

export const appState = (state) => {
  return document.querySelector("body").classList.contains(state)
}

export const setAppState = (state) => {
  document.querySelector("body").classList.add(state)
}

export const removeAppState = (state) => {
  document.querySelector("body").classList.remove(state)
}

export const toggleAppState = (state) => {
  document.querySelector("body").classList.toggle(state)
}
