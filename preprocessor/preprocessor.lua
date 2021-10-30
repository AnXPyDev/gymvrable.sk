local File = require("file")
local util = require("util")
local log = require("log")

local Preprocessor = {}

function Preprocessor:new(...)
	local this = {}
	setmetatable(this, self)
	self.__index = self
	this:construct(...)
	return this
end

function Preprocessor:construct()
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

function Preprocessor:string_resolve(str, variable_store)
	local search_begin = -1

	while true do
		local b, e = str:find("%%", search_begin + 1)
		
		if b == nil then
			break
		else
			if str:sub(b + 1, b + 1) == "%" then
				search_begin = b + 1
			else

			end
		end
	end
end

function Preprocessor:scan_file(file_source, variable_store)
	variable_store = variable_store and util.copy_table(variable_store) or {}

	local file = nil

	if type(file_source) == "table" then
		file = File:new(table.unpack(file_source))
	else
		file = File:new(file_source) 
	end

	-- scan for used templates
	local temps = nil
	do
		temps = file:scan("prep%-template")

		for i, v in ipairs(temps) do
			if v.content_begin then
				v.inner_content = file.content:sub(v.content_begin, v.content_end)
			end
		end

		local spans = util.directive_data_to_span_table(temps)
		local split_file = file:split_without_spans(spans)
		local final = util.join_split_file(split_file)
		file:construct(final, true)

		if #temps == 0 then
			temps = nil
		end
	end
	

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
		local spans = util.directive_data_to_span_table(defines)
		local split_file = file:split_without_spans(spans)
		local final = util.join_split_file(split_file)
		file:construct(final, true)
	end

	local config = {}

	do
		local directives = file:scan("prep%-config")
		for i, v in ipairs(directives) do
			config = util.crush_table(config, v)
		end

		local spans = util.directive_data_to_span_table(directives)
		local split_file = file:split_without_spans(spans)
		local final = util.join_split_file(split_file)
		file:construct(final, true)
	end

	return {
		file = file,
		variable_store = variable_store,
		templates = temps,
		config = config
	}
end

function Preprocessor:process_file(file_source, config, variable_store)

	config = util.crush_table({
		output_directory = "build/",
		weak_output_file = type(file_source) == "string" and file_source or "out"
	}, config or {})

	variable_store = variable_store or {}

	local result = self:scan_file(file_source, variable_store)

	log(result)

	config = util.crush_table(config, result.config or {})
	variable_store = util.crush_table(variable_store, result.variable_store or {})

	if result.templates then
		print("creating directory", config.output_directory .. (config.output_file or config.weak_output_file))
		for i, template in ipairs(result.templates) do
			local template_src = template.src
			print("processing template", template_src)
			local new_config = util.copy_table(config)
			new_config.output_file = template.output_file

			if template_src then
				self:process_file(template_src, new_config, util.copy_table(variable_store))
			end
			
		end
	else
		print("writing file to", config.output_directory .. (config.output_file or config.weak_output_file))
		print(result.file.content)
	end
end

function Preprocessor:format_string(str, variable_store)
	local result = ""
	local var_begin = 0
	local var_end = 0
	while true do
		local b, _ = str:find("$", var_begin)
		if b == nil then
			result = result .. str:sub(var_begin + 1)
			break
		end


		var_begin = b


		if str:sub(var_begin + 1, var_begin + 1) == "$" then
			var_begin = var_begin + 1
			result = result .. "$"
		else
			local e, _ = str:find("$", var_begin + 1)
			if e == nil then
				var_end = str:len() + 1
			else
				var_end = e
			end




		end


		
	end	
end

return Preprocessor