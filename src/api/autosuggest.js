import config from "../data/siteConfig"
import { slugify, getLocale } from "../js/utils"

let autosuggestList = []
let autosuggestListLoaded = false

// this is a cache that contains all previously entered autosuggest name / value pairs
const autosuggestCache = {}

const loadAutosuggestList = async (lang) => {
  const respJson = await fetch(`${config.API_HOST}/api/search/list`)
  const resp = await respJson.json()

  // filter items by language
  autosuggestList = resp.filter((item) => {
    return item.locale === lang
  })

  return true
}

export default async (prefix, categories, limit) => {
  let resp = null

  const lang = getLocale()
  const expression = slugify(prefix)

  // check autosuggest cache
  if (autosuggestCache[expression]) {
    resp = autosuggestCache[expression]
  } else {
    if (!autosuggestListLoaded) autosuggestListLoaded = await loadAutosuggestList(lang)

    let count = 0

    resp = autosuggestList.filter((item) => {
      if (count >= limit) {
        return false
      }
      if (item.word.indexOf(expression) >= 0) {
        count += 1
        return true
      }
      return false
    })
    autosuggestCache[expression] = resp
    return resp
  }

  return resp
}
