    let charts = [];


    document.addEventListener('DOMContentLoaded', async () => {

        // Extract parameters from the URL

        const response = await fetch('/config');
        const config = await response.json();

       const viewMoreBtn = document.getElementById('view-more-btn');
       const chartsContainer = document.getElementById('charts-container-2');

      chartsContainer.style.display = 'block';


      viewMoreBtn.addEventListener('click', () => {
        // Toggle visibility of extra content
         chartsContainer.classList.toggle('expanded');

        // Update button text and arrow direction
        if (chartsContainer.classList.contains('expanded')) {
            chartsContainer.style.display = 'none';
            viewMoreBtn.textContent = '▼ View More Chart';

        } else {
            chartsContainer.style.display = 'block';
            viewMoreBtn.textContent = '▲ View Less Chart';

        }
    });


        // Set calculator name
        document.getElementById('calculator-name').textContent = config.name;

        document.getElementById('calculator-description').textContent = config.description;

        // Generate input fields dynamically
        generateForm(config.variables);

        fetchAndCalculate(config.variables, config);

        // Setup real-time calculation listener
        setupEventListeners(config.variables, config);

        // Create charts if enabled
        createCharts(config.charts);


        displayExamples(config.examples);

        generateDefinition(config.variables);
    });





    // Dynamically create input fields
    function generateForm(variables) {
        const formContainer = document.getElementById('form-container');
        variables.forEach(variable => {
            const div = document.createElement('div');
            div.classList.add('form-group');

            const label = document.createElement('label');
            label.setAttribute('for', variable.name);
            label.textContent = variable.label;


            const input = document.createElement('input');
            input.type = variable.type;
            input.id = variable.name;
            input.placeholder = `Enter ${variable.label}`;
            input.value = variable.default;

            div.appendChild(label);
            div.appendChild(input);
            formContainer.appendChild(div);
        });

            const resultContainer = document.getElementById('result');
            resultContainer.textContent = 'Result will be displayed here...';

    }

    // Add event listeners for real-time updates
    function setupEventListeners(variables, config) {
        variables.forEach(variable => {
            const input = document.getElementById(variable.name);
            input.addEventListener('input', () => fetchAndCalculate(variables, config));
        });
    }


   function generateDefinition(variables) {
    const formContainer = document.getElementById('form-container-2');
    variables.forEach(variable => {
        const div = document.createElement('div');
        div.classList.add('form-group');

        // Add a descriptive label for the definition
        const definitionLabel = document.createElement('strong');
        definitionLabel.textContent = `${variable.label} - Explanation:`;
        div.appendChild(definitionLabel);

        // Add the long definition
        const longDefinition = document.createElement('p');
        longDefinition.textContent = variable.long_definition;
        longDefinition.style.marginTop = '5px';
        longDefinition.style.fontSize = '14px';
        longDefinition.style.color = '#555';
        div.appendChild(longDefinition);

        formContainer.appendChild(div);
    });


}


    async function fetchAndCalculate(variables, config) {


        const inputData = {};

        // Collect input data dynamically based on variables
        variables.forEach(variable => {
            const value = parseFloat(document.getElementById(variable.name).value);
            inputData[variable.name.toLowerCase()] = isNaN(value) ? 0 : value;
        });

        // Send the input data to the backend
        const response = await fetch('/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(inputData)
        });

        const data = await response.json();
        const results = data.results;
        const results2 = data.results2;
        const chart_result = data.charts_result_for_bar;


        generateCalculationTable(results, config);


        // Dynamically update the result text
        let resultText = "\n";
        const chartLabels = [];
        const chartValues = [];

        for (const [key, value] of Object.entries(results2)) {
         resultText += `${key.replace(/_/g, " ").toUpperCase()}: ₹${value.toFixed(2)}\n`; // Rupee symbol added
        }

        for (const [key, value] of Object.entries(chart_result)) {
         chartLabels.push(key.replace(/_/g, " ").toUpperCase());
         chartValues.push(value);
        }


        document.getElementById('result').textContent = resultText;

        // Dynamically update the chart
        updateCharts(chartLabels, chartValues);
    }


    function generateCalculationTable(data, config) {
    const tableContainer = document.getElementById('calculation-table-container');
    tableContainer.innerHTML = ''; // Clear any existing table

    // Create the table
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginTop = '20px';
    table.style.textAlign = 'center';

    // Fetch table headings from the config JSON
    const headers = config.table_headings;

    // Add table header
    const headerRow = document.createElement('tr');
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText.toUpperCase();
        th.style.border = '1px solid #ccc';
        th.style.padding = '10px';
        th.style.backgroundColor = '#f4f4f9';
        th.style.fontWeight = 'bold';
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Add table rows for each data entry
    data.forEach(row => {
        const tr = document.createElement('tr');

        // Dynamically map row data to each header
        headers.forEach((_, index) => {
            const key = Object.keys(row)[index]; // Match data keys with headers
            const td = document.createElement('td');
            td.textContent = key && row[key] !== undefined
                ? typeof row[key] === 'number' ? row[key].toFixed(2) : row[key]
                : '-'; // Fallback for missing data
            td.style.border = '1px solid #ccc';
            td.style.padding = '10px';
            tr.appendChild(td);
        });

        table.appendChild(tr);
    });

    // Append the table to the container
    tableContainer.appendChild(table);
}



