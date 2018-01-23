using DataFrames
using CSV
using MINLPLibJuMP
using Juniper 
using Ipopt
using JuMP


dir = "/home/ole/GitHub/bnb_visual/data/"
header = ["instance", "obj", "bin", "int", "nl_constr"]

c = 1
df = CSV.read(dir*"minlib_extra_data.csv"; header=header, types=[String,Float64,Int64,Int64,Int64])
# df[:instance] = [strip(value[1:end-3]) for (i, value) in enumerate(df[:instance])]

# df[:nl_constr] = zeros(size(df,1))


juniper = JuniperSolver(IpoptSolver(print_level=0);
    branch_strategy=:MostInfeasible,
    processors=1,
    time_limit=1,
    incumbent_constr = false,
)

c = 1
for r in eachrow(df)
    println("c: ",c)
    # println("Started "*r[:instance])
    c += 1

    m = fetch_model("JuniperLibSm/"*r[:instance]) 
    if typeof(m) != Void
        # setsolver(m, juniper)
        # solve(m)
        # r[:nl_constr] = m.internalModel.num_nl_constr
    else
        println(r)
    end
    # println("Finished "*r[:instance])
    # CSV.write("minlib_extra_data_new.csv", df)
    
end

println(df)
# CSV.write("minlib_extra_data_new.csv", df)