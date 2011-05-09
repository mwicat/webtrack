'''
Created on Apr 27, 2011

@author: mwicat
'''

import unittest

from django.contrib.auth.models import User
from django.core import serializers
from django.test import Client

import trackdemo.models as models
from trackdemo.models import Tracker, TrackerType

import notification
from mock import Mock
import tracker_pb2

import json

def get_channel(trk):
    return '/trackers/%s' % trk.owner.username

class TrackerTestCase(unittest.TestCase):
    def setUp(self):
        self.pass1 = 'jonpass'
        self.owner1 = User.objects.create_user('jon', 'jon@doe.com', self.pass1)
        self.pass2 = 'jennpass'
        self.owner2 = User.objects.create_user('jenna', 'jenna@doe.com', self.pass2)
        self.trk_type = TrackerType.objects.create(name='Czlowiek')
        self.trk1 = Tracker.objects.create(name="lion", owner=self.owner1, lat=10.0, lng=50.0, battery=10, type=self.trk_type)
        
    def tearDown(self):
        self.owner1.delete()
        self.owner2.delete()
        self.trk1.delete()

    def testNotify(self):
        models.send_diff_stomp = notify_mock = Mock()        
        self.trk1.lat = 30
        self.trk1.save()
        
        notify_mock.assert_called_with({'lat': 30, 'id': 1}, get_channel(self.trk1), tracker_pb2.Tracker)

        self.trk1.lng = 5
        self.trk1.save()
        notify_mock.assert_called_with({'lng': 5, 'id': 1}, get_channel(self.trk1), tracker_pb2.Tracker)

    def testNotNotifyOwner(self):
        models.send_diff_stomp = notify_mock = Mock()        
        self.trk1.owner = self.owner2
        self.trk1.save()
        self.assertFalse(notify_mock.called)

    def testTrackersAuthOk(self):
        c = Client()
        u = self.owner1
        c.login(username=u.username, password=self.pass1)
        r = c.get('/trackdemo/trackers/json/')
        trks_dict = serializers.serialize('python', [self.trk1])
        trks_dict = [v['fields'] for v in trks_dict]
        content = json.dumps(trks_dict)
        self.assertEquals(200, r.status_code)
        self.assertEquals(content, r.content)


    def testTrackersAuthWrong(self):
        c = Client()
        r = c.get('/trackdemo/trackers/json/')
        self.assertEquals(302, r.status_code)
        
    def testTrackersAuthDataOk(self):
        c = Client()
        u = self.owner1
        data = dict(username=u.username, password=self.pass1)
        r = c.post('/trackdemo/trackers/json/', data)
        trks_dict = serializers.serialize('python', [self.trk1])
        trks_dict = [v['fields'] for v in trks_dict]
        content = json.dumps(trks_dict)
        self.assertEquals(200, r.status_code)
        self.assertEquals(content, r.content)

    def testTrackersAuthDataWrong(self):
        c = Client()
        u = self.owner1
        data = dict(username=u.username)
        r = c.post('/trackdemo/trackers/json/', data)
        self.assertEquals(403, r.status_code)
        
            