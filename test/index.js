var should = require('chai').should(),
    xlt = require('../index'),
    javaVersion = xlt.javaVersion,
    setOptions = xlt.setOptions,
    downloadXlt = xlt.downloadXlt,
    checkPrerequisites = xlt.checkPrerequisites,
    findFilesWithPattern = xlt.findFilesWithPattern,
    findTestCaseClasses = xlt.findTestCaseClasses,
    findTestCaseJavas = xlt.findTestCaseJavas,
    deleteAllTestCaseClasses = xlt.deleteAllTestCaseClasses,
    deleteTestCaseDirectory = xlt.deleteTestCaseDirectory,
    compileAllTestCases = xlt.compileAllTestCases,
    runAllTestCases = xlt.runAllTestCases,
    runSingleTestCase = xlt.runSingleTestCase,
    runTestCasesParallel = xlt.runTestCasesParallel,
    runAllTestCasesParallel = xlt.runAllTestCasesParallel,
    runSingleTestCaseAsync = xlt.runSingleTestCaseAsync,
    complete = xlt.complete;
clean = xlt.clean;

var testOptions = {
    baseDir: './test/',
    commandPrefix: 'cd test && ',
    pathToScriptDir: 'node-xlt',
    xltWidth: 400,
    xltHeight: 300
};


describe('#setOptions', function () {
    it('sets the options', function () {
        var fun = function () {
            setOptions(testOptions);
        };
        fun.should.not.throw(Error);
    });
});

describe('#clean', function () {
    this.timeout(0);
    it('cleans all temporary files and directories', function () {
        var fun = function () {
            clean();
        };
        fun.should.not.throw(Error);
    });
});


describe('#downloadXlt', function () {
    this.timeout(0);
    it('downloads xlt', function (done) {
        var fun = function () {
            downloadXlt(function (err, res) {
                should.equal(err, null);
                res.should.be.equal('test/lib/xlt-4.5.6');
                done();
            });
        };
        fun.should.not.throw(Error);
    });
});

describe('#checkPrerequisites', function () {
    it('it awaits an error if the xlt directory can\'t be found', function () {
        setOptions({pathToXLT: '../notExistingDirectory'});
        var res = false, fun = function () {
            res = checkPrerequisites();
        };
        fun.should.throw(Error, 'XLT directory could not be found with the given path');
    });

    it('it awaits an error if the sources directory can\'t be found', function () {
        setOptions({pathToXLT: 'lib/xlt-4.5.6', testSrcDir: 'notExistingDirectory'});
        var res = false, fun = function () {
            res = checkPrerequisites();
        };
        fun.should.throw(Error, 'Directory of the java sources could not be found with the given path');
    });

    it('it check if all prerequisites (path to xlt and sources directory) are fulfilled', function () {
        setOptions(testOptions);
        var res = false, fun = function () {
            res = checkPrerequisites();
        };
        fun.should.not.throw(Error);
        res.should.be.true;
    });
});

describe('#javaVersion', function () {
    it('checks if Java greater 1.7 is installed', function (done) {
        var fun = function () {
            javaVersion(function (err, res) {
                parseFloat(res).should.least(1.7);
                done();
            });
        };
        fun.should.not.throw(Error);
    });
});


describe('#deleteTestCaseDirectory', function () {
    it('removes xlt test case classes', function () {
        var fun = function () {
            deleteTestCaseDirectory()
        };
        fun.should.not.throw(Error);
    });
});


describe('#findFilesWithPattern', function () {
    it('finds package.json in this folder', function () {
        findFilesWithPattern('./', 'p*.json').length.should.equal(1);
    });

    it('finds *.js in this folder and its subfolders', function () {
        findFilesWithPattern('./', '**/*.js').length.should.least(2);
    });

    it('finds no xlt java test cases in this folder and its subfolders', function () {
        findFilesWithPattern('./node_modules/', '**/*.java').length.should.equal(0);
    });

    it('finds two java test cases in this folder and its subfolders', function () {
        findFilesWithPattern('./test/src/', '**/*.java').length.should.equal(22);
    });

    it('returns error on "" as project folder', function () {
        var fun = function () {
            return findFilesWithPattern('', '*.js')
        };
        fun.should.throw(Error, 'No base directory given.');
    });

    it('returns error on null as project folder', function () {
        var fun = function () {
            findFilesWithPattern(null, '**/*.java')
        };
        fun.should.throw(Error, 'No base directory given.');
    });

    it('returns error on null as pattern', function () {
        var fun = function () {
            findFilesWithPattern('./', null)
        };
        fun.should.throw(Error, 'No pattern given.');
    });
});


describe('#findTestCaseJavas', function () {
    it('finds xlt java test cases in project folder', function () {
        findTestCaseJavas().length.should.least(2);
    });
});


describe('#compileAllTestCases', function () {
    this.timeout(0);
    it('compiles no xlt test case classes in project folder', function () {
        var res = false, fun = function () {
            res = compileAllTestCases();
        };
        fun.should.not.throw(Error);
        res.should.be.true;
    });
});


describe('#runAllTestCases', function () {
    this.timeout(0);
    it('runs xlt test cases', function () {
        var res = false, fun = function () {
            res = runAllTestCases();
        };
        fun.should.not.throw(Error);
        res.should.be.true;
    });
});


