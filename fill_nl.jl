using DataFrames
using CSV
using MINLPLibJuMP
using Juniper 
using Ipopt
using JuMP


dir = "/home/ole/GitHub/bnb_visual/data/"
header = ["instance", "var", "constr", "bin", "int", "nl_constr","sense"]

instances = ["oil2", "nous1", "eg_int_s", "eg_disc2_s", "eg_disc_s", "watertreatnd_flow", "bchoco05", "watercontamination0202r", "feedtray", "bchoco06", "eg_all_s", "bchoco07", "sjup2", "sfacloc1_2_95", "transswitch0009p", "bchoco08", "sfacloc1_3_95", "sfacloc1_4_95", "transswitch0009r", "tspn05", "squfl010-080persp", "var_con10", "heatexch_spec1", "synheat", "var_con5", "ex1233", "watercontamination0303r", "waterx", "squfl015-080persp", "squfl015-060", "squfl015-080", "heatexch_gen2", "heatexch_spec2", "ghg_2veh", "oil", "transswitch0014r", "squfl020-150persp", "squfl020-150", "squfl020-040", "squfl020-050", "deb6", "transswitch0014p", "deb10", "squfl025-040persp", "squfl025-025", "squfl025-040", "squfl025-030", "waterno2_03", "tspn08", "squfl030-150persp", "sfacloc1_2_90", "sfacloc1_4_90", "sfacloc1_3_90", "squfl030-150", "squfl030-100persp", "squfl030-100", "ghg_3veh", "waterno2_04", "gasprod_sarawak16", "gasprod_sarawak81", "kport20", "ndcc15persp", "squfl040-080", "ndcc15", "squfl040-080persp", "casctanks", "FLay05H", "FLay05M", "transswitch0030r", "transswitch0030p", "fo7", "o7_2", "o7_ar4_1", "o7_ar25_1", "no7_ar4_1", "o7_ar3_1", "o7_ar2_1", "o7_ar5_1", "no7_ar3_1", "ndcc13", "no7_ar5_1", "o7", "ndcc13persp", "edgecross10-060", "super3t", "chp_partload", "tspn10", "pooling_epa2", "transswitch0039p", "ndcc12persp", "ndcc12", "4stufen", "crudeoil_li01", "tln6", "CLay0205H", "beuster", "ndcc14", "waterno2_06", "ndcc14persp", "genpooling_meyer04", "CLay0305H", "fo8_ar4_1", "fo8_ar5_1", "o8_ar4_1", "fo8", "fo8_ar25_1", "FLay06M", "FLay06H", "procurement1mot", "heatexch_gen3", "ndcc16", "heatexch_spec3", "ndcc16persp", "sfacloc1_4_80", "sfacloc1_3_80", "sfacloc1_2_80", "tln7", "wastepaper5", "tspn12", "sssd15-04", "fo9", "fo9_ar3_1", "waternd2", "sssd15-04persp", "fo9_ar25_1", "o9_ar4_1", "fo9_ar2_1", "fo9_ar5_1", "fo9_ar4_1", "forest", "edgecross10-080", "sssd12-05", "sssd12-05persp", "multiplants_mtg5", "edgecross14-039", "crudeoil_pooling_ct1", "waterno2_09", "crudeoil_lee3_06", "blend718", "blend721", "blend146", "contvar", "edgecross10-070", "graphpart_clique-30", "wastepaper6", "sssd20-04", "sssd20-04persp", "multiplants_mtg1b", "multiplants_mtg1a", "hydroenergy1", "crudeoil_lee3_07", "portfol_shortfall100_04", "blend531", "tspn15", "product", "crudeoil_pooling_ct2", "graphpart_3pm-0334-0334", "sssd15-06persp", "waterno2_12", "sssd15-06", "gams01", "sssd25-04persp", "multiplants_mtg2", "sssd25-04", "crudeoil_lee3_08", "SLay08H", "kport40", "multiplants_mtg1c", "graphpart_clique-40", "blend852", "sfacloc2_4_80", "blend480", "crudeoil_lee2_09", "sssd18-06persp", "waterz", "water4", "sssd18-06", "crudeoil_lee3_09", "crudeoil_pooling_ct3", "crudeoil_li03", "crudeoil_li05", "crudeoil_li06", "sssd16-07persp", "sssd16-07", "crudeoil_lee4_07", "tls5", "gasnet_al1", "gasnet_al3", "crudeoil_pooling_ct4", "crudeoil_lee2_10", "crudeoil_lee3_10", "csched2a", "sssd15-08persp", "sssd15-08", "graphpart_3pm-0344-0344", "graphpart_clique-50", "pooling_epa3", "crudeoil_lee4_08", "edgecross14-078", "waterno2_18", "sssd18-08", "sssd18-08persp", "nuclearve", "nuclearvb", "nuclearvd", "tln12", "nuclearva", "nuclearvc", "nuclearvf", "crudeoil_lee4_09", "multiplants_mtg6", "transswitch0118p", "tls6", "transswitch0118r", "crudeoil_li11", "SLay10H", "graphpart_clique-60", "cecil_13", "edgecross14-176", "edgecross14-058", "edgecross14-098", "sssd20-08persp", "sssd20-08", "genpooling_meyer10", "faclay20h", "crudeoil_lee4_10", "graphpart_3g-0444-0444", "hydroenergy2", "graphpart_3pm-0444-0444", "chp_shorttermplan2b", "multiplants_stg1", "sssd22-08persp", "sssd22-08", "portfol_classical200_2", "portfol_shortfall200_05", "portfol_robust200_03", "graphpart_clique-70", "crossdock_15x7", "multiplants_stg1a", "waterno2_24", "crudeoil_li21", "sssd25-08", "sssd25-08persp", "qapw", "qap", "gastrans135", "crossdock_15x8", "crudeoil_li02", "space25a", "multiplants_stg1b", "graphpart_2g-0099-9211", "graphpart_2pm-0099-0999", "gastrans582_warm15", "multiplants_stg1c", "carton7", "chp_shorttermplan1b", "carton9", "tls7", "graphpart_2g-1010-0824", "csched2", "hydroenergy3", "genpooling_meyer15", "RSyn0815M04M", "edgecross20-040", "routingdelay_bigm", "routingdelay_proj", "waste", "saa_2", "procurement1large", "RSyn0820M04M", "supplychainp1_022020", "supplychainr1_022020", "edgecross22-048", "netmod_dol1", "RSyn0830M04M", "edgecross24-057", "nuclear14", "RSyn0840M04M", "nuclear14a", "nuclear14b", "nuclear25", "nuclear25b", "nuclear25a", "unitcommit2", "space25", "crudeoil_pooling_dt1", "space960", "crudeoil_pooling_dt4", "ibs2", "crudeoil_pooling_dt3", "supplychainr1_053050", "nuclear49", "nuclear49a", "nuclear49b", "telecomsp_pacbell", "telecomsp_metro", "hvb11", "nuclear10b"]