function createCharts(chartsConfig) {
    const chartsContainer = document.getElementById('charts-container');
    const chartsContainer2 = document.getElementById('charts-container-2');

    for (let chartType in chartsConfig) {
        const chartConfig = chartsConfig[chartType];

        if (chartConfig.enabled) {
            const canvas = document.createElement('canvas');
            canvas.id = `chart-${chartType}`;

            if (chartConfig.default) {
                chartsContainer.appendChild(canvas);
            } else {
                chartsContainer2.appendChild(canvas);
            }

            // Initialize the chart
            const ctx = canvas.getContext('2d');

            // Define basic chart structure
            const chartData = {
                labels: chartConfig.xAxis || [],
                datasets: [{
                    label: chartConfig.yLabel || "Y-Axis",
                    data: chartConfig.yAxis || [],
                    backgroundColor: chartConfig.colors || ['#007bff', '#ffc107', '#28a745', '#dc3545'],
                }]
            };

            let chartOptions = {
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                }
            };

            // If the chart type is 'bar', add more customization
            if (chartType === 'bar') {
                chartOptions = {
                    responsive: true,
                    plugins: {
                        legend: { display: true }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: chartConfig.xLabel || 'X-Axis' },
                            grid: { display: false }
                        },
                        y: {
                            title: { display: true, text: chartConfig.yLabel || 'Y-Axis' },
                            grid: { color: "rgba(0, 0, 0, 0.1)" }
                        }
                    },
                    barThickness: chartConfig.barThickness || 30, // Custom bar thickness
                    categoryPercentage: chartConfig.categoryPercentage || 0.8, // Space between bars
                    barPercentage: chartConfig.barPercentage || 0.9, // Bar width inside a group
                };

                const chartData = {
                labels: [45 , 65, 89],
                datasets: [{
                    label: chartConfig.yLabel || "Y-Axis",
                    data: chartConfig.yAxis || [],
                    backgroundColor: chartConfig.colors || ['#007bff', '#ffc107', '#28a745', '#dc3545'],
                }]
            };


            }

            const chart = new Chart(ctx, {
                type: chartType,
                data: chartData,
                options: chartOptions
            });

            // Store the chart instance
            charts.push({ type: chartType, instance: chart });
        }
    }
}



// function createCharts(chartsConfig) {
//     const chartsContainer = document.getElementById('charts-container');
//     const chartsContainer2 = document.getElementById('charts-container-2');
//     const charts = []; // Initialize the charts array

//     // Loop through each chart type and check if it's enabled
//     for (let chartType in chartsConfig) {
//         const chartConfig = chartsConfig[chartType];

//         if (chartConfig.enabled) {
//             const canvas = document.createElement('canvas');
//             canvas.id = `chart-${chartType}`;
//             if (chartConfig.default) {
//                 chartsContainer.appendChild(canvas);
//             } else {
//                 chartsContainer2.appendChild(canvas);
//             }

