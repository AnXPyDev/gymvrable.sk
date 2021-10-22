local File = require("file")

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

function Preprocessor:process(file_path)
	local file = File:new(file_path)

	local templates = file:scan("preprocessor%-use%-template")


end