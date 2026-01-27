import EleventyFetch from "@11ty/eleventy-fetch"
import config from "./siteConfig.js"

export default async function () {
  console.log("Fetching donators[HE] data...")
  const url = `${config.API_HOST}/api/donors?lang=he`

  /* This returns a promise */
  return EleventyFetch(url, {
    duration: "1d", // save for 1 day
    type: "json", // we'll parse JSON for you
  })
}
