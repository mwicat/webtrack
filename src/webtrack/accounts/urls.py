from django.conf.urls.defaults import url, patterns, include
from accounts.forms import CustomRegistrationForm

urlpatterns = patterns('',
    url(r'^register/$',
       'registration.views.register',
       {'backend': 'registration.backends.simple.SimpleBackend', 
        'form_class': CustomRegistrationForm,
        'success_url': '/'},
       'registration_register'),
    url(r'^login/$', 'django.contrib.auth.views.login', dict(redirect_field_name='/'), name='login'),
    url(r'^logout/$', 'django.contrib.auth.views.logout_then_login', name='logout'),
    url(r'', include('registration.backends.simple.urls')),                       
)
