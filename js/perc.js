var qcompact = getQueryVariable("compact");
var qparallel = getQueryVariable("parallel");
var qconfigs = getQueryVariable("configs");
var qdevel = getQueryVariable("devel");
var qconference = getQueryVariable("conference");
var compact = qcompact ? true : false;
var parallel = qparallel ? true : false;
var configs = qconfigs ? true : false;
var devel = qdevel ? true : false;
var conference = qconference ? true : false;

var width = 1200,
height = 550,
legend_nof_instances = 298;
var set_100_perc = true;

var max_time = 3600;
var fixTime = true; // everything above max_time will set to UserLimit
var best_juniper = true;

/*
    Paper:
    panorama compact: 900x400 later 900x370
    compact: 450x400 later 450*370
*/

if (compact) {
    width = 450;
    height = 400;
}

// My header
var headers;
var ots = false;
var files;
if (getQueryVariable("ots") == "true") {
    ots = true;
    headers = ["stdout","instance","bus","branch","objVal","best_bound","time","status"].join(",");
    files = ["ots-juniper","ots-bonmin","ots-couenne","ots-bonmin-nlw","ots-couenne-nlw"];
} else {
    headers = ["stdout","instance","nodes","bin_vars","int_vars","constraints",
    "sense","objVal","best_bound","status","time"].join(",");


    if (compact) {
        files = ["juniper", "bonmin-nlw","minotaur-nlw","knitro-nlw","couenne-nlw","scip-nlw"];
    } else {      
         files = ["juniper","juniper-bs-nsr","juniper-bs-r","juniper-ipopt-grb",
            "juniper-ipopt-cbc","juniper-ipopt-glpk","juniper-ipopt","juniper-ic","juniper-p02",
             "juniper-p04","juniper-p08","juniper-p16","juniper-ts-dbfs",
              "bonmin-nlw","knitro-nlw","minotaur-nlw","couenne-nlw","scip-nlw"];
    }
    if (parallel) {
        files = ["juniper", "juniper-p02","juniper-p04","juniper-p08","juniper-p16"];
    }
    if (configs) {
        files = ["juniper-ipopt","juniper-ipopt-grb","juniper-ipopt-glpk","juniper-ipopt-cbc",
                 "juniper-knitro-cbc"];
    }
    if (devel) {
        set_100_perc = false;
        files = ["devel/juniper_020", "devel/juniper_v0.2.2_debug", "devel/juniper_v0.2.2_inf_gains"];
    }
    if (conference) {
        set_100_perc = false;
        files = ["juniper", "juniper-p16", "bonmin-nlw","minotaur-nlw","knitro-nlw","couenne-nlw","scip-nlw"];
    }
}

var legend_w = 300;

// Set svg width & height
var svg = d3.select('#chart').append('svg')
.attr('width', width)
.attr('height', height);

let axis_width = 50;
let margin_top = 40;

var axis = svg.append('g');
axis.attr("transform", "translate("+axis_width+", "+margin_top+")");

var axisRight = svg.append('g');
axisRight.attr("transform", "translate("+(width-legend_w-5)+", "+margin_top+")");

var widthActual = width-20-axis_width-legend_w;
if (compact) {
    widthActual += legend_w-30;
    axisRight.attr("transform", "translate("+(width-35)+", "+margin_top+")");
}

// define scales
let scaleX = d3.scaleLog().range([0,widthActual]);
let linearScale = false;
if (parallel) {
    linearScale = true;
    scaleX = d3.scaleLinear().range([0,widthActual]);
}

let scaleY = d3.scaleLinear().range([height-margin_top*2,5]);
let scaleC = d3.scaleOrdinal(d3.schemeCategory20);
if (compact) {
    scaleC = d3.scaleOrdinal().range([d3.hsl(0, 0.5, 0),d3.hsl(50, 0.5, 0.20),
        d3.hsl(100, 0.5, 0.40),d3.hsl(150, 0.5, 0.60),d3.hsl(200, 0.5, 0.80)]);
}


var g = svg.append('g');
g.attr("transform", "translate("+(axis_width+10)+", "+margin_top+")");

var legend = svg.append('g').attr("class","legend");
if (!compact) {
    legend.attr("transform", "translate("+(width-legend_w+35)+","+margin_top+")");
} else {
    if (linearScale) {
        legend.attr("transform", "translate("+(width-legend_w+100)+","+(margin_top+100)+")");
    } else {
        legend.attr("transform", "translate("+(axis_width)+","+margin_top+")");
    }   
}

var yAxisName = svg.append('g').attr("class","yAxisName");
yAxisName.attr("transform", "translate(0,"+margin_top+")");

var xAxisName = svg.append('g').attr("class","xAxisName");
xAxisName.attr("transform", "translate("+(axis_width+10+(widthActual)/2)+","+(margin_top-25)+")");



/**
 * Draw legend
 * @param {Array} data 
 * @param {Float} maxTime 
 * @param {Float} max_perc 
 */
