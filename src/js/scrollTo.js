/**
 * scrollTo
 * Animates the scrolling of a container to a specific position
 * @param {number} targetPosition - position to scroll to
 * @param {Element} container - scrollable element to be scrolled
 * @param {Object} options
 * @param {string} [options.direction='vertical'] - direction of the scroll ()
 * @param {number} [options.duration=600] - duration of the scroll animation in ms
 */

async function scrollTo(targetPosition, container, { direction = "vertical", duration = 600 } = {}) {
  const directionProp = direction === "vertical" ? "scrollTop" : "scrollLeft"
  const startPosition = container[directionProp]
  const startTime = new Date().getTime()
  const distance = targetPosition - startPosition

  /**
   * Adapted ease out expo
   * @param {*} e - elapsed time
   * @param {*} s - starting position
   * @param {*} d - distance to travel
   * @param {*} l - time limit
   */
  const easeOutExpo = function(e, s, d, l) {
    // Using >= instead of == as the last animation frame can happen beyond the time limit
    return e >= l ? s + d : d * (-(2 ** ((-10 * e) / l)) + 1) + s
  }

  const makeStep = function(resolve) {
    return function() {
      const elapsed = new Date().getTime() - startTime
      const newPosition = easeOutExpo(elapsed, startPosition, distance, duration)
      container[directionProp] = newPosition

      if (elapsed < duration) {
        window.requestAnimationFrame(makeStep(resolve))
      } else {
        resolve()
      }
    }
  }

  return new Promise(resolve => window.requestAnimationFrame(makeStep(resolve)))
}

export default scrollTo
