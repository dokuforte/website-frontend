import EleventyFetch from "@11ty/eleventy-fetch"
import config from "./siteConfig.js"

export default async function () {
  console.log("Fetching pages[EN] data...")
  const url = `${config.API_HOST}/api/contents?lang=en`

  /* This returns a promise */
  return EleventyFetch(url, {
    duration: "1m", // save for 1 minute
    type: "json", // we'll parse JSON for you
  })
}
