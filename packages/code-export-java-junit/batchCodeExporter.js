import fs from 'fs'
var path = require('path');
const FileHound = require('filehound');
import { normalizeTestsInSuite } from './packages/selenium-ide/src/neo/IO/normalize'
import { emitTest, emitSuite } from './packages/code-export-java-junit/src'
const filesPath = '/home/varun/Downloads/SeleniumTests'
const downloadPath = path.join(filesPath,'Junit')
const filesType = 'side'

function readFile(file) {
  return JSON.parse(
    fs.readFileSync(file)
  )
}

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
  const results = await emitSuite({
    baseUrl: project.url,
    suite: project.suites[0],
    tests: project.tests,
  })
  return results
}

/**
 * Export JUnit code for SIDE files in a entire folder
 * SIDE files must be present in {filesPath}
 * Java JUnit files will be saved in {downloadPath}
 */
export default function batchExportSuitCode(){
  try {
    fs.mkdirSync(downloadPath, { recursive: true } )
  } catch (e) {
      console.log('Cannot create folder ', e)
  }
  const files = FileHound.create()
    .paths(filesPath)
    .ext(filesType)
    .find()

  files.then((arr) => {
    arr.forEach(function(item, i)  {
      var filename = path.parse(item).base;
      console.log("Found",filename)
      emitSuitCode(item).then((result) => {
        fs.writeFile(path.join(downloadPath, result.filename), result.body, function(err) {
          if(err) {
              return console.log(err);
          }
          console.log("The file:",result.filename," was saved!")
        })
      })
    })
  })
}

// Call the batch process function
batchExportSuitCode()
