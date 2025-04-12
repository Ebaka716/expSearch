// Visualization Components

// Stock Chart Component
function createStockChart(containerId, data) {
    return Highcharts.stockChart(containerId, {
        rangeSelector: {
            selected: 1,
            buttons: [{
                type: 'day',
                count: 1,
                text: '1D'
            }, {
                type: 'week',
                count: 1,
                text: '1W'
            }, {
                type: 'month',
                count: 1,
                text: '1M'
            }, {
                type: 'year',
                count: 1,
                text: '1Y'
            }, {
                type: 'all',
                text: 'All'
            }]
        },
        title: {
            text: 'Stock Price'
        },
        series: [{
            name: 'Price',
            data: data,
            tooltip: {
                valueDecimals: 2
            }
        }],
        chart: {
            height: 400
        },
        navigator: {
            enabled: true
        },
        scrollbar: {
            enabled: true
        }
    });
}

// Portfolio Distribution Chart
function createPortfolioPieChart(containerId, data) {
    return Highcharts.chart(containerId, {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },
        title: {
            text: 'Portfolio Distribution'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        accessibility: {
            point: {
                valueSuffix: '%'
            }
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                }
            }
        },
        series: [{
            name: 'Allocation',
            colorByPoint: true,
            data: data
        }]
    });
}

// Interactive Data Table
function createInteractiveTable(containerId, data) {
    const table = d3.select(containerId)
        .append('table')
        .attr('class', 'data-table');

    // Add headers
    const headers = Object.keys(data[0]);
    table.append('thead')
        .append('tr')
        .selectAll('th')
        .data(headers)
        .enter()
        .append('th')
        .text(d => d)
        .on('click', function(d) {
            // Sort table by clicked column
            const rows = table.select('tbody')
                .selectAll('tr')
                .sort((a, b) => d3.ascending(a[d], b[d]));
        });

    // Add rows
    const tbody = table.append('tbody');
    const rows = tbody.selectAll('tr')
        .data(data)
        .enter()
        .append('tr');

    rows.selectAll('td')
        .data(d => headers.map(h => d[h]))
        .enter()
        .append('td')
        .text(d => d);

    return table;
}

// Performance Comparison Chart
function createPerformanceChart(containerId, data) {
    return Highcharts.chart(containerId, {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Performance Comparison'
        },
        xAxis: {
            categories: data.categories
        },
        yAxis: {
            title: {
                text: 'Performance (%)'
            }
        },
        series: data.series,
        plotOptions: {
            column: {
                dataLabels: {
                    enabled: true,
                    format: '{point.y:.1f}%'
                }
            }
        }
    });
}

// Export functions for use in other files
window.visualizations = {
    createStockChart,
    createPortfolioPieChart,
    createInteractiveTable,
    createPerformanceChart
}; 