#!/usr/bin/env julia

using DataFrames
using CSV
using LatexPrint


files = ["juniper","bonmin-nlw","couenne-nlw","scip-nlw"]
header = ["stdout","instance","nodes","bin_vars","int_vars","constraints",
"sense","objval","best_bound","status","time"]
objval_cols = [:scip_objval,:couenne_objval,:bonmin_objval,:juniper_objval]
solver_names = [:scip,:couenne,:bonmin,:juniper]
tex_headers = [:instance,:nodes,:constraints,:disc_vars,:nl_constr,:objval,
:juniper_gap,:bonmin_gap,:couenne_gap,:scip_gap,
:juniper_time,:bonmin_time,:couenne_time,:scip_time]

mlibheader = ["instance", "gams_obj", "bin", "int", "nl_constr"]

function readjoindata()
    data = []
    
    dir = "/home/ole/GitHub/bnb_visual/"
    
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
        if c != 1
            delete!(df, :sense)
            delete!(df, :nodes)
            delete!(df, :bin_vars)
            delete!(df, :int_vars)
            delete!(df, :constraints)
        end
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
    
    df = CSV.read(dir*"data/minlib_extra_data.csv"; header=mlibheader, types=[String for h in mlibheader])
    println(df)
    push!(data,df)
    
    f = data[1]
    
    for i=2:length(data)
        f = join(f, data[i], on = :instance, kind = :outer)
    end
    
    println("size: ",size(f,1))
    return f[1:124,:] # first 124 instances as rest is missing ...
end

"""
get_value(sense, status, value)

return value if optimal
return worst value if Infeasible, Error, Unbounded or value is NaN 
"""
function get_value(sense, status, value)
    if status == "Infeasible" || status == "Error" || status == "Unbounded" || isnan(value)
        if sense == :Min
            return Inf
        else 
            return -Inf
        end
    end
    return value
end

function get_gap(status, value, best_obj)
    if status == "Infeasible" || status == "Error" || status == "Unbounded" || isnan(value)
        return NaN
    end
    return abs(best_obj-value)/abs(best_obj)*100
end

function fillmissings(f)
    for solver in solver_names
        status_symbol = Symbol(string(solver)*"_status")
        obj_symbol = Symbol(string(solver)*"_objval")
        time_symbol = Symbol(string(solver)*"_time")
        for r in eachrow(f)
            if isa(r[status_symbol],Missings.Missing)
                r[status_symbol] = "UserLimit"
                r[obj_symbol] = NaN
                r[time_symbol] = 4000
            end
        end
    end 
    return f
end

function computegaps(f)
    # get best objective from all

    f[:objval]      = NaN*ones(size(f,1))
    f[:scip_gap]    = NaN*ones(size(f,1))
    f[:couenne_gap] = NaN*ones(size(f,1))
    f[:knitro_gap]  = NaN*ones(size(f,1))
    f[:bonmin_gap]  = NaN*ones(size(f,1))
    f[:juniper_gap] = NaN*ones(size(f,1))

    f[:sum_time] = zeros(size(f,1))
    f[:disc_vars] = zeros(size(f,1))

    for r in eachrow(f) 
        if r[:sense] == "Min"
            r[:objval] = minimum([get_value(:Min, r[Symbol(string(solver)*"_status")], r[Symbol(string(solver)*"_objval")]) for solver in solver_names])
        else
            r[:objval] = maximum([get_value(:Max, r[Symbol(string(solver)*"_status")], r[Symbol(string(solver)*"_objval")]) for solver in solver_names])
        end

        # compute gap
        for solver in solver_names
            gap_col = Symbol(string(solver)*"_gap")
            status = r[Symbol(string(solver)*"_status")]
            value = r[Symbol(string(solver)*"_objval")]
            r[gap_col] = get_gap(status, value, r[:objval])
        end

        r[:disc_vars] = r[:int_vars]+r[:bin_vars]
    end 
    return f
end


