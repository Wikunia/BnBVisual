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
g.attr("transform", "translate("+(axis_width+10)+", 20)");

var legend = svg.append('g').attr("class","legend");
legend.attr("transform", "translate("+(width-legend_w+10)+",20)");

// define scales
let scaleX = d3.scaleLog().range([0,widthActual]);
let scaleY = d3.scaleLinear().range([height-20*2,5]);
let scaleC = d3.scaleOrdinal(d3.schemeCategory20);

/**
* Draw the legend
* @param {Array} data 
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
        .text(d=>{return d.alg})
        .on("click", (d,i) => {
            if ("no" in d && d.no) {
                data[i].no = false
            } else {
                data[i].no = true;
            }
            console.log(data);
            render(data,maxTime,max_perc,first_render=false);
        });

    lAlgText.exit().remove();
    lAlg.exit().remove();
}

function data2line(data,steps) {
    let max_perc = 0
    for (let alg in data) {
        let dalg = data[alg].data;
        data[alg].line = [];
        for (let step of steps) {
            let n = 0;
            for (let d of dalg) {
                if (d.time < step && d.status == "Optimal") {
                   n += 1;
                }                
            }
             data[alg].line.push({
                 x: step,
                 y: (n/data[alg].data.length)*100,
             })
             if ((n/data[alg].data.length)*100 > max_perc) {
                 max_perc = (n/data[alg].data.length)*100;
             }
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
            ? d
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
    console.log("fdata", fdata);
    if (first_render) {
        for (let di in data) {
            data[di].color = scaleC(data[di].alg);
        }
    }

    solvedLines.enter().append("path")
        .attr("class", "solvedLines")
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
             .curve(d3.curveLinear);
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

var files = ["bnb","bnb-bs-mi","bnb-bs-sr","bnb-p02",
"bnb-p04","bnb-p08","bnb-p16","bnb-ts-bfs","bnb-ts-dbfs","bonmin","couenne"];

getandrenderdata(0,files,{});

// My header
var headers = ["stdout","instance","nodes","bin_vars","int_vars","constraints",
"sense","objval","best_bound","status","time"].join(",");

function getdata(section,cb) {
    // First I get the file or URL data like text
    d3.text("data/"+section+"_data.csv", function(error, data) {
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
        cb(data);   
    });
}

function numberRange (start, end) {
    return new Array(end - start).fill().map((d, i) => i + start);
}

function getDiff(left, right) {
    let ret = { add_l: [], add_r: [] };
    for (var i = 0; i < right.length; i++) {
      if (left.indexOf(right[i]) < 0)
        ret['add_l'].push(right[i]);
    }
    for (var i = 0; i < left.length; i++) {
      if (right.indexOf(left[i]) < 0)
        ret['add_r'].push(left[i]);
    }
    return ret;
}

function fillNotDefined(data) {
    let keys = Object.keys(data);
    console.log(keys);
    for (let algi in keys) {
        algi = +algi
        let alg = keys[algi];
        if (algi == keys.length-1) {
            break;
        }
        for (let oalgi of numberRange(algi,keys.length)) {
            let oalg = keys[oalgi];
            let alg_instances = [];
            let oalg_instances = [];
            for (let inst of data[alg]) {
                alg_instances.push(inst.instance);
            }
            for (let inst of data[oalg]) {
                oalg_instances.push(inst.instance); 
            }
            let diff = getDiff(alg_instances,oalg_instances);
            for (let inst of diff["add_l"]) {
                data[alg].push(nanrow(inst));
            }
            for (let inst of diff["add_r"]) {
                data[oalg].push(nanrow(inst));
            }
        }
    }
    return data;
}

function nanrow(inst) {
    return {
        stdout:"-",
        instance: inst,
        nodes: NaN,
        bin_vars:NaN,
        int_vars: NaN,
        constraints: NaN,
        sense: NaN,
        objval: NaN,
        best_bound: NaN,
        status: "Error",
        time: 0}
}

function algArray(data) {
    let algObj = {};
    for (let alg in data) {
        if (!(alg in algObj)) {
            algObj[alg] = [];
        }
        for (let o of data[alg]) {
            let inst = o.instance;
            algObj[alg].push({alg: alg, inst: inst, time:o.time,status:o.status});
        }
    }   
    let algArr = [];
    for (let alg in algObj) {
        algArr.push({alg: alg, data:algObj[alg]})
    }
    return algArr;
}

function getandrenderdata(i,files,data) {
    let file = files[i];
    getdata(file,function(d) {
        data[file] = d;
        if (i == files.length-1) {
            console.log(data);
            data = fillNotDefined(data);
            console.log(data);
            data = algArray(data);
            console.log("instArr: ",data);
            let maxTime = 0;
            for (let alg in data) {
                let maxInAlg = Math.max(...data[alg].data.map(d => {return d.time}));
                maxTime = maxTime > maxInAlg ? maxTime : maxInAlg;
            }
            console.log("maxTime: ", maxTime);
            data,max_perc = data2line(data,numberRange(1,Math.ceil(maxTime)));
            render(data,maxTime,max_perc);
        }else {
          getandrenderdata(i+1,files,data)
        }
    }); 
}


