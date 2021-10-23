local File = {}

function File:new(...)
	local this = {}
	setmetatable(this, self)
	self.__index = self
	this.__class = "File"
	this:construct(...)
	return this
end

function File:construct(file_source, is_string)
	if is_string then
		self.content = file_source
	else
		local file = io.open(file_source, "r")
		self.content = file:read("*a")
		file:close()
	end
end

function File:scan(directive)
	local results = {}

	local begin = -1

	while true do
		local b, e = self.content:find("<" .. directive .. ".->", begin + 1)
		begin = b
		if b == nil then
			break
		end
		local data = self:parse_directive(directive, b, e)
		table.insert(results, data)
	end

	return results
end

function File:parse_directive(directive, begin, endv)
	print(directive, begin, endv)
	local data = {
		span_begin = begin,
		span_end = nil,
		content_begin = endv + 1,
		content_end = nil
	}

	-- Find parameters
	do
		local param_end = begin

		while true do
			local pb, pe = self.content:find(" .-=%\".-%\"", param_end + 1)
			param_end = pe
			if pb == nil or pb >= endv then
				break
			end
			local identifier, value = self:parse_parameter(pb + 1, pe)

			data[identifier] = value
		end
	end

	-- find end of span
	do
		if self.content:sub(endv-1, endv-1) == "/" then
			data.span_end = endv
			data.content_begin = nil
			data.content_end = nil
		else

			local content_end, span_end = self.content:find("</" .. directive .. ">", begin)
			data.span_end = span_end
			data.content_end = content_end - 1
			if data.content_end < data.content_begin then
				data.content_begin = nil
				data.content_end = nil
			end
		end
	end
	print(data)
	return data
end

function File:parse_parameter(param_begin, param_end)
	local param_middle, _ = self.content:find("%=", param_begin)
	if param_middle == nil or param_middle > param_end then
		return nil, nil
	end
	local identifier = self.content:sub(param_begin, param_middle - 1)
	local value = self.content:sub(param_middle + 2, param_end - 1)
	return identifier, value
end

function File:split_without_spans(spans)
	local result = {}
	
	local last_span_end = -1

	for i, v in ipairs(spans) do
		table.insert(result, self.content:sub(last_span_end + 1, v[1] - 1))
		last_span_end = v[2]
	end

	table.insert(result, self.content:sub(last_span_end + 1))

	return result
end

function File:write(output_path)
	local f = io.open(output_path, "w")
	f:write(self.content)
	f:close()
end

return File