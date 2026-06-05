// Code Quality Analyzer Service
const { analyzeComplexity, analyzeMaintainability, analyzeReadability } = require('./codeAnalysis');

class QualityAnalyzer {
    async analyzeCodeQuality(code, language, fileName) {
        try {
            const lines = code.split('\n');
            const linesOfCode = lines.filter(line => line.trim().length > 0).length;
            
            // Analyze different aspects of code quality
            const complexity = await analyzeComplexity(code, language);
            const maintainability = await analyzeMaintainability(code, language);
            const readability = await analyzeReadability(code, language);
            
            // Calculate cyclomatic complexity
            const cyclomaticComplexity = this.calculateCyclomaticComplexity(code, language);
            
            // Detect code duplication
            const codeDuplication = this.detectCodeDuplication(code);
            
            // Generate issues and suggestions
            const issues = this.generateIssues(code, language);
            const suggestions = this.generateSuggestions(code, language);
            
            return {
                complexity: Math.round(complexity),
                maintainability: Math.round(maintainability),
                readability: Math.round(readability),
                linesOfCode,
                cyclomaticComplexity,
                codeDuplication: Math.round(codeDuplication),
                testCoverage: 0, // Placeholder - would integrate with test runner
                issues,
                suggestions
            };
        } catch (error) {
            console.error('Error analyzing code quality:', error);
            return this.getDefaultMetrics();
        }
    }
    
    calculateCyclomaticComplexity(code, language) {
        // Simplified cyclomatic complexity calculation
        const complexityKeywords = {
            javascript: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', '&&', '||', '?'],
            python: ['if', 'elif', 'else', 'for', 'while', 'try', 'except', 'and', 'or'],
            java: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', '&&', '||', '?'],
            cpp: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', '&&', '||', '?']
        };
        
        const keywords = complexityKeywords[language] || complexityKeywords.javascript;
        let complexity = 1; // Base complexity
        
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = code.match(regex);
            if (matches) {
                complexity += matches.length;
            }
        });
        
        return complexity;
    }
    
    detectCodeDuplication(code) {
        // Simplified code duplication detection
        const lines = code.split('\n').filter(line => line.trim().length > 0);
        const lineCounts = {};
        let duplicateLines = 0;
        
        lines.forEach(line => {
            const normalizedLine = line.trim().toLowerCase();
            if (normalizedLine.length > 10) { // Only consider meaningful lines
                lineCounts[normalizedLine] = (lineCounts[normalizedLine] || 0) + 1;
                if (lineCounts[normalizedLine] > 1) {
                    duplicateLines++;
                }
            }
        });
        
        return (duplicateLines / lines.length) * 100;
    }
    
    generateIssues(code, language) {
        const issues = [];
        const lines = code.split('\n');
        
        lines.forEach((line, index) => {
            const lineNumber = index + 1;
            
            // Check for common issues
            if (line.includes('console.log') && !line.includes('//')) {
                issues.push({
                    type: 'warning',
                    message: 'Console.log statement found - consider removing for production',
                    line: lineNumber,
                    column: line.indexOf('console.log') + 1,
                    rule: 'no-console'
                });
            }
            
            if (line.length > 120) {
                issues.push({
                    type: 'warning',
                    message: 'Line too long - consider breaking into multiple lines',
                    line: lineNumber,
                    column: 121,
                    rule: 'max-len'
                });
            }
            
            if (line.includes('var ') && language === 'javascript') {
                issues.push({
                    type: 'warning',
                    message: 'Use let or const instead of var',
                    line: lineNumber,
                    column: line.indexOf('var') + 1,
                    rule: 'no-var'
                });
            }
            
            if (line.includes('==') && !line.includes('===')) {
                issues.push({
                    type: 'warning',
                    message: 'Use strict equality (===) instead of loose equality (==)',
                    line: lineNumber,
                    column: line.indexOf('==') + 1,
                    rule: 'eqeqeq'
                });
            }
        });
        
        return issues;
    }
    
    generateSuggestions(code, language) {
        const suggestions = [];
        const lines = code.split('\n');
        
        // Check for missing comments
        const functionLines = lines.filter(line => 
            line.includes('function') || line.includes('def ') || line.includes('public ')
        );
        
        if (functionLines.length > 0 && !code.includes('/**') && !code.includes('"""')) {
            suggestions.push({
                type: 'Add documentation',
                message: 'Consider adding JSDoc or docstring comments for functions',
                line: 1,
                priority: 'medium'
            });
        }
        
        // Check for error handling
        if (code.includes('fetch(') && !code.includes('catch')) {
            suggestions.push({
                type: 'Add error handling',
                message: 'Consider adding try-catch blocks for async operations',
                line: lines.findIndex(line => line.includes('fetch(')) + 1,
                priority: 'high'
            });
        }
        
        // Check for performance optimizations
        if (code.includes('for(') && code.includes('length')) {
            suggestions.push({
                type: 'Performance optimization',
                message: 'Consider caching array length in for loops',
                line: lines.findIndex(line => line.includes('for(')) + 1,
                priority: 'low'
            });
        }
        
        return suggestions;
    }
    
    getDefaultMetrics() {
        return {
            complexity: 50,
            maintainability: 50,
            readability: 50,
            linesOfCode: 0,
            cyclomaticComplexity: 1,
            codeDuplication: 0,
            testCoverage: 0,
            issues: [],
            suggestions: []
        };
    }
}

// Helper functions for code analysis
async function analyzeComplexity(code, language) {
    // Simplified complexity analysis
    const lines = code.split('\n').length;
    const functions = (code.match(/function|def|class/g) || []).length;
    const conditionals = (code.match(/if|else|switch|case/g) || []).length;
    const loops = (code.match(/for|while|do/g) || []).length;
    
    // Calculate complexity score (0-100, lower is better)
    const complexity = Math.min(100, (functions * 10 + conditionals * 5 + loops * 3 + lines * 0.1));
    return Math.max(0, 100 - complexity);
}

async function analyzeMaintainability(code, language) {
    // Simplified maintainability analysis
    const lines = code.split('\n').length;
    const functions = (code.match(/function|def|class/g) || []).length;
    const comments = (code.match(/\/\/|\/\*|\*\/|#|"""/g) || []).length;
    
    // Calculate maintainability score (0-100, higher is better)
    const commentRatio = comments / lines;
    const functionSize = lines / Math.max(1, functions);
    
    let maintainability = 100;
    maintainability -= Math.min(50, functionSize * 2); // Penalize large functions
    maintainability += Math.min(30, commentRatio * 100); // Reward comments
    maintainability -= Math.min(20, lines * 0.1); // Penalize very long files
    
    return Math.max(0, Math.min(100, maintainability));
}

async function analyzeReadability(code, language) {
    // Simplified readability analysis
    const lines = code.split('\n');
    let readability = 100;
    
    lines.forEach(line => {
        // Penalize very long lines
        if (line.length > 120) {
            readability -= 2;
        }
        
        // Penalize lines without proper indentation
        if (line.trim().length > 0 && !line.startsWith(' ') && !line.startsWith('\t') && 
            (line.includes('{') || line.includes('}') || line.includes(':'))) {
            readability -= 1;
        }
        
        // Penalize lines with too many operators
        const operators = (line.match(/[+\-*/=<>!&|]/g) || []).length;
        if (operators > 5) {
            readability -= 3;
        }
    });
    
    return Math.max(0, Math.min(100, readability));
}

module.exports = new QualityAnalyzer();
