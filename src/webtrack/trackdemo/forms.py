'''
Created on Apr 26, 2011

@author: mwicat
'''
from django import forms
from trackdemo.models import Tracker

class TrackerForm(forms.ModelForm):
    class Meta:
        model = Tracker
        exclude = ('owner')
        