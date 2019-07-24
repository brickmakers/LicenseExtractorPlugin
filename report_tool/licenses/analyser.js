const knownLicenses = require('./known-licenses.js')
const usage = require('./constants')

const analyse = (module) => {
  const handledLicenses = knownLicenses.getLicenses()
  const lastCharacterAsterisk = /\*$/
  const licenseName = module.licenses.replace(lastCharacterAsterisk, '')
  const license = handledLicenses[licenseName]
  if (license) {
    return {
      usage: license.usage,
      conditions: license.conditions,
    }
  }
  return { usage: usage.unclear }
}
module.exports = analyse
