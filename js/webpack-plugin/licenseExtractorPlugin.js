/* eslint-disable no-plusplus */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable class-methods-use-this */
const https = require('https')
const { exec } = require('child_process')
const { readFile } = require('fs')
const request = require('request-promise-native')

let proxy

const CHUNK_SIZE = 100

const licenseFileNames = [
  'UNLICENSE',
  'LICENSE-MIT',
  'LICENSE',
  'LICENSE.md',
  'LICENSE.MD',
  'LICENSE.txt',
  'LICENSE.TXT',
  'LICENSE.bsd',
  'LICENSE.BSD',
  'License',
  'license',
  'License.md',
  'License.txt',
  'License.bsd',
  'LICENCE',
  'LICENCE.md',
  'LICENCE.txt',
  'LICENCE.TXT',
  'LICENCE.BSD',
  'Licence',
  'Licence.md',
  'Licence.txt',
  'Licence.bsd',
]

const DEFAULT_OUTPUTFILENAME = 'licenses.json'

function flattenDependencyTree(dependencyTree) {
  const { dependencies } = dependencyTree
  if (dependencies) {
    const dependencyList = Object.keys(dependencies)
    return Object
      .keys(dependencies)
      .map(dependency => flattenDependencyTree(dependencies[dependency]))
      .reduce((agg, cur) => new Set([...agg, ...cur]), new Set(dependencyList))
  }
  return []
}


function downloadFile(url) {
  if (proxy) {
    return httpsGetWithProxy(url)
  }
  return httpsGet(url)
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (req) => {
      let data = ''
      req.on('socket', (socket) => {
        socket.setTimeout(3E5)
        socket.on('timeout', () => {
          reject()
        })
      })
      req.on('data', (chunk) => { data += chunk })
      req.on('end', () => {
        if (req.statusCode === 200) {
          resolve(data)
        } else {
          reject()
        }
      })
    })
  })
}

async function httpsGetWithProxy(url) {
  try {
    return request({
      uri: url,
      headers: { 'User-Agent': 'Request-Promise' },
      proxy,
    })
  } catch (e) {
    return request()
  }
}

function openFile(path) {
  return new Promise((resolve, reject) => readFile(path, (err, data) => {
    if (err) {
      reject(err)
    }
    resolve(data)
  }))
}

function saveRace(promises, timeout = 1000) {
  return Promise.race([
    new Promise((resolve, reject) => {
      let rejectCount = 0
      promises.forEach(promise => promise
        .then(value => resolve(value))
        .catch(() => {
          rejectCount++
          if (rejectCount === promises.length) {
            reject()
          }
        }))
    }),
    new Promise(
      (_, reject) => setTimeout(() => {
        reject()
      }, timeout),
    ),
  ])
}


function createChunks(arr, chunkSize) {
  const chunks = []
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize))
  }
  return chunks
}

async function runPromisesSequential(chunks, fn) {
  if (chunks.length === 0) {
    return Promise.resolve()
  }
  await fn(chunks[0])
  return await runPromisesSequential(chunks.slice(1), fn)
}


class LicenseExtractorPlugin {
  constructor(outputFilename, proxyString) {
    this.prevDependencies = new Set()
    this.outPutFilename = outputFilename || DEFAULT_OUTPUTFILENAME
    proxy = proxyString
    // eslint-disable-next-line no-console
    if (proxyString) { console.warn(`LicenseExtractorPlugin: Using proxy ${proxyString}`) }
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync('LicenseExtractorPlugin', (compilation, callback) => {
      const { prevDependencies, outPutFilename } = this
      // eslint-disable-next-line no-bitwise
      exec('npm ls --json --prod', { maxBuffer: 2 << 20 }, async (err, stdout) => {
        const dependencyTree = JSON.parse(stdout)
        const dependencies = flattenDependencyTree(dependencyTree)
        if ([...dependencies].every(dependency => prevDependencies.has(dependency))) {
          callback()
        } else {
          this.prevDependencies = dependencies
          const licenses = []
          const chunks = createChunks([...dependencies], CHUNK_SIZE)
          await runPromisesSequential(chunks, async chunk => await Promise.all(
            chunk.map(async (dependency) => {
              const nodeModulePath = `node_modules/${dependency}`
              const packageJson = JSON.parse(await openFile(`${nodeModulePath}/package.json`).catch(() => ''))
              const repositoryUrl = this.resolveRepositoryUrl(packageJson)
              const license = this.extractLicenseFromPackage(packageJson)
              const author = this.extractAuthorFromPackage(packageJson)
              const licenseText = await this.resolveLicense(nodeModulePath, repositoryUrl).catch(() => '')
              licenses.push({
                name: packageJson.name,
                version: packageJson.version,
                author,
                license,
                licenseText,
              })
            }),
          ))
          const licensesString = JSON.stringify(licenses)
          // eslint-disable-next-line no-param-reassign
          compilation.assets[outPutFilename] = {
            source: () => licensesString,
            size: () => licensesString.length,
          }
          callback()
        }
      })
    })
  }

  extractAuthorFromPackage(packageJson) {
    if (!packageJson.author) return ''
    if (typeof packageJson.author === 'string') {
      return packageJson.author
    }
    if (packageJson.author.name && typeof packageJson.author.name === 'string') {
      return packageJson.author.name
    }
    return ''
  }

  extractLicenseFromPackage(packageJson) {
    if (!packageJson.licenses && !packageJson.license) return ''
    if (packageJson.license) {
      return packageJson.license
    }
    if (packageJson.licenses.length > 0) {
      return packageJson.licenses[0].type
    }
    return ''
  }

  resolveRepositoryUrl(packageJson) {
    const { repository } = packageJson
    if (!repository) {
      return null
    }
    const parts = (repository.url || repository)
      .split('github.com/')
      .slice(-1)[0]
      .split('.git')
      .slice(0, 1)[0]
      .split('/')
      .slice(0, 2)
    return `https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/master`
  }

  async resolveLicense(nodeModulePath, repositoryUrl) {
    try {
      const buffer = await saveRace(licenseFileNames.map(fileName => openFile(`${nodeModulePath}/${fileName}`)))
      return buffer.toString()
    } catch (e) {
      return await saveRace(licenseFileNames.map(fileName => downloadFile(`${repositoryUrl}/${fileName}`))).catch(() => '')
    }
  }
}

module.exports = LicenseExtractorPlugin
