const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Configuration
const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongodb-service:27017';
const DB_NAME = 'votingapp';

let db;
let votesCollection;
let historyCollection;

// MongoDB Connection
async function connectDB() {
    try {
        const client = new MongoClient(MONGO_URL);
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        db = client.db(DB_NAME);
        votesCollection = db.collection('votes');
        historyCollection = db.collection('history');
        
        // Initialize vote options if they don't exist
        await initializeVotes();
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function initializeVotes() {
    const options = ['Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'Ansible'];
    
    for (const option of options) {
        const exists = await votesCollection.findOne({ option });
        if (!exists) {
            await votesCollection.insertOne({ 
                option, 
                count: 0,
                createdAt: new Date()
            });
        }
    }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await db.admin().ping();
        res.json({ 
            status: 'healthy',
            database: 'connected',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message
        });
    }
});

// Get all votes
app.get('/api/votes', async (req, res) => {
    try {
        const votes = await votesCollection.find({}).toArray();
        const totalVotes = votes.reduce((sum, v) => sum + v.count, 0);
        
        const voteMap = {};
        votes.forEach(v => {
            voteMap[v.option] = v.count;
        });
        
        res.json({
            votes: voteMap,
            totalVotes,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cast a vote
app.post('/api/vote', async (req, res) => {
    try {
        const { option, voter } = req.body;
        
        if (!option) {
            return res.status(400).json({ error: 'Option is required' });
        }
        
        // Check if option exists
        const voteDoc = await votesCollection.findOne({ option });
        if (!voteDoc) {
            return res.status(400).json({ 
                error: 'Invalid vote option',
                validOptions: await votesCollection.distinct('option')
            });
        }
        
        // Increment vote count
        const result = await votesCollection.updateOne(
            { option },
            { $inc: { count: 1 } }
        );
        
        // Record vote history
        await historyCollection.insertOne({
            option,
            voter: voter || 'Anonymous',
            timestamp: new Date(),
            ipAddress: req.ip
        });
        
        // Get updated count
        const updated = await votesCollection.findOne({ option });
        const totalVotes = await votesCollection.aggregate([
            { $group: { _id: null, total: { $sum: '$count' } } }
        ]).toArray();
        
        res.json({
            success: true,
            option,
            currentCount: updated.count,
            totalVotes: totalVotes[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
    try {
        const votes = await votesCollection.find({}).sort({ count: -1 }).toArray();
        const totalVotes = votes.reduce((sum, v) => sum + v.count, 0);
        
        const stats = votes.map(v => ({
            option: v.option,
            count: v.count,
            percentage: totalVotes > 0 ? ((v.count / totalVotes) * 100).toFixed(2) : 0
        }));
        
        res.json({
            stats,
            totalVotes,
            leader: stats[0]?.option || 'None',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get vote history
app.get('/api/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const history = await historyCollection
            .find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
        
        const total = await historyCollection.countDocuments();
        
        res.json({
            history,
            total,
            showing: history.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset votes (admin function)
app.post('/api/reset', async (req, res) => {
    try {
        await votesCollection.updateMany({}, { $set: { count: 0 } });
        await historyCollection.deleteMany({});
        
        res.json({ 
            success: true,
            message: 'All votes reset successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get detailed analytics
app.get('/api/analytics', async (req, res) => {
    try {
        // Votes by hour
        const hourlyVotes = await historyCollection.aggregate([
            {
                $group: {
                    _id: { 
                        $dateToString: { 
                            format: '%Y-%m-%d %H:00', 
                            date: '$timestamp' 
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 24 }
        ]).toArray();
        
        // Top voters
        const topVoters = await historyCollection.aggregate([
            { $match: { voter: { $ne: 'Anonymous' } } },
            { $group: { _id: '$voter', votes: { $sum: 1 } } },
            { $sort: { votes: -1 } },
            { $limit: 10 }
        ]).toArray();
        
        res.json({
            hourlyVotes,
            topVoters,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/results', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

app.get('/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'analytics.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Voting App running on port ${PORT}`);
        console.log(`📊 Frontend: http://localhost:${PORT}`);
        console.log(`📈 Results: http://localhost:${PORT}/results`);
        console.log(`📉 Analytics: http://localhost:${PORT}/analytics`);
        console.log(`🔧 API: http://localhost:${PORT}/api/votes`);
        console.log(`💾 Database: ${MONGO_URL}/${DB_NAME}`);
    });
});