using DataFrames
using CSV
using MINLPLibJuMP
using Juniper 
using Ipopt
using JuMP


dir = "/home/ole/GitHub/bnb_visual/"
header = ["instance", "obj", "bin", "int"]

c = 1
df = CSV.read(dir*"data/minlib_data.csv"; header=header, types=[String for h in header])
df[:instance] = [strip(value[1:end-3]) for (i, value) in enumerate(df[:instance])]

df[:nl_constr] = zeros(size(df,1))


juniper = JuniperSolver(IpoptSolver(print_level=0);
    branch_strategy=:MostInfeasible,
    processors=1,
    time_limit=1,
    incumbent_constr = false,
)

for r in eachrow(df)
    println("Started "*r[:instance])
    m = fetch_model("JuniperLibSm/"*r[:instance]) 
    if typeof(m) != Void
        setsolver(m, juniper)
        solve(m)
        r[:nl_constr] = m.internalModel.num_nl_constr
    end
    println("Finished "*r[:instance])
end

println(df)
CSV.write("minlib_extra_data.csv", df)