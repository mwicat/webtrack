'''
Created on May 3, 2011

@author: mwicat
'''

from django.views.generic.detail import DetailView
from django.views.generic.edit import UpdateView, CreateView, DeleteView
from django.views.generic.list import ListView
from django.core import exceptions
from django.core.exceptions import ImproperlyConfigured
from django.http import Http404, HttpResponseRedirect


class GuardedDetailView(DetailView):
    def get(self, request, **kwargs):
        self.object = self.get_object()
        self.check_permission(request.user, self.object)
        context = self.get_context_data(object=self.object)
        return self.render_to_response(context)


class GuardedUpdateView(UpdateView):
    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.check_permission(request.user, self.object)
        return super(GuardedUpdateView, self).get(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.check_permission(request.user, self.object)
        return super(GuardedUpdateView, self).post(request, *args, **kwargs)


class GuardedCreateView(CreateView):
    def post(self, request, *args, **kwargs):
        self.object = None
        form_class = self.get_form_class()
        form = self.get_form(form_class)
        if form.is_valid():
            self.ensure_permissions(request.user, form.instance)
            return self.form_valid(form)
        else:
            return self.form_invalid(form)

class GuardedDeleteView(DeleteView):
    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.check_permission(request.user, self.object)
        return super(DeleteView, self).get(request, *args, **kwargs)

    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.check_permission(request.user, self.object)
        self.object.delete()
        return HttpResponseRedirect(self.get_success_url())


class OwnedCreateView(GuardedCreateView):
    
    owner = None
    
    def ensure_permissions(self, user, object):
        setattr(object, self.owner, user)

    
class OwnedDetailView(GuardedDetailView):
    
    owner = None
    
    def check_permission(self, user, object):
        if getattr(object, self.owner) != user:
            raise exceptions.PermissionDenied()


class OwnedUpdateView(GuardedUpdateView):
    
    owner = None
    
    def check_permission(self, user, object):
        if getattr(object, self.owner) != user:
            raise exceptions.PermissionDenied()

class OwnedDeleteView(GuardedDeleteView):
    
    owner = None
    
    def check_permission(self, user, object):
        if getattr(object, self.owner) != user:
            raise exceptions.PermissionDenied()


class OwnedListView(ListView):
    
    owner = None
    
    def get_queryset_perm(self, user):
        """
        Get the list of items for this view. This must be an interable, and may
        be a queryset (in which qs-specific behavior will be enabled).
        """
        if self.queryset is not None:
            queryset = self.queryset
            if hasattr(queryset, '_clone'):
                queryset = queryset._clone()
        elif self.model is not None:
            lookup_args = { self.owner: user }
            queryset = self.model._default_manager.filter(**lookup_args)
        else:
            raise ImproperlyConfigured(u"'%s' must define 'queryset' or 'model'"
                                       % self.__class__.__name__)
        return queryset

    def get(self, request, *args, **kwargs):
        self.object_list = self.get_queryset_perm(request.user)
        allow_empty = self.get_allow_empty()
        if not allow_empty and len(self.object_list) == 0:
            raise Http404(_(u"Empty list and '%(class_name)s.allow_empty' is False.")
                          % {'class_name': self.__class__.__name__})
        context = self.get_context_data(object_list=self.object_list)
        return self.render_to_response(context)
