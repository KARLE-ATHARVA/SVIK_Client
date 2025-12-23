from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os

from services.tile_service import get_tile_details
from services.qr_generator import generate_qr
from services.pdf_generator import generate_pdf

app = FastAPI()

# ------------------------------------------------
# CORS (open for prototype)
# ------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------
# Static file serving
# ------------------------------------------------
app.mount("/static", StaticFiles(directory="static"), name="static")


# ------------------------------------------------
# Catalogue Generation API (PROTOTYPE)
# ------------------------------------------------
@app.post("/api/catalogue/generate")
def generate_catalogue(payload: dict):
    """
    Prototype flow:
    - Accept tileId
    - Generate catalogue PDF
    - Embed QR redirecting to visualizer screen
    """

    tile_id = payload.get("tileId")

    if not tile_id:
        return JSONResponse(
            status_code=400,
            content={"error": "tileId is required"}
        )

    # Ensure output directories exist
    os.makedirs("static/catalogues", exist_ok=True)

    # ------------------------------------------------
    # HARDCODED VISUALIZED IMAGE (Prototype)
    # ------------------------------------------------
    visualized_image_path = "static/images/bathroom-3.jpg"

    # Output PDF path
    output_pdf_path = "static/catalogues/catalogue_demo.pdf"

    # ------------------------------------------------
    # Fetch tile details (from .NET API)
    # ------------------------------------------------
    tile_data = get_tile_details(tile_id)

    # ------------------------------------------------
    # Generate QR (redirects to real visualizer screen)
    # ------------------------------------------------
    qr_path = generate_qr()

    # ------------------------------------------------
    # Generate PDF catalogue
    # ------------------------------------------------
    generate_pdf(
        image_path=visualized_image_path,
        tile=tile_data,
        qr_path=qr_path,
        output_path=output_pdf_path
    )

    # ------------------------------------------------
    # Return downloadable PDF URL
    # ------------------------------------------------
    return {
        "pdfUrl": f"http://localhost:8000/{output_pdf_path}"
    }
