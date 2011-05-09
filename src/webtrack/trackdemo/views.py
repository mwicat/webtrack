# Create your views here.

from trackdemo.models import Tracker
from helpers import OwnedUpdateView, OwnedListView, OwnedCreateView, OwnedDeleteView, OwnedDetailView
from django.contrib.auth.decorators import login_required
from trackdemo.forms import TrackerForm


import json
from misc.util import serialize
from django.views.decorators.csrf import csrf_exempt

class ShowMapView(OwnedListView):
    
    def get_context_data(self, **kwargs):
        """
        Get the context for this view.
        """
        object_list = kwargs['object_list']       
        context = OwnedListView.get_context_data(self, **kwargs)
        serialized = json.dumps(serialize(object_list))
        context['serialized_trackers'] = serialized
        return context


create_tracker = login_required(OwnedCreateView.as_view(owner='owner',
                                                        model=Tracker, 
                                                        form_class=TrackerForm,
                                                        success_url='/trackdemo/tracker/%(id)d'))

update_tracker = csrf_exempt(login_required(OwnedUpdateView.as_view(owner='owner',
                                                                    model=Tracker, 
                                                                    form_class=TrackerForm, 
                                                                    success_url='/trackdemo/tracker/%(id)d')))

delete_tracker = login_required(OwnedDeleteView.as_view(owner='owner',
                                                                    model=Tracker,
                                                                    success_url='/trackdemo/tracker/'))

tracker_list = login_required(OwnedListView.as_view(owner='owner', model=Tracker))

tracker_detail = login_required(OwnedDetailView.as_view(owner='owner', model=Tracker))

show_map = login_required(ShowMapView.as_view(owner='owner', model=Tracker, template_name='trackdemo/map.html'))
