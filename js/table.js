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
var firstUse = true;

var minlp2_solvers = ["juniper_moi","juniper","juniper_v0.2.4", "bonmin-nlw","minotaur-nlw",
"knitro-nlw","couenne-nlw","scip-nlw","juniper-bs-nsr","juniper-bs-r","juniper-fp-grb",
"juniper-p02","juniper-p04","juniper-p08","juniper-p16","juniper-ts-dbfs",
"juniper-ic","juniper-ipopt","juniper-ipopt-glpk","juniper-ipopt-grb","juniper-knitro-cbc","juniper-par-p02","juniper-par-p04"];

var ibm_solvers =  ["juniper","bonmin-nlw","minotaur-bnb-ipopt","minotaur-bnb-nlw","minotaur-msbnb-nlw",
"couenne-nlw","scip-nlw"];

var devel_solvers = ["juniper_devel", "juniper_fp-best","juniper_mu-0.5","juniper_mu-0.5_36","juniper_presolve",
"juniper_rerun-strong", "juniper-rerun-strong-200","juniper_candidates","juniper_candidates_asc","juniper_evenly",
"juniper_reliable_new","juniper_presolve_tighten","juniper_p-3","juniper_strong_parallel","juniper_gain_mu","juniper_020",
"juniper_diverse_strong","juniper_ref_inf_gain", "juniper_v0.2.2", "juniper_v0.2.2_mu_init", "juniper_v0.2.2_debug", "juniper_v0.2.2_inf_gains",
"juniper_v0.2.4_presolve","juniper_v0.2.4_presolve_ma27","juniper_v0.2.4_presolve_v2","juniper_v0.2.5","juniper_v0.2.5_bugfix_116", "juniper_v0.2.4_moi",
 "juniper_v0.2.4_moi_03-05"];                    

var gsolvers = {
    minlp2: minlp2_solvers,
    ibm: ibm_solvers,
    devel: devel_solvers,
};

var solvers = gsolvers["minlp2"];

var section1;
var section2;


sortInst = function(a,b) {
    return a.inst < b.inst ? -1 : 1;
}

$.fn.dataTable.ext.search.push(
    function( settings, data, dataIndex ) {
        var wantPrevStatus = $('#prevStatus').val();
        var wantNewStatus = $('#newStatus').val();
        var wantObjChange = $('#objChange').val();
        var wantTimeChange = $('#timeChange').val();

        var prevStatus = data[11];
        var newStatus = data[10];
        var objChange = data[7];
        var timeChange = data[13];
        var sense = data[5];

        if (!state_is_optimal(prevStatus) && wantPrevStatus == "optimal") return false;
        if (!state_is_optimal(newStatus) && wantNewStatus == "optimal") return false;
        if (state_is_optimal(prevStatus) && wantPrevStatus == "not_optimal") return false;
        if (state_is_optimal(newStatus) && wantNewStatus == "not_optimal") return false;
        if (!state_is_infeasible(prevStatus) && wantPrevStatus == "infeasible") return false;
        if (!state_is_infeasible(newStatus) && wantNewStatus == "infeasible") return false;
        if (!state_is_time_limit(prevStatus) && wantPrevStatus == "time_limit") return false;
        if (!state_is_time_limit(newStatus) && wantNewStatus == "time_limit") return false;
        if ((state_is_optimal(newStatus) || state_is_infeasible(newStatus) || state_is_time_limit(newStatus)) && wantNewStatus == "other") return false;
        if ((state_is_optimal(prevStatus) || state_is_infeasible(prevStatus) || state_is_time_limit(prevStatus)) && wantPrevStatus == "other") return false;

        if (sense == "Max" || sense == "MAX_SENSE") {
            if (objChange.indexOf('-') < 0 && wantObjChange == "worse") return false;
            if (objChange.indexOf('+') < 0 && wantObjChange == "better") return false;
        } else { // min
            if (objChange.indexOf('-') < 0 && wantObjChange == "better") return false;
            if (objChange.indexOf('+') < 0 && wantObjChange == "worse") return false;
        }
        if (objChange == "-0" && wantObjChange != "all" && wantObjChange != "identical") return false;
        if (objChange == "+0" && wantObjChange != "all" && wantObjChange != "identical") return false;
        if (wantObjChange == "identical") {
            console.log(objChange);
            if (objChange != "-0" && objChange != "+0") return false;
        }


    
        if (timeChange.indexOf('-') < 0 && wantTimeChange == "better") return false;
        if (timeChange.indexOf('+') < 0 && wantTimeChange == "worse") return false;
        if (Math.abs(parseFloat(timeChange.slice(1))) <= 30.0 && wantTimeChange != "all" && wantTimeChange != "similar") return false;
        if (Math.abs(parseFloat(timeChange.slice(1))) > 30.0 && wantTimeChange == "similar") return false;

        return true;
    }
);


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
    var sect = document.getElementById("file1");
    section1 = sect.options[sect.selectedIndex].value;

    document.getElementById("file2").innerHTML = innerFile2;
    sect = document.getElementById("file2");
    section2 = sect.options[sect.selectedIndex].value;
}

