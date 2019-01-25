using Glob
import JSON

files = glob("*.jl", "/home/ole/.julia/v0.6/Juniper/src/")

dict_of_all_functions = Dict{String,Array{String}}()
list_of_all_functions = []
for file in files
    f = open(file)
    s = read(f, String)
    close(f)
    list_of_functions = []

    for funcname in eachmatch(r"^function ([a-zA-Z_][0-9a-zA-Z_!.]+)\("m, s)
        push!(list_of_functions, funcname.captures[1])
        push!(list_of_all_functions, funcname.captures[1])
    end
    dict_of_all_functions[file] = list_of_functions
end

func_names_regex = Regex("("*join(list_of_all_functions,"\\(|")*"\\()")
println(func_names_regex)
function_calls = Dict{String,Set{String}}()
for file in files
    f = open(file)
    s = read(f, String)
    close(f)
    println("file: ", file)
    for func in dict_of_all_functions[file]
        match_str = "function "*func
        regex_str = match_str*"[\\s\\S]*?^end"
        regex = Regex(regex_str,"m")
        func_body = match(regex, s)

        if func_body == nothing
            continue
        end
        function_calls[func] = Set()

        body = func_body.match[length("function ")+length(func):end]

        # get all function calls
        for function_call in eachmatch(func_names_regex, body)
            push!(function_calls[func],function_call.match[1:end-1])
        end
    end
end

# dictionary with nodes
nodes = Dict{String,Int}()
json = Dict{Symbol,Any}()
json[:nodes] = []

i = 1
file_id = 1
for file in keys(dict_of_all_functions)
    for func in dict_of_all_functions[file]
        nodes[func] = i
        entry = Dict{Symbol,Any}()
        entry[:name] = func
        entry[:id] = i
        entry[:group] = file_id
        push!(json[:nodes], entry)
        i += 1
    end
    file_id += 1
end

println("Nodes: ", nodes)

# edges/links
json[:links] = []

for func in keys(function_calls)
    for call in function_calls[func]
        entry = Dict{Symbol,Any}()
        entry[:source] = nodes[func]
        entry[:target] = nodes[call]
        entry[:value] = 1
        push!(json[:links], entry)
    end
end

println(JSON.json(json))

write("data/extras/functions.json", JSON.json(json))