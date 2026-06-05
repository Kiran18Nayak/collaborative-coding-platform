/**
 * AI Code Assistant API Endpoints
 * Handles requests for code suggestions, reviews, explanations, and refactoring
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Load configuration
let config = {};
try {
    const configPath = path.join(__dirname, '../config.json');
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (error) {
    console.error('Error loading config:', error);
}

// Default AI provider settings
const DEFAULT_AI_PROVIDER = config.aiProvider || 'openai';
const DEFAULT_MODEL = config.aiModel || 'gpt-3.5-turbo';

// Middleware to verify API key
const verifyApiKey = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'API key is required' });
    }
    
    const apiKey = authHeader.split(' ')[1];
    if (!apiKey) {
        return res.status(401).json({ error: 'Invalid API key format' });
    }
    
    // Store the API key for use in the route handlers
    req.apiKey = apiKey;
    next();
};

/**
 * Generate code suggestions based on current code and cursor position
 */
router.post('/suggest', verifyApiKey, async (req, res) => {
    try {
        const { code, language, cursorPosition, prefix } = req.body;
        
        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }
        
        // Determine which AI provider to use
        const provider = req.query.provider || DEFAULT_AI_PROVIDER;
        const model = req.query.model || DEFAULT_MODEL;
        
        // Generate suggestions using the appropriate provider
        let suggestions;
        switch (provider.toLowerCase()) {
            case 'openai':
                suggestions = await getOpenAISuggestions(req.apiKey, code, language, cursorPosition, prefix, model);
                break;
            case 'anthropic':
                suggestions = await getAnthropicSuggestions(req.apiKey, code, language, cursorPosition, prefix, model);
                break;
            case 'github':
                suggestions = await getGitHubCopilotSuggestions(req.apiKey, code, language, cursorPosition, prefix);
                break;
            default:
                return res.status(400).json({ error: `Unsupported AI provider: ${provider}` });
        }
        
        res.json({ suggestions });
    } catch (error) {
        console.error('Error generating suggestions:', error);
        res.status(500).json({ error: error.message || 'Failed to generate suggestions' });
    }
});

/**
 * Review code for issues and improvement suggestions
 */
router.post('/review', verifyApiKey, async (req, res) => {
    try {
        const { code, language, fileName } = req.body;
        
        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }
        
        // Determine which AI provider to use
        const provider = req.query.provider || DEFAULT_AI_PROVIDER;
        const model = req.query.model || DEFAULT_MODEL;
        
        // Generate code review using the appropriate provider
        let review;
        switch (provider.toLowerCase()) {
            case 'openai':
                review = await getOpenAICodeReview(req.apiKey, code, language, fileName, model);
                break;
            case 'anthropic':
                review = await getAnthropicCodeReview(req.apiKey, code, language, fileName, model);
                break;
            default:
                return res.status(400).json({ error: `Unsupported AI provider: ${provider}` });
        }
        
        res.json({ review });
    } catch (error) {
        console.error('Error reviewing code:', error);
        res.status(500).json({ error: error.message || 'Failed to review code' });
    }
});

/**
 * Explain selected code
 */
router.post('/explain', verifyApiKey, async (req, res) => {
    try {
        const { code, language, fileName } = req.body;
        
        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }
        
        // Determine which AI provider to use
        const provider = req.query.provider || DEFAULT_AI_PROVIDER;
        const model = req.query.model || DEFAULT_MODEL;
        
        // Generate code explanation using the appropriate provider
        let explanation;
        switch (provider.toLowerCase()) {
            case 'openai':
                explanation = await getOpenAICodeExplanation(req.apiKey, code, language, fileName, model);
                break;
            case 'anthropic':
                explanation = await getAnthropicCodeExplanation(req.apiKey, code, language, fileName, model);
                break;
            default:
                return res.status(400).json({ error: `Unsupported AI provider: ${provider}` });
        }
        
        res.json({ explanation });
    } catch (error) {
        console.error('Error explaining code:', error);
        res.status(500).json({ error: error.message || 'Failed to explain code' });
    }
});

