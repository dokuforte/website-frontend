const fetch = require("node-fetch")
const siteConfig = require("./siteConfig")

module.exports = async function() {
  console.log("Fetching donators data...")

  return fetch(`${siteConfig.API_HOST}/getdata/donators`)
    .then(res => res.json())
    .then(json => {
      const donatorsData = json.data
      donatorsData.forEach(donator => {
        const nameArray = donator.name.split(" ")
        donator.name_transformed = `${nameArray.pop()}, ${nameArray.join(" ")}`
      })
      return donatorsData.sort((a, b) => {
        return a.name_transformed.localeCompare(b.name_transformed, "en", { ignorePunctuation: false })
      })
    })
}
