"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from webtrack.trackdemo.models import Tracker
import json

class SimpleTest(TestCase):
    
    def testUpdateValid(self):
        new_name = 'Rex'
        data = dict(username='admin', password='password', name=new_name)
        r = self.client.post('/api/tracker/1/update/', data)
        self.assertEqual('', r.content)
        self.assertEqual(200, r.status_code)
        trk= Tracker.objects.get(pk=1)
        self.assertEqual(new_name, trk.name)

    def testUpdateBadAuth(self):
        new_name = 'Rex'
        trk= Tracker.objects.get(pk=1)
        name = trk.name
        data = dict(username='admin', password='', name=new_name)
        r = self.client.post('/api/tracker/1/update/', data)
        self.assertEqual(403, r.status_code)
        self.assertEqual(name, trk.name)


    def testUpdateInvalid(self):
        new_lat = 'x'
        trk= Tracker.objects.get(pk=1)
        lat = trk.lat
        data = dict(username='admin', password='password', lat=new_lat)
        r = self.client.post('/api/tracker/1/update/', data)
        errors = json.loads(r.content)
        self.assertIn('lat', errors)
        self.assertEqual(400, r.status_code)
        self.assertEqual(lat, trk.lat)

    def testUpdateExtraField(self):
        data = dict(username='admin', password='password', extra_field='')
        r = self.client.post('/api/tracker/1/update/', data)
        errors = json.loads(r.content)
        self.assertIn('extra_field', errors)
        self.assertEqual(400, r.status_code)
