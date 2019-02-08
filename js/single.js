var headers = ["stdout","instance","nodes","bin_vars","int_vars","constraints",
"sense","objVal","best_bound","status","time"].join(",");

var width = 1500,
height = 600,
centered;
var max_time = 3600;

// initial
var group_sect = document.getElementById("group");
var group = group_sect.options[group_sect.selectedIndex].value;

var faster = [];
var more = [];
var instances_group = "More";

var dataArr;


var minlp2_solvers = ["juniper","bonmin-nlw","minotaur-nlw",
"knitro-nlw","couenne-nlw","scip-nlw","juniper-bs-nsr","juniper-bs-r","juniper-fp-grb",
"juniper-p02","juniper-p04","juniper-p08","juniper-p16","juniper-ts-dbfs",
"juniper-ic","juniper-ipopt","juniper-ipopt-glpk","juniper-ipopt-grb","juniper-knitro-cbc","juniper-par-p02","juniper-par-p04"];

var ibm_solvers =  ["juniper","bonmin-nlw","minotaur-bnb-ipopt","minotaur-bnb-nlw","minotaur-msbnb-nlw",
"couenne-nlw","scip-nlw"];

var devel_solvers = ["juniper_devel", "juniper_fp-best","juniper_mu-0.5","juniper_mu-0.5_36","juniper_presolve",
"juniper_rerun-strong", "juniper-rerun-strong-200","juniper_candidates","juniper_candidates_asc","juniper_evenly",
"juniper_reliable_new","juniper_presolve_tighten","juniper_p-3","juniper_strong_parallel","juniper_gain_mu","juniper_020",
"juniper_diverse_strong","juniper_ref_inf_gain", "juniper_v0.2.2", "juniper_v0.2.2_mu_init", "juniper_v0.2.2_debug", "juniper_v0.2.2_inf_gains",
"juniper_v0.2.4_presolve","juniper_v0.2.4_presolve_ma27","juniper_v0.2.4_presolve_v2","juniper_v0.2.4_lin_BFS"];                    

var gsolvers = {
    minlp2: minlp2_solvers,
    ibm: ibm_solvers,
    devel: devel_solvers,
};

var solvers = gsolvers["minlp2"];

var section1;
var section2;


function setOptions() {
    let innerFile1 = "";
    let innerFile2 = "";

    section1 = solvers[0];
    section2 = solvers[1];
    for (let solver of solvers) {
        if (solver == section1) {
            innerFile1 += '<option value="'+solver+'" selected="selected">'+solver+'</option>';
        } else {
            innerFile1 += '<option value="'+solver+'">'+solver+'</option>';
        }
        if (solver == section2) {
            innerFile2 += '<option value="'+solver+'" selected="selected">'+solver+'</option>';
        } else {
            innerFile2 += '<option value="'+solver+'">'+solver+'</option>';
        }
    }
    document.getElementById("file1").innerHTML = innerFile1;
    document.getElementById("file2").innerHTML = innerFile2;
    var sect = document.getElementById("file1");
    section1 = sect.options[sect.selectedIndex].value;
    sect = document.getElementById("file2");
    section2 = sect.options[sect.selectedIndex].value;
}

setOptions();
getandrenderdata(0,group,[section1,section2],{});


sortInst = function(a,b) {
    return a.inst < b.inst ? -1 : 1;
}

d3.select('#group')
.on("change", function () {
    let sect = document.getElementById("group");
    group = sect.options[sect.selectedIndex].value;
    solvers = gsolvers[group];
    setOptions();
    getandrenderdata(0,group,[section1,section2],{});
});

d3.select('#file1')
.on("change", function () {
    let sect = document.getElementById("file1");
    section1 = sect.options[sect.selectedIndex].value;
    getandrenderdata(0,group,[section1,section2],{});
});


d3.select('#file2')
.on("change", function () {
    let sect = document.getElementById("file2");
    section2 = sect.options[sect.selectedIndex].value;
    getandrenderdata(0,group,[section1,section2],{});
});

d3.select('#faster')
.on("click", function () {
    instances_group = "Faster";
    document.getElementById("instances_span").innerHTML = "- Solved faster -";
   
    document.getElementById("file1_instances").innerHTML = listToHtml(faster[0],"span","instClick",["value"]);
    document.getElementById("file2_instances").innerHTML = listToHtml(faster[1],"span","instClick",["value"]);
});

