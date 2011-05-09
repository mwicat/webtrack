'''
Created on May 3, 2011

@author: mwicat
'''

from django.core.serializers import python
from django.core.urlresolvers import get_resolver


class SimpleSerializer(python.Serializer):
    
    def end_object(self, obj):
        self.objects.append(self._current)
        self._current = None


def serialize(queryset, *args, **kwargs):
    return SimpleSerializer().serialize(queryset, *args, **kwargs)

def get_url_pattern(urlname, args=[]):
    """
    Return URL pattern for a URL based on its name.

    args - list of argument names for the URL. Useful to distinguish URL
    patterns identified with the same name.

    >>> get_url_pattern('project_detail')
    u'/projects/p/%(project_slug)s/'

    >>> get_url_pattern('project_detail', args=['project_slug'])
    u'/projects/p/%(project_slug)s/'

    """
    patterns = get_resolver(None).reverse_dict.getlist(urlname)
    if not args:
        return '/%s' % patterns[0][0][0][0]

    for pattern in patterns:
        if pattern[0][0][1] == args:
            return '/%s' % pattern[0][0][0]