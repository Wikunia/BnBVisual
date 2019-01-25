var ots = false;
var headers = ["stdout","instance","nodes","bin_vars","int_vars","constraints",
    "sense","objval","best_bound","status","time"].join(",");
var files = ["juniper", "bonmin-nlw","minotaur-nlw","knitro-nlw","couenne-nlw","scip-nlw"];

var max_time = 3600;

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
        let parts = file.split("/")
        let solver = parts.length > 1 ? parts[1] : parts[0];
    
        data[file] = d;
        if (i == files.length-1) {
            data = fillNotDefined(data);
            render(data);
        }else {
          getandrenderdata(i+1,files,data)
        }
    }); 
}

function intersect(a, b) {
    let t;
    if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
    return a.filter(function (e) {
        return b.indexOf(e) > -1;
    });
}

function arr_diff (a1, a2) {
    let a = [], diff = [];
    for (let i = 0; i < a1.length; i++) {
        a[a1[i]] = true;
    }
    for (let i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            delete a[a2[i]];
        } else {
            a[a2[i]] = true;
        }
    }
    for (let k in a) {
        diff.push(k);
    }

    return diff;
}

function allIntersectRec(data,start,all_options,result) {
    // if all options used
    if (start.length == all_options.length) {
        return result;
    }
    if (start.length > 0) {
        let current_intersect = result[start];
        let options = arr_diff(start,all_options)
        for (let opt of options) {
            let new_start = start.concat([opt])
            new_start.sort();
            if (!(new_start in Object.keys(result))) {
                result[new_start] = intersect(current_intersect, data[opt])
                result = allIntersectRec(data, new_start, all_options, result);
            }
        }
    } else {
        for (let opt of all_options) {
            result[[opt]] = data[opt];
            result = allIntersectRec(data, [opt], all_options, result);
        }
    }
    return result;

}

function render(data) {
    console.log(data);
    // get feasible instances per algorithm
    let objdata = {};
    for (let alg in data) {
        objdata[alg] = []
        for (let i = 0; i < data[alg].length; i++) {
            if (!isNaN(data[alg][i].objval) && (data[alg][i].status == "Optimal" /*|| data[alg][i].status == "UserLimit"*/)) {
                objdata[alg].push(data[alg][i].instance);
            }
        }
    }

    let result = allIntersectRec(objdata,[],["bonmin-nlw","juniper","minotaur-nlw","knitro-nlw"], {});
    var sets = [];
    for (let set in result) {
        let set_arr = set.split(",");
        sets.push({sets: set_arr, size: result[set].length});
    }

    var chart = venn.VennDiagram()
    d3.select("#chart").datum(sets).call(chart);
}