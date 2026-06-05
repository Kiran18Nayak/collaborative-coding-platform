// Code Quality Metrics Controller
const QualityMetrics = require('../models/QualityMetrics');
const { analyzeCodeQuality } = require('../services/qualityAnalyzer');

class QualityController {
    // Analyze code quality
    async analyzeCode(req, res) {
        try {
            const { code, language, fileName } = req.body;
            
            const metrics = await analyzeCodeQuality(code, language, fileName);
            
            // Save metrics to database
            const qualityRecord = new QualityMetrics({
                fileName,
                language,
                metrics,
                analyzedAt: new Date()
            });
            
            await qualityRecord.save();
            
            res.json({ success: true, metrics });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get quality metrics for a file
    async getFileMetrics(req, res) {
        try {
            const { fileName } = req.params;
            
            const metrics = await QualityMetrics.find({ fileName })
                .sort({ analyzedAt: -1 })
                .limit(10);
            
            res.json({ success: true, metrics });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get quality trends
    async getQualityTrends(req, res) {
        try {
            const { fileName, days = 30 } = req.query;
            
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(days));
            
            const trends = await QualityMetrics.find({
                fileName,
                analyzedAt: { $gte: startDate }
            }).sort({ analyzedAt: 1 });
            
            res.json({ success: true, trends });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get quality summary
    async getQualitySummary(req, res) {
        try {
            const { roomId } = req.params;
            
            const summary = await QualityMetrics.aggregate([
                {
                    $group: {
                        _id: '$fileName',
                        avgComplexity: { $avg: '$metrics.complexity' },
                        avgMaintainability: { $avg: '$metrics.maintainability' },
                        avgReadability: { $avg: '$metrics.readability' },
                        lastAnalyzed: { $max: '$analyzedAt' },
                        totalAnalyses: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        fileName: '$_id',
                        avgComplexity: { $round: ['$avgComplexity', 2] },
                        avgMaintainability: { $round: ['$avgMaintainability', 2] },
                        avgReadability: { $round: ['$avgReadability', 2] },
                        lastAnalyzed: 1,
                        totalAnalyses: 1
                    }
                },
                { $sort: { lastAnalyzed: -1 } }
            ]);
            
            res.json({ success: true, summary });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new QualityController();
