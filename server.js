const express = require('express');
const net = require('net');

const app = express();
// Set the port to the environment variable port, or default to 3000 if port is not set
const port = process.env.port || 3000;

// Set EJS as the default view engine
app.set('view engine', 'ejs');

// Set the directory where your view files are located
app.set('views', './views');

// Store the latency data for each channel
let channelLatencies = {};

// Queue to store latencies for each channel
const latencyQueues = {};

// Window size for sliding window average
const windowSize = 10;

// Function to measure latency using TCP connections
async function measureLatency(address, port) {
    console.log(`Attempting to measure latency to ${address}:${port}`);
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const socket = net.createConnection({ host: address, port }, () => {
            const endTime = Date.now();
            const latency = endTime - startTime;
            console.log(`Latency measurement successful: ${latency} ms`);
            socket.destroy();
            resolve(latency);
        });
        socket.on('error', (error) => {
            console.error(`Error measuring latency to ${address}:${port}:`, error.message);
            socket.destroy();
            reject(error);
        });
    });
}

// Function to update channel latencies
async function updateLatencies() {
    const channels = [
        { name: "Channel 1", address: "35.155.204.207", port: 8585 },
        { name: "Channel 2", address: "52.26.82.74", port: 8585 },
        { name: "Channel 3", address: "34.217.205.66", port: 8585 },
        { name: "Channel 4", address: "35.161.183.101", port: 8585 },
        { name: "Channel 5", address: "54.218.157.183", port: 8585 },
        { name: "Channel 6", address: "52.25.78.39", port: 8585 },
        { name: "Channel 7", address: "54.68.160.34", port: 8585 },
        { name: "Channel 8", address: "34.218.141.142", port: 8585 },
        { name: "Channel 9", address: "52.33.249.126", port: 8585 },
        { name: "Channel 10", address: "54.148.170.23", port: 8585 },
        { name: "Channel 11", address: "54.201.184.26", port: 8585 },
        { name: "Channel 12", address: "54.191.142.56", port: 8585 },
        { name: "Channel 13", address: "52.13.185.207", port: 8585 },
        { name: "Channel 14", address: "34.215.228.37", port: 8585 },
        { name: "Channel 15", address: "54.187.177.143", port: 8585 },
        { name: "Channel 16", address: "54.203.83.148", port: 8585 },
        { name: "Channel 17", address: "54.148.188.235", port: 8585 },
        { name: "Channel 18", address: "52.43.83.76", port: 8585 },
        { name: "Channel 19", address: "54.69.114.137", port: 8585 },
        { name: "Channel 20", address: "54.148.137.49", port: 8585 },
        { name: "Channel 21", address: "54.212.109.33", port: 8585 },
        { name: "Channel 22", address: "44.230.255.51", port: 8585 },
        { name: "Channel 23", address: "100.20.116.83", port: 8585 },
        { name: "Channel 24", address: "54.188.84.22", port: 8585 },
        { name: "Channel 25", address: "34.215.170.50", port: 8585 },
        { name: "Channel 26", address: "54.184.162.28", port: 8585 },
        { name: "Channel 27", address: "54.185.209.29", port: 8585 },
        { name: "Channel 28", address: "52.12.53.225", port: 8585 },
        { name: "Channel 29", address: "54.189.33.238", port: 8585 },
        { name: "Channel 30", address: "54.188.84.238", port: 8585 },
        { name: "Channel 31", address: "44.234.162.14", port: 8585 },
        { name: "Channel 32", address: "44.234.162.13", port: 8585 },
        { name: "Channel 33", address: "44.234.161.92", port: 8585 },
        { name: "Channel 34", address: "44.234.161.48", port: 8585 },
        { name: "Channel 35", address: "44.234.160.137", port: 8585 },
        { name: "Channel 36", address: "44.234.161.28", port: 8585 },
        { name: "Channel 37", address: "44.234.162.100", port: 8585 },
        { name: "Channel 38", address: "44.234.161.69", port: 8585 },
        { name: "Channel 39", address: "44.234.162.145", port: 8585 },
        { name: "Channel 40", address: "44.234.162.130", port: 8585 }


    ];

    for (const channel of channels) {
        try {
            const latency = await measureLatency(channel.address, channel.port);
            // Initialize the latency queue for the channel if it doesn't exist
            if (!latencyQueues[channel.name]) {
                latencyQueues[channel.name] = [];
            }
            // Add the new latency to the queue
            latencyQueues[channel.name].push(latency);
            // Remove the oldest latency if the queue size exceeds the window size
            if (latencyQueues[channel.name].length > windowSize) {
                latencyQueues[channel.name].shift();
            }
            // Calculate the sliding window average latency
            const slidingWindowAverage = latencyQueues[channel.name].reduce((acc, curr) => acc + curr, 0) / latencyQueues[channel.name].length;
            const roundedAverage = Math.round(slidingWindowAverage * 100) / 100; // Round to two decimal places
            console.log(`Sliding window average latency for ${channel.name}: ${roundedAverage} ms`);
            // Update channel latencies
            channelLatencies[channel.name] = roundedAverage;

        } catch (error) {
            console.error(`Error measuring latency for ${channel.name} (${channel.address}):`, error.message);
        }
    }
}

// Update channel latencies initially and then every 20 seconds
updateLatencies();
const interval = setInterval(updateLatencies, 20000); // 20 seconds interval

// Stop updating after 5 minute
//setTimeout(() => {
//    clearInterval(interval);
//}, 5 * 60 * 1000); // 5 minute in milliseconds

// Define a function to calculate instability of channels
function calculateInstability(latencies) {
    // Convert latency object to an array of { name, latency } objects
    const latencyArray = Object.entries(latencies).map(([name, latency]) => ({ name, latency }));

    // Calculate average latency
    const totalLatency = latencyArray.reduce((sum, channel) => sum + channel.latency, 0);
    const averageLatency = totalLatency / latencyArray.length;

    // Calculate standard deviation of latencies
    const squaredDifferencesSum = latencyArray.reduce((sum, channel) => sum + Math.pow(channel.latency - averageLatency, 2), 0);
    const variance = squaredDifferencesSum / latencyArray.length;
    const standardDeviation = Math.sqrt(variance);

    // Calculate instability for each channel
    const instabilityMap = {};
    latencyArray.forEach(channel => {
        instabilityMap[channel.name] = Math.abs(channel.latency - averageLatency) / standardDeviation;
    });

    // Sort channels by instability in descending order
    const sortedChannels = Object.keys(instabilityMap).sort((a, b) => instabilityMap[b] - instabilityMap[a]);

    // Get the top 5 most unstable channels
    const unstableChannels = sortedChannels.slice(0, 5).map(name => ({
        name,
        instability: instabilityMap[name]
    }));

    return unstableChannels;
}

// Define a route handler to serve data for the client-side chart
app.get('/data', (req, res) => {
    res.json(channelLatencies);
});

// Define a route handler for the root URL ("/")
app.get('/', (req, res) => {
    // Calculate the instability of channels
    const unstableChannels = calculateInstability(channelLatencies);

    // Get the top 5 highest latencies
    const top5Latencies = Object.entries(channelLatencies)
        .sort(([, latencyA], [, latencyB]) => latencyB - latencyA)
        .slice(0, 5)
        .map(([name, latency]) => ({ name, latency }));

    // Render the index.ejs view with the channel latencies
    res.render('index', { channelLatencies, unstableChannels, top5Latencies });
    // Update the Chart.js chart with the latest latency data
    updateChart(channelLatencies);
});
app.use(express.static('public'));


// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});