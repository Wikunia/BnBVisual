using DataFrames
using CSV
using LatexPrint
include("util.jl")

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
scip_couenne_filtered = []

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
    delete!(df, :best_bound)

    for col in [:objval,:status,:time,:sense,:nodes,:bin_vars,:int_vars,:constraints]
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
    f = join(f, data[i], on = :instance, kind = :outer)
end


for col in [:sense,:nodes,:bin_vars,:int_vars,:constraints]
    a_col = Symbol("bonmin_"*string(col))
    b_col = Symbol("couenne_"*string(col))
    c_col = Symbol("scip_"*string(col))
    d_col = Symbol("juniper_"*string(col))
    f[col] = map((a,b,c,d) -> not_missing([a,b,c,d]), f[a_col], f[b_col], f[c_col], f[d_col])
    delete!(f, a_col)
    delete!(f, b_col)
    delete!(f, c_col)
    delete!(f, d_col)
end

fillmissings(f)
# set time to 4000 if error or unbounded or Infeasible
time_adjustment(f)

computegaps(f, knitro=false)


f = sort(f, cols = :disc_vars)

# remove objval columns
for obj_col in objval_cols
    delete!(f, obj_col)
end

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
break_after = false
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
        push!(scip_couenne_filtered,r[:instance])
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
            if format[gap_name](gap) == "-" && r[col] < 3600
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
    if break_after
        error("1")
    end
end

sort!(scip_couenne_filtered)

println("Uninteresting lines: ", noprint_c) 
println("Resonable lines: ", rc) 
println("reasonable_instances: ")
println(reasonable_instances)
println("Filtered by scip/couenne: ")
println(scip_couenne_filtered)