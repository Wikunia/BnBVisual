#!/usr/bin/env julia

using DataFrames
using CSV
using LatexPrint
include("util.jl")

files = ["juniper","bonmin-nlw","knitro-nlw","minotaur-nlw","couenne-nlw","scip-nlw"]
header = ["stdout","instance","nodes","bin_vars","int_vars","constraints",
"sense","objval","best_bound","status","time"]
objval_cols = [:scip_objval,:couenne_objval,:bonmin_objval,:juniper_objval,:knitro_objval,:minotaur_objval]
solver_names = [:scip,:couenne,:bonmin,:minotaur,:knitro,:juniper]
local_solver_names = [:bonmin,:minotaur,:knitro,:juniper]
tex_headers = [:instance,:nodes,:constraints,:disc_vars,:nl_constr,:objval,
:juniper_gap,:bonmin_gap,:minotaur_gap,:knitro_gap,:couenne_gap,:scip_gap,
:juniper_time,:bonmin_time,:minotaur_time,:knitro_time,:couenne_time,:scip_time]

mlibheader = ["instance", "nodes", "constraints", "bin_vars", "int_vars", "nl_constr","sense","dual"]
dir = "/home/ole/GitHub/bnb_visual/"

function readjoindata()
    data = []
    
    c = 1
    for f in files
        df = CSV.read(dir*"data/"*f*"_data.csv"; header=header, types=[String for h in header])
        df[:instance] = [strip(value[1:end-3]) for (i, value) in enumerate(df[:instance])]
        for col in [:sense,:status]
            df[col] = [strip(value) for (i, value) in enumerate(df[col])]
        end
        for col in [:nodes,:bin_vars,:int_vars,:constraints]
            df[col] = [parse(Int64, value) for (i, value) in enumerate(df[col])]
        end
        for col in [:objval,:best_bound,:time]
            df[col] = [parse(Float64, strip(value)) for (i, value) in enumerate(df[col])]
        end
    
        delete!(df, :stdout)
        delete!(df, :sense)
        delete!(df, :nodes)
        delete!(df, :bin_vars)
        delete!(df, :int_vars)
        delete!(df, :constraints)
        delete!(df, :best_bound)
    
        for col in [:objval,:status,:time]
            if !contains(f,"juniper")
                # remove nlw
                rename!(df, col => convert(Symbol, f[1:end-4]*"_"*string(col)))
            else 
                rename!(df, col => convert(Symbol, "juniper_"*string(col)))
            end
         end
        
        push!(data,df)
        c += 1
    end
    
    df = CSV.read(dir*"data/minlib_extra_data.csv"; header=mlibheader, types=[String,Int64,Int64,Int64,Int64,Int64,String,Float64])
    println(df)
    push!(data,df)
    
    f = data[1]
    
    for i=2:length(data)
        f = join(f, data[i], on = :instance, kind = :outer)
    end
    
    println("size: ",size(f,1))
    f = sort(f, cols = :bin_vars)
    println(f)
    return f     
end




"""
    generateviewdf(f)

Set time to NaN if gap is NaN
Get only every Xth entry (atm x = 13 :D)
"""
function generateviewdf(of)
    f = deepcopy(of)
    delete_idx = Vector{Int64}()
    idx = 1
    for r in eachrow(f)
        for solver in solver_names
            gap_col = Symbol(string(solver)*"_gap")
            time_col = Symbol(string(solver)*"_time")
            if isnan(r[gap_col])
                r[time_col] = NaN
            end
        end
        cnf = 0
        for solver in local_solver_names
            gap_sym = Symbol(string(solver)*"_gap")
            if isnan(r[gap_sym])
                cnf += 1
            end
        end
        if cnf == length(local_solver_names)
            push!(delete_idx,idx)
        end
        idx += 1
    end
    deleterows!(f, delete_idx)
    println("size of view before uniform: ",size(f,1))
    return f,f[1:13:end,:]
end

f = readjoindata()
f = fillmissings(f)
f = computegaps(f)
f = sort(f, cols = :disc_vars)

