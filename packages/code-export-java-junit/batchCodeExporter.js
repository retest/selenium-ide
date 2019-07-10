import fs from 'fs'
var path = require('path');
const FileHound = require('filehound');
import { emitTest, emitSuite } from './src'
import { normalizeTestsInSuite } from '../selenium-ide/src/neo/IO/normalize'
const filesPath = '.' // path to the folder containing SIDE files
const downloadPath = path.join(filesPath,'Junit') // Will by default create a JUnit folder in {filesPath}
const filesType = 'side'

function readFile(file) {
  return JSON.parse(
    fs.readFileSync(file)
  )
}

/* Borrowed from end-to-end tests */
function normalizeProject(project) {
  let _project = { ...project }
  _project.suites.forEach(suite => {
    normalizeTestsInSuite({ suite, tests: _project.tests })
  })
  return _project
}

/**
 * Emit an individual test, wrapped in a suite
 * @param {full path to the SIDE file} file
 */
async function emitTestcaseCode(file) {
  const project = normalizeProject(readFile(file))
  const results = await emitTest({
    baseUrl: project.url,
    test: project.tests[0],
    tests: project.tests,
  })
  return results
}

/**
 * Emit a suite with all of its tests
 * @param {full path to the SIDE file} file
 */
async function emitSuitCode(file) {
 const project = normalizeProject(readFile(file))
 return await emitSuite({
   baseUrl: project.url,
   suite: project.suites[0],
   tests: project.tests,
 })
}

/**
 * Export JUnit code for SIDE files in a entire folder
 * SIDE files must be present in {filesPath}
 * Java JUnit files will be saved in {downloadPath}
 */
async function batchExportSuitCode(){
  try {
    fs.mkdirSync(downloadPath, { recursive: true } )
  } catch (e) {
      console.log('Cannot create folder ', e)
  }
  var files = []
  await FileHound.create()
    .paths(filesPath)
    .ext(filesType)
    .find().then((arr) => {files = arr}).catch(error => console.log(error.message));

  for (const item of files) {
    var filename = path.parse(item).base;
    console.log("Found",filename)
    await emitSuitCode(item).then((result) => {
      fs.writeFile(path.join(downloadPath, result.filename), result.body, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file:",result.filename," was saved!")
      })
    }).catch(error => console.log(error.message, ' in ' ,item));
  }
}

// Call the batch process function
batchExportSuitCode()