//             // Initialize the chart
//             const ctx = canvas.getContext('2d');

//             // Define base chart data structure
//             let chartData = {
//                 labels: chartConfig.labels || [],
//                 datasets: []
//             };

//             // Define base chart options
//             let chartOptions = {
//                 responsive: true,
//                 plugins: {
//                     legend: { position: 'top' },
//                     title: {
//                         display: true,
//                         text: chartConfig.title || `${chartType.toUpperCase()} Chart`
//                     }
//                 },
//                 scales: {}
//             };

//             if (chartType === 'bar') {
//     // X-axis labels (e.g., Years)
//     chartData.labels = chartConfig.xAxisLabels || [1, 2, 3, 4]; // Default to 4 years if not provided

//     chartData.datasets.push({
//         label: chartConfig.label || 'Yearly Data',
//         data: [], // Default data if not provided
//         backgroundColor: chartConfig.backgroundColor || [
//             'rgba(255, 99, 132, 0.8)',
//             'rgba(54, 162, 235, 0.8)',
//             'rgba(255, 206, 86, 0.8)',
//             'rgba(75, 192, 192, 0.8)'
//         ],
//         borderColor: chartConfig.borderColor || [
//             'rgba(255, 99, 132, 1)',
//             'rgba(54, 162, 235, 1)',
//             'rgba(255, 206, 86, 1)',
//             'rgba(75, 192, 192, 1)'
//         ],
//         borderWidth: 2,
//         barPercentage: 0.7,
//         categoryPercentage: 0.8
//     });

//     // Define X and Y axis configurations
//     chartOptions.scales = {
//         x: {
//             title: {
//                 display: true,
//                 text: chartConfig.xAxisTitle || 'Number of Years'
//             },
//             ticks: {
//                 callback: function(value, index) {
//                     return chartData.labels[index]; // Display custom x-axis labels
//                 }
//             }
//         },
//         y: {
//             beginAtZero: true,
//             title: {
//                 display: true,
//                 text: chartConfig.yAxisTitle || 'Values'
//             }
//         }
//     };
// }

//             else {
//                 // Default dataset for other chart types
//                 chartData.datasets.push({
//                     label: chartConfig.datasetLabel || `${chartType} Dataset`,
//                     data: [],
//                     backgroundColor: chartConfig.backgroundColor || [
//                         '#007bff', '#ffc107', '#28a745', '#dc3545'
//                     ],
//                     borderColor: chartConfig.borderColor || '#000',
//                     borderWidth: 1
//                 });

//         const chartOptions = {
//             responsive: true,
//             plugins: {
//                 legend: { position: 'top' },
//             }

//         };
//         }

//             // Initialize Chart
//             const chart = new Chart(ctx, {
//                 type: chartType,
//                 data: chartData,
//                 options: chartOptions
//             });

//             // Store the chart instance
//             charts.push({ type: chartType, instance: chart });
//         }
//     }

//     return charts; // Return the array of chart instances
// }

// function createCharts(chartsConfig) {
//     const chartsContainer = document.getElementById('charts-container');
//     const chartsContainer2 = document.getElementById('charts-container-2');
//     const charts = []; // Array to store chart instances

//     // Loop through each chart type and create the chart if enabled
//     for (let chartType in chartsConfig) {
//         const chartConfig = chartsConfig[chartType];

//         if (chartConfig.enabled) {
//             // Create and append a canvas for the chart
//             const canvas = document.createElement('canvas');
//             canvas.id = `chart-${chartType}`;
//             if (chartConfig.default) {
//                 chartsContainer.appendChild(canvas);
//             } else {
//                 chartsContainer2.appendChild(canvas);
//             }

//             const ctx = canvas.getContext('2d');

//             // Base chart data
//             let chartData = {
//                 labels: chartConfig.labels || [],
//                 datasets: []
//             };

//             // Base chart options
//             let chartOptions = {
//                 responsive: true,
//                 plugins: {
//                     legend: { position: 'top' },
//                     title: {
//                         display: true,
//                         text: chartConfig.title || `${chartType.toUpperCase()} Chart`
//                     }
//                 },
//                 scales: {}
//             };