function format_gap(val)
    if isnan(val)
        return "-"
    end
    if val >= 1000
        return "\$\\gg\$"
    end

    return string(@sprintf "%.2f" val)
end

function format_time(val)
    if val >= 3600
        return "T.L"
    end
    if val < 1
        return "\$\\bm{< 1}\$"
    end
    if isnan(val)
        return "-"
    end

    return string(@sprintf "%d" ceil(val))
end

function format_objval(val)
    return string(@sprintf "%.2f" val)
end

function format_string(val)
    return string(val)
end

function format_int(val)
    if isa(val, Missings.Missing)
        return "0"
    end
    if isa(val, String)
        return val
    end

    return string(convert(Int64,val))
end

function format_instance(val)
    return replace(val,"_","\\_")
end

"""
    generateviewdf(f)

Set time to NaN if gap is NaN
Get only every forth entry
"""
function generateviewdf(f)
    println(f[:,[:instance,:juniper_gap,:bonmin_gap,:juniper_time,:bonmin_time]])
    for r in eachrow(f)
        for solver in solver_names
            gap_col = Symbol(string(solver)*"_gap")
            time_col = Symbol(string(solver)*"_time")
            if isnan(r[gap_col])
                r[time_col] = NaN
            end
        end
    end
    println(f[:,[:instance,:juniper_gap,:bonmin_gap,:juniper_time,:bonmin_time]])
    return f[1:4:end,:]
end


f = readjoindata()
f = fillmissings(f)
f = computegaps(f)
f = sort(f, cols = :disc_vars)
# remove objval columns
for obj_col in objval_cols
    delete!(f, obj_col)
end
vf = generateviewdf(f)


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
"\\begin{tabular}{|r|r|r|r|r||r||r|r|r|r||r|r|r|r|r|}",
"\\hline",
"                        &     &       &        &  &   & \\multicolumn{4}{c||}{Gap (\\%)} &  \\multicolumn{4}{c|}{Runtime (seconds)} \\\\",
"    Instance              & \$|V|\$& \$|C|\$& \$|I|\$& \$|NC|\$ & obj         & juniper    & bonmin & couenne        & scip            & juniper          & bonmin            & couenne         & scip \\\\",
"    \\hline",
"    \\hline"]

tex_end = ["\\hline","\\end{tabular}\\\\",
"\\label{table:results}",
"\\end{table*}"]

for ln in tex_start
    write(tex_file, "$ln \n")
end

# average for each solver
ln = "\\multicolumn{6}{|c||}{Average solver feasible} & "
for head in tex_headers 
    sthead = string(head)
    spsthead = split(sthead,"_")
    if Symbol(spsthead[1]) in solver_names
        vals = []
        for r in eachrow(vf)
            if !isnan(r[Symbol(spsthead[1]*"_gap")])
                push!(vals,r[head])
            end
        end
        println(head)
        println(vals)
        mean_val = mean(vals)
        println(mean_val)
        ln *= string(@sprintf "%.2f" mean_val) * " & "
    end
end
ln = ln[1:end-2]*" \\\\"
write(tex_file, "$ln \n")

function allfeasible(r)
    for solver in solver_names
        gap_sym = Symbol(string(solver)*"_gap")
        if isnan(r[gap_sym])
            return false
        end
    end
    return true
end

# average where all solves find feasible
ln = "\\multicolumn{6}{|c||}{Average all solvers feasible} & "
for head in tex_headers 
    sthead = string(head)
    spsthead = split(sthead,"_")
    println(head)
    if Symbol(spsthead[1]) in solver_names
        vals = []
        for r in eachrow(vf)
            if allfeasible(r)
                push!(vals,r[head])
            end
        end
        mean_val = mean(vals)
        ln *= string(@sprintf "%.2f" mean_val) * " & "
    end
end
ln = ln[1:end-2]*" \\\\"
write(tex_file, "$ln \n")
write(tex_file, "\\hline \n")
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
 

    if write_counter % 35 == 0 && rc != last_rc
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