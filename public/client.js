// Fetch data from the server and update the chart
async function fetchDataAndUpdateChart() {
    const response = await fetch('/data'); // Returns channel latency data
    const data = await response.json();
    updateChart(data);
}

// Initialize an empty Chart.js chart
let latencyChart = null;

// Function to update the Chart.js chart with latency data
function updateChart(channelData) {
    const ctx = document.getElementById('latencyChart').getContext('2d');
    if (!latencyChart) {
        latencyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(channelData),
                datasets: [{
                    label: 'Latency (ms)',
                    data: Object.values(channelData),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } else {
        latencyChart.data.labels = Object.keys(channelData);
        latencyChart.data.datasets[0].data = Object.values(channelData);
        latencyChart.update();
    }
}

// Fetch data and update the chart on page load
window.addEventListener('load', () => {
    fetchDataAndUpdateChart();
});
