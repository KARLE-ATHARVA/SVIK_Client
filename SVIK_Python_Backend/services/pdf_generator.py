from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
import os
import uuid
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

FALLBACK_IMAGE_URL = "https://vyr.svikinfotech.in/assets/media/no-image.jpg"

# ------------------------------------------------
# LUXURY BRAND PALETTE
# ------------------------------------------------
PRIMARY = colors.HexColor("#0F172A")    # Deep Slate
ACCENT = colors.HexColor("#D97706")     # Amber 600
ACCENT_LIGHT = colors.HexColor("#F59E0B") 
MUTED = colors.HexColor("#94A3B8")      # Slate 400
DIVIDER = colors.HexColor("#334155")    # Slate 700
WHITE = colors.white

def download_image(base_url: str) -> str:
    os.makedirs("static/tmp", exist_ok=True)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/*,*/*;q=0.8",
        "Referer": "https://vyr.svikinfotech.in/",
    }

    def fetch(url: str):
        try:
            r = requests.get(url, headers=headers, timeout=10, verify=False)
            if r.status_code == 200 and r.headers.get("Content-Type", "").startswith("image"):
                return r.content
        except: pass
        return None

    content = fetch(base_url)
    is_fallback = False
    if not content:
        for ext in [".jpg", ".JPG", ".jpeg"]:
            content = fetch(base_url + ext)
            if content: break
    
    if not content:
        content = fetch(FALLBACK_IMAGE_URL)
        is_fallback = True

    prefix = "REAL_" if not is_fallback else "EMPTY_"
    path = f"static/tmp/{prefix}{uuid.uuid4().hex}.jpg"
    with open(path, "wb") as f:
        f.write(content)
    return path

def generate_pdf(image_path, tile, qr_path, output_path):
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4
    temp_files = []

    # 1. LUXURY SIDEBAR
    c.setFillColor(PRIMARY)
    c.rect(0, 0, 210, height, fill=1, stroke=0)

    # 2. LOGO SECTION
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(40, height - 60, "SVIK")
    c.setFillColor(ACCENT)
    c.drawString(104, height - 60, "TiVi")
    
    c.setStrokeColor(ACCENT)
    c.setLineWidth(1.5)
    c.line(40, height - 72, 80, height - 72)

    # 3. DYNAMIC DATA ENTRIES
    y_cursor = height - 140
    specs = [
        ("COLLECTION", tile.get("category")),
        ("PRODUCT SKU", tile.get("sku_name")),
        ("FINISH", tile.get("finish")),
        ("COLOR", tile.get("color")),
        ("APPLICATION", tile.get("application")),
        ("SPACE", tile.get("space")),
    ]

    for label, value in specs:
        if value and value not in ["—", "None", ""]:
            c.setFillColor(MUTED)
            c.setFont("Helvetica-Bold", 7)
            label_text = "  ".join(list(label)) 
            c.drawString(40, y_cursor, label_text)
            
            c.setFillColor(WHITE)
            c.setFont("Helvetica", 11)
            c.drawString(40, y_cursor - 18, str(value)[:28])
            
            c.setStrokeColor(DIVIDER)
            c.setLineWidth(0.5)
            c.line(40, y_cursor - 30, 170, y_cursor - 30)
            y_cursor -= 55

    # 4. QR CODE (Bottom Left)
    if os.path.exists(qr_path):
        c.setStrokeColor(DIVIDER)
        c.roundRect(40, 40, 130, 150, 6, stroke=1, fill=0)
        c.drawImage(ImageReader(qr_path), 55, 85, width=100, height=100)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(105, 65, "VIRTUAL PREVIEW")

    # 5. MAIN VISUALIZATION (HERO)
    hero_w = 345
    hero_h = 320 # Slightly reduced height for better balance
    hero_x = 230
    hero_y = height - 360

    if os.path.exists(image_path):
        # Image Shadow
        c.setFillColor(colors.HexColor("#F8FAFC"))
        c.roundRect(hero_x - 5, hero_y - 5, hero_w + 10, hero_h + 10, 10, fill=1, stroke=0)
        
        c.saveState()
        p = c.beginPath()
        p.roundRect(hero_x, hero_y, hero_w, hero_h, 8)
        c.clipPath(p, stroke=0)
        c.drawImage(ImageReader(image_path), hero_x, hero_y, width=hero_w, height=hero_h, preserveAspectRatio=True)
        c.restoreState()

    # 6. DYNAMIC TILE IMAGES (Non-Magnified Logic)
    big_path = download_image(tile.get("big_image"))
    thumb_path = download_image(tile.get("thumb_image"))
    temp_files.extend([big_path, thumb_path])

    valid_images = []
    if "REAL_" in os.path.basename(big_path):
        valid_images.append(big_path)
    if "REAL_" in os.path.basename(thumb_path):
        valid_images.append(thumb_path)

    area_y_top = hero_y - 40
    area_y_bottom = 60
    available_h = area_y_top - area_y_bottom
    
    if len(valid_images) == 2:
        # Two images: Regular stack
        img_h = (available_h - 20) / 2
        for i, img in enumerate(valid_images):
            draw_y = area_y_top - (img_h * (i + 1)) - (10 * i)
            c.setStrokeColor(colors.HexColor("#CBD5E1"))
            c.roundRect(230, draw_y, 345, img_h, 8, stroke=1)
            c.drawImage(ImageReader(img), 235, draw_y + 5, width=335, height=img_h - 10, preserveAspectRatio=True)
            
    elif len(valid_images) == 1:
        # Prevent Magnification: Limit the height so it doesn't stretch 
        # but occupies a "Gallery" style position
        max_single_h = 280 
        img_h = min(available_h, max_single_h)
        # Center the image in the remaining vertical area
        draw_y = area_y_bottom + (available_h - img_h) / 2
        
        c.setStrokeColor(colors.HexColor("#CBD5E1"))
        c.roundRect(230, draw_y, 345, img_h, 8, stroke=1)
        
        # preserveAspectRatio=True is key here to stop magnification
        c.drawImage(ImageReader(valid_images[0]), 235, draw_y + 10, width=335, height=img_h - 20, preserveAspectRatio=True)

    # 7. FINAL TOUCHES
    c.setFillColor(colors.HexColor("#64748B"))
    c.setFont("Helvetica-Oblique", 8)
    c.drawRightString(width - 30, 25, "SVIK TILES | INTERNATIONAL STANDARDS")

    c.showPage()
    c.save()

    for f in temp_files:
        try: os.remove(f)
        except: pass