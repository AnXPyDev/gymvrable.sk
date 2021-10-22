function log(value, max_depth, current_depth)
	if type(value) ~= "table" then
		io.write(value)
		io.write("\n")
	end

	current_depth = current_depth or 0
	if current_depth == max_depth then 
		return
	end

	io.write("{\n")

	for k, v in pairs(value) do
		io.write(string.rep(" ", (current_depth + 1) * 2))
		io.write("\"" .. k .. "\" = ")
		if type(v) == "table" then
			log(v, max_depth, current_depth + 1)
		else
			io.write(v)
			io.write("\n")
		end
	end

	io.write(string.rep(" ", current_depth * 2))
	io.write("}\n")
end


return log