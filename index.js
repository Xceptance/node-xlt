'use strict';

var glob = require('glob');
var fs = require('fs');
var nodePath = require('path');

var XLT = function () {

    var baseDir = './';
    var testSrcDir = nodePath.join(baseDir, 'src');
    var targetDir = 'classes';
    var testClassesDir = nodePath.join(baseDir, targetDir);
    var testCasesJava = '**/T*.java';
    var testCasesClass = '**/T*.class';
    var xltLibDir = 'lib/*';
    var pathToXLT = '../XLT-4.5.3';
    var xltLibPath = nodePath.join(pathToXLT , xltLibDir);
    var log4jProperties = 'config/js-log4j.properties';
    var pathToScriptDir = '';
    var commandPrefix = '';
    var xltWebDriver;
    var fName = 'sources.txt';

    /**
     * Generates the parameters for the java environment to be added during the run of the test case.
     *
     * @param  {Object} options
     * @param  {String} options.baseDir
     * @param  {String} options.pathToXLT
     * @param  {String} options.testSrcDir
     * @param  {String} options.testClassesDir
     * @param  {String} options.testCasesJava
     * @param  {String} options.testCasesClass
     * @param  {String} options.log4jProperties
     * @param  {String} options.xltWebDriver
     * @param  {String} options.commandPrefix
     * @param  {String} options.pathToScriptDir
     */
    XLT.prototype.setOptions = function (options) {
        if (options) {
            baseDir = options.baseDir || baseDir;
            pathToXLT =  options.pathToXLT ? options.pathToXLT : pathToXLT;
            xltLibPath = options.pathToXLT ? nodePath.join(pathToXLT , xltLibDir) : xltLibPath;
            testSrcDir = options.testSrcDir ? nodePath.join(baseDir, options.testSrcDir) : testSrcDir;
            testClassesDir = options.testClassesDir ? nodePath.join(baseDir, options.testClassesDir) : testClassesDir;
            testCasesJava = options.testCasesJava || testCasesJava;
            testCasesClass = options.testCasesClass || testCasesClass;
            log4jProperties = options.log4jProperties || log4jProperties;
            commandPrefix = options.commandPrefix ?  options.commandPrefix : commandPrefix;
            pathToScriptDir = options.pathToScriptDir ?  options.pathToScriptDir : pathToScriptDir;
            xltWebDriver = options.xltWebDriver;
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
     * Compiles all test cases one after the other and returns true if all compiled.
     *
     * @return {Boolean}
     */
    XLT.prototype.checkPrerequisites = function () {
        if(!fs.existsSync(nodePath.join( baseDir,pathToXLT))){
            throw new Error('XLT directory could not be found with the given path');
        } else if(!fs.existsSync(testSrcDir)){
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

        var data = '';
        var files = XLT.prototype.findTestCaseJavas();
        for (var file in files) {
            if (files.hasOwnProperty(file)) {
                var rep = nodePath.join(baseDir);
                var name = files[file].replace( rep, '');
                data += name + '\n';
            }
        }
        fs.writeFileSync(nodePath.join(baseDir, fName), data);

        var exec = require('child_process').execSync;
        var command =  commandPrefix + 'javac -classpath "'+xltLibPath+'" -d ' + targetDir + ' @' + nodePath.join( fName );
        exec(command);

        deleteFile(nodePath.join(baseDir, fName));
        return true;
    };

    /**
     * Compiles a test case with the given path and returns true if it is successful.
     *
     * @param  {String} path
     * @return {Boolean}
     */
    XLT.prototype.compileSingleTestCase = function (path) {
        var exec = require('child_process').execSync;
        var command =  commandPrefix + 'javac -classpath "'+xltLibPath+'" -d ' + targetDir + ' ' + path;
        exec(command);
        return true;
    };


    /**
     * Runs all compiled test cases one after the other and returns true if all return true.
     *
     * @param  {Object} [params]
     * @param  {String} [params.xltWebDriver]
     * @param  {String} [params.log4jProperties]
     * @return {Boolean}
     */
    XLT.prototype.runAllTestCases = function (params) {
        var result = true;
        var files = XLT.prototype.findTestCaseClasses();
        for (var file in files) {
            if (files.hasOwnProperty(file)) {
                var reg = new RegExp('.*'+ targetDir +'\/');
                var name = files[file].replace(reg, '').replace('.class', '').replace(/\//g, '.');
                result = result && XLT.prototype.runSingleTestCase(name, params);
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
     * @param  {String} [params.log4jProperties]
     * @return {Boolean}
     */
    XLT.prototype.runSingleTestCase = function (path, params) {
        var exec = require('child_process').execSync;
        var command = commandPrefix + 'java ' + generateRunParamsString(params) + ' -cp "'+xltLibPath+':'+targetDir+':config" org.junit.runner.JUnitCore ' + path;
        console.log(command);
        var cli = exec(command).toString();
        return /OK \(\d* test\)/.test(cli);
    };

    /**
     * Generates the parameters for the java environment to be added during the run of the test case.
     *
     * @param  {Object} params
     * @param  {String} params.xltWebDriver
     * @param  {String} params.log4jProperties
     * @return {String}
     */
    function generateRunParamsString(params) {
        var res = '';
        var webDriver = params && params.xltWebDriver ? params.xltWebDriver : xltWebDriver;
        if (webDriver) {
            res += ' -Dxlt.webDriver="' + webDriver + '"';
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
            return glob.sync(baseDirectory + pattern);
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

    /**
     * Deletes a file with the given path.
     *
     * @param  {String} path
     */
    function deleteFile(path) {
        fs.unlinkSync(path);
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
        fs.mkdirSync(testClassesDir);
    };

    XLT.prototype.clean = function () {
        this.deleteTestCaseDirectory();
        //this.deleteFile()
    }
};

module.exports = new XLT();
