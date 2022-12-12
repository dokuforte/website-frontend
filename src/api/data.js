import config from "../data/siteConfig"

/**
 * Request specific user generated public data
 * Currently available props: dictionary, donators, photographers
 *
 * @returns		JSON specific response to the request with props
 */
const getData = async prop => {
  let resp = null
  resp = await fetch(`${config.API_HOST}/getdata/${prop}`, {
    method: "GET",
    mode: "cors",
  })
  return resp ? resp.json() : resp
}

export default {
  getData,
}
