import io, qrcode
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
import base64

class PDFService:
    @staticmethod
    def generate_certificate_pdf(cert: dict) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        story.append(Paragraph("Verified Academic Certificate", styles["Title"]))
        story.append(Spacer(1, 24))

        for key, value in cert.items():
            story.append(Paragraph(f"<b>{key}:</b> {value}", styles["Normal"]))
            story.append(Spacer(1, 12))

        qr = qrcode.QRCode(box_size=4, border=1)
        qr.add_data(cert["id"])
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf_qr = io.BytesIO()
        img.save(buf_qr, format="PNG")
        buf_qr.seek(0)

        story.append(Image(buf_qr, width=100, height=100))
        doc.build(story)
        pdf = buffer.getvalue()
        buffer.close()
        return pdf

    @staticmethod
    def pdf_to_base64(pdf_bytes: bytes) -> str:
        return base64.b64encode(pdf_bytes).decode("utf-8")
