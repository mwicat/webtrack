from fabric.api import *

REPOS = (("my_project", "origin", "master"),
        ("my_app", "origin", "master"))

def production():
    env.fab_hosts = ['a.example.com']
    env.repos = REPOS

def staging():
    env.fab_hosts = ['a.staging_example.com']
    env.repos = REPOS

def git_pull():
    "Updates the repository."
    run("cd ~/git/$(repo)/; git pull $(parent) $(branch)")

def git_reset():
    "Resets the repository to specified version."
    run("cd ~/git/$(repo)/; git reset --hard $(hash)")

def reboot():
    "Reboot Apache2 server."
    sudo("apache2ctl graceful")

def pull():
    require('fab_hosts', provided_by=[production])
    for repo, parent, branch in env.repos:
        env.repo = repo
        env.parent = parent
        env.branch = branch
        invoke(git_pull)

def test():
    local("python manage.py test", fail='abort')

def reset(repo, hash):
    """
    Reset all git repositories to specified hash.
    Usage:
        fab reset:repo=my_repo,hash=etcetc123
    """
    require("fab_hosts", provided_by=[production])
    env.hash = hash
    env.repo = repo
    invoke(git_reset)
