local Template = {}

function Template:new(...)
    local this = {}
    setmetatable(this, self)
    self.__index = self
    this:construct(...)
    return this
end

function Template:construct(file_source)
    local file = io.open(file, "r")
    self.content = file:read("*a")
    file:close()



end

function Template:scan()
   self.marks = {}
  
   local mark_begin = -1;
   while true do
    local mb, me = string.find(self.content, "<preprocessor-mark", mark_begin + 1);
    if mb == nil then
        break
    end
    mark_begin = mb
    local mark = {}
    mark.begin = mb

    
   end
end