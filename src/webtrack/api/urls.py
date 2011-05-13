from django.conf.urls.defaults import url, patterns

urlpatterns = patterns('api.views',
    url(r'^tracker/(?P<format>\w+)/$', 'tracker_list', name='tracker_list'),
    url(r'^tracker/(?P<pk>\d+)/update/$', 'update_tracker', name='update_tracker'),    
)