//             // Handle specific chart types
//             switch (chartType) {
//                 case 'bar':
//                     chartData.labels = chartConfig.labels;
//                     chartData.datasets.push({
//                         label: chartConfig.labels,
//                         data: [45 , 86, 25, 65],
//                         backgroundColor: chartConfig.backgroundColor || [
//                             'rgba(255, 99, 132, 0.8)',
//                             'rgba(54, 162, 235, 0.8)',
//                             'rgba(255, 206, 86, 0.8)',
//                             'rgba(75, 192, 192, 0.8)'
//                         ],
//                         borderColor: chartConfig.borderColor || [
//                             'rgba(255, 99, 132, 1)',
//                             'rgba(54, 162, 235, 1)',
//                             'rgba(255, 206, 86, 1)',
//                             'rgba(75, 192, 192, 1)'
//                         ],
//                         borderWidth: 2,
//                         barPercentage: 0.7,
//                         categoryPercentage: 0.8
//                     });

//                     chartOptions.scales = {
//                         x: {
//                             title: {
//                                 display: true,
//                                 text: chartConfig.xAxisTitle || 'Number of Years'
//                             },
//                             ticks: {
//                                 callback: function(value, index) {
//                                     return chartData.labels[index];
//                                 }
//                             }
//                         },
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: chartConfig.yAxisTitle || 'Values'
//                             }
//                         }
//                     };
//                     break;

//                 case 'line':
//                     chartData.labels = chartConfig.xAxisLabels || ['Jan', 'Feb', 'Mar', 'Apr'];
//                     chartData.datasets.push({
//                         label: chartConfig.label || 'Trend Data',
//                         data: [46,85,65,12],
//                         borderColor: chartConfig.borderColor || '#007bff',
//                         backgroundColor: chartConfig.backgroundColor || 'rgba(0, 123, 255, 0.2)',
//                         borderWidth: 2,
//                         fill: false
//                     });

//                     chartOptions.scales = {
//                         x: {
//                             title: {
//                                 display: true,
//                                 text: chartConfig.xAxisTitle || 'Months'
//                             }
//                         },
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: chartConfig.yAxisTitle || 'Values'
//                             }
//                         }
//                     };
//                     break;

//                 case 'pie':
//                     chartData.labels = chartConfig.labels || ['Slice 1', 'Slice 2', 'Slice 3'];
//                     chartData.datasets.push({
//                         label: chartConfig.label || 'Distribution',
//                         data: [56,85,74,65],
//                         backgroundColor: chartConfig.backgroundColor || [
//                             '#FF6384', '#36A2EB', '#FFCE56'
//                         ],
//                         borderColor: chartConfig.borderColor || '#fff',
//                         borderWidth: 1
//                     });
//                     break;

//                 case 'doughnut':
//                     chartData.labels = chartConfig.labels || ['Slice 1', 'Slice 2', 'Slice 3'];
//                     chartData.datasets.push({
//                         label: chartConfig.label || 'Distribution',
//                         data: [56,85,74,65],
//                         backgroundColor: chartConfig.backgroundColor || [
//                             '#FF6384', '#36A2EB', '#FFCE56'
//                         ],
//                         borderColor: chartConfig.borderColor || '#fff',
//                         borderWidth: 1
//                     });
//                     break;


//                 default:
//                     chartData.datasets.push({
//                         label: chartConfig.label || `${chartType} Dataset`,
//                         data: [],
//                         backgroundColor: chartConfig.backgroundColor || '#007bff',
//                         borderColor: chartConfig.borderColor || '#000',
//                         borderWidth: 1
//                     });
//                     break;
//             }

//             // Initialize the chart
//             const chart = new Chart(ctx, {
//                 type: chartType,
//                 data: chartData,
//                 options: chartOptions
//             });

//             // Store the chart instance
//             charts.push({ type: chartType, instance: chart });
//         }
//     }

//     return charts; // Return the array of chart instances
// }

// Global array to store chart instances

