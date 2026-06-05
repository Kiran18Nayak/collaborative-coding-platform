// Code Snippet Model
const mongoose = require('mongoose');

const snippetSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    code: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true,
        enum: ['javascript', 'python', 'java', 'cpp', 'c', 'html', 'css', 'php', 'ruby', 'go', 'rust', 'typescript', 'sql', 'json', 'xml', 'yaml', 'markdown']
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    isPublic: {
        type: Boolean,
        default: false
    },
    userId: {
        type: String,
        required: true
    },
    usageCount: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
snippetSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for search functionality
snippetSchema.index({ title: 'text', description: 'text', code: 'text' });
snippetSchema.index({ language: 1 });
snippetSchema.index({ tags: 1 });
snippetSchema.index({ isPublic: 1, usageCount: -1 });

module.exports = mongoose.model('Snippet', snippetSchema);
