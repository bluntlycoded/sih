# app/utils/ocr.py
import hashlib
from google.cloud import vision

def ocr_and_hash_image(image_bytes: bytes) -> str:
    """Run OCR on image bytes and return SHA256 hash of normalized text."""
    client = vision.ImageAnnotatorClient()
    image = vision.Image(content=image_bytes)
    response = client.text_detection(image=image)

    if response.error.message:
        raise RuntimeError(f"Vision API error: {response.error.message}")

    texts = response.text_annotations
    text = texts[0].description if texts else ""

    normalized = " ".join(text.strip().lower().split())  # normalize spaces, lowercase
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()
