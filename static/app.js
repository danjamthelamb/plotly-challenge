var names = new Array
var metadata = {}
var samples = {}
var id = 0

function init() {
    d3.json('https://cksandal.github.io/plotly-challenge/data/samples.json').then(function (data) {
        // break up the data in more usable chunks
        names = data.names;
        for (var [key, value] of Object.entries(data.metadata)) { metadata[value['id']] = value; }
        for (var [key, value] of Object.entries(data.samples)) { samples[value['id']] = value; }

        // default id is going to be the first one
        id = names[0];

        // add all of the names/ids into the drop down menu
        for (i = 0; i < names.length; i++) {
            d3.select('#selDataset').append('option').data(names[i])
                .text(names[i]);
        }
        // now that we have the initial conditions, update relevant fields
        updateMetadata(id);
        updatePlots(id, update = false);
        console.log('json: ', data)
        console.log('names: ', names)
        console.log('metadata: ', metadata)
        console.log('samples: ', samples)
    })
}

function optionChanged(value) {
    id = value;
    console.log('id: ', id)
    updatePlots(id)
    updateMetadata(id);
}

function updateMetadata(id) {
    var htmltoadd = ''
    for (var [key, value] of Object.entries(metadata[id])) {
        htmltoadd += '<b>' + key + ':</b> ' + value + '<br>\n';
    }
    d3.select('#sample-metadata').html(htmltoadd);
}

function get_top_n(id, n) {
    // need to associate three seperate arrays together before sorting / slicing. 
    var arr = new Array;
    for (i = 0; i < samples[id].otu_ids.length; i++) {
        arr[i] = {}
        arr[i].otu_id = samples[id].otu_ids[i];
        arr[i].otu_label = samples[id].otu_labels[i];
        arr[i].sample_value = samples[id].sample_values[i];
    }
    return arr.sort((a, b) => b.sample_value - a.sample_value).slice(0, n).reverse();
}


function gaugeChart(id) {
    var gaugechart = d3.select('#gauge').node();

    var x = .5 * Math.cos(Math.PI * (1 - 1 / 8 * metadata[id].wfreq));
    var y = .5 * Math.sin(Math.PI * (1 - 1 / 8 * metadata[id].wfreq));
    var path = 'M -.0 -0.025 L .0 0.025 L ' + x + ' ' + y + ' Z'
    var data = [{
        type: 'scatter',
        x: [0], y: [0],
        marker: { size: 28, color: '850000' },
        showlegend: false,
        name: '',
        hoverinfo: 'text+name'
    }, {
        values: [1, 1, 1, 1, 1, 1, 1, 1, 8],
        rotation: 90,
        text: ['8-9', '6-7', '5-6', '4-5', '3-4', '2-3', '1-2', '0-1', ''],
        textinfo: 'text',
        textposition: 'inside',
        marker: {
            colors: ['rgba(14, 127, 0, .5)', 'rgba(110, 134, 22, .5)', 'rgba(110, 144, 22, .5)',
                'rgba(110, 154, 22, .5)', 'rgba(170, 202, 42, .5)', 'rgba(202, 209, 95, .5)',
                'rgba(210, 206, 145, .5)', 'rgba(232, 226, 202, .5)', 'rgba(255, 255, 255, 0)']
        },
        labels: ['8-9', '6-7', '5-6', '4-5', '3-4', '2-3', '1-2', '0-1', ''],
        hoverinfo: 'label',
        hole: .45,
        type: 'pie',
        showlegend: false
    }];

    var layout = {
        shapes: [{
            type: 'path',
            path: path,
            fillcolor: '850000',
            line: { color: '850000' }
        }],
        title: '<b>Belly Button Washing Frequency</b> <br>Scrubs per Week',
        xaxis: {
            zeroline: false, showticklabels: false,
            showgrid: false, range: [-1, 1]
        },
        yaxis: {
            zeroline: false, showticklabels: false,
            showgrid: false, range: [-1, 1]
        }
    };

    Plotly.newPlot(gaugechart, data, layout, { showSendToCloud: true });
}

function barChart(id) {
    var barchart = d3.select('#bar').node();
    var bardata = get_top_n(id, 10);
    var data = [{
        type: 'bar',
        x: bardata.map(x => x.sample_value),
        y: bardata.map(y => 'OTU' + y.otu_id),
        text: bardata.map(t => t.otu_label),
        orientation: 'h'
    }];
    Plotly.newPlot(barchart, data, { title: { text: '<b>Top Ten OTUs</b>' } });
}

function bubbleChart(id) {
    var bubblechart = d3.select('#bubble').node();
    var data = [{
        x: samples[id].otu_ids,
        y: samples[id].sample_values,
        mode: 'markers',
        marker: {
            size: samples[id].sample_values,
            color: samples[id].otu_ids.map(x => 'hsl(' + x * 12 / 255 + ',100%,50%)'),
        },
        text: samples[id].otu_labels
    }];
    Plotly.newPlot(bubblechart, data, { xaxis: { title: { text: 'OTU ID' } } });
}

function updatePlots(id, update = true) {
    var bubblechart = d3.select('#bubble').node();
    var barchart = d3.select('#bar').node();
    var bardata = get_top_n(id, 10);

    if (update == true) {
        // updated the bar chart here
        Plotly.restyle(barchart, 'x', [bardata.map(x => x.sample_value)])
        Plotly.restyle(barchart, 'y', [bardata.map(y => 'OTU' + y.otu_id)])
        Plotly.restyle(barchart, 'text', [bardata.map(t => t.otu_label)])

        // update the bubble chart
        Plotly.restyle(bubblechart, 'x', [samples[id].otu_ids]);
        Plotly.restyle(bubblechart, 'y', [samples[id].sample_values]);
        Plotly.restyle(bubblechart, 'text', [samples[id].otu_labels]);
        Plotly.restyle(bubblechart, 'marker', [{
            size: samples[id].sample_values,
            color: samples[id].otu_ids.map(x => 'hsl(' + x * 12 / 255 + ',100%,50%)'),
        }]);

        // update the needle on gauge chart / this one will need a full redraw...
        gaugeChart(id)

    } else {
        barChart(id)
        bubbleChart(id)
        gaugeChart(id);
    }
}

init();