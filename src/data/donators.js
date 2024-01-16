const EleventyFetch = require("@11ty/eleventy-fetch")
const config = require("./siteConfig")

module.exports = async function () {
  console.log("Fetching donators data...")
  const url = `${config.API_HOST}/api/donors/list`

  /* This returns a promise */
  return EleventyFetch(url, {
    duration: "1d", // save for 1 day
    type: "json", // we’ll parse JSON for you
  })
}
