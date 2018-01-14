using DataFrames
using CSV
using LatexPrint

files = ["bonmin-nlw","couenne-nlw","scip-nlw","juniper"]
header = ["stdout","instance","nodes","bin_vars","int_vars","constraints",
"sense","objval","best_bound","status","time"]
objval_cols = [:scip_objval,:couenne_objval,:bonmin_objval,:juniper_objval]
solver_names = [:scip,:couenne,:bonmin,:juniper]
tex_headers = [:instance,:nodes,:constraints,:objval,
:juniper_gap,:bonmin_gap,:couenne_gap,:scip_gap,
:juniper_time,:bonmin_time,:couenne_time,:scip_time]

data = []
reasonable_instances = []

c = 1
for f in files
    df = CSV.read("data/complete/"*f*"_data.csv"; header=header,
    types=[String for h in header])
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

f = data[1]

for i=2:length(data)
    f = join(f, data[i], on = :instance)
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

    # get sum time for sorting
    for solver in solver_names
        time =  r[Symbol(string(solver)*"_time")]
        r[:sum_time] += time
    end

    r[:disc_vars] = r[:int_vars]+r[:bin_vars]

end 


f = sort(f, cols = :disc_vars)

# remove objval columns
for obj_col in objval_cols
    delete!(f, obj_col)
end

for r in eachrow(f)
    println(r)
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

    return string(@sprintf "%d" ceil(val))
end

function format_objval(val)
    return string(@sprintf "%.2f" val)
end

function format_string(val)
    return string(val)
end

function format_instance(val)
    return replace(val,"_","\\_")
end

# generate tex

format = Dict{Symbol,Any}()
format[:instance] = format_instance
format[:nodes] = format_string
format[:constraints] = format_string
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
    spaces[col] = maximum([length(format[col] != nothing ? format[col](value) : value)+9 for value in f[col]])
end

noprint_c = 0

rc = 0
last_rc = 0
write_counter = 0
for r in eachrow(f)
    l_arr = []
    c = 1
    time_smaller_10_c = 0
    time_greater_3600_c = 0
    bprint = true

    if isinf(r[:objval])
        noprint_c += 1
        continue
    end

    if r[:scip_time] <= 60 || r[:couenne_time] <= 60
        noprint_c += 1
        continue
    end

    if r[:juniper_time] >= 3600 && r[:bonmin_time] >= 3600 
        noprint_c += 1
        continue
    end

    for col in tex_headers
        sval = ""
        if string(col)[end-3:end] == "time"
            if r[col] <= 10
                time_smaller_10_c += 1
                if time_smaller_10_c == length(solver_names)
                    bprint = false
                    break
                end
            end
            if r[col] >= 3600
                time_greater_3600_c += 1
                if time_greater_3600_c == length(solver_names)
                    bprint = false
                    break
                end
            end
            solver = string(col)[1:end-5]
            gap_name = Symbol(solver*"_gap")
            gap = r[gap_name]
            if format[gap_name](gap) == "-"
                time_greater_3600_c += 1
                if time_greater_3600_c == length(solver_names)
                    bprint = false
                    break
                end
                sval = "-"
                r[col] = NaN
            end
        end
        if sval == ""
            sval = format[col] != nothing ? format[col](r[col]) : r[col]
        end
        lval = length(sval)
        
        push!(l_arr, sval)
        c += 1    
    end

    if bprint   
        push!(reasonable_instances, r[:instance])
        rc += 1
    else 
        noprint_c += 1
    end
end

println("Uninteresting lines: ", noprint_c) 
println("Resonable lines: ", rc) 
println("reasonable_instances: ")
println(reasonable_instances)