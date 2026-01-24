const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// In-memory vote storage (use Redis/MongoDB in production)
let votes = {
    'Docker': 0,
    'Kubernetes': 0,
    'Jenkins': 0,
    'Terraform': 0,
    'Ansible': 0
};

let voteHistory = [];
let totalVotes = 0;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.get('/api/votes', (req, res) => {
    res.json({
        votes: votes,
        totalVotes: totalVotes,
        timestamp: new Date().toISOString()
    });
});

app.post('/api/vote', (req, res) => {
    const { option, voter } = req.body;
    
    if (!option || !votes.hasOwnProperty(option)) {
        return res.status(400).json({ 
            error: 'Invalid vote option',
            validOptions: Object.keys(votes)
        });
    }

    votes[option]++;
    totalVotes++;
    
    voteHistory.push({
        option: option,
        voter: voter || 'Anonymous',
        timestamp: new Date().toISOString()
    });

    // Keep only last 100 votes in history
    if (voteHistory.length > 100) {
        voteHistory = voteHistory.slice(-100);
    }

    res.json({
        success: true,
        option: option,
        currentCount: votes[option],
        totalVotes: totalVotes
    });
});

app.get('/api/history', (req, res) => {
    res.json({
        history: voteHistory.slice(-20).reverse(), // Last 20 votes
        total: voteHistory.length
    });
});

app.post('/api/reset', (req, res) => {
    votes = {
        'Docker': 0,
        'Kubernetes': 0,
        'Jenkins': 0,
        'Terraform': 0,
        'Ansible': 0
    };
    voteHistory = [];
    totalVotes = 0;
    
    res.json({ 
        success: true,
        message: 'Votes reset successfully'
    });
});

app.get('/api/stats', (req, res) => {
    const sortedVotes = Object.entries(votes)
        .sort((a, b) => b[1] - a[1])
        .map(([option, count]) => ({
            option,
            count,
            percentage: totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(2) : 0
        }));

    res.json({
        stats: sortedVotes,
        totalVotes: totalVotes,
        leader: sortedVotes[0]?.option || 'None',
        timestamp: new Date().toISOString()
    });
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/results', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Voting App running on port ${PORT}`);
    console.log(`📊 Frontend: http://localhost:${PORT}`);
    console.log(`📈 Results: http://localhost:${PORT}/results`);
    console.log(`🔧 API: http://localhost:${PORT}/api/votes`);
});