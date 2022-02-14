#!/usr/bin/python

import json
import re
import os

source_dir = "source/"
output_dir = "build/"
souces_file_path = "sources.json"

deps_cache = {}

directories = []

def get_source_files():
    f = open(souces_file_path, "r")
    source_files = json.load(f)
    f.close()
    return source_files

def process_source_files(source_files):
    result = []
    for FILE in source_files:
        if FILE.get("type", "none") == "glob-dir":
            template = FILE.get("template", {})
            if not "src" in FILE:
                print("Unspecified \"src\" for FILE", FILE)
                continue
            files = []
            src = FILE["src"]
            if not os.path.isdir(source_dir + src):
                print("Specified \"src\" is not a directory for FILE", FILE)
                continue
            if not src[-1] == "/":
                src += "/";
            for item in os.listdir(source_dir + src):
                temp = template.copy()
                temp["src"] = src + item
                files.append(temp)
            for F in process_source_files(files):
                result.append(F)
            continue

        elif not "src" in FILE:
            print("Unspecified \"src\" for FILE", FILE)
            continue
        elif not "out" in FILE:
            if FILE.get("type", "none") == "article":
                FILE["out"] = file_path_to_directory(FILE["src"])
            else:
                FILE["out"] = FILE["src"]
        result.append(FILE)

    return result

def get_deps(file_path):
    if file_path in deps_cache:
        return deps_cache[file_path]

    f = open(file_path, "r")
    
    includes = re.findall(r"include\(`?(.*?)'?\)", f.read())
    deps = []
    for i in includes:
        dpath = source_dir + i
        if dpath in deps: continue
        get_deps(dpath)
        deps.append(dpath)

    deps_cache[file_path] = deps
    f.close()
    return deps

def file_path_to_directory(file_path):
    split = file_path.split("/")
    split[-1] = split[-1].split(".")[0]
    return "/".join(split) + "/"

def create_article_make_directive(FILE):
    out_dir = output_dir + FILE["out"]
    src_file = source_dir + FILE["src"]
    prep_opts = FILE.get("prep_opts", "")

    index_FILE = {
        "src": FILE["src"],
        "out": FILE["out"] + "index.html",
        "prep_opts": prep_opts + " -D Article-IndexMode",
        "c_deps": FILE.get("c_deps", []) + [source_dir + "include/article-index.html"]
    }

    gallery_FILE = {
        "src": FILE["src"],
        "out": FILE["out"] + "gallery.html",
        "prep_opts": "-D Article-GalleryMode " + prep_opts,
        "c_deps": FILE.get("c_deps", []) + [source_dir + "include/article-gallery.html"]
    }

    return f"{create_make_directive(index_FILE)}\n{create_make_directive(gallery_FILE)}"

def create_make_directive(FILE):
    if FILE.get("type", "none") == "article":
        return create_article_make_directive(FILE)

    out_file = output_dir + FILE["out"]
    src_file = source_dir + FILE["src"]
    rel_out_dir = os.path.dirname(FILE["out"]) + "/"
    if rel_out_dir == "/":
        rel_out_dir = ""
    out_dir = output_dir + rel_out_dir

    if not out_dir in directories: directories.append(out_dir)

    prep_opts = FILE.get("prep_opts", "")

    prep_defines = f"-D __WD='/{rel_out_dir}'"

    deps = get_deps(src_file)

    return f"{out_file}: {src_file} {out_dir} {' '.join(deps)} {' '.join(FILE.get('c_deps', []))}\n	prep -I source/ {prep_defines} {prep_opts} -i {src_file} -o {out_file}\n"

def get_main_deps(FILE):
    if FILE.get("type", "none") == "article":
        return f"{output_dir}{FILE['out']}index.html {output_dir}{FILE['out']}gallery.html"
    else:
        return output_dir + FILE["out"]

def create_makefile():
    makefile = open("Makefile", "w")

    source_files = process_source_files(get_source_files())

    main_directive = "main: "

    rest_directives = ""
    for FILE in source_files:
        main_directive += get_main_deps(FILE) + " "
        rest_directives += create_make_directive(FILE) + "\n"

    dependency_directives = ""
    for i, deps in deps_cache.items():
        if len(deps) == 0 or not re.search("^" + re.escape(source_dir + "include/"), i) or i == source_dir + "include/article.html":
            continue
        dependency_directives += f"{i}: {' '.join(deps)}\n	touch {i}\n\n"

    directory_directives = ""
    for directory in directories:
        directory_directives += f"{directory}:\n	mkdir -p {directory}\n\n"

    makefile.write(main_directive + "\n\n")
    makefile.write(directory_directives)
    makefile.write(dependency_directives)
    makefile.write(rest_directives)

    makefile.close()

def main():
    create_makefile()

if __name__ == "__main__":
    main()