function createLegend(data,maxTime,max_perc) {
    d3.selectAll(".legend > *").remove();

    if (!compact) {
        // Legend text
        let tlegend = legend.append("text")
            .attr("class", "tlegend")
            .attr("y", 10)
            .attr("font-family", "sans-serif")
            .text("Legend");
        tlegend.exit().remove();
    }

    let legend_alg = legend.append('g');
    legend_alg.attr("transform", "translate(0,20)");

    // status circles
    let lAlg = legend_alg.selectAll(".lAlg").data(data);
    lAlg.enter().append("circle")
        .attr("class", "lAlg")
        .attr("cx", 20)
        .attr("cy", (d,i) => {
            if (compact) {
                return (7*2+5)*i
            } else {
                return 10+(10*2+5)*i
            }
        })
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
        .attr("x", 30)
        .attr("y", (d,i) => {
            if (compact) {
                return 5+(7*2+5)*i
            } else {
                return 15+(10*2+5)*i
            }
        })
        .text(d=>{
            let t = d.alg;
            t = t.replace("ots-","")
            let split = t.split("/")
            if (split.length > 1) {
                t = split[split.length-1];
            }
            t = t.replace("juniper-ipopt", "jp-ipopt");
            t = t.replace("juniper-knitro", "jp-knitro");

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
        let first50 = true;
        for (let t of times) {
            // if there is a problem which took exactly 1s
            if (first && t == 1) {
                first = false;
            } else {
                n += 1
            }
            if (t >= 1) {
                var N = data[alg].data.length;
                if (set_100_perc) {
                    N = legend_nof_instances
                }
                data[alg].line.push({
                    x: t,
                    y: (n/N)*100,
                })
                lastY = (n/N)*100;
                if (lastY >= 50 && first50) {
                    first50 = false;
                }
            }
        }
        /*data[alg].line.unshift({
            x: 1,
            y: 0,
        })*/
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
    if (linearScale) {
        scaleX.domain([0,maxTime]);
    } else {
        scaleX.domain([1,maxTime]);
    }
    scaleY.domain([0,Math.min(Math.ceil(max_perc+5),100)]);

    // define the axis
    var axisSolved = d3.axisLeft(scaleY)
    var axisSolvedRight = d3.axisRight(scaleY)
    var axisTime = d3.axisTop(scaleX)
    if (!linearScale) {
        axisTime.tickFormat(function(d) {
            return this.parentNode.nextSibling
                ? (([1,5,10,50,100,500,1000].indexOf(d) >= 0) ? d : "")
                : d + "s";
        });
    } else {
        axisTime.tickFormat(function(d) {
            return this.parentNode.nextSibling
            ? d
            : d + "s";
        });
    }
    axisSolved.tickFormat(function(d) {
        return this.parentNode.nextSibling
            ? d
            : d + "%";
    });
    axisSolvedRight.tickFormat(function(d) {
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
    axisRight.call(axisSolvedRight);


    d3.selectAll(".yName").remove();
    d3.selectAll(".xName").remove();
    let yName = yAxisName.append("text")
        .attr("class", "yName")
        .attr("text-anchor", "middle")  
        .attr("font-family", "sans-serif")
        .attr("transform", "translate(15,"+(height/2-margin_top)+") rotate(-90)")
        .text("Solved (n="+legend_nof_instances+")");
    

    let xName = xAxisName.append("text")
        .attr("class", "xName")
        .attr("text-anchor", "middle")  
        .attr("font-family", "sans-serif")
    xName.text("Time (log, seconds)");
    if (linearScale) {
        xName.text("Time (seconds)");
    }
    
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
            if (d.stdout.length == 0) {
                return;
            }
            if (ots) {
                return {
                    stdout: d.stdout,
                    instance: d.instance.trim(), 
                    bus: +d.bus,
                    branch: +d.branch,
                    objVal: +d.objVal,
                    best_bound: +d.best_bound,
                    status: getRealStatus(d, fixTime),
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
                    objVal: +d.objVal,
                    best_bound: +d.best_bound,
                    status: getRealStatus(d, fixTime),
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

var bestJuniperFirst = true;
var bestJuniperObj;
function getandrenderdata(i,files,data) {
    let file = files[i];
    getdata(file,function(d) {
        // d = filterInstances(d);
        let parts = file.split("/")
        let solver = parts.length > 1 ? parts[1] : parts[0];
        if (solver.substr(0,7) == "juniper" && solver.substr(0,9) != "juniper-p" && best_juniper) {
            if (bestJuniperFirst) {
                bestJuniperFirst = false;
                bestJuniperObj = arr2Obj(d,"instance");
            } else {
                updateBest(bestJuniperObj,arr2Obj(d,"instance"));
            }
        }

        data[file] = d;
        if (i == files.length-1) {
            if (best_juniper) {
                files.push("juniper-combined");
                data["juniper-combined"] = obj2Arr(bestJuniperObj);
            }
            data = fillNotDefined(data);
            data = algArray(data);
            nof_instances = data[0].data.length;
            if (set_100_perc) {
                nof_instances = legend_nof_instances;
            }

            d3.select("#title").text(d3.select("#title").text()+" ("+nof_instances+" Instances) ");
            let maxTime = 0;
            for (let alg in data) {
                let maxInAlg = Math.max(...data[alg].data.map(d => {return d.time}));
                maxTime = maxTime > maxInAlg ? maxTime : maxInAlg;
            }
            maxTime = 4000;
            data,max_perc = data2line(data,maxTime);
            render(data,maxTime,max_perc);
        }else {
          getandrenderdata(i+1,files,data)
        }
    }); 
}