describe('#runSingleTestCase', function () {
    this.timeout(0);
    it('runs TVisitXceptance test case', function () {
        var res = false, fun = function () {
            res = runSingleTestCase('tests.demo.TVisitXceptance');
        };
        fun.should.not.throw(Error);
        res.should.be.true;
    });

    it('runs TVisitXceptance test case changing the web driver to firefox_clientperformance', function () {
        var res = false, fun = function () {
            res = runSingleTestCase('tests.demo.TVisitXceptance', {xltWebDriver: 'firefox_clientperformance'});
        };
        fun.should.not.throw(Error);
        res.should.be.true;
    });
});


describe('#parallel', function(){
    this.timeout(0);
    it('calls one test async', function(done){
        var fun = function () {
            runSingleTestCaseAsync('tests.demo.TVisitXceptance', null, function (err, res) {
                res.should.be.true;
                done();
            });
        };
        fun.should.not.throw(Error);
    });

    it('calls all tests async', function(done){
        var params = {
            'xltWebDriver': 'chrome',
            'xltWidth': 800,
            'xltHeight': 600,
            'patterns': {
                'test.*TVisitWait1.*': 'firefox',
                'test.*TVisitWait2.*': 'phantomjs'
            }
        };
        var fun = function () {
            runAllTestCasesParallel(params, function (res) {
                res.should.be.true;
                done();
            });
        };
        fun.should.not.throw(Error);
    });

    it('calls some tests async', function(done){
        var fun = function () {
            var tests = [
                {
                    'path': 'tests.demo.TVisitWait10SecondXceptance',
                    'params': {
                        'xltWebDriver': 'firefox',
                        'xltWidth': 400,
                        'xltHeight': 300
                    }
                },
                {
                    'path': 'tests.demo.TVisitWait10SecondXceptance',
                    'params': {
                        'xltWebDriver': 'chrome',
                        'xltWidth': 450,
                        'xltHeight': 350
                    }
                },
                {
                    'path': 'tests.demo.TVisitWait11SecondXceptance',
                    'params': {
                        'xltWebDriver': 'firefox',
                        'xltWidth': 500,
                        'xltHeight': 400
                    }
                },
                {
                    'path': 'tests.demo.TVisitWait11SecondXceptance',
                    'params': {
                        'xltWebDriver': 'chrome',
                        'xltWidth': 550,
                        'xltHeight': 450
                    }
                },
                {
                    'path': 'tests.demo.TVisitWait12SecondXceptance',
                    'params': {
                        'xltWebDriver': 'firefox',
                        'xltWidth': 600,
                        'xltHeight': 500
                    }
                },
                {
                    'path': 'tests.demo.TVisitWait12SecondXceptance',
                    'params': {
                        'xltWebDriver': 'chrome',
                        'xltWidth': 650,
                        'xltHeight': 550
                    }
                },
                {
                    'path': 'tests.demo.TVisitWait13SecondXceptance',
                    'params': {
                        'xltWebDriver': 'firefox',
                        'xltWidth': 700,
                        'xltHeight': 600
                    }
                },
                {
                    'path': 'tests.demo.TVisitWait13SecondXceptance',
                    'params': {
                        'xltWebDriver': 'chrome',
                        'xltWidth': 750,
                        'xltHeight': 650
                    }
                },
                {
                    'path': 'tests.demo.TVisitWait14SecondXceptance',
                    'params': {
                        'xltWebDriver': 'firefox',
                        'xltWidth': 800,
                        'xltHeight': 700
                    }
                },
                {
                    'path': 'tests.demo.TVisitWait14SecondXceptance',
                    'params': {
                        'xltWebDriver': 'chrome',
                        'xltWidth': 850,
                        'xltHeight': 750
                    }
                },
                {
                    'path': 'tests.demo.TVisitWait15SecondXceptance',
                    'params': {
                        'xltWebDriver': 'firefox',
                        'xltWidth': 900,
                        'xltHeight': 800
                    }
                },
                {
                    'path': 'tests.demo.TVisitWait15SecondXceptance',
                    'params': {
                        'xltWebDriver': 'chrome',
                        'xltWidth': 950,
                        'xltHeight': 850
                    }
                },
                {
                    'path': 'tests.demo.TVisitWait16SecondXceptance',
                    'params': {
                        'xltWebDriver': 'firefox',
                        'xltWidth': 1000,
                        'xltHeight': 900
                    }
                },
                {
                    'path': 'tests.demo.TVisitWait16SecondXceptance',
                    'params': {
                        'xltWebDriver': 'chrome',
                        'xltWidth':1000
                    }
                },
                {
                    'path': 'tests.demo.TVisitWait17SecondXceptance',
                    'params': {
                        'xltWebDriver': 'firefox',
                        'xltHeight': 1000
                    }
                },
                {
                    'path': 'tests.demo.TVisitWait17SecondXceptance',
                    'params': {
                        'xltWebDriver': 'chrome'
                    }
                }
            ];
            runTestCasesParallel(tests, function (res) {
                res.should.be.true;
                done();
            });
        };
        fun.should.not.throw(Error);
    });
});

describe('#findTestCaseClasses', function () {
    it('finds xlt test case classes in project folder', function () {
        findTestCaseClasses().length.should.least(2);
    });
});


describe('#deleteAllTestCaseClasses', function () {
    it('removes xlt test case classes', function () {
        var fun = function () {
            deleteAllTestCaseClasses()
        };
        fun.should.not.throw(Error);
    });
});


describe('#complete', function () {
    this.timeout(0);
    it('runs the whole process', function (done) {
        var fun = function () {
            complete(function () {
                done();
            });
        };
        fun.should.not.throw(Error);
    });
});