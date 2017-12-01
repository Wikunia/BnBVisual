var listOfProblems = 
[
 "ex1223a","meanvarx","blend721","util","blend029","blend531",
 "gear4","johnall","blend718","genpooling_lee1","genpooling_lee2",
 "ndcc12","blend852","fuel","elf","genpooling_meyer15","ex1264",
 "ex1266","ex1265","genpooling_meyer10","genpooling_meyer04",
 "saa_2","blend480","o8_ar4_1","blend146","multiplants_mtg1a",
 "kport20","kport40","primary","carton7","forest","graphpart_clique-50","wager"
];

function filterInstances(data) {
    data = data.filter(d => {
        if (listOfProblems.indexOf(d.instance) >= 0) {
            return true;
        } else {
            return false;
        }
    });
    return data;
}

function getQueryVariable(variable) {
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}

function fillNotDefined(data) {
    let keys = Object.keys(data);
    for (let algi in keys) {
        algi = +algi
        let alg = keys[algi];
        if (algi == keys.length-1) {
            break;
        }
        for (let oalgi = algi; oalgi < keys.length; oalgi++) {
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
        gap: NaN,
        time: 0}
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

/**
* Remove data without discrete values
* @param {Array} data 
*/
function filterNoDisc(data) {
    return data.filter(d=>{
        return d.bin_vars+d.int_vars
    })
}

function byDiscrete(a,b) {
    return a.bin_vars+a.int_vars < b.bin_vars+b.int_vars ? -1 : 1;
}

function byBus(a,b) {
    return a.bus < b.bus ? -1 : 1;
}

/**
 * Remove data where the time is not long enough (for logarithmic scale)
 * @param {Array} data 
 */
function mapSecond(data) {
    return data.map(d=>{
        if (d.time < 1) {
            d.time = 1;
        }
        return d;
    })
}

function algArray(data) {
    let algObj = {};
    for (let alg in data) {
        if (!(alg in algObj)) {
            algObj[alg] = [];
        }
        for (let o of data[alg]) {
            let inst = o.instance;
            if (alg == "minlib") {
                gap = 0;
            } else {
                gap = NaN;
            }
            algObj[alg].push({alg: alg, inst: inst, time:o.time,status:o.status,
                 objval: o.objval, best_bound: o.best_bound, gap: gap,
                nodes: o.nodes, constraints: o.constraints});
        }
    }   
    let algArr = [];
    for (let alg in algObj) {
        algArr.push({alg: alg, data:algObj[alg]})
    }
    return algArr;
}


function computeGlobGap(data,ai,i) {
    let realObj = data[0].data[i].objval;
    let obj = data[ai].data[i].objval;
    if (data[ai].data[i].status == "Optimal" && data[ai].data[i].status == "UserLimit") {
        return NaN;
    }
    return Math.abs(realObj-obj)/Math.abs(realObj);
}

/**
 * Change the status from UserLimit to Status if time limit not reached
 * @param {Object} d one data object
 */
function getRealStatus(d) {
    d.status = d.status.trim();
    if ((d.status == "UserLimit") && (d.time <= 3500)) { // close to 1h
        return "Optimal";
    }
    return d.status;
}