c = 1
df = CSV.read(dir*"minlib_extra_data.csv"; header=header, types=[String,Int64,Int64,Int64,Int64,Int64,String])
# df[:instance] = [strip(value[1:end-3]) for (i, value) in enumerate(df[:instance])]

# df[:nl_constr] = zeros(size(df,1))


juniper = JuniperSolver(IpoptSolver(print_level=0);
    branch_strategy=:MostInfeasible,
    processors=1,
    time_limit=1,
    incumbent_constr = false,
    num_resolve_root_relaxation = 0
)

c = 1
for r in eachrow(df)
    println("c: ",c)
    # println("Started "*r[:instance])
    c += 1
    if length(r[:sense]) < 3
        m = fetch_model("JuniperLibSm/"*r[:instance]) 
        if typeof(m) != Void
            setsolver(m, juniper)
            solve(m)
            r[:var] = m.internalModel.num_var
            r[:constr] = m.internalModel.num_constr
            r[:bin] = m.internalModel.nbinvars
            r[:int] = m.internalModel.nintvars
            r[:nl_constr] = m.internalModel.num_nl_constr
            r[:sense] = m.internalModel.obj_sense
        else
            println(r)
        end
        # println("Finished "*r[:instance])
        CSV.write("data/minlib_extra_data.csv", df)
    end
    
end

println(df)
CSV.write("data/minlib_extra_data.csv", df)