println("Check for dual bounds")

nviolations = 0
for row in eachrow(f)
    if (row[:sense] == "Min" && row[:objval]+0.05*(abs(row[:objval])+0.001) < row[:dual]) ||
        (row[:sense] == "Max" && row[:objval]-0.05*(abs(row[:objval])+0.001) > row[:dual])
        println(row)
        nviolations += 1
    end
end
println("#Violations: ", nviolations)

# remove objval columns
for obj_col in objval_cols
    delete!(f, obj_col)
end
nf, vf = generateviewdf(f)

println(nf[:,[:instance,:scip_gap,:scip_time]])

# generate tex
written_instances = []

format = Dict{Symbol,Any}()
format[:instance] = format_instance
format[:nodes] = format_string
format[:constraints] = format_string
format[:disc_vars] = format_int
format[:nl_constr] = format_int
gap_cols = [Symbol(string(solver)*"_gap") for solver in solver_names]
for col in gap_cols
    format[col] = format_gap
end
time_cols = [Symbol(string(solver)*"_time") for solver in solver_names]
for col in time_cols
    format[col] = format_time
end
format[:objval] = format_objval


spaces = Dict{Symbol,Int64}()              
for col in tex_headers
    spaces[col] = 0
end

# get number of spaces
# extra space for textbf in each column :/
for col in tex_headers
    spaces[col] = maximum([length(format[col] != nothing ? format[col](value) : value)+9 for value in vf[col]])
end

noprint_c = 0
tex_file = open(dir*"table_data.tex", "w")

tex_start = ["",
"\\begin{table*}[t]",
"\\footnotesize",
"\\caption{Quality and Runtime Results for Various Instances}",
"\\begin{tabular}{|r|r|r|r|r||r||r|r|r|r|r|r||r|r|r|r|r|r|r|}",
"\\hline",
" \\multicolumn{6}{|c||}{} & juniper    & bonmin  & minot & knitro & couenne        & scip            & juniper          & bonmin  & minot & knitro  & couenne         & scip \\\\ ",
"    \\hline",
"    \\hline"]

tex_end = ["\\hline","\\end{tabular}\\\\",
"\\label{table:results}",
"\\end{table*}"]

for ln in tex_start
    write(tex_file, "$ln \n")
end

# average for each solver over all
ln = "\\multicolumn{6}{|c||}{Feasible instances / Time Limit reached} & "
ln2 = "\\multicolumn{6}{|c||}{Average solver feasible} & "
for head in tex_headers 
    sthead = string(head)
    spsthead = split(sthead,"_")
    if Symbol(spsthead[1]) in solver_names
        vals = []
        tl_reached = 0
        for r in eachrow(f)
            if !isnan(r[Symbol(spsthead[1]*"_gap")])
                push!(vals,r[head])
            end
            if r[Symbol(spsthead[1]*"_time")] >= 3600
                tl_reached += 1
            end
        end
        println(head)
        mean_val = mean(vals)
        println(sthead[end-3:end])
        if sthead[end-2:end] == "gap"
            ln *= string(@sprintf "%d" length(vals)) * " & "
        else
            ln *= string(@sprintf "%d" tl_reached) * " & "
        end
        if mean_val >= 10000
            ln2 *= string(@sprintf "%.0e" mean_val) * " & "
        else
            ln2 *= string(@sprintf "%.2f" mean_val) * " & "
        end
    end
end
ln = ln[1:end-2]*" \\\\"
ln2 = ln2[1:end-2]*" \\\\"
write(tex_file, "$ln \n")
write(tex_file, "\\hline \n")
write(tex_file, "\\multicolumn{6}{|c||}{} & \\multicolumn{6}{c||}{Gap (\\%)} &  \\multicolumn{6}{c|}{Runtime (seconds)} \\\\ ")
write(tex_file, "\\hline \n")
write(tex_file, "$ln2 \n")



