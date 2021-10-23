local File = require("file")
local util = require("util")

local Preprocessor = {}

function Preprocessor:new(...)
	local this = {}
	setmetatable(this, self)
	self.__index = self
	this:construct(...)
	return this
end

function Preprocessor:construct()
	print("new preprocessor")
end

function Preprocessor:eval_sub_directives(directives, variable_store)
	local result = {}

	for i, v in ipairs(directives) do
		if variable_store[v.id] then
			table.insert(result, variable_store[v.id])
		elseif v.default then
			table.insert(result, v.default)	
		else
			table.insert(result, "")
		end
	end

	return result
end

function Preprocessor:eval_script_directives(directives, file)
	local result = {}

	for i, v in ipairs(directives) do
		if v.content_begin or v.src then
			local args = function() return nil end
			if v.args then
				args = load("return " .. v.args)
			end


			local fun = nil
			
			if v.src then
				fun = loadfile(v.src)
			else
				fun = load(file.content:sub(v.content_begin, v.content_end))
			end

			table.insert(result, fun(args()))

		else
			table.insert(result, "")
		end
	end

	return result
end

function Preprocessor:eval_define_directives(directives, variable_store, file)
	for i, v in ipairs(directives) do
		if v.id then
			if v.val then
				variable_store[v.id] = v.val
			elseif v.content_begin then
				variable_store[v.id] = file.content:sub(v.content_begin, v.content_end)
			end
		end
	end
end

function Preprocessor:process(file_path, variable_store)
	variable_store = variable_store or {}
	local file = File:new(file_path)

	-- scan for substitute requests in file
	do 
		local subs = file:scan("prep%-substitute")
		local sub_spans = util.directive_data_to_span_table(subs)
		local split_file = file:split_without_spans(sub_spans)
		local eval_subs = self:eval_sub_directives(subs, variable_store)
		local final = util.join_split_file_and_directives(split_file, eval_subs)
		file:construct(final, true)
	end

	-- evaluate scripts
	do 
		local scripts = file:scan("prep%-script")
		local spans = util.directive_data_to_span_table(scripts)
		local split_file = file:split_without_spans(spans)
		local eval_scripts = self:eval_script_directives(scripts, file)
		local final = util.join_split_file_and_directives(split_file, eval_scripts)
		file:construct(final, true)
	end

	-- evaluate defines
	do 
		local defines = file:scan("prep%-define")
		self:eval_define_directives(defines, variable_store, file)
	end



	return file
end

return Preprocessor