/**
 * Suggest code refactoring
 */
router.post('/refactor', verifyApiKey, async (req, res) => {
    try {
        const { code, language, fileName } = req.body;
        
        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }
        
        // Determine which AI provider to use
        const provider = req.query.provider || DEFAULT_AI_PROVIDER;
        const model = req.query.model || DEFAULT_MODEL;
        
        // Generate refactoring suggestions using the appropriate provider
        let refactorings;
        switch (provider.toLowerCase()) {
            case 'openai':
                refactorings = await getOpenAIRefactoringSuggestions(req.apiKey, code, language, fileName, model);
                break;
            case 'anthropic':
                refactorings = await getAnthropicRefactoringSuggestions(req.apiKey, code, language, fileName, model);
                break;
            default:
                return res.status(400).json({ error: `Unsupported AI provider: ${provider}` });
        }
        
        res.json({ refactorings });
    } catch (error) {
        console.error('Error generating refactoring suggestions:', error);
        res.status(500).json({ error: error.message || 'Failed to generate refactoring suggestions' });
    }
});

/**
 * OpenAI API integration for code suggestions
 */
async function getOpenAISuggestions(apiKey, code, language, cursorPosition, prefix, model = 'gpt-3.5-turbo') {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: `You are an AI code assistant that provides code suggestions. The user is writing code in ${language}. They have typed up to a certain point and need suggestions for what to write next. Provide 3 different suggestions that are relevant and helpful. Format your response as a JSON array of objects, where each object has 'type' (e.g., 'completion', 'function', 'import') and 'code' (the suggested code).`
                },
                {
                    role: 'user',
                    content: `I'm writing code in ${language}. Here's what I have so far:\n\n${code}\n\nMy cursor is at line ${cursorPosition.lineNumber}, column ${cursorPosition.column}. The text up to my cursor is:\n\n${prefix}\n\nProvide 3 different suggestions for what I might want to write next.`
                }
            ],
            temperature: 0.3,
            max_tokens: 500
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Parse the response to extract suggestions
        const content = response.data.choices[0].message.content;
        let suggestions;
        
        try {
            // Try to parse as JSON directly
            suggestions = JSON.parse(content);
        } catch (error) {
            // If direct parsing fails, try to extract JSON from the text
            const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
            if (jsonMatch) {
                suggestions = JSON.parse(jsonMatch[0]);
            } else {
                // If no JSON found, create a simple suggestion from the text
                suggestions = [{
                    type: 'completion',
                    code: content.replace(/```[\w]*\n|```/g, '').trim()
                }];
            }
        }
        
        // Add range information for each suggestion
        return suggestions.map(suggestion => ({
            ...suggestion,
            range: {
                startLineNumber: cursorPosition.lineNumber,
                startColumn: cursorPosition.column,
                endLineNumber: cursorPosition.lineNumber,
                endColumn: cursorPosition.column
            }
        }));
    } catch (error) {
        console.error('OpenAI API error:', error.response?.data || error.message);
        throw new Error('Failed to get suggestions from OpenAI');
    }
}

/**
 * OpenAI API integration for code review
 */
