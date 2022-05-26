#!/usr/bin/python

from ftplib import FTP
import ftplib
from argparse import ArgumentParser
from getpass import getpass
from datetime import datetime, timedelta
from io import StringIO
import re
import os

current_year = int(datetime.now().strftime("%Y"))
months_index = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

verbose = False
lazy_dir = False
ignore_extra = True
ignore_date_diff = False
recent = False
recent_date = None

def get_month(abbrev):
    abbrev = abbrev.lower()

    if abbrev == "okt":
        return 10

    try:
        return months_index.index(abbrev) + 1
    except ValueError:
        return 1

class File():
    def __init__(self, date, name, size=0):
        self.date = date
        self.name = name
        self.size = size
    def __str__(self):
        return f"F {self.date} {self.name} {self.size}"

class Dir():
    def __init__(self, date, name, content=[]):
        self.date = date
        self.name = name
        self.update_content(content)

    def update_content(self, content):
        self.content = content
        self.make_content_dict()

    def make_content_dict(self):
        self.content_dict = {}
        for item in self.content:
            self.content_dict[item.name] = item

    def __getitem__(self, name):
        return self.content_dict[name]

    def __str__(self):
        return f"D[{len(self.content)}] {self.date} {self.name}"

class FileSystem(Dir):
    def __init__(self, content = []):
        super().__init__(datetime.now(), "root", content)

    def tostr(self, item=None, depth=0, stream=None):
        if not stream:
            stream = StringIO()
        if not item:
            item = self

        for c in item.content:

            stream.write(" " * (depth * 2))
            stream.write(c.__str__())
            stream.write("\n")
            if isinstance(c, Dir):
                self.tostr(c, depth + 1, stream)

        if depth == 0:
            ret = stream.getvalue()
            stream.close()
            return ret

    def __str__(self):
        return self.tostr()

def process_dir_line(line):
    split = line.split()

    year = current_year
    month = get_month(split[5])
    day = int(split[6])
    hour = 0
    minute = 0

    if re.match("\d\d:\d\d", split[7]):
        s = split[7].split(":")
        hour = int(s[0])
        minute = int(s[1])
    else:
        year = int(split[7])

    name = " ".join(split[8:])
    date = datetime(year, month, day, hour, minute)
    size = int(split[4])

    if name in [".", ".."]:
        return None

    if line[0] == "d":
        return Dir(date, name)
    else:
        return File(date, name, size)

    #print(f"{line} >> {isdir} {year}/{month}/{day} {hour}:{minute} {name}")


def ftp_get_hierarchy(ftp, cwd = None, top_level=True):
    if not cwd:
        cwd = ftp.pwd()

    dir_lines = []
    ftp.dir(cwd, lambda line: dir_lines.append(line))

    content = []
    for line in dir_lines:
        result = process_dir_line(line)

        if result == None:
            continue

        if isinstance(result, Dir):
            result.update_content(ftp_get_hierarchy(ftp, cwd + "/" + result.name, False))

        content.append(result)

    if top_level:
        return FileSystem(content)
    else:
        return content

def process_local_file(cwd, path):
    stat = os.stat(cwd + "/" + path)

    date = datetime.fromtimestamp(stat.st_mtime)
    size = stat.st_size

    if os.path.isdir(cwd + "/" + path):
        return Dir(date, path)
    else:
        return File(date, path, size)

def local_get_hierarchy(cwd=None, top_level=True):
    if not cwd:
        cwd = os.getcwd()

    files = os.listdir(cwd)

    content = []
    for path in files:
        result = process_local_file(cwd, path)

        if result == None:
            continue

        if isinstance(result, Dir):
            result.update_content(local_get_hierarchy(cwd + "/" + result.name, False))

        content.append(result)

    if top_level:
        return FileSystem(content)
    else:
        return content


class Request():
    def __init__(self, command=None, source=None, target=None, reason=None):
        self.command = command
        self.source = source
        self.target = target
        self.reason = reason

    def __str__(self):
        return f"R {self.command} local:{self.source} > remote:{self.target} ({self.reason})";

    def execute(self, ftp):
        result = True
        if self.command == "rm":
            print(f"Removing remote file {self.target}", end="", flush=True)
            try:
                ret = ftp.delete(self.target)
            except ftplib.error_perm as err:
                raise Exception("Failed to execute request", self, err)
            print(f" : {ret}", flush=True)
        elif self.command == "rmdir":
            print(f"Removing remote directory {self.target}", end="", flush=True)
            try:
                ret = ftp.rmd(self.target)
            except ftplib.error_perm as err:
                raise Exception("Failed to execute request", self, err)
            print(f" : {ret}", flush=True)
        elif self.command == "mkdir":
            print(f"Creating remote directory {self.target}", end="", flush=True)
            try:
                ret = ftp.mkd(self.target)
            except ftplib.error_perm as err:
                raise Exception("Failed to execute request", self, flush=True)
            print(f" : {ret}", flush=True)
        elif self.command == "send":
            print(f"Sending local file {self.source} to remote", flush=True)
            ret = None
            try:
                f = open(self.source, "rb")
                ret = ftp.storbinary(f"STOR {self.target}", f)
                f.close()
                print(f" : {ret}", flush=True)
            except OSError:
                result = False
                print(f"Failed to open local file {self.source}, continuing execution", flush=True)
            except ftplib.error_perm as err:
                result = False
                print(f"Failed to transfer file {self.source} to remote, error {err}, continuing execution", flush=True)


        return result

def diff_missing_dir(lfs, request_list=[], cwd="."):
    for name in lfs.content_dict:
        path = cwd + "/" + name
        li = lfs[name]
        if isinstance(li, Dir):
            request_list.append(Request("mkdir", None, path, "Directory missing"))
            diff_missing_dir(li, request_list, path)
        else:
            request_list.append(Request("send", path, path, "File missing"))

    return request_list

