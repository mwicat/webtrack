from django.conf.urls.defaults import url, patterns
from django.contrib.auth.decorators import login_required

from trackdemo.views import tracker_list, update_tracker, create_tracker

from django.views.generic.simple import direct_to_template

urlpatterns = patterns('api.views',
    url(r'^tracker/(?P<format>\w+)/$', 'tracker_list', name='tracker_list'),
)