async function getOpenAICodeReview(apiKey, code, language, fileName, model = 'gpt-3.5-turbo') {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: `You are an expert code reviewer. Analyze the provided ${language} code for issues, bugs, and improvement opportunities. Format your response as a JSON object with the following structure:
{
  "issues": [
    {
      "severity": "high|medium|low",
      "description": "Description of the issue",
      "line": line_number,
      "code": "problematic code snippet",
      "fix": "suggested fix",
      "location": "file and line information"
    }
  ],
  "suggestions": [
    {
      "type": "improvement|optimization|style|security",
      "description": "Description of the suggestion",
      "line": line_number,
      "before": "original code",
      "after": "improved code",
      "location": "file and line information"
    }
  ],
  "score": 0-100,
  "summary": "Brief summary of the review"
}`
                },
                {
                    role: 'user',
                    content: `Please review this ${language} code from file ${fileName || 'unknown'}:\n\n${code}`
                }
            ],
            temperature: 0.3,
            max_tokens: 1500
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Parse the response to extract review
        const content = response.data.choices[0].message.content;
        let review;
        
        try {
            // Try to parse as JSON directly
            review = JSON.parse(content);
        } catch (error) {
            // If direct parsing fails, try to extract JSON from the text
            const jsonMatch = content.match(/\{\s*"issues".*\}\s*$/s);
            if (jsonMatch) {
                review = JSON.parse(jsonMatch[0]);
            } else {
                // If no JSON found, create a simple review from the text
                review = {
                    issues: [],
                    suggestions: [],
                    score: 0,
                    summary: content
                };
            }
        }
        
        return review;
    } catch (error) {
        console.error('OpenAI API error:', error.response?.data || error.message);
        throw new Error('Failed to get code review from OpenAI');
    }
}

/**
 * OpenAI API integration for code explanation
 */
async function getOpenAICodeExplanation(apiKey, code, language, fileName, model = 'gpt-3.5-turbo') {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: `You are an expert programmer explaining code to others. Provide a clear, concise explanation of the provided ${language} code. Break down complex parts, explain the purpose, and highlight any important patterns or techniques used. Format your response as HTML that can be directly inserted into a web page.`
                },
                {
                    role: 'user',
                    content: `Please explain this ${language} code snippet from file ${fileName || 'unknown'}:\n\n${code}`
                }
            ],
            temperature: 0.3,
            max_tokens: 1000
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Extract the explanation from the response
        const content = response.data.choices[0].message.content;
        
        // Check if the content is HTML
        const isHTML = /<[a-z][\s\S]*>/i.test(content);
        
        return {
            html: isHTML ? content : `<p>${content.replace(/\n/g, '</p><p>')}</p>`,
            text: content
        };
    } catch (error) {
        console.error('OpenAI API error:', error.response?.data || error.message);
        throw new Error('Failed to get code explanation from OpenAI');
    }
}

/**
 * OpenAI API integration for refactoring suggestions
 */
async function getOpenAIRefactoringSuggestions(apiKey, code, language, fileName, model = 'gpt-3.5-turbo') {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: `You are an expert in code refactoring. Analyze the provided ${language} code and suggest improvements that make the code more maintainable, efficient, and readable. Format your response as a JSON array of refactoring suggestions, where each suggestion has the following structure:
{
  "type": "extract_method|rename_variable|simplify_logic|etc",
  "description": "Description of the refactoring",
  "location": "file and line information",
  "line": line_number,
  "startLine": start_line_number,
  "endLine": end_line_number,
  "originalCode": "code before refactoring",
  "refactoredCode": "code after refactoring",
  "benefits": ["list", "of", "benefits"]
}`
                },
                {
                    role: 'user',
                    content: `Please suggest refactoring improvements for this ${language} code from file ${fileName || 'unknown'}:\n\n${code}`
                }
            ],
            temperature: 0.3,
            max_tokens: 1500
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Parse the response to extract refactoring suggestions
        const content = response.data.choices[0].message.content;
        let refactorings;
        
        try {
            // Try to parse as JSON directly
            refactorings = JSON.parse(content);
        } catch (error) {
            // If direct parsing fails, try to extract JSON from the text
            const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
            if (jsonMatch) {
                refactorings = JSON.parse(jsonMatch[0]);
            } else {
                // If no JSON found, create a simple refactoring from the text
                refactorings = [{
                    type: 'general',
                    description: content,
                    benefits: ['Improved code quality']
                }];
            }
        }
        
        return Array.isArray(refactorings) ? refactorings : [refactorings];
    } catch (error) {
        console.error('OpenAI API error:', error.response?.data || error.message);
        throw new Error('Failed to get refactoring suggestions from OpenAI');
    }
}

