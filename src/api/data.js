import { getApiUrl } from "../js/utils"

/**
 * Request specific user generated public data
 * Currently available props: dictionary, donators, photographers
 *
 * @returns		JSON specific response to the request with props
 */
const getData = async (prop) => {
  let resp = null
  resp = await fetch(`${getApiUrl()}/getdata/${prop}`, {
    method: "GET",
    mode: "cors",
  })
  return resp ? resp.json() : resp
}

export default {
  getData,
}
