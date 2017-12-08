var listOfProblems = 
// ["SLay10M", "sfacloc2_4_90", "squfl020-150persp", "RSyn0815M04H", "squfl025-040", "CLay0205H", "waterno2_03", "squfl030-100persp", "squfl040-080persp", "blend531", "multiplants_mtg1a", "FLay05H", "squfl030-150persp", "sfacloc1_4_80", "sssd20-04", "sssd25-04", "Syn40M04H", "hydroenergy3", "gasprod_sarawak16", "routingdelay_bigm", "procurement1mot", "ndcc15", "sssd12-05", "blend718", "ndcc13persp", "qap", "sepasequ_complex", "genpooling_meyer10", "sssd18-06", "tln5", "squfl020-150", "waterno2_04", "multiplants_mtg2", "sfacloc2_3_80", "watercontamination0303r", "nuclear14", "supplychainp1_022020", "SLay10H", "qapw", "sssd15-06", "multiplants_mtg5", "crossdock_15x7", "water4", "crudeoil_pooling_ct2", "squfl040-080", "squfl030-100", "crudeoil_li01", "crudeoil_pooling_ct4", "blend852", "squfl030-150"]
["graphpart_clique-20","edgecross14-058","edgecross20-040","edgecross14-176","SLay10M","squfl020-040","squfl025-025","squfl025-030","squfl015-060","graphpart_2g-1010-0824","graphpart_2g-0099-9211","SLay08H","edgecross22-048","sfacloc2_4_90","RSyn0820M02H","edgecross14-039","squfl020-050","chp_shorttermplan1a","squfl015-080","graphpart_3g-0444-0444","SLay09H","RSyn0815M04H","squfl020-150persp","squfl025-040","CLay0205H","waterno2_03","graphpart_3pm-0334-0334","squfl030-100persp","portfol_classical050_1","squfl040-080persp","heatexch_gen1","blend531","graphpart_3pm-0344-0344","edgecross14-078","multiplants_mtg1a","FLay05H","nous1","faclay20h","nuclearvc","nuclearvb","nuclearve","space25a","nuclear14a","contvar","feedtray","nuclearva","nuclearvf","waternd2","nuclearvd","graphpart_clique-70","ghg_3veh","squfl030-150persp","graphpart_clique-60","ndcc15persp","edgecross24-057","genpooling_meyer15","genpooling_meyer04","graphpart_clique-50","ghg_2veh","sfacloc1_4_80","sssd20-04","Syn30M04H","sssd25-04","sssd15-04","sfacloc1_3_80","Syn40M04H","sfacloc1_4_90","edgecross14-098","hydroenergy3","sfacloc1_3_95","sfacloc1_3_90","sfacloc1_4_95","hydroenergy1","hydroenergy2","carton7","gasprod_sarawak16","sfacloc1_2_80","graphpart_clique-30","waterx","graphpart_clique-40","graphpart_2pm-0099-0999","sfacloc1_2_90","transswitch0009r","graphpart_3pm-0444-0444","sfacloc1_2_95","heatexch_spec2","routingdelay_bigm","synheat","heatexch_spec1","procurement1mot","ndcc15","sssd12-05","ex1233","chp_shorttermplan1b","heatexch_gen2","multiplants_mtg1c","blend718","cvxnonsep_psig40r","ndcc13persp","qap","sepasequ_complex","sssd18-06","genpooling_meyer10","tln5","squfl020-150","waterno2_04","multiplants_mtg2","sfacloc2_3_80","watercontamination0303r","nuclear14","supplychainp1_022020","SLay10H","multiplants_mtg5","qapw","sssd15-06","crossdock_15x7","water4","crudeoil_pooling_ct2","squfl040-080","squfl030-100","crudeoil_pooling_ct4","blend852","crudeoil_li01","squfl030-150"]


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
    console.log(keys);
    for (let algi in keys) {
        algi = +algi
        let alg = keys[algi];
        if (algi == keys.length-1) {
            break;
        }
        for (let oalgi = algi+1; oalgi < keys.length; oalgi++) {
            let oalg = keys[oalgi];
            console.log(alg+" vs. "+oalg)
            let alg_instances = [];
            let oalg_instances = [];
            for (let inst of data[alg]) {
                alg_instances.push(inst.instance);
            }
            for (let inst of data[oalg]) {
                oalg_instances.push(inst.instance); 
            }
            let diff = getDiff(alg_instances,oalg_instances);
            console.log("lalg: ", alg_instances.length)
            console.log("loalg: ", oalg_instances.length)
            console.log("diff: ", diff)
            for (let inst of diff["add_l"]) {
                console.log("nanrow: ", inst, " -> " ,alg)
                data[alg].push(nanrow(inst));
            }
            for (let inst of diff["add_r"]) {
                console.log("nanrow: ", inst, " -> " ,oalg)
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
    if ((d.status == "UserLimit") && !isNaN(d.objval) && (d.time <= 3500)) { // close to 1h
        return "Optimal";
    }
    return d.status;
}