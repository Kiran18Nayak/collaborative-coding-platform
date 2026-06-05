// Demo Test File for Enhanced Debugger Testing Tab
// This file contains sample tests for demonstration purposes

// Test Suite: Basic Math Functions
function testMathFunctions() {
    // Test addition
    function testAddition() {
        const result = 2 + 2;
        if (result !== 4) {
            throw new Error(`Expected 2 + 2 to equal 4, but got ${result}`);
        }
        return true;
    }
    
    // Test subtraction
    function testSubtraction() {
        const result = 5 - 3;
        if (result !== 2) {
            throw new Error(`Expected 5 - 3 to equal 2, but got ${result}`);
        }
        return true;
    }
    
    // Test multiplication
    function testMultiplication() {
        const result = 3 * 4;
        if (result !== 12) {
            throw new Error(`Expected 3 * 4 to equal 12, but got ${result}`);
        }
        return true;
    }
    
    // Test division
    function testDivision() {
        const result = 10 / 2;
        if (result !== 5) {
            throw new Error(`Expected 10 / 2 to equal 5, but got ${result}`);
        }
        return true;
    }
    
    // Run all tests in this suite
    testAddition();
    testSubtraction();
    testMultiplication();
    testDivision();
    
    console.log('All math function tests passed!');
}

// Test Suite: String Operations
function testStringOperations() {
    // Test string concatenation
    function testConcatenation() {
        const result = 'Hello' + ' ' + 'World';
        if (result !== 'Hello World') {
            throw new Error(`Expected 'Hello' + ' ' + 'World' to equal 'Hello World', but got '${result}'`);
        }
        return true;
    }
    
    // Test string length
    function testLength() {
        const str = 'JavaScript';
        if (str.length !== 10) {
            throw new Error(`Expected 'JavaScript'.length to equal 10, but got ${str.length}`);
        }
        return true;
    }
    
    // Test string uppercase
    function testUppercase() {
        const result = 'hello'.toUpperCase();
        if (result !== 'HELLO') {
            throw new Error(`Expected 'hello'.toUpperCase() to equal 'HELLO', but got '${result}'`);
        }
        return true;
    }
    
    // Run all tests in this suite
    testConcatenation();
    testLength();
    testUppercase();
    
    console.log('All string operation tests passed!');
}

// Test Suite: Array Operations
function testArrayOperations() {
    // Test array push
    function testPush() {
        const arr = [1, 2, 3];
        arr.push(4);
        if (arr.length !== 4 || arr[3] !== 4) {
            throw new Error(`Expected [1,2,3].push(4) to result in [1,2,3,4], but got [${arr}]`);
        }
        return true;
    }
    
    // Test array map
    function testMap() {
        const arr = [1, 2, 3];
        const result = arr.map(x => x * 2);
        if (result.length !== 3 || result[0] !== 2 || result[1] !== 4 || result[2] !== 6) {
            throw new Error(`Expected [1,2,3].map(x => x * 2) to equal [2,4,6], but got [${result}]`);
        }
        return true;
    }
    
    // Test array filter
    function testFilter() {
        const arr = [1, 2, 3, 4, 5];
        const result = arr.filter(x => x % 2 === 0);
        if (result.length !== 2 || result[0] !== 2 || result[1] !== 4) {
            throw new Error(`Expected [1,2,3,4,5].filter(x => x % 2 === 0) to equal [2,4], but got [${result}]`);
        }
        return true;
    }
    
    // Run all tests in this suite
    testPush();
    testMap();
    testFilter();
    
    console.log('All array operation tests passed!');
}

// Run all test suites
function runAllTests() {
    try {
        testMathFunctions();
        testStringOperations();
        testArrayOperations();
        console.log('All tests passed successfully!');
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

// Uncomment to run tests
// runAllTests();