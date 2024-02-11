const EleventyFetch = require("@11ty/eleventy-fetch")
const config = require("./siteConfig")

module.exports = async function () {
  console.log("Fetching photographers[EN] data...")
  const url = `${config.API_HOST}/api/media/photographers`

  /* This returns a promise */
  return EleventyFetch(url, {
    duration: "1d", // save for 1 day
    type: "json", // we’ll parse JSON for you
  })
}
