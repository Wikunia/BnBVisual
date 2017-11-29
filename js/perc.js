var width = 1200,
height = 600,
centered;

// My header
var headers;
var ots = false;
var files;
if (getQueryVariable("ots") == "true") {
    ots = true;
    headers = ["stdout","instance","bus","branch","objval","best_bound","time","status"].join(",");
    files = ["ots-minlpbnb","ots-bonmin","ots-couenne","ots-bonmin-nlw","ots-couenne-nlw"];
} else {
    headers = ["stdout","instance","nodes","bin_vars","int_vars","constraints",
    "sense","objval","best_bound","status","time"].join(",");
    files = ["bnb","bnb-bs-mi","bnb-bs-r","bnb-p02",
    "bnb-p04","bnb-p08","bnb-p16","bnb-ts-dfs","bnb-ts-dbfs","bonmin","couenne","bonmin-nlw","couenne-nlw","scip-nlw","knitro-nlw"];
}

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
g.attr("transform", "translate("+(axis_width+10)+", 20)");

var legend = svg.append('g').attr("class","legend");
legend.attr("transform", "translate("+(width-legend_w+10)+",20)");

// define scales
let scaleX = d3.scaleLog().range([0,widthActual]);
let scaleY = d3.scaleLinear().range([height-20*2,5]);
let scaleC = d3.scaleOrdinal(d3.schemeCategory20);

/**
 * Draw legend
 * @param {Array} data 
 * @param {Float} maxTime 
 * @param {Float} max_perc 
 */
function createLegend(data,maxTime,max_perc) {
    d3.selectAll(".legend > *").remove();
    // Legend text
    let tlegend = legend.selectAll(".tlegend").data(data);
    tlegend.enter().append("text")
        .attr("class", "tlegend")
        .attr("y", 10)
        .attr("font-family", "sans-serif")
        .text("Legend");
    tlegend.exit().remove();

    let legend_alg = legend.append('g');
    legend_alg.attr("transform", "translate(0,20)");

    // status circles
    let lAlg = legend_alg.selectAll(".lAlg").data(data);
    lAlg.enter().append("circle")
        .attr("class", "lAlg")
        .attr("cx", 20)
        .attr("cy", (d,i) => {return 10+(10*2+5)*i})
        .attr("r", 3)
        .attr("fill", d=> {
            if ("no" in d && d.no) {
                return "white";
            } else {
                return d.color
            }
        });
    let lAlgText = legend_alg.selectAll(".lAlgText").data(data);
    lAlgText.enter().append("text")
        .attr("class", "lAlgText")
        .attr("x", 40)
        .attr("y", (d,i) => {return 15+(10*2+5)*i})
        .text(d=>{
            let t = d.alg;
            t = t.replace("ots-","")
            return t;
        })
        .on("click", (d,i) => {
            if ("no" in d && d.no) {
                data[i].no = false
            } else {
                data[i].no = true;
            }
            render(data,maxTime,max_perc,first_render=false);
        });

    lAlgText.exit().remove();
    lAlg.exit().remove();
}

numberSort = function (a,b) {
    return a - b;
};

/**
 * Convert data to line format
 * @param {Array} data 
 * @param {Float} maxTime 
 */
function data2line(data,maxTime) {
    let max_perc = 0
    for (let alg in data) {
        let dalg = data[alg].data;
        data[alg].line = [];
        let fdata = dalg.filter(d => {
            return d.status == "Optimal" || d.status == "LocalOptimal";
        });
        let times = fdata.map(d => {
            return d.time;
        });
        times.push(1);
        times = times.sort(numberSort);
        let n = 0;
        let first = true;
        for (let t of times) {
            // if there is a problem which took exactly 1s
            if (first && t == 1) {
                first = false;
            } else {
                n += 1
            }
            if (t >= 1) {
                data[alg].line.push({
                    x: t,
                    y: (n/data[alg].data.length)*100,
                })
                lastY = (n/data[alg].data.length)*100;
            }
        }
        data[alg].line.unshift({
            x: 1,
            y: 0,
        })
        data[alg].line.push({
            x: maxTime,
            y: lastY,
        })
        if (lastY > max_perc) {
            max_perc = lastY;
        }
    }
    return data,max_perc;
}

/**
* Render the instance using the data
*/
function render(data,maxTime,max_perc,first_render=true) {
    // different scales depending on the data
    // get maximum in time
    scaleX.domain([1,maxTime]);
    scaleY.domain([0,Math.min(Math.ceil(max_perc+5),100)]);

    // define the axis
    var axisSolved = d3.axisLeft(scaleY)
    var axisTime = d3.axisTop(scaleX)
    axisTime.tickFormat(function(d) {
        return this.parentNode.nextSibling
            ? (([1,5,10,50,100,500,1000,3000].indexOf(d) >= 0) ? d : "")
            : d + "s";
    });
    axisSolved.tickFormat(function(d) {
        return this.parentNode.nextSibling
            ? d
            : d + "%";
    });

    let fdata = data.filter(d=> {
        if ("no" in d && d.no) {
            return false;
        } else {
            return true;
        }
    })

    let solvedLines = g.selectAll(".solvedLines").data(fdata, d=>{return d.alg});
    if (first_render) {
        for (let di in data) {
            data[di].color = scaleC(data[di].alg);
        }
    }

    solvedLines.enter().append("path")
        .attr("class", "solvedLines")
        .attr("stroke-width", "2px")
        .attr("d", d=>{return lineFunc(d.line);})
        .attr("stroke", d=>{
            return d.color
        });
            
    
    solvedLines.exit().remove();

    // create legend
    createLegend(data,maxTime,max_perc);
    g.call(axisTime);
    axis.call(axisSolved);
}

var lineFunc = d3.line()
             .x(function(d) { return scaleX(d.x); })
             .y(function(d) { return scaleY(d.y); })
             .curve(d3.curveStepAfter);

getandrenderdata(0,files,{});

function getdata(section,cb) {
    // First I get the file or URL data like text
    d3.text("data/"+section+"_data.csv", function(error, data) {
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
            data = filterNoDisc(data);
        }
        cb(data);   
    });
}

function getandrenderdata(i,files,data) {
    let file = files[i];
    getdata(file,function(d) {
        data[file] = d;
        if (i == files.length-1) {
            data = fillNotDefined(data);
            data = algArray(data);
            nof_instances = data[0].data.length;
            d3.select("#title").text(d3.select("#title").text()+" ("+nof_instances+" Instances) ");
            let maxTime = 0;
            for (let alg in data) {
                let maxInAlg = Math.max(...data[alg].data.map(d => {return d.time}));
                maxTime = maxTime > maxInAlg ? maxTime : maxInAlg;
            }
            data,max_perc = data2line(data,maxTime);
            render(data,maxTime,max_perc);
        }else {
          getandrenderdata(i+1,files,data)
        }
    }); 
}


