const program = require('commander');
const https = require('https');
const { readFile, writeFile } = require('fs');
const request = require('request-promise-native');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');

const DEFAULT_OUTPUTFILENAME = 'licenses.json';
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


function downloadFile(url, proxy) {
    if (proxy) {
        return httpsGetWithProxy(url)
    }
    return httpsGet(url)
}

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
        let data = ''
        res.on('socket', (socket) => {
            socket.setTimeout(3E5)
            socket.on('timeout', () => {
                reject()
            })
        })
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
            if (res.statusCode === 200) {
                resolve(data)
            } else {
                reject()
            }
        })
        })
    })
}

function httpsGetWithProxy(url) {
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
        }, timeout)),
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

class LicenseExtractor {
  constructor({
    modulesPath = '', outputPath = '', fileName, proxyString,
  }) {
    this.prevDependencies = new Set();
    this.nodePath = modulesPath;
    this.outPutFilename = fileName;
    this.output = path.join(outputPath, this.outPutFilename);
    this.proxy = proxyString;
    if (proxyString) { console.warn(`LicenseExtractorPlugin: Using proxy ${proxyString}`); }
  }

  async extract() {
        const { output, nodePath } = this
        const { stdout, stderr } = await exec(`npm ls --json --prod`, {cwd: nodePath, maxBuffer: 2 << 20 })
        if(stderr){
            console.error(err);
            return;
        }
        const dependencyTree = JSON.parse(stdout)
        const dependencies = flattenDependencyTree(dependencyTree)
        this.prevDependencies = dependencies
        const licenses = []
        const chunks = createChunks([...dependencies], CHUNK_SIZE)
        await runPromisesSequential(chunks, async chunk => await Promise.all(
            chunk.map(async (dependency) => {
                const nodeModulePath = path.join(nodePath, 'node_modules', dependency)
                const packageJson = JSON.parse(await openFile(path.join(nodeModulePath,'package.json')).catch(() => '{}'))
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
        writeFile(output, licensesString, err => {
            if(err){
                console.warn(err)
            }
            console.log(`File written to: ${output}`)
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
      const buffer = await saveRace(licenseFileNames.map(fileName => openFile(path.join(nodeModulePath, fileName))))
      return buffer.toString()
    } catch (e) {
      return await saveRace(licenseFileNames.map(fileName => downloadFile(`${repositoryUrl}/${fileName}`, this.proxy))).catch(() => '')
    }
  }
}

program
  .version('1.0.0', '-v, --version')
  .usage('[OPTIONS]...')
  .option('-n, --modules-path [node_module_path]', 'Path to node_modules and package.json')
  .option('-o, --output-path [out_path]', 'Path to output file')
  .option('-f, --file-name [file_name]', 'Output Filename', DEFAULT_OUTPUTFILENAME)
  .option('-p, --proxy-string [proxy]', 'Proxy String if needed')
  .parse(process.argv);

const extractor = new LicenseExtractor(program);
extractor.extract();