setOptions();
$(document).ready(function() {
    getandrenderdata(group,[section1, section2],{});
} );

d3.select('#group')
.on("change", function () {
    let sect = document.getElementById("group");
    group = sect.options[sect.selectedIndex].value;
    solvers = gsolvers[group];
    setOptions();
    getandrenderdata(group,[section1,section2],{});
});

d3.select('#file1')
.on("change", function () {
    let sect = document.getElementById("file1");
    section1 = sect.options[sect.selectedIndex].value;
    getandrenderdata(group,[section1,section2],{});
});

d3.select('#file2')
.on("change", function () {
    let sect = document.getElementById("file2");
    section2 = sect.options[sect.selectedIndex].value;
    getandrenderdata(group,[section1,section2],{});
});

function precise(x, precision=4) {
    return parseFloat(x.toFixed(precision));
}

function getData(file, path, headers, cb) {
    d3.text(path, function(error, data) {
        data = d3.csvParse(headers +"\n"+ data,d=>{
            return {
                instance: d.instance.substr(0,d.instance.length-3).trim(), // get rid of .jl
                nodes: +d.nodes,
                bin_vars: +d.bin_vars,
                int_vars: +d.int_vars,
                constraints: +d.constraints,
                sense: d.sense.trim(),
                objVal: precise(+d.objVal),
                best_bound: precise(+d.best_bound),
                gap: precise((Math.abs(+d.best_bound-(+d.objVal))/Math.abs(+d.objVal))*100.0,2),
                status: getRealStatus(d, file),
                time: precise(+d.time, 0)
            }
        }); 
        cb(data);   
    });
}

