var width = 1200,
    height = 600,
    centered;

var legend_w = 200;

// Set svg width & height
var svg = d3.select('#chart').append('svg')
    .attr('width', width)
    .attr('height', height);

let axis_width = 80;

var axis = svg.append('g');
axis.attr("transform", "translate("+axis_width+", 20)");

var widthActual = width-20-axis_width-legend_w;
var g = svg.append('g');
g.attr("transform", "translate("+(axis_width+10)+", 20)")
 .attr("width", widthActual);

 var legend = svg.append('g');
legend.attr("transform", "translate("+(width-legend_w+10)+",20)");

// define scales
let scaleX = d3.scaleLinear().range([0,widthActual]);
let scaleY = d3.scaleLog().range([height-10*2,5]);
let scaleR = d3.scaleLog();
let scaleC = d3.scaleOrdinal(d3.schemeCategory10);

/**
 * Draw the legend
 * @param {Array} data 
 */
function createLegend(data) {
    // Legend text
    let tlegend = legend.selectAll(".tlegend").data(data).enter();
    tlegend.append("text")
        .attr("class", "tlegend")
        .attr("y", 10)
        .attr("font-family", "sans-serif")
        .text("Legend");
    let all_status = Array.from(data, d=>{return d.status});
    let status = [...new Set(all_status)];
    
    let legend_status = legend.append('g');
    let legend_dis_vars = legend.append('g');
    legend_status.attr("transform", "translate(0,20)");
    let height_status = 50+(10*2+5)*status.length;
    legend_dis_vars.attr("transform", "translate(0,"+height_status+")");
    let tdisvars = legend_dis_vars.selectAll(".tdisvars").data(data).enter();
    tdisvars.append("text")
    .attr("class", "tdisvars")
    .attr("y", 10)
    .attr("font-family", "sans-serif")
    .text("Discrete Variables");

    // status circles
    let lStatusCircles = legend_status.selectAll(".lStatusCircles").data(status).enter();
    lStatusCircles.append("circle")
        .attr("class", "lStatusCircles")
        .attr("cx", 20)
        .attr("cy", (d,i) => {return 10+(10*2+5)*i})
        .attr("r", 10)
        .attr("fill", d=> {return scaleC(d)});
    let lStatusText = legend_status.selectAll(".lStatusText").data(status).enter();
    lStatusText.append("text")
        .attr("class", "lStatusText")
        .attr("x", 40)
        .attr("y", (d,i) => {return 15+(10*2+5)*i})
        .text(d=>{return d});

    // circles for the number of discrete variables
    let disvard = scaleR.domain();    
    let midVal = Math.round((disvard[1]+disvard[0])/10);
    let some_disvar_values = [disvard[0],midVal,disvard[1]];
    let lDisVarsCircles = legend_dis_vars.selectAll(".lDisVarsCircles").data(some_disvar_values).enter();
    lDisVarsCircles.append("circle")
        .attr("class", "lDisVarsCircles")
        .attr("cx", 20)
        .attr("cy", (d,i) => {return 30+(scaleR.range()[1]*2+5)*i})
        .attr("r", d => {return scaleR(d)})
    let lDisVarsText = legend_dis_vars.selectAll(".lDisVarsText").data(some_disvar_values).enter();
    lDisVarsText.append("text")
        .attr("class", "lDisVarsText")
        .attr("x", 40)
        .attr("y", (d,i) => {return 35+(scaleR.range()[1]*2+5)*i})
        .text(d=>{return d});
}

/**
 * Render the instance using the data
 */
function render(data) {
    // different scales depending on the data
    scaleX.domain([0,data.length-1]);
    scaleY.domain(d3.extent(data, d=>{return d["time"];}));
    scaleR.range([1,(scaleX(2)-scaleX(1))/2-2])
        .domain(d3.extent(data, d=>{return d.int_vars+d.bin_vars}));

    // define the axis
    var axisTime = d3.axisLeft(scaleY)
    axisTime.tickFormat(function(d) {
        return this.parentNode.nextSibling
            ? d
            : d + " seconds";
    });

    tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
        return "<span>"+d.instance+", "+Math.round(d.time)+" sec, "+(d.bin_vars+d.int_vars)+" dvars</span>"; 
    });
    /* Invoke the tip in the context of your visualization */
    g.call(tip)
  
    // draw the data
    let timeCircles = g.selectAll(".timeCircles").data(data).enter();
    timeCircles.append("circle")
        .attr("class", "timeCircles")
        .attr("cx", (d,i) => {return scaleX(i);})
        .attr("cy", d => {return scaleY(d["time"]);})
        .attr("r", d => {return scaleR(d.int_vars+d.bin_vars)})
        .attr("fill", d=> {return scaleC(d.status)})
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)

    // create legend
    createLegend(data);
    axis.call(axisTime);
}

/**
 * Remove data without discrete values
 * @param {Array} data 
 */
function filterNoDisc(data) {
    return data.filter(d=>{
        return d.bin_vars+d.int_vars
    })
}

/**
 * Remove data where the time is not long enough (for logarithmic scale)
 * @param {Array} data 
 */
function filterSecond(data) {
    return data.filter(d=>{
        return d.time >= 0.5
    })
}
	
// My header
var headers = ["stdout","instance","nodes","bin_vars","int_vars","constraints",
"sense","objval","best_bound","status","time"].join(",");

// First I get the file or URL data like text
d3.text("data/bnb_data.csv", function(error, data) {
    // Then I add the header and parse to csv
    data = d3.csvParse(headers +"\n"+ data,d=>{
        return {
            stdout: d.stdout,
            instance: d.instance.substr(0,d.instance.length-3).trim(), // get rid of .jl
            nodes: +d.nodes,
            bin_vars: +d.bin_vars,
            int_vars: +d.int_vars,
            constraints: +d.constraints,
            sense: d.sense.trim(),
            objval: +d.objval,
            best_bound: +d.best_bound,
            status: d.status.trim(),
            time: +d.time
        }
    }); 
    data = filterNoDisc(data);
    data = filterSecond(data);
    render(data);
});

