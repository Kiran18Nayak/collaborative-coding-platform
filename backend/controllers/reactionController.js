// Emoji Reactions Controller
const Reaction = require('../models/Reaction');

class ReactionController {
    // Add reaction to code
    async addReaction(req, res) {
        try {
            const { roomId, fileName, lineNumber, emoji, userId, username } = req.body;
            
            // Check if user already reacted to this line
            const existingReaction = await Reaction.findOne({
                roomId,
                fileName,
                lineNumber,
                userId
            });

            if (existingReaction) {
                // Update existing reaction
                existingReaction.emoji = emoji;
                existingReaction.updatedAt = new Date();
                await existingReaction.save();
            } else {
                // Create new reaction
                const reaction = new Reaction({
                    roomId,
                    fileName,
                    lineNumber,
                    emoji,
                    userId,
                    username,
                    createdAt: new Date()
                });
                await reaction.save();
            }

            // Get all reactions for this line
            const reactions = await Reaction.find({
                roomId,
                fileName,
                lineNumber
            });

            res.json({ success: true, reactions });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Remove reaction
    async removeReaction(req, res) {
        try {
            const { roomId, fileName, lineNumber, userId } = req.body;
            
            await Reaction.findOneAndDelete({
                roomId,
                fileName,
                lineNumber,
                userId
            });

            // Get remaining reactions for this line
            const reactions = await Reaction.find({
                roomId,
                fileName,
                lineNumber
            });

            res.json({ success: true, reactions });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get reactions for a file
    async getFileReactions(req, res) {
        try {
            const { roomId, fileName } = req.params;
            
            const reactions = await Reaction.find({
                roomId,
                fileName
            });

            // Group reactions by line number
            const reactionsByLine = {};
            reactions.forEach(reaction => {
                if (!reactionsByLine[reaction.lineNumber]) {
                    reactionsByLine[reaction.lineNumber] = [];
                }
                reactionsByLine[reaction.lineNumber].push(reaction);
            });

            res.json({ success: true, reactions: reactionsByLine });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get reaction statistics
    async getReactionStats(req, res) {
        try {
            const { roomId } = req.params;
            
            const stats = await Reaction.aggregate([
                { $match: { roomId } },
                {
                    $group: {
                        _id: '$emoji',
                        count: { $sum: 1 },
                        users: { $addToSet: '$userId' }
                    }
                },
                {
                    $project: {
                        emoji: '$_id',
                        count: 1,
                        uniqueUsers: { $size: '$users' }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            res.json({ success: true, stats });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new ReactionController();
