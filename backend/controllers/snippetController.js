// Code Snippets Controller
const Snippet = require('../models/Snippet');

class SnippetController {
    // Get all snippets
    async getAllSnippets(req, res) {
        try {
            const snippets = await Snippet.find({ isPublic: true });
            res.json({ success: true, snippets });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get user's snippets
    async getUserSnippets(req, res) {
        try {
            const { userId } = req.params;
            const snippets = await Snippet.find({ userId });
            res.json({ success: true, snippets });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Create new snippet
    async createSnippet(req, res) {
        try {
            const { title, description, code, language, tags, isPublic, userId } = req.body;
            
            const snippet = new Snippet({
                title,
                description,
                code,
                language,
                tags: tags || [],
                isPublic: isPublic || false,
                userId,
                createdAt: new Date(),
                usageCount: 0
            });

            await snippet.save();
            res.json({ success: true, snippet });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Update snippet
    async updateSnippet(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const snippet = await Snippet.findByIdAndUpdate(id, updates, { new: true });
            if (!snippet) {
                return res.status(404).json({ success: false, error: 'Snippet not found' });
            }
            
            res.json({ success: true, snippet });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Delete snippet
    async deleteSnippet(req, res) {
        try {
            const { id } = req.params;
            const snippet = await Snippet.findByIdAndDelete(id);
            if (!snippet) {
                return res.status(404).json({ success: false, error: 'Snippet not found' });
            }
            
            res.json({ success: true, message: 'Snippet deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Search snippets
    async searchSnippets(req, res) {
        try {
            const { query, language, tags } = req.query;
            let searchCriteria = { isPublic: true };

            if (query) {
                searchCriteria.$or = [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                    { code: { $regex: query, $options: 'i' } }
                ];
            }

            if (language) {
                searchCriteria.language = language;
            }

            if (tags) {
                searchCriteria.tags = { $in: tags.split(',') };
            }

            const snippets = await Snippet.find(searchCriteria).sort({ usageCount: -1 });
            res.json({ success: true, snippets });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Increment usage count
    async incrementUsage(req, res) {
        try {
            const { id } = req.params;
            const snippet = await Snippet.findByIdAndUpdate(
                id, 
                { $inc: { usageCount: 1 } }, 
                { new: true }
            );
            
            if (!snippet) {
                return res.status(404).json({ success: false, error: 'Snippet not found' });
            }
            
            res.json({ success: true, snippet });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new SnippetController();
