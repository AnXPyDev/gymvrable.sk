divert(-1)
ifdef(`__HELPERS_INCLUDE_GUARD', `', `

define(`__HELPERS_INCLUDE_GUARD')


define(`APPEND_STRING', `define(`$1', defn(`$1')`$2')')
define(`APPEND_LIST', `ifdef(`$1', `APPEND_STRING(`$1', `, `$2'')', `define(`$1', ``$2'')')')

define(`REQUIRE_CSS', `pushdef(`REQUIRED_CSS', `$1')')
')
divert`'dnl
