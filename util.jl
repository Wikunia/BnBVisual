
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
    if abs(best_obj-value)/abs(best_obj)*100 > 300
        println("status: ", status)
        println("best_obj: ", best_obj)
        println("value: ", value)
        println("gap: ", abs(best_obj-value)/abs(best_obj)*100)
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

function time_adjustment(f)
    for solver in solver_names
        status_symbol = Symbol(string(solver)*"_status")
        time_symbol = Symbol(string(solver)*"_time")
        for r in eachrow(f)
            if r[status_symbol] == "Error" || r[status_symbol] == "Unbounded" || r[status_symbol] == "Infeasible"
                r[time_symbol] = 4000
            end
        end
    end 
    return f
end

function computegaps(f; knitro=true)
    # get best objective from all

    f[:objval]      = NaN*ones(size(f,1))
    knitro && (f[:knitro_gap]  = NaN*ones(size(f,1)))

    for solver in solver_names
        gap_col = Symbol(string(solver)*"_gap")
        f[gap_col]    = NaN*ones(size(f,1))
    end
    
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

function allfeasible(r)
    for solver in solver_names
        gap_sym = Symbol(string(solver)*"_gap")
        if isnan(r[gap_sym])
            return false
        end
    end
    return true
end

function not_missing(arr)
    for a in arr
        if typeof(a) != Missings.Missing
            return a
        end
    end
end