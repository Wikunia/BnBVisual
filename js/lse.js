var width = 1300,
height = 1000,
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
let scaleY = d3.scaleLinear().range([30,height-20*2]);
let scaleC = d3.scaleLog().range([d3.rgb(0,255,0),d3.rgb(255,128,0)]);

function color(val) {
    if (val == 0) {
        return "white";
    } 
    return "black";
}

/**
* Render the instance using the data
*/
function render(mat,debug_json,first_render=true) {
    scaleX.domain([0,mat[0].length]);
    scaleY.domain([0,mat.length]);
    let minus_gain = debug_json["tree"]["step_obj"]["obj_gain"]["minus"];
    let plus_gain = debug_json["tree"]["step_obj"]["obj_gain"]["plus"];
    scaleC.domain([0.0001,d3.max(minus_gain.concat(plus_gain), (d)=>{return d})]);
    let rects = {};

    for (let di = 0; di < mat.length; di++) {
        rects[di] = g.selectAll(".rects-"+di).data(mat[di]);
        rects[di].enter().append("rect")
            .attr("class", "rects-"+di)
            .attr("x", (d,i) => {return scaleX(i)})
            .attr("y", (d,i) => {return scaleY(di)})
            .attr("width", (d,i) => {return scaleX(i+1)-scaleX(i)-1})
            .attr("height", (d,i) => {return scaleY(di+1)-scaleY(di)-1})
            .attr("stroke-width", "0px")
            .attr("fill", d => {return color(d)})
        rects[di].exit().remove();
    }

    let mgain = g.selectAll(".mgain").data(minus_gain);
    mgain.enter().append("rect")
        .attr("class", "mgain")
        .attr("x", (d,i) => {return scaleX(i)})
        .attr("y", 10)
        .attr("width", (d,i) => {return scaleX(i+1)-scaleX(i)-1})
        .attr("height", 5)
        .attr("stroke-width", "0px")
        .attr("fill", d => {
            if (d == 0) {
                return "white";
            }
            return scaleC(d)
        })
    mgain.exit().remove();

    let pgain = g.selectAll(".pgain").data(plus_gain);
    pgain.enter().append("rect")
        .attr("class", "pgain")
        .attr("x", (d,i) => {return scaleX(i)})
        .attr("y", 20)
        .attr("width", (d,i) => {return scaleX(i+1)-scaleX(i)-1})
        .attr("height", 5)
        .attr("stroke-width", "0px")
        .attr("fill", d => {
            if (d == 0) {
                return "white";
            }
            return scaleC(d)
        })
    pgain.exit().remove();


    let pad_mat = mat.slice();
    pad_mat.unshift(Array.from({ length: mat[0].length }, () => 0))

    let cnz = pad_mat.reduce((a,b) => sumNZ(a,b));
    console.log("cnz: ", cnz);


    let axisTop = g.selectAll(".axisTop").data(cnz);
    axisTop.enter().append("text")
        .attr("class", "axisTop")
        .attr("y", 5)
        .attr("x", (d,i) => {return scaleX(i)-4+(scaleX(i+1)-scaleX(i))/2})
        .text(d=>{
            return d;
        })
    axisTop.exit().remove();

}

function obj2arr(arrOfobj) {
    let arr = [];
    for (let i = 0; i < arrOfobj.length; i++) {
        arr.push([])
        for (let j = 0; j < Object.keys(arrOfobj[i]).length; j++) {
            arr[arr.length-1].push(+arrOfobj[i][j])
        }
    }    
    return arr;
}

// function to get sum of two array where array length of a is greater than b
function sumNZ(a, b) {
    return a.map((v, i) => {
        let c = 0;
           
        if (b[i] != 0) {
           c += 1;
        }
        return v+c;
    })
  }
  

let instance = "flay05h"
d3.csv("data/mats/"+instance+".csv", function(csv) {
    let headers = [...Array(csv.columns.length).keys()];
    d3.text("data/mats/"+instance+".csv", function(error, data) {
        // Then I add the header and parse to csv
        data = d3.csvParse(headers +"\n"+ data,d=>{
            return d;
        });
        console.log(data);
        arr = obj2arr(data);
        console.log(arr);

        d3.json("data/json/"+instance+".json", (debug_json) =>{
            console.log(Object.keys(debug_json["tree"]));
            console.log(debug_json["tree"]["step_obj"]["obj_gain"]);
            render(arr, debug_json);
        });
    });
})