d3.select('#more')
.on("click", function () {
    instances_group = "More";
    document.getElementById("instances_span").innerHTML = "- Solved more -";
    document.getElementById("file1_instances").innerHTML = listToHtml(more[0],"span","instClick",["value"]);
    document.getElementById("file2_instances").innerHTML = listToHtml(more[1],"span","instClick",["value"]);
});


function listToHtml(l, type, func, params) {
    let html = "";
    for (let item of l) {
        var new_params = params.slice();
        for (let pi in params) {
            if (new_params[pi] == "value") {
                new_params[pi] = item;
            }
        }
        params_join = "'"+new_params.join("','")+"'";
        html += '<'+type+' style="cursor: pointer;" onClick="'+func+'('+params_join+')">'+item+'</'+type+'><br>';
    }
    return html;
}

function instClick(inst) {
    var html = "<tr><th></th><th>"+section1+"</th><th>"+section2+"</th></tr>";

    var instId;
    for (let i in dataArr[0].data) {
        if (dataArr[0].data[i].inst == inst) {
            instId = i;
            break
        }
    }

    let entry1 = dataArr[0].data[instId];
    let entry2 = dataArr[1].data[instId];

    // status
    html += "<tr><th>Status</th><td>"+entry1.status+"</td><td>"+entry2.status+"</td></tr>";
    // time
    html += "<tr><th>Time</th><td>"+entry1.time+"</td><td>"+entry2.time+"</td></tr>";
    // objVal
    html += "<tr><th>Obj.</th><td>"+entry1.objVal+"</td><td>"+entry2.objVal+"</td></tr>";

    // General info
    // Variables, Constraints, Ints, Bins
    html += '<tr><th>#Var</th><td colspan="2">'+entry1.nodes+'</td></tr>';
    html += '<tr><th>#Constr</th><td colspan="2">'+entry1.constraints+'</td></tr>';
    html += '<tr><th>#Ints</th><td colspan="2">'+entry1.ints+'</td></tr>';
    html += '<tr><th>#Bins</th><td colspan="2">'+entry1.bins+'</td></tr>';


    document.getElementById("specific_instance").innerHTML = html;
}


function getdata(group,section,cb) {
    console.log("group: ", group);
    console.log("section: ", section);
    let path = "data/";
    if (group != "minlp2") {
        path += group+"/";   
    }
    path += section+"_data.csv";
    console.log("path: ", path);
    d3.text(path, function(error, data) {
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
                status: getRealStatus(d, section),
                time: +d.time
            }
        }); 
        cb(data);   
    });
}

function getandrenderdata(i,group,files,data) {
    more = [[],[]];
    faster = [[],[]];
    console.log("files: ", files);
    let file = files[i];
    getdata(group,file,function(d) {
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
            getDifferences(data);
            if (instances_group == "Faster") {
                document.getElementById('faster').click();
            }
            if (instances_group == "More") {
                document.getElementById('more').click();
            }
            dataArr = data;
            // render(data);
        }else {
          getandrenderdata(i+1,group,files,data);
        }
    }); 
}

function getDifferences(data) {
    // check for instances which one solves and one doesn't
    let counter_1 = 0;
    let counter_2 = 0;
    for (let i = 0; i < data[0].data.length; i++) {
        if (data[0].data[i].status != data[1].data[i].status) {
            if (data[0].data[i].status == "Optimal") {
                more[0].push(data[0].data[i].inst);
                counter_1 += 1;
            } else if (data[1].data[i].status == "Optimal") {
                more[1].push(data[0].data[i].inst);
                counter_2 += 1;
            }
        }
    }
    document.getElementById("file1_more").innerHTML = counter_1;
    document.getElementById("file2_more").innerHTML = counter_2;

    // faster if both solved
    counter_1 = 0;
    counter_2 = 0;
    for (let i = 0; i < data[0].data.length; i++) {
        if (data[0].data[i].status == "Optimal" && data[1].data[i].status == "Optimal") {
            if (data[0].data[i].time+10 < data[1].data[i].time) {
                faster[0].push(data[0].data[i].inst);
                counter_1 += 1;
            } else if (data[1].data[i].time+10 < data[0].data[i].time) {
                faster[1].push(data[1].data[i].inst);
                counter_2 += 1;
            }
        }
    }

    document.getElementById("file1_faster").innerHTML = counter_1;
    document.getElementById("file2_faster").innerHTML = counter_2;
}