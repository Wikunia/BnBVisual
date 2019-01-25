
using JSON
filename = "tln5"
so_del_keys = ["obj_gain","idx_time","node_idx_time","branch_time","upd_gains_time","upd_gains"]

function iterate!(tree)
    for del_key in so_del_keys
        if haskey(tree["step_obj"], del_key)
            delete!(tree["step_obj"], del_key)
        end
    end
    if haskey(tree["step_obj"], "strong_int_vars") && length(tree["step_obj"]["strong_int_vars"]) == 0
        delete!(tree["step_obj"], "strong_int_vars")
    end
    if haskey(tree["step_obj"], "nrestarts") && tree["step_obj"]["nrestarts"] == 0
        delete!(tree["step_obj"], "nrestarts")
    end
    if haskey(tree, "children")
        for ch in tree["children"]
            iterate!(ch)
        end
    end
end

s = open("data/json/v0.2.2_inf_gains/"*filename*".json") do file
    read(file, String)
end

println("Finished reading")
init_length = length(s)
s = replace(s, "\"best_bound\"" => "\"bb\"")
s = replace(s, "\"relaxation_state\"" => "\"rs\"")
s = replace(s, "\"state\"" => "\"st\"")
s = replace(s, "\"Normal\"" => "\"N\"")
s = replace(s, "\"Optimal\"" => "\"O\"")
s = replace(s, "\"Infeasible\"" => "\"I\"")
s = replace(s, "\"Done\"" => "\"D\"")
s = replace(s, "\"var_idx\"" => "\"vi\"")
s = replace(s, "\"node\"" => "\"n\"")
s = replace(s, "\"gain_gap\"" => "\"gg\"")


parsed = JSON.parse(s)
println("Length: ", init_length)


iterate!(parsed["tree"])

s = JSON.json(parsed)
println("Length/Init: ", length(s)/init_length)
write("data/json/v0.2.2_inf_gains/"*filename*"_sm.json", s)