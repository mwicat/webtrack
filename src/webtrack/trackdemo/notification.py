'''
Created on Apr 26, 2011

@author: mwicat
'''
import settings as sett
from django.core import serializers

import json
from protobuf_json import json2pb
from django.db.models.signals import pre_save, post_save
import django.dispatch

from stompest.simple import Stomp

from base64 import b64encode

def get_stomp_connection():
    stomp_connection = Stomp(sett.STOMP_HOST, sett.STOMP_PORT)
    stomp_connection.connect(sett.STOMP_USERNAME, sett.STOMP_PASSWORD)
    return stomp_connection

def get_dict_diff(dict1, dict2):
    return dict(set(dict1.items()) - set(dict2.items()))

def get_models_diff(model1, model2):
    m1d, m2d = serializers.serialize('python', [model1, model2])
    return get_dict_diff(m1d['fields'], m2d['fields'])
    
def get_nested(d, path, create=False):
    curr = d
    for k in path:
        if not k in d:
            if create:
                curr = d[k] = {}
            else:
                raise KeyError
        else:
            curr = d[k]
    return curr

def _rename_key(d, path_src, path_dest):
    try:
        container_src = get_nested(d, path_src[:-1])
        v = container_src.pop(path_src[-1])
    except KeyError:
        return
    container_dest = get_nested(d, path_dest[:-1], create=True)
    container_dest[path_dest[-1]] = v

def rename_key(d, path_src, path_dest):
    _rename_key(d, path_src.split('.'), path_dest.split('.'))
    
def _delete_key(d, path):
    try:
        container = get_nested(d, path[:-1])
        del container[path[-1]]
    except KeyError:
        return

def delete_key(d, path):
    _delete_key(d, path.split('.'))


def notify_pre_save(sender, instance, **kwargs):
    try:
        instance.before_save = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        instance.before_save = None

def notify_post_save(sender, instance, **kwargs):
    if not instance.before_save:
        return
    diff = get_models_diff(instance, instance.before_save)
    model_changed.send(sender=sender, instance=instance, diff=diff)


model_changed = django.dispatch.Signal(providing_args=["sender", "instance", "diff"])

def connect_notification(model):
    pre_save.connect(notify_pre_save, sender=model)
    post_save.connect(notify_post_save, sender=model)