def fs_diff(lfs, rfs, request_list=[], cwd="."):
    for name in lfs.content_dict:
        path = cwd + "/" + name
        isdir = isinstance(lfs[name], Dir)
        if not name in rfs.content_dict:
            if isdir:
                request_list.append(Request("mkdir", None, path, "Directory missing"))
                diff_missing_dir(lfs[name], request_list, path)
            else:
                request_list.append(Request("send", path, path, "File missing"))
        else:
            isrdir = isinstance(rfs[name], Dir)
            if isdir and not isrdir:
                request_list.append(Request("rm", None, path, "Remote item is not a directory"))
                request_list.append(Request("mkdir", None, path, "Directory missing"))
                diff_missing_dir(lfs[name], request_list, path)
            elif not isdir and isrdir:
                request_list.append(Request("rmdir", None, path, "Remote item is not a file"))
                request_list.append(Request("send", path, path, "File missing"))
            elif not isdir and not isrdir:
                lf = lfs[name]
                rf = rfs[name]

                equal = True
                request = Request("send", path, path)

                if lf.size != rf.size:
                    if verbose: print(f"!diff! {path} size {lf.size} != {rf.size}")
                    equal = False
                    request.reason = "Remote file differs in size"
                if not (ignore_date_diff or recent) and lf.date > rf.date:
                    if verbose: print(f"!diff! {path} date {lf.date} > {rf.date}")
                    equal = False
                    if request.reason:
                        request.reason += " and is older"
                    else:
                        request.reason = "Remote file is older"
                if recent and lf.date > recent_date:
                    if verbose: print(f"!diff! {path} recent date {recent_date} > {lf.date}")
                    equal = False
                    if request.reason:
                        request.reason += " and is recently updated"
                    else:
                        request.reason = "Local file is recently updated"

                if not equal:
                    request_list.append(Request("rm", None, path, request.reason))
                    request_list.append(request)

            elif isdir and isrdir:
                fs_diff(lfs[name], rfs[name], request_list, path)


    return request_list


def main():
    parser = ArgumentParser(description="Push local filesystem to remote ftp server.")
    parser.add_argument("address", metavar="ADDR", help="ftp server address")
    parser.add_argument("source", metavar="SRC", help="source directory")
    parser.add_argument("target", metavar="TARGET", help="target remote directory")
    parser.add_argument("-l", "--login", help="user login on ftp server")
    parser.add_argument("-p", "--password", "--pass", help="user password on ftp server")
    parser.add_argument("-d", "--dryrun", action="store_true", help="only analyze file hierarchy and print diff")
    parser.add_argument("-e", "--encoding", help="specify ftp encoding")
    parser.add_argument("-c", "--confirm", action="store_false", help="require confirmation before executing requests")
    parser.add_argument("-v", "--verbose", action="store_true", help="print additional information")
    parser.add_argument("-i", "--ignore-date-diff", action="store_true", help="ignore date differences when comparing filesystems")
    parser.add_argument("-r", "--recent", const="1", nargs="?", help="ignore date differences when comparing filesystems")
    parser.add_argument("--lazy-dir", action="store_true", help="do not recurse directory when newer on remote")
    parser.add_argument("--no-ignore-extra", action="store_true", help="do not delete extra directories in remote")

    args = parser.parse_args()

    global verbose, lazy_dir, ignore_extra, ignore_date_diff, recent, recent_date
    verbose = args.verbose
    lazy_dir = args.lazy_dir
    ignore_extra = not args.no_ignore_extra
    ignore_date_diff = args.ignore_date_diff
    

    login = args.login
    password = args.password

    if not login:
        login = input(f"login for {args.address}: ")

    if not password:
        password = getpass(f"password for {login}@{args.address}: ")

    if args.recent:
        recent = True
        recent_date = datetime.now() - timedelta(hours=float(args.recent))

    ftp = FTP(args.address)

    if args.encoding:
        ftp.encoding = args.encoding

    try:
        ftp.login(login, password)
    except ftplib.error_perm as err:
        print(err)
        ftp.quit()
        return


    os.chdir(args.source)
    localfs = local_get_hierarchy()
    if args.verbose:
        print(f"Local filesystem at {os.getcwd()}:\n{localfs}")

    ftp.cwd(args.target)
    remotefs = ftp_get_hierarchy(ftp)
    if args.verbose:
        print(f"Remote filesystem at {ftp.pwd()}:\n{remotefs}")


    requests = fs_diff(localfs, remotefs)

    if len(requests) == 0:
        print("No requests to execute")
        ftp.quit()
        return

    if args.dryrun or (args.verbose and not args.confirm):
        i = 1
        l = len(requests)
        for request in requests:
            print(f"[{i}/{l}] {request}")
            i += 1

    if not args.dryrun:
        if args.confirm:
            i = 1
            l = len(requests)
            for request in requests:
                print(f"[{i}/{l}] {request}")
                i += 1
            print("")
            if input("Do you want to execute these requsts [y/N]: ").lower() != "y":
                print("Exiting")
                ftp.quit()
                return



        i = 1
        l = len(requests)
        success = 0
        for request in requests:
            print(f"[{i}/{l}] ", end="")
            ret = False
            try:
                ret = request.execute(ftp)
            except Exception as err:
                print("STOPPING EXECUTION")
                print(err.args[0])
                print(err.args[1])
                print(err.args[2])

            if ret:
                success += 1
            i += 1

        if (success == l):
            print("All requests were executed successfully")
        else:
            print(f"{success}/{l} requests were successfull")
            print(f"{l-success}/{l} requests failed")


    ftp.quit()

if __name__ == "__main__":
    main()
