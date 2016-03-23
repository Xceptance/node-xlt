# node-xlt
NodeJS support for Xceptance LoadTest.

## Installation

  npm install node-xlt --save-dev

## Usage

  var xlt = require('node-xlt');
  
  // adjust this path to your local installation of Xlt
  xlt.setOptions({pathToXLT: '../xlt-4.6.2'});
  
  // you can also use our download feature if you have no installation of Xlt
  xlt.downloadXlt();
  
  // the next step would be to check if you have java installed
  xlt.javaVersion(function (err, res) {
    console.log(res);
  });

  // to check if all needed folders are available you can call the following
  console.log("Everything is fine: " +xlt.checkPrerequisites());
  
  // before you can run the test cases you have to compile them
  xlt.compileAllTestCases();

  // now you can run them all
  xlt.runAllTestCases();
  
  // or you can call a single test case (you need to provide the path and name)
  xlt.runSingleTestCase('tests.demo.TVisitXceptance');
  
  // if running your test suite take to much time and you tests are independent of each other you can call them in a parallel mode
  xlt.runAllTestCasesParallel({xltWebDriver: "chrome"}, function(res){console.log("All tests run without errors: " + res)});
  
  // you can remove all the data created from compiling and the test runs  
  xlt.clean();

## Tests

  npm test