// function createCharts(chartsConfig) {
//     const chartsContainer = document.getElementById('charts-container');
//     const chartsContainer2 = document.getElementById('charts-container-2');
//     charts = []; // Reset the charts array to avoid duplicates

//     for (let chartType in chartsConfig) {
//         const chartConfig = chartsConfig[chartType];

//         if (chartConfig.enabled) {
//             // Create and append a canvas for the chart
//             const canvas = document.createElement('canvas');
//             canvas.id = `chart-${chartType}`;
//             if (chartConfig.default) {
//                 chartsContainer.appendChild(canvas);
//             } else {
//                 chartsContainer2.appendChild(canvas);
//             }

//             const ctx = canvas.getContext('2d');

//             // Base chart data
//             let chartData = {
//                 labels: chartConfig.labels || [],
//                 datasets: []
//             };

//             // Base chart options
//             let chartOptions = {
//                 responsive: true,
//                 plugins: {
//                     legend: { position: 'top' },
//                     title: {
//                         display: true,
//                         text: chartConfig.title || `${chartType.toUpperCase()} Chart`
//                     }
//                 },
//                 scales: {}
//             };

//             // Handle specific chart types
//             switch (chartType) {
//                 case 'bar':
//                     chartData.datasets.push({
//                         label: chartConfig.labels || 'Yearly Data',
//                         data: [56,89,100,65],
//                         backgroundColor: chartConfig.backgroundColor || [
//                             'rgba(255, 99, 132, 0.8)',
//                             'rgba(54, 162, 235, 0.8)',
//                             'rgba(255, 206, 86, 0.8)',
//                             'rgba(75, 192, 192, 0.8)'
//                         ],
//                         borderColor: chartConfig.borderColor || [
//                             'rgba(255, 99, 132, 1)',
//                             'rgba(54, 162, 235, 1)',
//                             'rgba(255, 206, 86, 1)',
//                             'rgba(75, 192, 192, 1)'
//                         ],
//                         borderWidth: 2,
//                         barPercentage: 0.7,
//                         categoryPercentage: 0.8
//                     });

//                     chartOptions.scales = {
//                         x: {
//                             title: {
//                                 display: true,
//                                 text: chartConfig.xAxisTitle || 'Number of Years'
//                             },
//                             ticks: {
//                                 callback: function (value, index) {
//                                     return chartData.labels[index];
//                                 }
//                             }
//                         },
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: chartConfig.yAxisTitle || 'Values'
//                             }
//                         }
//                     };
//                     break;

//                 case 'line':
//                     chartData.datasets.push({
//                         label: chartConfig.label || 'Trend Data',
//                         data: [],
//                         borderColor: chartConfig.borderColor || '#007bff',
//                         backgroundColor: chartConfig.backgroundColor || 'rgba(0, 123, 255, 0.2)',
//                         borderWidth: 2,
//                         fill: false
//                     });

//                     chartOptions.scales = {
//                         x: {
//                             title: {
//                                 display: true,
//                                 text: chartConfig.xAxisTitle || 'Months'
//                             }
//                         },
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: chartConfig.yAxisTitle || 'Values'
//                             }
//                         }
//                     };
//                     break;

//                 case 'pie':
//                 case 'doughnut':
//                     chartData.datasets.push({
//                         label: chartConfig.label || 'Distribution',
//                         data: [],
//                         backgroundColor: chartConfig.backgroundColor || [
//                             '#FF6384', '#36A2EB', '#FFCE56'
//                         ],
//                         borderColor: chartConfig.borderColor || '#fff',
//                         borderWidth: 1
//                     });
//                     break;

//                 default:
//                     chartData.datasets.push({
//                         label: chartConfig.label || `${chartType} Dataset`,
//                         data: chartConfig.data || [],
//                         backgroundColor: chartConfig.backgroundColor || '#007bff',
//                         borderColor: chartConfig.borderColor || '#000',
//                         borderWidth: 1
//                     });
//                     break;
//             }

//             // Initialize the chart
//             const chart = new Chart(ctx, {
//                 type: chartType,
//                 data: chartData,
//                 options: chartOptions
//             });

//             // Store the chart instance
//             charts.push({ type: chartType, instance: chart });
//         }
//     }

