local File = require("file")
local log = require("log")

local f = File:new("test.html")


local scanned = f:scan("prep%-hole")

log(scanned)