var listOfProblems = 
["oil2", "bchoco07", "squfl015-080persp", "transswitch0014p", 
"squfl030-100persp", "FLay05M", "ndcc13", "CLay0205H", "procurement1mot", 
"fo9_ar2_1", "crudeoil_pooling_ct1", "multiplants_mtg1a", "multiplants_mtg2", "crudeoil_pooling_ct3", 
"pooling_epa3", "transswitch0118r", "graphpart_3pm-0444-0444", 
"qap", "csched2", "edgecross22-048", "crudeoil_pooling_dt1"];   


function removeheatexch(data) {
    data = data.filter(d => {
        if (d.instance != "heatexch_gen1") {
            return true;
        } else {
            return false;
        }
    });
    return data;
}

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
        for (let oalgi = algi+1; oalgi < keys.length; oalgi++) {
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
        objVal: NaN,
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
            if (alg == "minlib_extra") {
                gap = 0;
            } else {
                gap = NaN;
            }
            algObj[alg].push({alg: alg, inst: inst, time:o.time,status:o.status,
                objVal: o.objVal, best_bound: o.best_bound, gap: gap,
                nodes: o.nodes, constraints: o.constraints, sense: o.sense,
                bins: o.bin_vars, ints: o.int_vars
            });
        }
    }   
    let algArr = [];
    for (let alg in algObj) {
        algArr.push({alg: alg, data:algObj[alg]})
    }
    return algArr;
}

function arr2Obj(data, key) {
    var obj = {};
    for (let d of data) {
        obj[d[key]] = d;
    }   
    return obj;
}

function obj2Arr(data) {
    var result = [];
    for (let d of Object.keys(data)) {
        result.push(data[d]);
    }
    return result;
}

function updateBest(best, newData) {
    let diff = getDiff(Object.keys(best),Object.keys(newData));
    for (let k of diff.add_l) {
        best[k] = newData[k];
    }
    for (let k in newData) {
        let d = newData[k];
        if (d.time < best[k].time && d.status == "Optimal") {
            best[k] = d;
        }
    }
} 


function computeGlobGap(data,ai,i) {
    let realObj = data[0].data[i].objVal;
    let obj = data[ai].data[i].objVal;
    if (data[ai].data[i].status == "Optimal" && data[ai].data[i].status == "UserLimit") {
        return NaN;
    }
    return Math.abs(realObj-obj)/Math.abs(realObj);
}

/**
 * Change the status from UserLimit to status optimal if solution found and
 * if time limit not reached
 * Change from Optimal to UserLimit if the other way around (only if fixTime is set to true)
 * @param {Object} d one data object
 * @param {Boolean} fixTime=false 
 */
function getRealStatus(d, fixTime=false) {
    d.status = d.status.trim();
    if ((d.status == "UserLimit") && !isNaN(d.objVal) && (d.time <= max_time-10)) { // close to max time
        return "Optimal";
    }
    if (fixTime && (d.status == "Optimal") && (d.time > max_time)) {
        return "UserLimit"
    }
    return d.status;
}