/**
 * Anthropic API integration for code suggestions
 */
async function getAnthropicSuggestions(apiKey, code, language, cursorPosition, prefix, model = 'claude-2') {
    try {
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: model,
            max_tokens: 500,
            messages: [
                {
                    role: 'user',
                    content: `I'm writing code in ${language}. Here's what I have so far:\n\n${code}\n\nMy cursor is at line ${cursorPosition.lineNumber}, column ${cursorPosition.column}. The text up to my cursor is:\n\n${prefix}\n\nProvide 3 different suggestions for what I might want to write next. Format your response as a JSON array of objects, where each object has 'type' (e.g., 'completion', 'function', 'import') and 'code' (the suggested code).`
                }
            ],
            temperature: 0.3
        }, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            }
        });
        
        // Parse the response to extract suggestions
        const content = response.data.content[0].text;
        let suggestions;
        
        try {
            // Try to parse as JSON directly
            suggestions = JSON.parse(content);
        } catch (error) {
            // If direct parsing fails, try to extract JSON from the text
            const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
            if (jsonMatch) {
                suggestions = JSON.parse(jsonMatch[0]);
            } else {
                // If no JSON found, create a simple suggestion from the text
                suggestions = [{
                    type: 'completion',
                    code: content.replace(/```[\w]*\n|```/g, '').trim()
                }];
            }
        }
        
        // Add range information for each suggestion
        return suggestions.map(suggestion => ({
            ...suggestion,
            range: {
                startLineNumber: cursorPosition.lineNumber,
                startColumn: cursorPosition.column,
                endLineNumber: cursorPosition.lineNumber,
                endColumn: cursorPosition.column
            }
        }));
    } catch (error) {
        console.error('Anthropic API error:', error.response?.data || error.message);
        throw new Error('Failed to get suggestions from Anthropic');
    }
}

/**
 * Anthropic API integration for code review
 */
async function getAnthropicCodeReview(apiKey, code, language, fileName, model = 'claude-2') {
    try {
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: model,
            max_tokens: 1500,
            messages: [
                {
                    role: 'user',
                    content: `You are an expert code reviewer. Analyze the provided ${language} code for issues, bugs, and improvement opportunities. Format your response as a JSON object with the following structure:
{
  "issues": [
    {
      "severity": "high|medium|low",
      "description": "Description of the issue",
      "line": line_number,
      "code": "problematic code snippet",
      "fix": "suggested fix",
      "location": "file and line information"
    }
  ],
  "suggestions": [
    {
      "type": "improvement|optimization|style|security",
      "description": "Description of the suggestion",
      "line": line_number,
      "before": "original code",
      "after": "improved code",
      "location": "file and line information"
    }
  ],
  "score": 0-100,
  "summary": "Brief summary of the review"
}

Please review this ${language} code from file ${fileName || 'unknown'}:\n\n${code}`
                }
            ],
            temperature: 0.3
        }, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            }
        });
        
        // Parse the response to extract review
        const content = response.data.content[0].text;
        let review;
        
        try {
            // Try to parse as JSON directly
            review = JSON.parse(content);
        } catch (error) {
            // If direct parsing fails, try to extract JSON from the text
            const jsonMatch = content.match(/\{\s*"issues".*\}\s*$/s);
            if (jsonMatch) {
                review = JSON.parse(jsonMatch[0]);
            } else {
                // If no JSON found, create a simple review from the text
                review = {
                    issues: [],
                    suggestions: [],
                    score: 0,
                    summary: content
                };
            }
        }
        
        return review;
    } catch (error) {
        console.error('Anthropic API error:', error.response?.data || error.message);
        throw new Error('Failed to get code review from Anthropic');
    }
}

