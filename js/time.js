var width = 1200,
    height = 600,
    centered;

var legend_w = 200;

// My header
var headers;
var ots = false;
if (getQueryVariable("ots") == "true") {
    ots = true;
    headers = ["stdout","instance","bus","branch","objval","best_bound","time","status"].join(",");
} else {
    headers = ["stdout","instance","nodes","bin_vars","int_vars","constraints",
    "sense","objval","best_bound","status","time"].join(",");
}

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

 var legend = svg.append('g').attr("class","legend");
legend.attr("transform", "translate("+(width-legend_w+10)+",20)");

// define scales
let scaleX = d3.scaleLinear().range([0,widthActual]);
let scaleY = d3.scaleLog().range([height-20*2,5]);
let scaleR = d3.scaleLog();


function getRadius(d) {
    if (ots) {
        return scaleR(d.bus);
    }
    return scaleR(d.int_vars+d.bin_vars);
}

function getColor(status) {
    let statusColor = {
        "UserLimit": d3.rgb(31, 119, 180),
        "Optimal": d3.rgb(44, 160, 44),
        "LocalOptimal": d3.rgb(44, 160, 44),
        "Infeasible": d3.rgb(214, 39, 40),
        "LocalInfeasible": d3.rgb(214, 39, 40),
        "Unbounded": d3.rgb(100,100,100),
        "Error": "black"
    };
    return statusColor[status];
}


/**
 * Draw the legend
 * @param {Array} data 
 */
function createLegend(data) {
    d3.selectAll(".legend > *").remove();
    // Legend text
    let tlegend = legend.selectAll(".tlegend").data(data);
    tlegend.enter().append("text")
        .attr("class", "tlegend")
        .attr("y", 10)
        .attr("font-family", "sans-serif")
        .text("Legend");
    tlegend.exit().remove();

    let all_status = Array.from(data, d=>{return d.status});
    let status = [...new Set(all_status)];
    
    let legend_status = legend.append('g');
    let legend_dis_vars = legend.append('g');
    legend_status.attr("transform", "translate(0,20)");
    let height_status = 50+(10*2+5)*status.length;
    legend_dis_vars.attr("transform", "translate(0,"+height_status+")");
    let radiusTextObj = legend_dis_vars.selectAll(".radiusTextObj").data(data);
    let radiusText = ots ? "#Bus" : "#Discrete Variables";
    radiusTextObj.enter().append("text")
    .attr("class", "radiusTextObj")
    .attr("y", 10)
    .attr("font-family", "sans-serif")
    .text(radiusText);
    radiusTextObj.exit().remove();

    // status circles
    let lStatusCircles = legend_status.selectAll(".lStatusCircles").data(status);
    lStatusCircles.enter().append("circle")
        .attr("class", "lStatusCircles")
        .attr("cx", 20)
        .attr("cy", (d,i) => {return 10+(10*2+5)*i})
        .attr("r", 10)
        .attr("fill", d=> {return getColor(d)});
    let lStatusText = legend_status.selectAll(".lStatusText").data(status);
    lStatusText.enter().append("text")
        .attr("class", "lStatusText")
        .attr("x", 40)
        .attr("y", (d,i) => {return 15+(10*2+5)*i})
        .text(d=>{return d});

    lStatusText.exit().remove();
    lStatusCircles.exit().remove();

    // circles for the number of discrete variables
    let disvard = scaleR.domain();    
    let midVal = Math.round((disvard[1]+disvard[0])/10);
    let some_disvar_values = [disvard[0],midVal,disvard[1]];
    let lDisVarsCircles = legend_dis_vars.selectAll(".lDisVarsCircles").data(some_disvar_values);
    lDisVarsCircles.enter().append("circle")
        .attr("class", "lDisVarsCircles")
        .merge(lDisVarsCircles)
        .attr("cx", 20)
        .attr("cy", (d,i) => {return 30+(scaleR.range()[1]*2+5)*i})
        .attr("r", d => {return scaleR(d)})
    let lDisVarsText = legend_dis_vars.selectAll(".lDisVarsText").data(some_disvar_values);
    lDisVarsText.enter().append("text")
        .attr("class", "lDisVarsText")
        .merge(lDisVarsText)
        .attr("x", 40)
        .attr("y", (d,i) => {return 35+(scaleR.range()[1]*2+5)*i})
        .text(d=>{return d});
    lDisVarsCircles.exit().remove();
    lDisVarsText.exit().remove();
}

