const fs = require('fs')

const [testName] = process.argv.slice(2)
if (!testName) {
  throw new Error('missing filename\nusage: node loadJson.js <fileName>')
}
console.log(JSON.stringify(JSON.parse(fs.readFileSync(`./${testName}`))))