//     return charts; // Return the array of chart instances
// }


// function updateCharts(labels, values) {
//     charts.forEach(chart => {
//         chart.instance.data.labels = labels; // Update labels
//         if (chart.instance.data.datasets.length > 0) {
//             chart.instance.data.datasets[0].data = values; // Update dataset values
//         }
//         chart.instance.update(); // Refresh the chart
//     });
// }



// function updateCharts(updateData) {
//     charts.forEach(chart => {
//         const { type, instance } = chart;

//         // Check if the updateData contains data for the current chart type
//         if (updateData[type]) {
//             const chartUpdate = updateData[type];

//             // Update labels dynamically
//             if (chartUpdate.labels) {
//                 instance.data.labels = chartUpdate.labels;
//             }

//             // Update dataset values dynamically
//             if (chartUpdate.datasets) {
//                 chartUpdate.datasets.forEach((datasetUpdate, index) => {
//                     if (instance.data.datasets[index]) {
//                         if (datasetUpdate.data) {
//                             instance.data.datasets[index].data = datasetUpdate.data;
//                         }
//                         if (datasetUpdate.backgroundColor) {
//                             instance.data.datasets[index].backgroundColor = datasetUpdate.backgroundColor;
//                         }
//                         if (datasetUpdate.borderColor) {
//                             instance.data.datasets[index].borderColor = datasetUpdate.borderColor;
//                         }
//                     } else {
//                         // Add new dataset if it doesn't exist
//                         instance.data.datasets.push({
//                             label: datasetUpdate.label || `Dataset ${index + 1}`,
//                             data: datasetUpdate.data || [],
//                             backgroundColor: datasetUpdate.backgroundColor || '#007bff',
//                             borderColor: datasetUpdate.borderColor || '#000',
//                             borderWidth: datasetUpdate.borderWidth || 1
//                         });
//                     }
//                 });
//             }

//             // Update the chart instance
//             instance.update();
//         }
//     });
// }




function updateCharts(labels, values) {
    charts.forEach(chart => {
        chart.instance.data.labels = labels; // Use the labels from the config
        chart.instance.data.datasets[0].data = values; // Update data
        chart.instance.update(); // Refresh the chart
    });
}

// function updateCharts(labels, values) {
//     charts.forEach(chart => {
//         // Update chart labels and dataset values
//         chart.instance.data.labels = labels;
//         chart.instance.data.datasets[0].data = values;

//         // Refresh the chart
//         chart.instance.update();
//     });
// }


// Function to display examples and calculations
function displayExamples(examples) {
    const examplesContainer = document.getElementById('examples-container');
    examples.forEach(example => {
        const exampleDiv = document.createElement('div');
        exampleDiv.classList.add('example');

        const title = document.createElement('h3');
        title.textContent = example.title;
        exampleDiv.appendChild(title);

        const description = document.createElement('p');
        description.textContent = example.description;
        exampleDiv.appendChild(description);

        const stepsList = document.createElement('ul');
        example.steps.forEach(step => {
            const stepItem = document.createElement('li');
            stepItem.textContent = step;
            stepsList.appendChild(stepItem);
        });
        exampleDiv.appendChild(stepsList);

        // Show calculation details
        const calculationContainer = document.createElement('div');
        calculationContainer.classList.add('calculation');

        const formulaText = document.createElement('p');
        formulaText.innerHTML = `<strong>Formula:</strong> ${example.calculation.formula}`;
        calculationContainer.appendChild(formulaText);

        const resultText = document.createElement('p');
        resultText.innerHTML = `<strong>Result:</strong> ₹${example.calculation.result.toFixed(2)}`;
        calculationContainer.appendChild(resultText);

        const explanationText = document.createElement('p');
        explanationText.innerHTML = `<strong>Explanation:</strong> ${example.calculation.explanation}`;
        calculationContainer.appendChild(explanationText);

        exampleDiv.appendChild(calculationContainer);

        examplesContainer.appendChild(exampleDiv);

        const horizontalLine = document.createElement('hr');
        examplesContainer.appendChild(horizontalLine);

    });

}
