const fetch = require("node-fetch")
const siteConfig = require("./siteConfig")

const REQUEST_LIMIT = 500

module.exports = async function() {
  console.log("Fetching notifications data...")

  return fetch(`${siteConfig.API_HOST}/items/notifications/?limit=${REQUEST_LIMIT}`)
    .then(res => res.json())
    .then(json => {
      return json.data
    })
}
