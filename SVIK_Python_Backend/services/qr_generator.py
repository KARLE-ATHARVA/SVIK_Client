import qrcode
import os
import uuid

def generate_qr():
    """
    Generates QR code pointing directly to Visualizer screen
    (prototype version)
    """
    os.makedirs("static/qr", exist_ok=True)

    # 🔥 FINAL PROTOTYPE TARGET
    visualizer_url = (
        "http://localhost:3000/visualizerScreen"
        "?app=Wall&color=slate"
    )

    qr = qrcode.make(visualizer_url)

    qr_path = f"static/qr/qr_{uuid.uuid4().hex}.png"
    qr.save(qr_path)

    return qr_path
