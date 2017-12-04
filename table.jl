using DataFrames
using CSV
using LatexPrint

files = ["bonmin-nlw","couenne-nlw","scip-nlw","knitro-nlw","juniper"]
header = ["stdout","instance","nodes","bin_vars","int_vars","constraints",
"sense","objval","best_bound","status","time"]

data = []
c = 1
for f in files
    df = CSV.read("data/"*f*"_data.csv"; header=header)
    df[:instance] = [strip(value[1:end-3]) for (i, value) in enumerate(df[:instance])]
    for col in [:sense,:status]
        df[col] = [strip(value) for (i, value) in enumerate(df[col])]
    end
    for col in [:nodes,:bin_vars,:int_vars,:constraints]
        df[col] = [convert(Int64, value) for (i, value) in enumerate(df[col])]
    end
    for col in [:objval,:best_bound,:time]
        df[col] = [isa(value, String) ? parse(Float64, strip(value)) : convert(Float64, value) for (i, value) in enumerate(df[col])]
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
        if f != "juniper"
            # remove nlw
            rename!(df, col, convert(Symbol, f[1:end-4]*"_"*string(col)))
        else 
            rename!(df, col, convert(Symbol, f*"_"*string(col)))
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

objval_cols = [:scip_objval,:couenne_objval,:knitro_objval,:bonmin_objval,:juniper_objval]
solver_names = [:scip,:couenne,:knitro,:bonmin,:juniper]
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

end 

f = sort(f, cols = :sum_time)

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
        return "\$\\leq 1\$"
    end

    return string(@sprintf "%d" ceil(val))
end

function format_objval(val)
    return string(@sprintf "%.2f" val)
end

function format_string(val)
    return string(val)
end

# generate tex
tex_headers = [:instance,:nodes,:constraints,:objval,
              :juniper_gap,:bonmin_gap,:knitro_gap,:couenne_gap,:scip_gap,
              :juniper_time,:bonmin_time,:knitro_time,:couenne_time,:scip_time]

format = Dict{Symbol,Any}()
format[:instance] = nothing
format[:nodes] = format_string
format[:constraints] = format_string
gap_cols = [:juniper_gap,:bonmin_gap,:knitro_gap,:couenne_gap,:scip_gap]
for col in gap_cols
    format[col] = format_gap
end
time_cols = [:juniper_time,:bonmin_time,:knitro_time,:couenne_time,:scip_time]
for col in time_cols
    format[col] = format_time
end
format[:objval] = format_objval


spaces = Dict{Symbol,Int64}()              
for col in tex_headers
    spaces[col] = 0
end

# get number of spaces
for col in tex_headers
    spaces[col] = maximum([length(format[col] != nothing ? format[col](value) : value)+1 for value in f[col]])
end

open("table_data.tex", "w") do tex_file
    for r in eachrow(f)
        ln = ""
        c = 1
        for col in tex_headers
            sval = ""
            if string(col)[end-3:end] == "time"
                solver = string(col)[1:end-5]
                gap_name = Symbol(solver*"_gap")
                gap = r[gap_name]
                if format[gap_name](gap) == "-"
                    sval = "-"
                end
            end
            if sval == ""
                sval = format[col] != nothing ? format[col](r[col]) : r[col]
            end
            lval = length(sval)
            if c == length(tex_headers)
                ln *= repeat(" ", spaces[col]-lval)*sval*" \\\\"
            else
                ln *= repeat(" ", spaces[col]-lval)*sval*" &"
            end
            c += 1
        end
        write(tex_file, "$ln \n")
    end
end


print() 