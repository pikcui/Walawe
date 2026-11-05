import json
import urllib.request
import urllib.error

class WalaweError(Exception):
    pass

class Walawe:
    def __init__(self, api_key: str, base_url: str = "http://localhost:8080/v1"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")

    def chat_completions(self, model: str, messages: list, max_tokens: int = 100):
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = json.dumps({
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens
        }).encode("utf-8")

        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        
        try:
            with urllib.request.urlopen(req) as response:
                # Karena server kita streaming (SSE), kita baca baris per baris
                for line in response:
                    line_str = line.decode("utf-8").strip()
                    if line_str.startswith("data: "):
                        json_str = line_str[6:] # Hapus "data: "
                        yield json.loads(json_str)
        except urllib.error.HTTPError as e:
            raise WalaweError(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
        except urllib.error.URLError as e:
            raise WalaweError(f"Connection Error: {e.reason}")
