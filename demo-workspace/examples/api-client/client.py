# Incomplete API client - let AI help you finish it!

import requests


class APIClient:
    """A simple REST API client. Try asking AI to:
    - Add error handling
    - Add retry logic
    - Add authentication
    - Add response caching
    - Write tests
    """

    def __init__(self, base_url):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()

    def get(self, endpoint):
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        response = self.session.get(url)
        return response.json()

    def post(self, endpoint, data):
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        response = self.session.post(url, json=data)
        return response.json()
