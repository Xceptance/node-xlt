var should = require('chai').should(),
    xlt = require('../index'),
    javaVersion = xlt.javaVersion,
    setOptions = xlt.setOptions,
    checkPrerequisites = xlt.checkPrerequisites,
    findFilesWithPattern = xlt.findFilesWithPattern,
    findTestCaseClasses = xlt.findTestCaseClasses,
    findTestCaseJavas = xlt.findTestCaseJavas,
    deleteAllTestCaseClasses = xlt.deleteAllTestCaseClasses,
    deleteTestCaseDirectory = xlt.deleteTestCaseDirectory,
    compileAllTestCases = xlt.compileAllTestCases,
    runAllTestCases = xlt.runAllTestCases,
    runSingleTestCase = xlt.runSingleTestCase;

var testOptions = {
    baseDir: './test/',
    testSrcDir: 'src/',
    testClassesDir: 'classes/',
    testCasesJava: '**/T*.java',
    testCasesClass: '**/T*.class',
    pathToXLT: '../../../XLT-4.5.3',
    commandPrefix: 'cd test && ',
    pathToScriptDir: 'node-xlt'
};


describe('#setOptions', function () {
    it('sets the options', function () {
        var fun = function () {
            setOptions(testOptions);
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
        setOptions({pathToXLT: '../../../XLT-4.5.3', testSrcDir: 'notExistingDirectory'});
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
        javaVersion(function (err, res) {
            parseFloat(res).should.least(1.7);
            done();
        });
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
        findFilesWithPattern('./test/src/', '**/*.java').length.should.equal(2);
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
    it('runs TAccount_CreateAccount test case', function () {
        var res = false, fun = function () {
            res = runSingleTestCase('tests.demo.TVisitXceptance');
        };
        fun.should.not.throw(Error);
        res.should.be.true;
    });

    it('runs TSearch_NoResults test case changing the web driver to phantomJs', function () {
        var res = false, fun = function () {
            res = runSingleTestCase('tests.demo.TVisitXceptance', {xltWebDriver: 'phantomJs'});
        };
        fun.should.not.throw(Error);
        res.should.be.true;
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
