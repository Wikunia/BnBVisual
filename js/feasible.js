var width = 1300,
height = 600,
centered;
var max_time = 3600;

var files = ["minlib_extra","couenne-nlw","scip-nlw","bonmin-nlw","knitro-nlw","juniper",
"juniper-bs-nsr","juniper-bs-r","juniper-ipopt-grb","juniper-ic","juniper-p02",
"juniper-p04","juniper-p08","juniper-p16","juniper-ts-dbfs"];

var legend_w = 100;

// Set svg width & height
var svg = d3.select('#chart').append('svg')
.attr('width', width)
.attr('height', height);

let axis_width = 100;

var axis = svg.append('g');
axis.attr("transform", "translate(0, 20)");

var widthActual = width-20-axis_width-legend_w;
var g = svg.append('g');
g.attr("transform", "translate("+(axis_width+10)+", 20)");

var legend = svg.append('g').attr("class","legend");
legend.attr("transform", "translate("+(width-legend_w+10)+",20)");

// define scales
let scaleX = d3.scaleLinear().range([0,widthActual]);
let scaleY = d3.scaleLinear().range([80,height-20*2]);
let scaleC = d3.scaleLog().range([d3.rgb(0,255,0),d3.rgb(255,128,0)]);


sortInst = function(a,b) {
    return a.inst < b.inst ? -1 : 1;
}

function color(d) {
    if (d.status == "Error") {
        return "black";
    }
    if (d.status == "Infeasible") {
        return d3.rgb(50,50,50);
    }
    if (d.status == "Unbounded") {
        return d3.rgb(128,128,128);
    }
    if (isNaN(d.gap) || d.gap > scaleC.domain()[1]) {
        return d3.rgb(255,0,0);
    }
    return scaleC(d.gap);
}

function strokeColor(d) {
    let statusColor = {
        "Error": "black",
        "Infeasible": d3.rgb(50,50,50),
        "Unbounded": d3.rgb(128,128,128),
        "Optimal": "green",
        "UserLimit": d3.rgb(255,228,0)
    }
    return statusColor[d.status];
}

/**
* Render the instance using the data
*/
function render(data,first_render=true) {
    scaleX.domain([0,data[0].data.length]);
    scaleY.domain([0,data.length]);
    scaleC.domain([0.0001,0.10]);
    let rects = {};

    tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
        if (d.alg == "minlib_extra") {
            // show objective for minlip (which just represents the global objective)
            return "<span>Obj: "+d.objVal+"</span>";
        }
        if (d.status == "Infeasible" || d.status == "Error" || d.status == "Unbounded") {
            return "<span>"+d.status+"</span>";
        }
        return "<span>"+d.status+", Gap:"+(d.gap*100).toFixed(2)+"%</span>"; 
    });
    /* Invoke the tip in the context of your visualization */
    g.call(tip)
  

    for (let di = 0; di < data.length; di++) {
        let alg = data[di]["alg"];
        rects[alg] = g.selectAll(".rects-"+alg).data(data[di].data);
        rects[alg].enter().append("rect")
            .attr("class", "rects-"+alg)
            .on('mouseover', (d) => {return tip.show(d)})
            .on('mouseout', tip.hide)
            .attr("x", (d,i) => {return scaleX(i)})
            .attr("y", (d,i) => {return scaleY(di)})
            .attr("width", (d,i) => {return scaleX(i+1)-scaleX(i)-6})
            .attr("height", (d,i) => {return scaleY(di+1)-scaleY(di)-6})
            .attr("stroke-width", "4px")
            .attr("stroke", d => {return strokeColor(d)})
            .attr("fill", d => {return color(d)})
            .attr("data-objVal", d => {return d.objVal})
            .attr("data-status", d => {return d.status})
            .attr("data-gap", d => {return d.gap})
        rects[alg].exit().remove();
    }

    let axisLeft = axis.selectAll(".axisLeft").data(data);
    axisLeft.enter().append("text")
        .attr("class", "axisLeft")
        .attr("x", 0)
        .attr("y", (d,i) => {return scaleY(i)+(scaleY(i+1)-scaleY(i))/2})
        .text(d=>{
            let desc = d.alg;
            desc = desc.replace("juniper-","jun-") 
            return desc;
        })
    axisLeft.exit().remove();

    let axisTop = g.selectAll(".axisTop").data(data[0].data);
    axisTop.enter().append("text")
        .attr("class", "axisTop")
        .attr("y", 75)
        .attr("x", (d,i) => {return scaleX(i)+(scaleX(i+1)-scaleX(i))/2})
        .attr("transform", (d,i) => {return "rotate(330, "+(scaleX(i)+(scaleX(i+1)-scaleX(i))/2)+", 75)"} )
        .text(d=>{
            let short = d.inst.replace("genpooling_meyer", "GP_M");
            short = short.replace("genpooling", "GP");
            short = short.replace("graphpart_clique", "GP_C");
            short = short.replace("routingdelay", "RD");
            short = short.replace("crudeoil_pooling", "C_P");
            short = short.replace("graphpart_3pm", "GP_3");
            short = short.replace("multiplants", "MP");
            short = short.replace("watercontamination", "WC");
            short = short.replace("supplychain", "SC");
        
            return short})
    axisTop.exit().remove();
}


