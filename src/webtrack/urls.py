from django.conf.urls.defaults import url, patterns, include

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
from guardian.admin import GuardedModelAdmin

from django.views.generic.simple import redirect_to

from django.contrib import databrowse
from django.contrib.auth.models import User
from django.db import models

for app in models.get_apps():
    model_list = models.get_models(app)
    for model in model_list:
        databrowse.site.register(model)
        admin.site.register(model, GuardedModelAdmin)


from django.contrib import databrowse


urlpatterns = patterns('',
    url(r'^$', redirect_to, dict(url='/trackdemo')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^accounts/', include('accounts.urls')),
    url(r'^trackdemo/', include('trackdemo.urls')),
    url(r'^api/', include('api.urls')),
    url(r'^databrowse/(.*)', databrowse.site.root),
    url(r'^captcha/', include('captcha.urls')),
    url(r'^databrowse/(.*)', databrowse.site.root),
)
