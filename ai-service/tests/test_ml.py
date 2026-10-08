import os
import requests
from io import BytesIO
from PIL import Image

def download_image(url: str) -> Image.Image:
    res = requests.get(url)
    return Image.open(BytesIO(res.content)).convert("RGB")

images = [
    {"url": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Pothole_in_the_road.jpg", "desc": "large hole in the street", "cat": "Pothole"},
    {"url": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Garbage_in_street.jpg", "desc": "trash bags piled up", "cat": "Garbage Accumulation"},
    {"url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Flooded_street.jpg/640px-Flooded_street.jpg", "desc": "street flooded with water", "cat": "Water Leakage"},
    {"url": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Broken_street_light.jpg/640px-Broken_street_light.jpg", "desc": "light pole is dark", "cat": "Broken Streetlight"}
]

print("This is a placeholder for the automated ML tests.")
print("In a real CI, this fetches sample images and asserts ml.classify_issue returns the correct category.")
