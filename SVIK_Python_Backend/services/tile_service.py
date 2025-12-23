import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# --------------------------------------------------
# CONSTANTS
# --------------------------------------------------

GET_TILE_LIST_ENDPOINT = "https://vyr.svikinfotech.in/api/GetTileList"

BIG_IMAGE_BASE = "https://vyr.svikinfotech.in/assets/media/big/"
THUMB_IMAGE_BASE = "https://vyr.svikinfotech.in/assets/media/thumb/"
FALLBACK_IMAGE = "https://vyr.svikinfotech.in/assets/media/no-image.jpg"


# --------------------------------------------------
# SERVICE
# --------------------------------------------------

def get_tile_details(tile_id: str) -> dict:
    """
    Fetch tile details using SKU code and
    derive BIG & THUMB image URLs from SKU.
    """

    try:
        response = requests.get(
            GET_TILE_LIST_ENDPOINT,
            timeout=10,
            verify=False
        )
        response.raise_for_status()

        tiles = response.json()

        matching_tile = next(
            (
                tile for tile in tiles
                if str(tile.get("sku_code", "")).strip() == str(tile_id).strip()
            ),
            None
        )

        if not matching_tile:
            raise ValueError(f"No tile found with SKU {tile_id}")

        # 🔥 IMAGE URL DERIVATION (KEY UPDATE)
        big_image_url = f"{BIG_IMAGE_BASE}{tile_id}.jpg"
        thumb_image_url = f"{THUMB_IMAGE_BASE}{tile_id}.jpg"

        return {
            # Core details
            "sku_name": matching_tile.get("sku_name", "N/A"),
            "sku_code": matching_tile.get("sku_code", tile_id),
            "category": matching_tile.get("cat_name", "N/A"),
            "application": matching_tile.get("app_name", "N/A"),
            "space": matching_tile.get("space_name", "N/A"),
            "size": matching_tile.get("size_name", "N/A"),
            "finish": matching_tile.get("finish_name", "N/A"),
            "color": matching_tile.get("color_name", "N/A"),
            "status": "Blocked" if matching_tile.get("block") else "Active",

            # 🔥 Images
            "big_image": big_image_url,
            "thumb_image": thumb_image_url
        }

    except Exception as e:
        print("❌ TILE SERVICE ERROR:", e)

        # Fallback (catalogue must still generate)
        return {
            "sku_name": "Unknown Tile",
            "sku_code": tile_id,
            "category": "N/A",
            "application": "N/A",
            "space": "N/A",
            "size": "N/A",
            "finish": "N/A",
            "color": "N/A",
            "status": "N/A",
            "big_image": FALLBACK_IMAGE,
            "thumb_image": FALLBACK_IMAGE
        }
