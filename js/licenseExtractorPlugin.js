const https = require('https');
const {exec} = require('child_process');
const {readFile} = require('fs');
const request = require('request-promise-native');

let proxy;

const CHUNK_SIZE = 100;

const licenseFileNames = [
  'LICENSE',
  'LICENSE.md',
  'LICENSE.txt',
  'License',
  'License.md',
  'License.txt',
  'LICENCE',
  'LICENCE.md',
  'LICENCE.txt',
  'Licence',
  'Licence.md',
  'Licence.txt'
];

function flattenDependencyTree(dependencyTree) {
  const dependencies = dependencyTree.dependencies;
  if (dependencies) {
    const dependencyList = Object.keys(dependencies);
    return Object
      .keys(dependencies)
      .map(dependency => {
        return flattenDependencyTree(dependencies[dependency])
      })
      .reduce((agg, cur) => new Set([...agg, ...cur]), new Set(dependencyList));
  } else {
    return []
  }
}

function resolveRepositoryUrl(packageJson) {
  const repository = packageJson.repository;
  if (!repository) {
    return null;
  }
  const parts = (repository.url || repository)
    .split('github.com/')
    .slice(-1)[0]
    .split('.git')
    .slice(0, 1)[0]
    .split('/')
    .slice(0, 2);
  return `https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/master`;
}

function downloadFile(url) {
  if (proxy) {
    httpsGetWithProxy(url)
  } else {
    httpsGet(url)
  }
};

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, request => {
      let data = '';
      request.on('socket', (socket) => {
        socket.setTimeout(3E5);
        socket.on('timeout', () => {
          reject();
        });
      });
      request.on('data', chunk => data += chunk);
      request.on('end', () => {
        if (request.statusCode === 200) {
          resolve(data);
        } else {
          reject();
        }
      })
    });
  })
}

function httpsGetWithProxy(url) {
  return request({
    uri: url,
    headers: {'User-Agent': 'Request-Promise'},
    proxy: proxy
  })
    .catch(() => {})
}

function openFile(path) {
  return new Promise((resolve, reject) =>
    readFile(path, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    })
  )
}

function saveRace(promises, timeout = 1000) {
  return Promise.race([
      new Promise((resolve, reject) => {
        let rejectCount = 0;
        promises.forEach(promise =>
          promise
            .then(value => resolve(value))
            .catch(() => {
              rejectCount++;
              if (rejectCount === promises.length) {
                reject();
              }
            })
        )
      }),
      new Promise(
        (_, reject) => setTimeout(() => {
          reject();
        }, timeout)
      )
    ]
  );
}

function resolveLicense(nodeModulePath, repositoryUrl) {
  return saveRace(licenseFileNames.map(fileName => openFile(`${nodeModulePath}/${fileName}`)))
    .then(buffer => buffer.toString())
    .catch(() => saveRace(licenseFileNames.map(fileName => downloadFile(`${repositoryUrl}/${fileName}`))));
}

function createChunks(arr, chunkSize) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

async function runPromisesSequential(chunks, fn) {
  if (chunks.length === 0) {
    return Promise.resolve();
  } else {
    await fn(chunks[0]);
    await runPromisesSequential(chunks.slice(1), fn);
  }
}


function LicenseExtractorPlugin(proxyString) {
  this.prevDependencies = new Set();
  proxy = proxyString;
  proxyString && console.log("LicenseExtractorPlugin: Using proxy " + proxyString);
}

LicenseExtractorPlugin.prototype.apply = function (compiler) {
  compiler.plugin('emit', (compilation, callback) => {
    const prevDependencies = this.prevDependencies;
    exec('npm ls --json --prod', {maxBuffer: 2 << 20}, async (err, stdout) => {
      const dependencyTree = JSON.parse(stdout);
      const dependencies = flattenDependencyTree(dependencyTree);
      if ([...dependencies].every(dependency => prevDependencies.has(dependency))) {
        callback();
      } else {
        this.prevDependencies = dependencies;
        const licenses = [];
        const chunks = createChunks([...dependencies], CHUNK_SIZE);
        await runPromisesSequential(chunks, async (chunk) =>
          await Promise.all(
            chunk
              .map(async dependency => {
                  const nodeModulePath = `node_modules/${dependency}`;
                  const packageJson = JSON.parse(await openFile(`${nodeModulePath}/package.json`));
                  const repositoryUrl = resolveRepositoryUrl(packageJson);
                  const license = packageJson.license ? packageJson.license : packageJson.licenses ? packageJson.licenses[0].type : null;
                  const author = packageJson.author ? typeof packageJson.author === 'string' ? packageJson.author : packageJson.author.name : null;
                  const licenseText = await resolveLicense(nodeModulePath, repositoryUrl).catch(() => null);
                  licenses.push({
                    name: packageJson.name,
                    version: packageJson.version,
                    author,
                    license,
                    licenseText
                  });
                }
              )
          )
        );
        const licensesString = JSON.stringify(licenses);
        compilation.assets['licenses.json'] = {
          source: () => licensesString,
          size: () => licensesString.length
        };
        callback();
      }
    });
  });
};

module.exports = LicenseExtractorPlugin;