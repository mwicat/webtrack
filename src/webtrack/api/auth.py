'''
Created on Apr 29, 2011

@author: mwicat
'''

from functools import wraps

from django.contrib.auth import authenticate
from django.utils.decorators import available_attrs
from django.core import exceptions

def request_has_authentication(request):
    username = request.POST.get('username', '')
    password = request.POST.get('password', '')
    user = authenticate(username=username, password=password)
    authenticated = user is not None and user.is_active
    if authenticated:
        request.user = user
    return authenticated

def request_passes_test(request_test_func):
    """
    Decorator for views that checks that the user passes the given test,
    redirecting to the log-in page if necessary. The test should be a callable
    that takes the user object and returns True if the user passes.
    """

    def decorator(view_func):
        @wraps(view_func, assigned=available_attrs(view_func))
        def _wrapped_view(request, *args, **kwargs):
            if not request_test_func(request):
                raise exceptions.PermissionDenied()
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator


def auth_data_required(function=None):
    """
    Decorator for views that checks that the user is logged in, redirecting
    to the log-in page if necessary.
    """
    actual_decorator = request_passes_test(request_has_authentication)
    if function:
        return actual_decorator(function)
    return actual_decorator