/**
 * Render the instance using the data
 */
function render(data) {
    // different scales depending on the data
    scaleX.domain([0,data.length-1]);
    scaleY.domain(d3.extent(data, d=>{return d["time"];}));
    if (ots) {
        scaleR.range([1,(scaleX(2)-scaleX(1))/2-2])
            .domain(d3.extent(data, d=>{return d.bus}));
    } else {
        scaleR.range([1,(scaleX(2)-scaleX(1))/2-2])
        .domain(d3.extent(data, d=>{return d.int_vars+d.bin_vars}));
    }

    // define the axis
    var axisTime = d3.axisLeft(scaleY)
    axisTime.tickFormat(function(d) {
        return this.parentNode.nextSibling
            ? d
            : d + " seconds";
    });

    if (ots) {
        tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
            return "<span>"+d.instance+", "+Math.round(d.time)+" sec, "+(d.bus)+" bus</span>"; 
        });
    } else {
        tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
            return "<span>"+d.instance+", "+Math.round(d.time)+" sec, "+(d.bin_vars+d.int_vars)+" dvars</span>"; 
        });
    }
    /* Invoke the tip in the context of your visualization */
    g.call(tip)
  
    // the key of the data is the instance for updating
    let timeCircles = g.selectAll(".timeCircles").data(data, d => { return d.instance; });

    timeCircles.enter().append("circle")
        .attr("class", "timeCircles")
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .merge(timeCircles) // enter + update
        .transition()
        .attr("cx", (d,i) => {return scaleX(i);})
        .attr("cy", d => {return scaleY(d["time"]);})
        .attr("r", d => {return getRadius(d)})
        .attr("fill", d=> {return getColor(d.status)})
        .attr("id", d => {return "circle-"+d.instance;})
        

    timeCircles.exit().remove();
    
    
    // create legend
    createLegend(data);
    axis.call(axisTime);
}


d3.select('#file')
.on("change", function () {
    var sect = document.getElementById("file");
    var section = sect.options[sect.selectedIndex].value;
    getandrenderdata(section);
});

d3.select('#instance_search')
.on("keyup", function () {
    var instname = document.getElementById("instance_search").value;
    for (let circle of g.selectAll(".timeCircles").data()) {
        if ((circle.instance.indexOf(instname) >= 0) && (instname.length > 0)) {
            g.select("#circle-"+circle.instance)
            .attr("stroke-width", "2px")
            .attr("stroke", "orange")
        } else {
            g.select("#circle-"+circle.instance)
            .attr("stroke-width", "0px")
        }
    }
});

// initial
var sect = document.getElementById("file");
var section = sect.options[sect.selectedIndex].value;
getandrenderdata(section);

function getandrenderdata(section) {
    // First I get the file or URL data like text
    d3.text("data/"+section+".csv", function(error, data) {
        // Then I add the header and parse to csv
        data = d3.csvParse(headers +"\n"+ data,d=>{
            if (ots) {
                return {
                    stdout: d.stdout,
                    instance: d.instance.trim(), 
                    bus: +d.bus,
                    branch: +d.branch,
                    objval: +d.objval,
                    best_bound: +d.best_bound,
                    status: getRealStatus(d),
                    time: +d.time
                }
            } else {
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
                    status: getRealStatus(d),
                    time: +d.time
                }
            }
        }); 
        if (!ots) {
            data = filterInstances(data);
        }
        data = mapSecond(data);
        if (ots) {
            data.sort(byBus);
        } else {
            data.sort(byDiscrete);
        }
        render(data);        
    });
}


