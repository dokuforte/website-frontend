import config from "../data/siteConfig"
import { slugify, getLocale } from "../js/utils"

// this is a cache that contains all previously entered autosuggest name / value pairs
const autosuggestCache = {}

export default async prefix => {
  let resp = null

  const lang = getLocale()
  const expression = slugify(prefix)
  const body = {
    lang,
    term: expression,
  }

  // check autosuggest cache
  if (autosuggestCache[expression]) {
    resp = autosuggestCache[expression]
  } else {
    const respJson = await fetch(`${config.API_HOST}/api/tags/filter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    })
    resp = await respJson.json()
    autosuggestCache[expression] = resp
  }

  return resp
}
