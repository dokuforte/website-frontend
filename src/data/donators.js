const fetch = require("node-fetch")
const siteConfig = require("./siteConfig")

module.exports = async function() {
  console.log("Fetching donators data...")

  return fetch(`${siteConfig.API_HOST}/getdata/donators`)
    .then(res => res.json())
    .then(json => {
      const donatorsData = json.data
      return donatorsData.sort((a, b) => {
        return a.name.localeCompare(b.name, "en", { ignorePunctuation: false })
      })
    })
}
