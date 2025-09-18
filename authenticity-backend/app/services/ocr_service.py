import pytesseract
from PIL import Image
import io
import fitz  # PyMuPDF

class OCRService:
    @staticmethod
    def extract_from_pdf(pdf_bytes: bytes) -> str:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text

    @staticmethod
    def extract_from_image(img_bytes: bytes) -> str:
        img = Image.open(io.BytesIO(img_bytes))
        return pytesseract.image_to_string(img)

    @staticmethod
    def find_certificate_id(text: str) -> str:
        # Expect certificate id pattern UUID
        import re
        match = re.search(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", text)
        if not match:
            raise ValueError("Certificate ID not found in document")
        return match.group(0)
