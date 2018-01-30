var listOfProblems = 
["oil2", "nous1", "eg_int_s", "eg_disc2_s", "eg_disc_s", "watertreatnd_flow", "bchoco05", 
"watercontamination0202r", "feedtray", "bchoco06", "eg_all_s", "bchoco07", "sfacloc1_2_95", 
"transswitch0009p", "bchoco08", "sfacloc1_3_95", "sfacloc1_4_95", "transswitch0009r", "tspn05", 
"squfl010-080persp", "var_con10", "heatexch_spec1", "synheat", "var_con5", "ex1233",
"watercontamination0303r", "waterx", "squfl015-080persp", "squfl015-060", "squfl015-080", 
"heatexch_gen2", "heatexch_spec2", "ghg_2veh", "oil", "transswitch0014r", "sepasequ_convent", 
"squfl020-150persp", "squfl020-150", "squfl020-040", "squfl020-050", "deb6", "transswitch0014p",
"deb10", "squfl025-040persp", "squfl025-025", "squfl025-040", "squfl025-030", "waterno2_03",
"tspn08", "squfl030-150persp", "sfacloc1_2_90", "sfacloc1_4_90", "sfacloc1_3_90", "squfl030-150", 
"squfl030-100persp", "squfl030-100", "ghg_3veh", "waterno2_04", "gasprod_sarawak16", 
"gasprod_sarawak81", "kport20", "ndcc15persp", "squfl040-080", "ndcc15", "squfl040-080persp", 
"casctanks", "FLay05H", "FLay05M", "transswitch0030r", "transswitch0030p", "fo7", "o7_2", "o7_ar4_1", 
"o7_ar25_1", "no7_ar4_1", "o7_ar3_1", "o7_ar2_1", "o7_ar5_1", "no7_ar3_1", "ndcc13", "no7_ar5_1", 
"o7", "ndcc13persp", "edgecross10-060", "super3t", "wastepaper4", "chp_partload", "tspn10", 
"pooling_epa2", "transswitch0039p", "ndcc12persp", "transswitch0039r", "ndcc12", "4stufen", 
"crudeoil_li01", "tln6", "sepasequ_complex", "CLay0205H", "beuster", "ndcc14", "waterno2_06", 
"ndcc14persp", "genpooling_meyer04", "CLay0305H", "fo8_ar2_1", "fo8_ar4_1", "fo8_ar5_1", "o8_ar4_1", 
"fo8", "fo8_ar25_1", "FLay06M", "FLay06H", "procurement1mot", "heatexch_gen3", "ndcc16", 
"heatexch_spec3", "ndcc16persp", "sfacloc1_4_80", "sfacloc1_3_80", "sfacloc1_2_80", "tln7", 
"wastepaper5", "tspn12", "sssd15-04", "fo9", "fo9_ar3_1", "waternd2", "fo9_ar25_1", "o9_ar4_1", 
"fo9_ar2_1", "fo9_ar5_1", "fo9_ar4_1", "forest", "edgecross10-080", "sssd12-05", "multiplants_mtg5", 
"edgecross14-039", "crudeoil_pooling_ct1", "waterno2_09", "crudeoil_lee3_06", "blend718", "blend721", 
"blend146", "contvar", "edgecross10-070", "graphpart_clique-30", "wastepaper6", "sssd20-04", 
"multiplants_mtg1b", "multiplants_mtg1a", "hydroenergy1", "gams02", "crudeoil_lee3_07", 
"portfol_shortfall100_04", "blend531", "tspn15", "product", "crudeoil_pooling_ct2", 
"graphpart_3pm-0334-0334", "waterno2_12", "sssd15-06", "gams01", "multiplants_mtg2", 
"sssd25-04", "crudeoil_lee3_08", "SLay08H", "kport40", "multiplants_mtg1c", 
"graphpart_clique-40", "blend852", "sfacloc2_4_80", "blend480", "crudeoil_lee2_09", "waterz", 
"water4", "sssd18-06", "crudeoil_lee3_09", "crudeoil_pooling_ct3", "crudeoil_li03", "crudeoil_li05",
"crudeoil_li06", "sssd16-07", "crudeoil_lee4_07", "tls5", "gasnet_al1", "gasnet_al3", 
"crudeoil_pooling_ct4", "crudeoil_lee2_10", "crudeoil_lee3_10", "csched2a", "sssd15-08", 
"graphpart_3pm-0344-0344", "graphpart_clique-50", "pooling_epa3", "crudeoil_lee4_08", 
"edgecross14-078", "waterno2_18", "sssd18-08", "nuclearve", "nuclearvb", "nuclearvd", "tln12", 
"nuclearva", "nuclearvc", "nuclearvf", "crudeoil_lee4_09", "multiplants_mtg6", "transswitch0118p", 
"tls6", "transswitch0118r", "crudeoil_li11", "SLay10H", "graphpart_clique-60", "cecil_13", 
"edgecross14-176", "edgecross14-058", "edgecross14-098", "sssd20-08", "genpooling_meyer10", 
"faclay20h", "crudeoil_lee4_10", "graphpart_3g-0444-0444", "hydroenergy2", "graphpart_3pm-0444-0444", 
"multiplants_stg1", "sssd22-08", "portfol_classical200_2", "portfol_shortfall200_05", 
"portfol_robust200_03", "graphpart_clique-70", "crossdock_15x7", "multiplants_stg1a", "waterno2_24", 
"crudeoil_li21", "sssd25-08", "qapw", "qap", "crossdock_15x8", "crudeoil_li02", "space25a", 
"multiplants_stg1b", "graphpart_2g-0099-9211", "graphpart_2pm-0099-0999", "multiplants_stg1c", "carton7", 
"chp_shorttermplan1b", "carton9", "tls7", "graphpart_2g-1010-0824", "csched2", "hydroenergy3", 
"genpooling_meyer15", "RSyn0815M04M", "edgecross20-040", "routingdelay_bigm", "routingdelay_proj", 
"waste", "saa_2", "procurement1large", "RSyn0820M04M", "supplychainp1_022020", "supplychainr1_022020", 
"edgecross22-048", "netmod_dol1", "RSyn0830M04M", "edgecross24-057", "nuclear14", "RSyn0840M04M", 
"nuclear14a", "nuclear14b", "nuclear25", "nuclear25b", "nuclear25a", "unitcommit2", "space25", 
"lop97icx", "crudeoil_pooling_dt1", "space960", "crudeoil_pooling_dt4", "ibs2", 
"crudeoil_pooling_dt3", "lop97ic", "supplychainr1_053050", "nuclear49", "nuclear49a", "nuclear49b", 
"telecomsp_pacbell", "telecomsp_metro", "hvb11", "nuclear10b"];   


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
 * Change the status from UserLimit to status optimal if solution found and
 * if time limit not reached
 * @param {Object} d one data object
 */
function getRealStatus(d) {
    d.status = d.status.trim();
    if ((d.status == "UserLimit") && !isNaN(d.objval) && (d.time <= max_time-10)) { // close to max time
        return "Optimal";
    }
    return d.status;
}