# average where all solves find feasible
ln = ""
l_vals = 0
for head in tex_headers 
    sthead = string(head)
    spsthead = split(sthead,"_")
    println(head)
    if Symbol(spsthead[1]) in solver_names
        vals = []
        for r in eachrow(f)
            if allfeasible(r,solver_names)
                push!(vals,r[head])
                if Symbol(spsthead[1]) == :juniper && spsthead[2] == "gap" && r[head] > 100
                    println(r)
                end
            end
        end
        mean_val = mean(vals)
        l_vals = length(vals)
        if mean_val >= 10000
            ln *= string(@sprintf "%.0e" mean_val) * " & "
        else
            ln *= string(@sprintf "%.2f" mean_val) * " & "
        end
    end
end
ln = ln[1:end-2]*" \\\\"
title_line = "\\multicolumn{6}{|c||}{Average all solvers feasible (n=$l_vals)} & "
write(tex_file, "$title_line $ln \n")


# average where local solves find feasible
ln = ""
l_vals = 0
for head in tex_headers 
    sthead = string(head)
    spsthead = split(sthead,"_")
    println(head)
    if Symbol(spsthead[1]) in solver_names
        if Symbol(spsthead[1]) in local_solver_names
            vals = []
            for r in eachrow(f)
                if allfeasible(r,local_solver_names)
                    push!(vals,r[head])
                end
            end
            mean_val = mean(vals)
            l_vals = length(vals)
            if mean_val >= 10000
                ln *= string(@sprintf "%.0e" mean_val) * " & "
            else
                ln *= string(@sprintf "%.2f" mean_val) * " & "
            end
        else
            ln *= "- & "
        end
    end
end
ln = ln[1:end-2]*" \\\\"
title_line = "\\multicolumn{6}{|c||}{Average all local solvers feasible (n=$l_vals)} & "
write(tex_file, "$title_line $ln \n")

write(tex_file, "\\hline \n")
write(tex_file, "Instance   & \$|V|\$& \$|C|\$& \$|I|\$& \$|NC|\$ & best obj.  & juniper    & bonmin  & minot &  knitro & couenne        & scip            & juniper          & bonmin  & minot & knitro  & couenne         & scip \\\\ \n")
write(tex_file, "\\hline \n")

rc = 0
last_rc = 0
write_counter = 0
println("lvf: ", length(vf))
for r in eachrow(vf)
    str_min_gap  = format[gap_cols[1]](minimum([isnan(r[col]) ? Inf : r[col] for col in gap_cols]))
    str_min_time = format[time_cols[1]](minimum([isnan(r[col]) ? Inf :r[col] for col in time_cols]))

    # get 
    svals = []
    for col in tex_headers
        push!(svals, format[col](r[col]))
    end

    ci = 1
    for sval in svals
        col = tex_headers[ci]
        if (col in gap_cols && sval == str_min_gap) || (col in time_cols && sval == str_min_time)
            if r[col] >= 1 || col in gap_cols
                svals[ci] = "\\textbf{"*sval*"}"
            end
        end
        ci += 1
    end
    ln = ""
    ci = 1
    for sval in svals
        lval = length(sval)
        col = tex_headers[ci]
        if ci == length(tex_headers)
            ln *= repeat(" ", spaces[col]-lval)*sval*" \\\\"
        else
            ln *= repeat(" ", spaces[col]-lval)*sval*" &"
        end
        ci += 1
    end

    push!(written_instances, r[:instance])
    write_counter += 1
    write(tex_file, "$ln \n")
    rc += 1
 

    if write_counter % 35 == 0 && rc != last_rc && size(vf,1) % 35 != 0
        last_rc = rc
        for eln in tex_end
            write(tex_file, "$eln \n")
        end

        for sln in tex_start
            write(tex_file, "$sln \n")
        end
    end
end

for eln in tex_end
    write(tex_file, "$eln \n")
end

close(tex_file)

println("Resonable lines: ", rc) 
println("Written lines: ", write_counter)

println("written_instances: ")
println(written_instances)