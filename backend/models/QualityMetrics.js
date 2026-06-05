// Code Quality Metrics Model
const mongoose = require('mongoose');

const qualityMetricsSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    },
    metrics: {
        complexity: {
            type: Number,
            min: 0,
            max: 100
        },
        maintainability: {
            type: Number,
            min: 0,
            max: 100
        },
        readability: {
            type: Number,
            min: 0,
            max: 100
        },
        linesOfCode: {
            type: Number,
            min: 0
        },
        cyclomaticComplexity: {
            type: Number,
            min: 1
        },
        codeDuplication: {
            type: Number,
            min: 0,
            max: 100
        },
        testCoverage: {
            type: Number,
            min: 0,
            max: 100
        },
        issues: [{
            type: {
                type: String,
                enum: ['error', 'warning', 'info']
            },
            message: String,
            line: Number,
            column: Number,
            rule: String
        }],
        suggestions: [{
            type: String,
            message: String,
            line: Number,
            priority: {
                type: String,
                enum: ['low', 'medium', 'high']
            }
        }]
    },
    analyzedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
qualityMetricsSchema.index({ fileName: 1, analyzedAt: -1 });
qualityMetricsSchema.index({ language: 1 });
qualityMetricsSchema.index({ 'metrics.complexity': 1 });
qualityMetricsSchema.index({ 'metrics.maintainability': 1 });

module.exports = mongoose.model('QualityMetrics', qualityMetricsSchema);
