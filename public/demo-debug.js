// Demo file for testing Enhanced Debugging Features
// This file demonstrates various debugging scenarios

function calculateSum(a, b) {
    // Set breakpoint here to test step-into
    const result = a + b;
    return result;
}

function processUserData(user) {
    // Set breakpoint here to test object inspection
    const processedUser = {
        id: user.id,
        name: user.name.toUpperCase(),
        email: user.email.toLowerCase(),
        isActive: user.status === 'active'
    };
    
    // Set breakpoint here to test watch expressions
    const validationResult = validateUser(processedUser);
    
    return {
        user: processedUser,
        isValid: validationResult
    };
}

function validateUser(user) {
    // Set breakpoint here to test call stack navigation
    const errors = [];
    
    if (!user.name || user.name.length < 2) {
        errors.push('Name must be at least 2 characters');
    }
    
    if (!user.email || !user.email.includes('@')) {
        errors.push('Valid email is required');
    }
    
    return errors.length === 0;
}

function main() {
    // Set breakpoint here to start debugging
    console.log('Starting demo debugging session...');
    
    // Test basic calculation
    const sum = calculateSum(10, 20);
    console.log('Sum:', sum);
    
    // Test object processing
    const userData = {
        id: 1,
        name: 'john doe',
        email: 'JOHN@EXAMPLE.COM',
        status: 'active'
    };
    
    const result = processUserData(userData);
    console.log('Processed user:', result);
    
    // Test array processing
    const numbers = [1, 2, 3, 4, 5];
    const doubled = numbers.map(n => n * 2);
    console.log('Doubled numbers:', doubled);
    
    // Test nested function calls
    const complexResult = processComplexData({
        users: [userData],
        settings: { theme: 'dark', notifications: true }
    });
    
    console.log('Complex result:', complexResult);
}

function processComplexData(data) {
    // Set breakpoint here to test complex object inspection
    const processed = {
        userCount: data.users.length,
        hasSettings: !!data.settings,
        theme: data.settings?.theme || 'light'
    };
    
    // Test conditional breakpoint: set condition "processed.userCount > 0"
    if (processed.userCount > 0) {
        processed.firstUser = data.users[0];
    }
    
    return processed;
}

// Sample data for testing
const sampleData = {
    users: [
        { id: 1, name: 'Alice', email: 'alice@example.com', status: 'active' },
        { id: 2, name: 'Bob', email: 'bob@example.com', status: 'inactive' },
        { id: 3, name: 'Charlie', email: 'charlie@example.com', status: 'active' }
    ],
    settings: {
        theme: 'dark',
        notifications: true,
        language: 'en'
    }
};

// Uncomment to run the demo
// main();
