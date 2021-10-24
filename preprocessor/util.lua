local util = {}

function util.directive_data_to_span_table(data)
	local result = {}

	for i, v in ipairs(data) do
		table.insert(result, {v.span_begin, v.span_end})
	end

	return result
end

function util.join_split_file_and_directives(split_file, directives)
	local result = ""

	for i, v in ipairs(split_file) do
		result = result .. v .. (directives[i] or "")
	end

	return result
end

function util.join_split_file(split_file)
	local result = ""

	for i, v in ipairs(split_file) do
		result = result .. v
	end
	return result
end

function util.copy_table(t1)
	local result = {}

	for k, v in pairs(t1) do
		result[k] = v
	end

	return result
end

function util.crush_table(t1, t2)
	local result = util.copy_table(t1)

	for k, v in pairs(t2) do
		result[k] = v
	end
	return result
end

return util