local Preprocessor = require("preprocessor")
local log = require("preprocessor/log")

local fs = require("lfs")

fs.mkdir("build")

local prep = Preprocessor:new()

local F = prep:get_file("example-article.html")
local fs = prep:process_file(F)

log(fs)
prep:write_processed(fs)



