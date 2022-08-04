const fetch = require("node-fetch")
const siteConfig = require("./siteConfig")

const REQUEST_LIMIT = 500

module.exports = async function() {
  console.log("Fetching hebrew pages data...")

  return fetch(`${siteConfig.API_HOST}/items/pages/?limit=${REQUEST_LIMIT}`)
    .then(res => res.json())
    .then(json => {
      const pagesData = json.data
      return pagesData.filter(d => d.locale === "he" && d.status === "published")
    })
}