getandrenderdata(0,files,{});

var headers = ["stdout","instance","nodes","bin_vars","int_vars","constraints",
"sense","objVal","best_bound","status","time"].join(",");

var headers_obj = ["instance", "var", "constr", "bin", "int", "nl_constr","sense","dual","primal"].join(",");

function getdata(section,cb) {
    d3.text("data/"+section+"_data.csv", function(error, data) {
        if (section == "minlib_extra") {
            data = d3.csvParse(headers_obj +"\n"+ data,d=>{
                return {
                    instance: d.instance,
                    bin_vars: +d.bin,
                    int_vars: +d.int,
                    objVal: +d.primal,
                    status: d.primal != "" ? "Optimal" : "Error"
                }
            }); 
        } else {
            data = d3.csvParse(headers +"\n"+ data,d=>{
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
                    status: getRealStatus(d),
                    time: +d.time
                }
            }); 
        }
        data = filterNoDisc(data);
        cb(data);   
    });
}


function setGaps(data) {
    for (let i = 0; i < data[0].data.length; i++) {
        for (let ai = 1; ai < data.length; ai++) {
            data[ai].data[i].gap = computeGlobGap(data,ai,i);
        }
    }
    return data;
}


function determineSortOrder(data) {
    for (let i = 0; i < data[0].data.length; i++) {
        let difficulty = 0;
        for (let ai = 1; ai < data.length; ai++) {
            let status = data[ai].data[i].status;
            if (status == "Unbounded") {
                difficulty += 50;
            }
            if (status == "Error") {
                difficulty += 40;
            }
            if (status == "Infeasible") {
                difficulty += 30;
            }
            if (data[ai].data[i].gap > 0.0001) {
                difficulty += 1;
            }
            if (data[ai].data[i].gap > 1) {
                difficulty += 2;
            }
            if (data[ai].data[i].gap > 5) {
                difficulty += 10;
            }
            if (isNaN(data[ai].data[i].gap)) {
                difficulty += 20;
            }
        }
        for (let ai = 0; ai < data.length; ai++) {
            data[ai].data[i].difficulty = difficulty;
        }
    }
    return data;
}

function getandrenderdata(i,files,data) {
    let file = files[i];
    getdata(file,function(d) {
        d = filterInstances(d);
        data[file] = d;
        if (i == files.length-1) {
            data = fillNotDefined(data);
            data = algArray(data);
            for (let di = 0; di < data.length; di++) {
                data[di].data.sort(sortInst);
            }
            let maxTime = 0;
            for (let alg in data) {
                let maxInAlg = Math.max(...data[alg].data.map(d => {return d.time}));
                maxTime = maxTime > maxInAlg ? maxTime : maxInAlg;
            }
            // first sort by name
            for (let ai = 0; ai < data.length; ai++) {
                data[ai].data.sort((a,b) => {
                    return a.inst < b.inst ? -1 : 1;
                })
            }
            data = setGaps(data);
            data = determineSortOrder(data);
            // sort by difficult rank
            for (let ai = 0; ai < data.length; ai++) {
                data[ai].data.sort((a,b) => {
                    return a.difficulty < b.difficulty ? -1 : 1;
                })
            }
            render(data);
        }else {
          getandrenderdata(i+1,files,data)
        }
    }); 
}