function combineData(data1, data2) {
    let data = fillNotDefined({first: data1, second: data2});
    data = algArray(data, computeGap=false);
    for (let di = 0; di < data.length; di++) {
        data[di].data.sort(sortInst);
    }
    console.log(data);
    let new_data = [];
    for (var i = 0; i < data[0].data.length; i++) {
        let first = data[0].data[i];
        let second = data[1].data[i];
        if (first.inst != second.inst) {
            console.error("not the same instance: ", first.inst, " vs. ", second.inst);
        }

        let new_data_obj = first;
        // objective value change
        if ((new_data_obj.sense == "Min" || new_data_obj.sense == "MIN_SENSE") && !isNaN(new_data_obj.objVal) && !isNaN(second.objVal)) {
            let diff = precise(Math.abs(second.objVal-new_data_obj.objVal),2);
            if (new_data_obj.objVal <= second.objVal) {
                new_data_obj.objValChange = "<span style='color:green'>-"+diff+"</span>";
            } else {
                new_data_obj.objValChange = "<span style='color:red'>+"+diff+"</span>";
            }
        }
        if ((new_data_obj.sense == "Max" || new_data_obj.sense == "MAX_SENSE") && !isNaN(new_data_obj.objVal) && !isNaN(second.objVal)) {
            let diff = precise(Math.abs(second.objVal-new_data_obj.objVal),2);
            if (new_data_obj.objVal >= second.objVal) {
                new_data_obj.objValChange = "<span style='color:green'>+"+diff+"</span>";
            } else {
                new_data_obj.objValChange = "<span style='color:red'>-"+diff+"</span>";
            }
        }

        if (!state_is_infeasible(new_data_obj.status) && !state_is_infeasible(second.status) && !isNaN(new_data_obj.objVal) && !isNaN(second.objVal)) {
            let diff = precise(Math.abs(second.gap-new_data_obj.gap),2);
            if (new_data_obj.gap <= second.gap) {
                new_data_obj.gapChange = "<span style='color:green'>-"+diff+"</span>";
            } else {
                new_data_obj.gapChange = "<span style='color:red'>+"+diff+"</span>";
            }
        }

        // time
        let timeDiff = precise(new_data_obj.time-second.time,0);
        if (timeDiff <= 0) {
            new_data_obj.timeChange = "<span style='color:green'>-"+Math.abs(timeDiff)+"</span>";
        } else {
            new_data_obj.timeChange = "<span style='color:red'>+"+Math.abs(timeDiff)+"</span>";
        }

        // status
        new_data_obj.prevStatus = second.status;
        if (state_is_optimal(new_data_obj.status) && state_is_optimal(second.status)) {
        } else if (state_is_optimal(new_data_obj.status)) {
            new_data_obj.status = "<span style='color:green'>"+new_data_obj.status+"</span>";
        } else if (state_is_optimal(second.status)) {
            new_data_obj.status = "<span style='color:red'>"+new_data_obj.status+"</span>";
        }

        new_data.push(new_data_obj);
    }
    
    return new_data;
}

function getandrenderdata(group,files,data) {
    let file1 = files[0];
    let file2 = files[1];
    let path1 = "data/";
    let path2 = "data/";
    if (group != "minlp2") {
        path1 += group+"/";   
        path2 += group+"/";   
    }
    path1 += file1+"_data.csv";
    path2 += file2+"_data.csv";
    headers = ["stdout","instance","nodes","bin_vars","int_vars","constraints",
               "sense","objVal","best_bound","status","time"].join(",");
    getData(file1, path1, headers, data1 => {
        getData(file2, path2, headers, data2 => {
        data = combineData(data1, data2);
        data.unshift({inst: "Instance", nodes: "#Vars", bins: "#Bin", ints: "#Int", constraints: "#Cons",
                      sense: "Sense", objVal: "Objective", objValChange: "Change", gap:"Gap %", gapChange: "Change", status: "New Status",
                      prevStatus: "Previous Status", time: "Time", timeChange: "Change"});
        let keyOrder = ["inst", "nodes", "bins", "ints", "constraints", "sense", "objVal", "objValChange", "gap",
                         "gapChange", "status", "prevStatus", "time", "timeChange"];
        
        if (!firstUse) {
            var currentSearch = $("body").find("input[aria-controls='specific_run_table']").val();
            $('#specific_run_table').DataTable().destroy();
            d3.select("#specific_run_table").html(null);
        }
        
        console.log("data[0]: ", data[0])
        var container = d3.select("#specific_run_table")
            .append("thead")
            .selectAll("tr")
                .data([data[0]]).enter()
                .append("tr")

            .selectAll("th")
                .data(function(d) { return obj2Arr(d, keyOrder=keyOrder); }).enter()
                .append("th")
                .text(function(d) { return d; });
        
        
        var inner = d3.select("#specific_run_table")
            .append("tbody")
            .selectAll("tr")
                .data(data.slice(1)).enter()
                .append("tr")

            .selectAll("td")
                .data(function(d) { return obj2Arr(d, keyOrder=keyOrder); }).enter()
                .append("td")
                .html(function(d) { return d; });
        
       
        var table = $('#specific_run_table').DataTable();
        $('#newStatus, #prevStatus, #objChange, #timeChange').change( function() {
            table.draw();
        } );
        if (!firstUse) {
            var searchInput =  $("body").find("input[aria-controls='specific_run_table']");
            searchInput.val(currentSearch);
            table.search(currentSearch).draw();
        }
        firstUse = false;
      })
    })

    
}
