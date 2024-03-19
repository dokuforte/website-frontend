const EleventyFetch = require("@11ty/eleventy-fetch")
const config = require("./siteConfig")

module.exports = async function () {
  console.log("Fetching pages[HE] data...")
  const url = `${config.API_HOST}/api/contents?lang=he`

  /* This returns a promise */
  return EleventyFetch(url, {
    duration: "1m", // save for 1 minute
    type: "json", // we’ll parse JSON for you
  })
}
