const fetch = require("node-fetch")
const siteConfig = require("./siteConfig")

const REQUEST_LIMIT = 500

module.exports = async function() {
  console.log("Fetching lang data...")
  const lang = {}

  return fetch(`${siteConfig.API_HOST}/items/dictionary/?limit=${REQUEST_LIMIT}`, {
    headers: {
      pragma: "no-cache",
      "cache-control": "no-cache",
    },
    cache: "no-cache",
  })
    .then(res => res.json())
    .then(json => {
      const responseData = json.data
      responseData.forEach(item => {
        Object.keys(item).forEach(key => {
          if (siteConfig.LOCALES[key]) {
            if (!lang[key]) lang[key] = {}
            lang[key][item.key] = item[key]
          }
        })
      })
      return lang
    })
}
