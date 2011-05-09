from django import template

register = template.Library()

@register.simple_tag
def active_tab(curr_path, path):
    return 'id="selected""' if curr_path == path else ''