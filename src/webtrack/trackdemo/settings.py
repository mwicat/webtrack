from django.conf import settings

STOMP_HOST = getattr(settings, 'STOMP_HOST', 'localhost')
STOMP_PORT = getattr(settings, 'STOMP_PORT', 61613)
STOMP_USERNAME = getattr(settings, 'STOMP_USERNAME', 'django')
STOMP_PASSWORD = getattr(settings, 'STOMP_PASSWORD', 'django')
