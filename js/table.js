var files = ["minlib","bonmin-nlw","couenne-nlw","scip-nlw","knitro-nlw","bnb","bnb-ts-dbfs","bnb-bs-r","bnb-bs-nsr","bnb-bs-mi","bnb-p03",
"bnb-p05","bnb-p09","bnb-p17","bnb-ts-dfs","bonmin","couenne"];

getalldata(0,files,{});

// My header
var headers = ["stdout","instance","nodes","bin_vars","int_vars","constraints",
"sense","objval","best_bound","status","time"].join(",");

var headers_obj = ["instance","objval","bin_vars","int_vars"].join(",");

function getdata(section,cb) {
    // First I get the file or URL data like text
    d3.text("data/"+section+"_data.csv", function(error, data) {
        if (section == "minlib") {
             // Then I add the header and parse to csv
            data = d3.csvParse(headers_obj +"\n"+ data,d=>{
                return {
                    instance: d.instance.substr(0,d.instance.length-3).trim(), // get rid of .jl
                    bin_vars: +d.bin_vars,
                    int_vars: +d.int_vars,
                    objval: +d.objval,
                    status: d.objval != "" ? "Optimal" : "Error"
                }
            }); 
        } else {
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

function getalldata(i,files,data) {
    let file = files[i];
    getdata(file,function(d) {
        d = filterInstances(d);
        data[file] = d;
        if (i == files.length-1) {
            data = fillNotDefined(data);
            data = algArray(data);
            let maxTime = 0;
            for (let alg in data) {
                let maxInAlg = Math.max(...data[alg].data.map(d => {return d.time}));
                maxTime = maxTime > maxInAlg ? maxTime : maxInAlg;
            }
            data = setGaps(data);
            data = determineSortOrder(data);
            // sort by difficult rank
            for (let ai = 0; ai < data.length; ai++) {
                data[ai].data.sort((a,b) => {
                    return a.difficulty < b.difficulty ? -1 : 1;
                })
            }
            console.log(data);
            printJsonTable(data);
        }else {
          getalldata(i+1,files,data)
        }
    }); 
}

function sortObject(obj) {
    return Object.keys(obj).sort((l,r) => {
        let list = ["Instance","V","C","Obj",
                    "bnb-gap","bonmin-nlw-gap","knitro-nlw-gap","couenne-nlw-gap","scip-nlw-gap",
                    "bnb-time","bonmin-nlw-time","knitro-nlw-time","couenne-nlw-time","scip-nlw-time"];

        return list.indexOf(l) < list.indexOf(r) ? -1 : 1;
    }).reduce((a, v) => {
      a[v] = obj[v];
      return a; 
    }, {});
}

function printJsonTable(data) {
    let row = 0;
    let arr = [];
    let alg_list = ["bnb","couenne-nlw","scip-nlw","bonmin-nlw","knitro-nlw"]
    for (let row = 0; row < data[0].data.length; row++) {
        let rowObj = {};
        let c = 0;
        for (let algO of data) {
            let alg = algO.alg;
            if (c == 0) {
                rowObj["Instance"] = data[c].data[row].inst;
                rowObj["V"] = data[1].data[row].nodes;
                rowObj["C"] = data[1].data[row].constraints;
                rowObj["Obj"] = data[c].data[row].objval.toFixed(2);
            } else {
                if (alg_list.indexOf(alg) >= 0) {
                    if (isNaN(data[c].data[row].objval) || data[c].data[row].status == "Infeasible") {
                        rowObj[alg+"-gap"] = "-";    
                    } else {
                        rowObj[alg+"-gap"] = (data[c].data[row].gap*100).toFixed(2);
                        if (rowObj[alg+"-gap"] > 1000) {
                            rowObj[alg+"-gap"] = ">>";   
                        }
                    }
                    rowObj[alg+"-time"] = Math.round(data[c].data[row].time);
                }
            }
            c += 1;
        }
        
        arr.push(sortObject(rowObj));
    }
    console.log(arr);
    console.log(JSON.stringify(arr));
    
}