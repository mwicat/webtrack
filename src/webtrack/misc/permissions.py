'''
Created on May 12, 2011

@author: mwicat
'''


from functools import wraps
from django.utils.decorators import available_attrs
from django.core import exceptions
from django.shortcuts import get_object_or_404

def user_is_owner(user, object):
    return object.owner == user

def user_passes_test(user_test_func, model):
    """
    Decorator for views that checks that the user passes the given test,
    redirecting to the log-in page if necessary. The test should be a callable
    that takes the user object and returns True if the user passes.
    """

    def decorator(view_func):
        @wraps(view_func, assigned=available_attrs(view_func))
        def _wrapped_view(request, *args, **kwargs):
            obj = get_object_or_404(model, pk=kwargs['pk'])            
            if not user_test_func(request.user, obj):
                raise exceptions.PermissionDenied()
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator


def permission_required(model, function=None, *args, **kwargs):
    """
    Decorator for views that checks that the user is logged in, redirecting
    to the log-in page if necessary.
    """
    actual_decorator = user_passes_test(user_is_owner, model)
    if function:
        return actual_decorator(function)
    return actual_decorator
