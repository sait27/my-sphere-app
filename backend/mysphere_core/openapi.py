# Postprocessing hooks for drf-spectacular
from typing import Dict, Any

from django.conf import settings


def tag_operations(result: Dict[str, Any], generator, request, public):
    """
    drf-spectacular postprocessing hook.
    Assigns tags to operations based on path prefixes.

    Example mapping (prefix -> tag name):
      /api/v1/expenses/ -> 'Expenses'
      /api/v1/users/ -> 'Users'
    """
    # Map known prefixes to tag names (keep in sync with SPECTACULAR_SETTINGS['TAGS'])
    prefix_map = {
        '/api/v1/expenses/': 'Expenses',
        '/api/v1/users/': 'Users',
        '/api/v1/budgets/': 'Budgets',
        '/api/v1/lists/': 'Lists',
        '/api/v1/todos/': 'Todos',
        '/api/v1/integrations/': 'Integrations',
    }

    paths = result.get('paths', {})
    for path, methods in paths.items():
        for prefix, tag in prefix_map.items():
            # normalize check: match prefix with or without trailing slash
            if path.startswith(prefix) or path.startswith(prefix.rstrip('/')):
                for operation in methods.values():
                    # Replace any existing tags with the single category tag to avoid duplicates
                    operation['tags'] = [tag]
                break

    return result
