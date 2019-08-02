using CSV, DataFrames

fname = "juniper_moi_data.csv"
header = ["stdout","instance","nodes","bin_vars","int_vars","constraints",
"sense","objval","best_bound","status","time"]
df = CSV.read("data/"*fname, header=header)
df = df[[:instance,:nodes,:bin_vars,:int_vars,:constraints,:time]]
df = sort(df, :time)

node_small_100 = df[df.nodes .<= 350,:]
int_vars_10 = node_small_100[node_small_100.int_vars .<= 0,:]
println("Faster than 100s: ", sum(int_vars_10.time .<= 100))
println("Slower than 100s: ", sum(int_vars_10.time .> 100))