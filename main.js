const asyncMap = require('asyncmap')
const axios = require('axios')
const roundTo = require('round-to')

const pages = require('./pages.json')

// round and provide number with leading zeros
const round = (number, places) => roundTo(number, places).toFixed(places)


async function request (page) {
  async function getResponse (page) {
    try {
      const response = await axios.get(page)
      return response
    }
    catch (error) {
      if (error && error.response) {
        return error.response
      }
      throw new Error(error)
    }
  }

  const startTime = Date.now()
  const response = await getResponse(page)
  const redirectCount = response.request._redirectable._redirectCount
  const { status } = response

  return {
    time: Date.now() - startTime,
    isOkay: (status < 400),
    url: page,
    redirectCount,
    status
  }
}

const textBar = (
  text = "",
  length = 45,
  {
    character = '-',
    frontDashes = 2,
    padding = true,
    paddingSize = 1,
  } = {}
) => {

  const textSpace = length - text.length - frontDashes - (padding ? paddingSize * 2 : 0)

  return [
    character.repeat(frontDashes),
    padding ? ' '.repeat(paddingSize) : '',
    text,
    padding ? ' '.repeat(paddingSize) : '',
    character.repeat (textSpace > 0 ? textSpace : 0)
  ].join('')
}

(async ()=> {
  const responses = await asyncMap(pages, async (page) => await request(page))

  console.info(`\n${textBar("Ping Pages")}\n`)

  console.info( // log the results of each response
    responses
      .map(response => {
        const { time, url, redirectCount, status, isOkay } = response

        const successIndicator = isOkay ? '✓ ' : '❌'
        const timeLabel = `${round(time / 1000, 3)}s`
        const statusLabel = `Status: ${status}`
        const redirectLabel = redirectCount ? `Redirects: ${redirectCount}` : 'Not Redirected'

        return `${url}\n  ${successIndicator}[ ${statusLabel} | ${timeLabel} | ${redirectLabel} ]`
      })
      .join('\n\n')
  )

  console.info(`\n\n${textBar("Results")}\n`)

  // log successes and failures
  const successfulResponses = responses.filter(({isOkay}) => isOkay)
  console.info(
    `Successful Responses: ${successfulResponses.length}\n${successfulResponses.map(({url}) => `  ${url}`).join('\n')}`
  )

  console.info('')

  const failedResponses = responses.filter(({isOkay}) =>! isOkay)
  console.info(
    `Failed Responses: ${failedResponses.length}\n${failedResponses.map(({url}) => `  ${url}`).join('\n')}`
  )
})()
