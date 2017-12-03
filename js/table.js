var files = ["minlib","bonmin-nlw","couenne-nlw","scip-nlw","knitro-nlw","juniper","juniper-ts-dbfs","juniper-bs-r","juniper-bs-nsr","juniper-bs-mi","juniper-p03",
"juniper-p05","juniper-p09","juniper-p17","juniper-ts-dfs"];

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
            let time = data[ai].data[i].time;
            difficulty += time;
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
            printJsonTable(data);
        }else {
          getalldata(i+1,files,data)
        }
    }); 
}

function sortObject(obj) {
    return Object.keys(obj).sort((l,r) => {
        let list = ["Instance","V","C","Obj",
                    "juniper-gap","bonmin-nlw-gap","knitro-nlw-gap","couenne-nlw-gap","scip-nlw-gap",
                    "juniper-time","bonmin-nlw-time","knitro-nlw-time","couenne-nlw-time","scip-nlw-time"];

        return list.indexOf(l) < list.indexOf(r) ? -1 : 1;
    }).reduce((a, v) => {
      a[v] = obj[v];
      return a; 
    }, {});
}

function printJsonTable(data) {
    let row = 0;
    let arr = [];
    let alg_list = ["juniper","couenne-nlw","scip-nlw","bonmin-nlw","knitro-nlw"]
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
                    if (rowObj[alg+"-time"] >= 3600) {
                        rowObj[alg+"-time"] = "T.L.";   
                    }
                }

            }
            c += 1;
        }
        
        arr.push(sortObject(rowObj));
    }
    console.log(arr);
    console.log(JSON.stringify(arr));
    
}