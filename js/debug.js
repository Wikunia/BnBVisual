var width = 1200,
height = 550,
margin_top = 20;

// Set svg width & height
var svg = d3.select('#chart').append('svg')
.attr('width', width)
.attr('height', height);

var legend_w = 100;
let axis_width = 50;

var axis = svg.append('g');
axis.attr("transform", "translate("+axis_width+", "+margin_top+")");

var axisRight = svg.append('g');
axisRight.attr("transform", "translate("+(width-legend_w-5)+", "+margin_top+")");

var widthActual = width-20-axis_width-legend_w;

// define scales
let scaleX = d3.scaleLinear().range([0,widthActual]);
let scaleY = d3.scaleLinear().range([height-margin_top*2,5]);


var g = svg.append('g');
g.attr("transform", "translate("+(axis_width+10)+", "+margin_top+")");

function getSequentialList(factor, nbranches, fpump, tree, lst=false) {
    if (!lst) {
        lst = Array(nbranches+1).fill({});
        if (fpump.hasOwnProperty("obj") && !isNaN(fpump.obj)) {
            console.log("here");
            lst[0] = {
                "timestamp": 0, // we only consider branching time here
                "integral": fpump.obj
            };
        }
    }
    if (tree.hasOwnProperty("step_obj") && tree.step_obj.hasOwnProperty("counter")) {
        lst[tree.step_obj.counter] = tree.step_obj;
    }
    if (tree.hasOwnProperty("children")) {
        for(var i=0; i < 2; i++) {
            // check for integral solution
            if (tree.children[i].hasOwnProperty("step_obj")) {
                if (tree.children[i].step_obj.node.state == "Integral") {
                    if (!lst[tree.step_obj.counter].hasOwnProperty("integral") || factor*tree.children[i].step_obj.node.best_bound > factor*lst[tree.step_obj.counter-1].integral) {
                        lst[tree.step_obj.counter].integral = tree.children[i].step_obj.node.best_bound;
                    }
                }
            }
            lst = getSequentialList(factor, nbranches, fpump, tree.children[i], lst);
        }
    }
    return lst;
}

function data2line(lst) {
    var data = [];
    for (var l of lst) {
        if (l.hasOwnProperty("node") && l.node.hasOwnProperty("best_bound")) {
            data.push({
                x: l.timestamp,
                y: l.node.best_bound,
            })
        }
    }
    return data;
}

function data2int(lst) {
    var data = [];
    for (var l of lst) {
        if (l.hasOwnProperty("integral")) {
            data.push({
                x: l.timestamp,
                y: l.integral,
            })
        }
    }
    return data;
}

var lineFunc = d3.line()
             .x(function(d) { return scaleX(d.x); })
             .y(function(d) { return scaleY(d.y); })
             .curve(d3.curveStepAfter);

function render(lst) {
    let line_data = data2line(lst);
    let int_data = data2int(lst);
    console.log("line_data: ", line_data);
    console.log("int_data: ", int_data);
    scaleX.domain([0,line_data[line_data.length-1].x]);
    let min_bound = d3.min(line_data, function(d) { return d.y; });
    let max_bound = d3.max(line_data, function(d) { return d.y; });
    let min_integral = d3.min(int_data, function(d) { return d.y; });
    let max_integral = d3.max(int_data, function(d) { return d.y; });
    min_bound = min_bound < min_integral ? min_bound : min_integral;
    max_bound = max_bound > max_integral ? max_bound : max_integral;

    scaleY.domain([min_bound-0.01*Math.abs(min_bound),max_bound+0.01*Math.abs(max_bound)]);
    console.log(scaleX.domain())
    console.log(scaleY.domain())

    let branchLines = g.selectAll(".branchLines").data([line_data]);
    branchLines.enter().append("path")
        .attr("class", "branchLines")
        .attr("stroke-width", "2px")
        .attr("fill", "none")
        .attr("d", lineFunc)
        .attr("stroke","black"); 
    
    branchLines.exit().remove();

    let integralCircles = g.selectAll(".integralCircles").data(int_data);
    integralCircles.enter().append("circle")
        .attr("class", "integralCircles")
        .attr("stroke-width", "1px")
        .attr("fill", "none")
        .attr("cx", d => {return scaleX(d.x)})
        .attr("cy", d => {return scaleY(d.y)})
        .attr("r", 2)
        .attr("stroke","black"); 
    
    integralCircles.exit().remove();

     // define the axis
     var axisBound = d3.axisLeft(scaleY)
     var axisBoundRight = d3.axisRight(scaleY)
     var axisTime = d3.axisTop(scaleX)
    
    axisTime.tickFormat(function(d) {
        return this.parentNode.nextSibling
        ? d
        : d + "s";
    });
    axisBound.tickFormat(function(d) {
        return this.parentNode.nextSibling
            ? d
            : d + "";
    });
    axisBoundRight.tickFormat(function(d) {
        return this.parentNode.nextSibling
            ? d
            : d + "";
    });

    // create legend
    g.call(axisTime);
    axis.call(axisBound);
    axisRight.call(axisBoundRight);
}

d3.json("data/json/blend852.json", function(data) {
    console.log(data);
    console.log("nbranches: ", data.solution.nbranches)
    let factor = 1;
    if (data.info.sense == "Min") {
        factor = -1;
    }
    let fpump = {};
    if (data.hasOwnProperty("fpump")) {
        fpump = data.fpump;
    }
    lst = getSequentialList(factor, data.solution.nbranches, fpump, data.tree);
    render(lst);
});