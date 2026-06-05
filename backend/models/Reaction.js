// Emoji Reaction Model
const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    lineNumber: {
        type: Number,
        required: true
    },
    emoji: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                // Basic emoji validation (Unicode emoji range)
                return /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(v);
            },
            message: 'Invalid emoji'
        }
    },
    userId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
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
reactionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Compound index for efficient queries
reactionSchema.index({ roomId: 1, fileName: 1, lineNumber: 1 });
reactionSchema.index({ userId: 1 });
reactionSchema.index({ emoji: 1 });

module.exports = mongoose.model('Reaction', reactionSchema);
