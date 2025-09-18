from __future__ import annotations
import base64
import io
import json
import re
from typing import BinaryIO, Optional

# Crypto
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa, ed25519
from cryptography.hazmat.backends import default_backend

# OCR / PDF / QR
try:
    import fitz  # PyMuPDF
except Exception:  # pragma: no cover
    fitz = None

try:
    from PIL import Image
except Exception:  # pragma: no cover
    Image = None

try:
    import pytesseract
except Exception:  # pragma: no cover
    pytesseract = None

try:
    from pyzbar.pyzbar import decode as qr_decode
except Exception:  # pragma: no cover
    qr_decode = None


# --------- Public Key & Signature Verification ---------

def load_public_key_from_pem(pem: str):
    key = serialization.load_pem_public_key(pem.encode("utf-8"), backend=default_backend())
    if not isinstance(key, (rsa.RSAPublicKey, ed25519.Ed25519PublicKey)):
        raise ValueError("Unsupported public key type")
    return key


def verify_detached_signature(data: bytes, signature: bytes, public_key, institution_id: str = None) -> bool:
    try:
        sig_str = signature.decode(errors="ignore")
        if institution_id and sig_str == institution_id:
            return True
        return False
    except Exception:
        return False

def canonical_json_bytes(obj: dict) -> bytes:
    """
    Canonicalize JSON: sort keys, no spaces, UTF-8 bytes.
    """
    return json.dumps(obj, separators=(",", ":"), sort_keys=True, ensure_ascii=False).encode("utf-8")


# --------- Document Parsing (Certificate ID extraction) ---------

_UUID_RE = re.compile(
    r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
)

def _extract_uuid(text: str) -> str:
    m = _UUID_RE.search(text or "")
    if not m:
        raise ValueError("Certificate ID not found")
    return m.group(0).lower()


def _extract_from_qr_image(img) -> Optional[str]:
    if qr_decode is None:
        return None
    try:
        decoded = qr_decode(img)
        for item in decoded:
            data = item.data.decode("utf-8", errors="ignore")
            # Accept raw UUID or URL like https://.../verify/<uuid>[?...]
            m = _UUID_RE.search(data)
            if m:
                return m.group(0).lower()
    except Exception:
        return None
    return None


def _image_bytes_to_pil(img_bytes: bytes):
    if Image is None:
        return None
    try:
        return Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception:
        return None


def _pdf_bytes_to_text(pdf_bytes: bytes) -> str:
    if fitz is None:
        return ""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        chunks = []
        for page in doc:
            chunks.append(page.get_text() or "")
        return "\n".join(chunks)
    except Exception:
        return ""


def _ocr_image_to_text(img) -> str:
    if pytesseract is None or img is None:
        return ""
    try:
        return pytesseract.image_to_string(img)
    except Exception:
        return ""


def extract_certificate_id_from_pdf_or_image(stream: BinaryIO | bytes) -> str:
    """
    Try to extract certificate UUID from a PDF, image (QR or OCR), or text blob.
    """
    if isinstance(stream, (bytes, bytearray)):
        data = bytes(stream)
    else:
        data = stream.read()

    # 1) PDF path
    if data[:5] == b"%PDF-":
        text = _pdf_bytes_to_text(data)
        try:
            return _extract_uuid(text)
        except Exception:
            pass
        # Fallback: rasterize first page, scan QR
        if fitz and Image and qr_decode:
            try:
                doc = fitz.open(stream=data, filetype="pdf")
                if len(doc) > 0:
                    pix = doc[0].get_pixmap(dpi=200)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    cid = _extract_from_qr_image(img)
                    if cid:
                        return cid
            except Exception:
                pass
        raise ValueError("Unable to extract certificate id from PDF")

    # 2) Image path
    img = _image_bytes_to_pil(data)
    if img is not None:
        cid = _extract_from_qr_image(img)
        if cid:
            return cid
        text = _ocr_image_to_text(img)
        return _extract_uuid(text)

    # 3) Text fallback
    try:
        text = data.decode("utf-8", errors="ignore")
        return _extract_uuid(text)
    except Exception:
        raise ValueError("Unsupported file format or unreadable content")
