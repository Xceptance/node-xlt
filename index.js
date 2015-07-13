'use strict';

var glob = require('glob');
var fs = require('fs');
var nodePath = require('path');

var XLT = function () {

    //internal
    var targetDir = 'classes';
    var sourcesDir = 'src';

    //available via options
    var baseDir = './';
    var testSrcDir = nodePath.join(baseDir, sourcesDir);
    var testClassesDir = nodePath.join(baseDir, targetDir);
    var testCasesJava = '**/T*.java';
    var testCasesClass = '**/T*.class';
    var log4jProperties = 'config/js-log4j.properties';
    var pathToScriptDir = '';
    var commandPrefix = '';
    var xltWebDriver, xltWidth, xltHeight;
    var xltVersion = '4.5.5';
    var pathToXLT = 'lib/xlt-4.5.5';

    //internal
    var xltLibDir = 'lib/*';
    var xltLibPath = nodePath.join(pathToXLT, xltLibDir);
    var sourceFileName = 'sources.txt';
    var sourceFilePath = nodePath.join(baseDir, sourceFileName);
    var libDir = nodePath.join(baseDir, 'lib');

    /**
     * Generates the parameters for the java environment to be added during the run of the test case.
     *
     * @param  {Object} options
     * @param  {String} [options.baseDir]
     * @param  {String} [options.pathToXLT]
     * @param  {String} [options.testSrcDir]
     * @param  {String} [options.testClassesDir]
     * @param  {String} [options.testCasesJava]
     * @param  {String} [options.testCasesClass]
     * @param  {String} [options.log4jProperties]
     * @param  {String} [options.xltWebDriver]
     * @param  {Number} [options.xltWidth]
     * @param  {Number} [options.xltHeight]
     * @param  {String} [options.commandPrefix]
     * @param  {String} [options.pathToScriptDir]
     * @param  {String} [options.xltVersion]
     */
    XLT.prototype.setOptions = function (options) {
        if (options) {
            //baseDir dependent
            baseDir = options.baseDir ? options.baseDir : baseDir;
            sourceFilePath = options.baseDir ? nodePath.join(baseDir, sourceFileName) : sourceFilePath;
            libDir = options.baseDir ? nodePath.join(baseDir, libDir) : libDir;
            testClassesDir = options.baseDir ? nodePath.join(baseDir, targetDir) : testClassesDir;
            testClassesDir = options.testClassesDir ? nodePath.join(baseDir, options.testClassesDir) : testClassesDir;
            testSrcDir = options.baseDir ? nodePath.join(baseDir, sourcesDir) : testSrcDir;
            testSrcDir = options.testSrcDir ? nodePath.join(baseDir, options.testSrcDir) : testSrcDir;

            //baseDir independent
            pathToXLT = options.pathToXLT ? options.pathToXLT : pathToXLT;
            xltLibPath = options.pathToXLT ? nodePath.join(pathToXLT, xltLibDir) : xltLibPath;
            testCasesJava = options.testCasesJava || testCasesJava;
            testCasesClass = options.testCasesClass || testCasesClass;
            log4jProperties = options.log4jProperties || log4jProperties;
            commandPrefix = options.commandPrefix ? options.commandPrefix : commandPrefix;
            pathToScriptDir = options.pathToScriptDir ? options.pathToScriptDir : pathToScriptDir;
            xltWebDriver = options.xltWebDriver ? options.xltWebDriver : null;
            xltWidth = options.xltWidth ? options.xltWidth : null;
            xltHeight = options.xltHeight ? options.xltHeight : null;
            xltVersion = options.xltVersion ? options.xltVersion : xltVersion;
        }
    };

    /**
     * Checks (asynchronous) if the Java is installed on the machine and returns the version.
     *
     * @param {function} callback(error, javaVersion)
     */
    XLT.prototype.javaVersion = function (callback) {
        var spawn = require('child_process').spawn('java', ['-version']);
        var notYetFired = true;
        spawn.on('error', function (err) {
            return callback(err, null);
        });
        spawn.stderr.on('data', function (data) {
            if (notYetFired) {
                notYetFired = false;
                data = data.toString().split('\n')[0];
                var javaVersion = new RegExp('java version').test(data) ? data.split(' ')[2].replace(/"/g, '') : false;
                if (javaVersion !== false) {
                    return callback(null, javaVersion);
                } else {
                    return callback(new Error('No Java installed.'), null);
                }
            }
        });
    };

    /**
     * Downloads (asynchronous) Xlt (default version 4.5.4) into the project directory and unpacks it.
     *
     * @param {function} callback(error, pathToXlt)
     */
    XLT.prototype.downloadXlt = function (callback) {
        var dest = nodePath.join(libDir, 'xlt-' + xltVersion + '.zip');

        deleteFolderRecursive(libDir);
        createDirectory(libDir);

        var file = fs.createWriteStream(dest);
        require('https').get('https://lab.xceptance.de/releases/xlt/' + xltVersion + '/xlt-' + xltVersion + '.zip', function (response) {
            response.pipe(file);
            file.on('finish', function () {
                file.close(function () {
                    var AdmZip = require('adm-zip');
                    new AdmZip(dest).extractAllTo(libDir, true);
                    callback(null, nodePath.join(libDir, 'xlt-' + xltVersion));
                });
            });
        }).on('error', function (error) {
            fs.unlink(dest);
            if (callback) callback(error);
        });
    };

    /**
     * Compiles all test cases one after the other and returns true if all compiled.
     *
     * @return {Boolean}
     */
    XLT.prototype.checkPrerequisites = function () {
        if (!fs.existsSync(nodePath.join(baseDir, pathToXLT))) {
            throw new Error('XLT directory could not be found with the given path');
        } else if (!fs.existsSync(testSrcDir)) {
            console.log(testSrcDir);
            throw new Error('Directory of the java sources could not be found with the given path');
        }
        return true;
    };

    /**
     * Compiles all test cases one after the other and returns true if all compiled.
     *
     * @return {Boolean}
     */
    XLT.prototype.compileAllTestCases = function () {
        createDirectory(testClassesDir);
        var data = '';
        var files = XLT.prototype.findTestCaseJavas();
        for (var file in files) {
            if (files.hasOwnProperty(file)) {
                var rep = nodePath.join(baseDir);
                var name = files[file].replace(rep, '');
                data += name + '\n';
            }
        }
        fs.writeFileSync(sourceFilePath, data);

        var exec = require('child_process').execSync;
        var command = commandPrefix + 'javac -classpath "' + xltLibPath + '" -d ' + targetDir + ' @' + nodePath.join(sourceFileName);
        exec(command);

        deleteFile(sourceFilePath);
        return true;
    };

    /**
     * Compiles a test case with the given path and returns true if it is successful.
     *
     * @param  {String} path
     * @return {Boolean}
     */
    XLT.prototype.compileSingleTestCase = function (path) {
        createDirectory(testClassesDir);
        var exec = require('child_process').execSync;
        var command = commandPrefix + 'javac -classpath "' + xltLibPath + '" -d ' + targetDir + ' ' + path;
        exec(command);
        return true;
    };


    /**
     * Runs all compiled test cases one after the other and returns true if all return true.
     *
     * @param  {Object} [params]
     * @param  {String} [params.xltWebDriver]
     * @param  {Number} [params.xltHeight]
     * @param  {Number} [params.xltWidth]
     * @param  {String} [params.log4jProperties]
     * @return {Boolean}
     */
    XLT.prototype.runAllTestCases = function (params) {
        var result = true;
        var files = XLT.prototype.findTestCaseClasses();
        for (var file in files) {
            if (files.hasOwnProperty(file)) {
                var reg = new RegExp('.*' + targetDir + '\/');
                var name = files[file].replace(reg, '').replace('.class', '').replace(/\//g, '.');
                result = XLT.prototype.runSingleTestCase(name, params) && result;
            }
        }
        return result;
    };

    /**
     * Runs the compiled test case with the given the name including the package (e.g. "java.lang.String") and returns true if it is successful.
     *
     * @param  {String} path
     * @param  {Object} [params]
     * @param  {String} [params.xltWebDriver]
     * @param  {Number} [params.xltWidth]
     * @param  {Number} [params.xltHeight]
     * @param  {String} [params.log4jProperties]
     * @return {Boolean}
     */
    XLT.prototype.runSingleTestCase = function (path, params) {
        var exec = require('child_process').execSync;
        var command = commandPrefix + 'java ' + generateRunParamsString(params) + ' -cp "' + xltLibPath + ':' + targetDir + ':config" org.junit.runner.JUnitCore ' + path;
        console.log(command);
        try {
            var cli = exec(command).toString();
            return /OK \(\d* test\)/.test(cli);
        }
        catch(err)
        {
            return false;
        }
    };

    var maxProcesses = 1;
    var currentProcesses = 0;
    var parallelResult = true;
    var parallelTests = [];

    function resetParallelTestSettings() {
        maxProcesses = 1;
        currentProcesses = 0;
        parallelResult = true;
        parallelTests = [];
    }

    /**
     * Runs all compiled test cases one after the other and returns true if all return true.
     *
     * @param  {Object} [params]
     * @param  {String} [params.xltWebDriver]
     * @param  {Number} [params.xltWidth]
     * @param  {Number} [params.xltHeight]
     * @param  {String} [params.log4jProperties]
     * @param  {Object} [params.patterns]
     * @param  {function} [callback(result)]
     */
    XLT.prototype.runAllTestCasesParallel = function (params, callback) {
        resetParallelTestSettings();
        var testCases = XLT.prototype.findTestCaseClasses();
        for (var testCase in testCases) {
            if (testCases.hasOwnProperty(testCase)) {
                var test = {
                    path: testCases[testCase],
                    params: {
                        xltWebDriver: params ? params.xltWebDriver : null,
                        xltWidth: params ? params.xltWidth : null,
                        xltHeight: params ? params.xltHeight : null,
                        log4jProperties: params ? params.log4jProperties : null
                    }
                };
                if (params && params.patterns) {
                    for (var pattern in params.patterns) {
                        if (params.patterns.hasOwnProperty(pattern)) {
                            if (test.path.match(pattern)) {
                                test.params = params.patterns[pattern];
                            }
                        }
                    }
                }
                parallelTests.push(test);
            }
        }
        maxProcesses = require('os').cpus().length;
        runParallel(callback);
    };

    /**
     * Runs all compiled test cases one after the other and returns true if all return true.
     *
     * @param  {Object[]} testCases
     * @param  {String} [testCases[].path]
     * @param  {Object} [testCases[].params]
     * @param  {String} [testCases[].params.xltWebDriver]
     * @param  {Number} [testCases[].params.xltWidth]
     * @param  {Number} [testCases[].params.xltHeight]
     * @param  {String} [testCases[].params.log4jProperties]
     * @param  {function} [callback(result)]
     */
    XLT.prototype.runTestCasesParallel = function (testCases, callback) {
        resetParallelTestSettings();
        if (testCases) {
            parallelTests = testCases;
        }
        maxProcesses = require('os').cpus().length;
        runParallel(callback);
    };


    function runParallel(callback) {
        if (currentProcesses < maxProcesses && parallelTests.length > 0) {
            while (currentProcesses < maxProcesses && parallelTests.length > 0) {
                var test = parallelTests.pop();
                var reg = new RegExp('.*' + targetDir + '\/');
                var name = test.path.replace(reg, '').replace('.class', '').replace(/\//g, '.');
                XLT.prototype.runSingleTestCaseAsync(name, test.params, function (error, res) {
                    parallelResult = parallelResult && res;
                    currentProcesses--;
                    if (error) {
                        console.log(error);
                    }
                    runParallel(callback)
                });
                currentProcesses++;
            }
        } else {
            if (parallelTests.length == 0 && currentProcesses == 0) {
                if (isFunction(callback)){
                    callback(parallelResult);
                }
            }
        }
    }

    /**
     * Runs the compiled test case with the given the name including the package (e.g. "java.lang.String") and returns true if it is successful.
     *
     * @param  {String} path
     * @param  {Object} [params]
     * @param  {String} [params.xltWebDriver]
     * @param  {Number} [params.xltWidth]
     * @param  {Number} [params.xltHeight]
     * @param  {String} [params.log4jProperties]
     * @param  {function} [callback(result, error)]
     */
    XLT.prototype.runSingleTestCaseAsync = function (path, params, callback) {
        var exec = require('child_process').exec;
        var command = commandPrefix + 'java ' + generateRunParamsString(params) + ' -cp "' + xltLibPath + ':' + targetDir + ':config" org.junit.runner.JUnitCore ' + path;
        exec(command, function (error, stdout, stderr) {
            console.log(command);
            console.log(stdout);
            if (error !== null) {
                console.log('Error: ' + stderr);
                if (isFunction(callback)) {
                    callback(error, false);
                }
            } else {
                if (isFunction(callback)) {
                    callback(null, /OK \(\d* test\)/.test(stdout));
                }
            }
        });
    };

    /**
     * Generates the parameters for the java environment to be added during the run of the test case.
     *
     * @param  {Object} params
     * @param  {String} params.xltWebDriver
     * @param  {Number} params.xltWidth
     * @param  {Number} params.xltHeight
     * @param  {String} params.log4jProperties
     * @return {String}
     */
    function generateRunParamsString(params) {
        var res = '';
        var webDriver = params && params.xltWebDriver ? params.xltWebDriver : xltWebDriver;
        if (webDriver) {
            res += ' -Dxlt.webDriver="' + webDriver + '"';
        }
        var width = params && params.xltWidth ? params.xltWidth : xltWidth;
        if (width) {
            res += ' -Dxlt.webDriver.window.width="' + width + '"';
        }
        var height = params && params.xltHeight ? params.xltHeight : xltHeight;
        if (height) {
            res += ' -Dxlt.webDriver.window.height="' + height + '"';
        }
        var log4jProp = params && params.log4jProperties ? params.log4jProperties : log4jProperties;
        if (log4jProp) {
            res += ' -Dlog4j.configuration="file:' + log4jProp + '"';
        }
        return res;
    }

    /**
     * Searches for files matching the given pattern starting from the given base directory.
     *
     * @param  {String} baseDirectory
     * @param  {String} pattern
     * @return {Array} files
     */
    XLT.prototype.findFilesWithPattern = function (baseDirectory, pattern) {
        if (!baseDirectory) {
            throw new Error('No base directory given.');
        } else if (!pattern) {
            throw new Error('No pattern given.');
        } else {
            return glob.sync(nodePath.join(baseDirectory, pattern));
        }
    };

    /**
     * Searches for test case java files in the base directory.
     *
     * @return {Array} files
     */
    XLT.prototype.findTestCaseJavas = function () {
        return XLT.prototype.findFilesWithPattern(testSrcDir, testCasesJava);
    };

    /**
     * Searches for test case class files in the base directory.
     *
     * @return {Array} files
     */
    XLT.prototype.findTestCaseClasses = function () {
        return XLT.prototype.findFilesWithPattern(testClassesDir, testCasesClass);
    };

    function isFunction(func) {
        return typeof(func) == 'function';
    }

    function createDirectory(path) {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    }

    function deleteFile(path) {
        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
        }
    }

    function deleteFolderRecursive(path) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function (file) {
                var curPath = nodePath.join(path, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    deleteFolderRecursive(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }

    /**
     * Deletes all test case class files path.
     *
     */
    XLT.prototype.deleteAllTestCaseClasses = function () {
        var files = XLT.prototype.findTestCaseClasses();
        for (var file in files) {
            if (files.hasOwnProperty(file)) {
                deleteFile(files[file]);
            }
        }
    };

    /**
     * Deletes all test case class files path.
     *
     */
    XLT.prototype.deleteTestCaseDirectory = function () {
        deleteFolderRecursive(testClassesDir);
    };

    /**
     * Cleans all temporary files and directories.
     *
     * @param {Boolean} [excludeXlt]
     */
    XLT.prototype.clean = function (excludeXlt) {
        XLT.prototype.deleteTestCaseDirectory();
        deleteFile(sourceFilePath);
        if (excludeXlt !== true) {
            deleteFolderRecursive(libDir);
        }
        deleteFolderRecursive(nodePath.join(baseDir, 'results'));
    };

    /**
     * Cleans all temporary files and directories.
     *
     * @param {function} callback()
     */
    XLT.prototype.complete = function (callback) {
        XLT.prototype.javaVersion(function (err, vers) {
            if (vers && parseFloat(vers)) {
                if (XLT.prototype.checkPrerequisites()) {
                    XLT.prototype.clean(true);
                    XLT.prototype.compileAllTestCases();
                    XLT.prototype.runAllTestCases();
                    callback();
                }
            }
        });
    }
};

module.exports = new XLT();