/**
 * Anthropic API integration for code explanation
 */
async function getAnthropicCodeExplanation(apiKey, code, language, fileName, model = 'claude-2') {
    try {
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: model,
            max_tokens: 1000,
            messages: [
                {
                    role: 'user',
                    content: `You are an expert programmer explaining code to others. Provide a clear, concise explanation of the provided ${language} code. Break down complex parts, explain the purpose, and highlight any important patterns or techniques used. Format your response as HTML that can be directly inserted into a web page.

Please explain this ${language} code snippet from file ${fileName || 'unknown'}:\n\n${code}`
                }
            ],
            temperature: 0.3
        }, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            }
        });
        
        // Extract the explanation from the response
        const content = response.data.content[0].text;
        
        // Check if the content is HTML
        const isHTML = /<[a-z][\s\S]*>/i.test(content);
        
        return {
            html: isHTML ? content : `<p>${content.replace(/\n/g, '</p><p>')}</p>`,
            text: content
        };
    } catch (error) {
        console.error('Anthropic API error:', error.response?.data || error.message);
        throw new Error('Failed to get code explanation from Anthropic');
    }
}

/**
 * Anthropic API integration for refactoring suggestions
 */
async function getAnthropicRefactoringSuggestions(apiKey, code, language, fileName, model = 'claude-2') {
    try {
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: model,
            max_tokens: 1500,
            messages: [
                {
                    role: 'user',
                    content: `You are an expert in code refactoring. Analyze the provided ${language} code and suggest improvements that make the code more maintainable, efficient, and readable. Format your response as a JSON array of refactoring suggestions, where each suggestion has the following structure:
{
  "type": "extract_method|rename_variable|simplify_logic|etc",
  "description": "Description of the refactoring",
  "location": "file and line information",
  "line": line_number,
  "startLine": start_line_number,
  "endLine": end_line_number,
  "originalCode": "code before refactoring",
  "refactoredCode": "code after refactoring",
  "benefits": ["list", "of", "benefits"]
}

Please suggest refactoring improvements for this ${language} code from file ${fileName || 'unknown'}:\n\n${code}`
                }
            ],
            temperature: 0.3
        }, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            }
        });
        
        // Parse the response to extract refactoring suggestions
        const content = response.data.content[0].text;
        let refactorings;
        
        try {
            // Try to parse as JSON directly
            refactorings = JSON.parse(content);
        } catch (error) {
            // If direct parsing fails, try to extract JSON from the text
            const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
            if (jsonMatch) {
                refactorings = JSON.parse(jsonMatch[0]);
            } else {
                // If no JSON found, create a simple refactoring from the text
                refactorings = [{
                    type: 'general',
                    description: content,
                    benefits: ['Improved code quality']
                }];
            }
        }
        
        return Array.isArray(refactorings) ? refactorings : [refactorings];
    } catch (error) {
        console.error('Anthropic API error:', error.response?.data || error.message);
        throw new Error('Failed to get refactoring suggestions from Anthropic');
    }
}

/**
 * GitHub Copilot API integration for code suggestions
 * Note: This is a placeholder as GitHub Copilot doesn't have a public API yet
 * This would need to be replaced with the actual implementation when available
 */
async function getGitHubCopilotSuggestions(apiKey, code, language, cursorPosition, prefix) {
    // This is a placeholder implementation
    // In a real implementation, this would call the GitHub Copilot API
    
    // For now, return a mock response
    return [
        {
            type: 'completion',
            code: '// This is a placeholder for GitHub Copilot suggestions\n// Actual implementation would use the GitHub Copilot API',
            range: {
                startLineNumber: cursorPosition.lineNumber,
                startColumn: cursorPosition.column,
                endLineNumber: cursorPosition.lineNumber,
                endColumn: cursorPosition.column
            }
        }
    ];
}

module.exports = router;