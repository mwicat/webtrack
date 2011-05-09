#coding: utf-8
from django.test import TestCase
from django.test import Client
from django import template
from django.db.models import get_model

class Testmaker(TestCase):

    #fixtures = ["trackdemo_testmaker"]


    def test_trackdemotracker_130449682992(self):
        r = self.client.get('/trackdemo/tracker/', {})
        self.assertEqual(r.status_code, 302)
    def test_trackdemotrackercreate_130449683646(self):
        r = self.client.get('/trackdemo/tracker/create/', {})
        self.assertEqual(r.status_code, 302)
    def test_trackdemotrackercreate_130449685364(self):
        r = self.client.post('/trackdemo/tracker/create/', {'name': 'Marek', 'battery': '30', 'lat': '10', 'csrfmiddlewaretoken': 'cf8bf45d628326e978e76566d25982ae', 'type': '2', 'lng': '10', })
    def test_trackdemotracker4_130449685622(self):
        r = self.client.get('/trackdemo/tracker/4/', {})
        self.assertEqual(r.status_code, 302)
    def test_trackdemotracker4update_130449686469(self):
        r = self.client.get('/trackdemo/tracker/4/update/', {})
        self.assertEqual(r.status_code, 302)
    def test_trackdemotracker4update_130449687009(self):
        r = self.client.post('/trackdemo/tracker/4/update/', {'name': 'Marek', 'battery': '40', 'lat': '10.0', 'csrfmiddlewaretoken': 'cf8bf45d628326e978e76566d25982ae', 'type': '2', 'lng': '10.0', })
    def test_trackdemotracker4_130449687673(self):
        r = self.client.get('/trackdemo/tracker/4/', {})
        self.assertEqual(r.status_code, 302)
