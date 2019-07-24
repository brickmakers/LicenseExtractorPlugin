// eslint-disable-next-line import/no-extraneous-dependencies
const createCsvWriter = require('csv-writer').createObjectCsvWriter
const analyse = require('./analyser')

const usedModules = require('./usedModules.json')

const exportPath = 'licenses-report.csv'
const csvHeader = [
  { id: 'moduleName', title: 'Module name' },
  { id: 'license', title: 'License' },
  { id: 'usage', title: 'Usage in project' },
  { id: 'conditions', title: 'Konditionen' },
]

const csvWriter = createCsvWriter({
  path: exportPath,
  header: csvHeader,
})

const csvEntries = []

function objectHasProperty(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key)
}

function addLineToCsv(csvLine) {
  csvEntries.push(csvLine)
}

Object.keys(usedModules).forEach((moduleKey) => {
  if (objectHasProperty(usedModules, moduleKey)) {
    const module = usedModules[moduleKey]
    const analyseResult = analyse(module)
    const csvLine = {
      moduleName: moduleKey,
      license: module.licenses,
      usage: analyseResult.usage,
      conditions: analyseResult.conditions,
    }
    addLineToCsv(csvLine)
  }
})
csvWriter.writeRecords(csvEntries).then(() => {})
