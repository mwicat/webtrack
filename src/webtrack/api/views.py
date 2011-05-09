'''
Created on May 3, 2011

@author: mwicat
'''

from django.http import HttpResponse

import protobuf_json as pbjson
from trackdemo.models import Tracker

from api import tracker_pb2
from api.auth import auth_data_required
from misc.util import serialize
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
@auth_data_required
def tracker_list(request, format=None):
    trk_dict_list = serialize(Tracker.objects.filter(owner=request.user))
    trklist_pb = pbjson.json2pb(tracker_pb2.TrackerList(), dict(trackers=trk_dict_list))
    data = trklist_pb.SerializeToString()
    mimetype = 'application/octet-stream'
    return HttpResponse(data, mimetype=mimetype)

    