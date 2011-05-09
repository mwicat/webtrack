from django.db import models

import random
from django.contrib.auth.models import User
# Create your models here.

from trackdemo.notification import *
from django.db.models.signals import post_save
import tracker_pb2

class TrackerType(models.Model):
    name = models.CharField(max_length=64)
    
    def __unicode__(self):
        return u'%s' % self.name


class Tracker(models.Model):
    id = models.AutoField(primary_key=True)
    owner = models.ForeignKey(User)
    name = models.CharField(max_length=64)
    lat = models.FloatField(blank=True, null=True)
    lng = models.FloatField(blank=True, null=True)
    battery = models.IntegerField(blank=True, null=True)
    type = models.ForeignKey(TrackerType)
    
    class Meta:
        permissions = (
            ('view_tracker', 'View tracker'),
        )

    def __unicode__(self):
        return u'%s' % self.name

    
Tracker._meta.get_field('id').serialize = True


def send_diff_stomp(diff, stomp_channel_root, pb_class):
    data_json = json.dumps(diff)
    obj_pb = json2pb(pb_class(), diff)
    data_pb = obj_pb.SerializeToString()
    data_pb = b64encode(data_pb)
    dest_pb = '%s_pb' % stomp_channel_root
    dest_json = '%s_json' % stomp_channel_root
    
    headers_pb = {'content-length': len(data_pb)}
    
    stomp_conn = None
    try:
        stomp_conn = get_stomp_connection()
        stomp_conn.send(dest_pb, data_pb, headers=headers_pb)
        stomp_conn.send(dest_json, data_json)
    except IOError, err:
        print err
    finally:
        if stomp_conn is not None:
            stomp_conn.disconnect()

def notify_stomp(pb_class):
    def f(sender, instance, diff, **kwargs):
        delete_key(diff, 'owner')
        if not diff:
            return
        diff[sender._meta.pk.name] = instance.pk
        stomp_channel_root = '/trackers/%s' % instance.owner.username
        send_diff_stomp(diff, stomp_channel_root, pb_class)
    return f

connect_notification(Tracker)
handle_changed = notify_stomp(tracker_pb2.Tracker)
model_changed.connect(handle_changed, sender=Tracker)

def setup_user_trackers(sender, instance, created, **kwargs):
    if not created:
        return
    for i in range(3):
        name = 'Tracker %d' % i
        lat = random.randint(-90, 90)
        lng = random.randint(-180, 180)
        battery = random.randint(0, 100)
        types = TrackerType.objects.all()
        type = random.choice(types)
        t = Tracker(name=name, lat=lat, lng=lng, battery=battery, owner=instance, type=type)
        t.save()

from django.contrib.auth.models import User
post_save.connect(setup_user_trackers, sender=User)
