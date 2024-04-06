const express = require('express');
const net = require('net');

const app = express();
const port = 3000;

// Set EJS as the default view engine
app.set('view engine', 'ejs');

// Set the directory where your view files are located
app.set('views', './views');

// Store the latency data for each channel
let channelLatencies = {};


// Define a function to measure latency using TCP connections
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


// Define a function to update channel latencies
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
        { name: "Channel 30", address: "54.188.84.238", port: 8585 }
    ];

    const latencies = {};

    // Measure latency for each channel
    for (const channel of channels) {
        try {
            const latency = await measureLatency(channel.address, channel.port);
            latencies[channel.name] = latency;
            console.log(`Latency to ${channel.name} (${channel.address}): ${latency} ms`);
        } catch (error) {
            console.error(`Error measuring latency for ${channel.name} (${channel.address}):`, error.message);
        }
    }

    // Update channel latencies
    channelLatencies = latencies;
}


// Update channel latencies initially and then every 20 seconds
updateLatencies();
const interval = setInterval(updateLatencies, 20000); // 20 seconds interval

// Stop updating after 1 minutes
setTimeout(() => {
    clearInterval(interval);
}, 5 * 60 * 1000); // 1 minutes in milliseconds

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



// Define a route handler for the root URL ("/")
app.get('/', (req, res) => {
    // Calculate the instability of channels
    const unstableChannels = calculateInstability(channelLatencies);
    // Render the index.ejs view with the channel latencies
    res.render('index', { channelLatencies, unstableChannels });
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
