import config from "../data/siteConfig"

// this is a cache that contains all previously entered autosuggest name / value pairs
const autosuggestCache = {}

export default async (prefix, filter, limit = 10) => {
  let resp

  const expression = filter === undefined ? `${prefix}` : `${filter}/${prefix}?limit=${limit}`

  // check autosuggest cache
  if (autosuggestCache[expression]) {
    resp = autosuggestCache[expression]
  } else {
    const respJson = await fetch(`${config.API_HOST}/custom/autocomplete/${expression}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
    resp = await respJson.json()
    autosuggestCache[expression] = resp
  }

  return resp
}
