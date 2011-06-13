#!/home/mwicat/python
import os, sys

from pysrc import pydevd

import site


#localsite = os.path.expanduser('~mwicat/.local/lib/python2.6/site-packages')
#os.listdir(localsite)
#if localsite in sys.path: sys.path.remove(localsite)
#pydevd.settrace('bh.mwicat.com')
#site.addsitedir(localsite)


print >> sys.stderr, 'sys.path', sys.path

_PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _PROJECT_DIR)
sys.path.insert(0, os.path.dirname(_PROJECT_DIR))

_PROJECT_NAME = _PROJECT_DIR.split('/')[-1]
os.environ['DJANGO_SETTINGS_MODULE'] = "%s.settings" % _PROJECT_NAME

from django.core.servers.fastcgi import runfastcgi
runfastcgi(method="threaded", daemonize="false")
