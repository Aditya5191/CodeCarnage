import os

def is_windows():
    """Check if running on Windows."""
    return os.name == 'nt'