from django.conf.urls.defaults import url, patterns
from django.contrib.auth.decorators import login_required
from django.views.generic.simple import direct_to_template

urlpatterns = patterns('trackdemo.views',
    url(r'^$', 'show_map', name='index'),
        
    url(r'^profile/$', 
        login_required(direct_to_template), 
        dict(template='trackdemo/profile.html', extra_context=dict(title='Profil'))),
        
    url(r'^simulation.jad/$', 'simulation_jad', name='simulation_jad'),
    url(r'^tracker/$', 'tracker_list', name='tracker_list'),
    url(r'^tracker/(?P<pk>\d+)/$', 'tracker_detail', name='tracker_detail'),
    url(r'^tracker/(?P<pk>\d+)/update/$', 'update_tracker', name='update_tracker'),
    url(r'^tracker/(?P<pk>\d+)/delete/$', 'delete_tracker', name='delete_tracker'),
    url(r'^tracker/create/$', 'create_tracker', name='create_tracker'),
)








