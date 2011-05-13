'''
Created on May 3, 2011

@author: mwicat
'''

from django.http import HttpResponse, HttpResponseBadRequest

import protobuf_json as pbjson
from trackdemo.models import Tracker

from api import tracker_pb2
from api.auth import auth_data_required
from misc.util import serialize
from django.views.decorators.csrf import csrf_exempt

import json
from webtrack.misc.permissions import permission_required
from django.shortcuts import get_object_or_404
from webtrack.trackdemo.forms import TrackerForm
from webtrack.misc.helpers import pre_fill_form
from django.views.decorators.http import require_POST

UNKNOWN_FIELD_MSG = 'unknown field'

@csrf_exempt
@auth_data_required
def tracker_list(request, format=None):
    trk_dict_list = serialize(Tracker.objects.filter(owner=request.user))
    trklist_pb = pbjson.json2pb(tracker_pb2.TrackerList(), dict(trackers=trk_dict_list))
    data = trklist_pb.SerializeToString()
    mimetype = 'application/octet-stream'
    return HttpResponse(data, mimetype=mimetype)

def validate(form, data):
    unknown_fields = set(data) - set(form.fields)
    errors = {}
    if unknown_fields:
        d = dict((field, UNKNOWN_FIELD_MSG) for field in unknown_fields)
        errors.update(d)
    if not form.is_valid():
        errors.update(form.errors)
    return errors


@require_POST
@csrf_exempt
@auth_data_required
@permission_required(model=Tracker)
def update_tracker(request, pk):
    instance = get_object_or_404(Tracker, pk=pk)
    data = request.POST.copy()
    del data['username'], data['password']
    form = TrackerForm(data, instance=instance)
    pre_fill_form(form)
    errors = validate(form, data)
    if errors:
        error_str = json.dumps(errors)
        resp = HttpResponseBadRequest(error_str, mimetype='application/json')        
    else:
        form.save()
        resp = HttpResponse('')
    return resp

