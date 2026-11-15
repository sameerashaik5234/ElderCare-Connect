// Comprehensive Automated Test Suite Runner
const { run } = require('node:test');
const { spec } = require('node:test/reporters');
const path = require('node:path');

console.log('====================================================');
console.log('  ElderCare Connect - Automated Test Suite');
console.log('====================================================');

run({
  files: [
    path.resolve(__dirname, 'auth.test.js'),
    path.resolve(__dirname, 'adherence.test.js'),
    path.resolve(__dirname, 'scheduler.test.js'),
    path.resolve(__dirname, 'api.test.js'),
    path.resolve(__dirname, 'voice.test.js')
  ]
})
  .compose(new spec())
  .pipe(process.stdout);
