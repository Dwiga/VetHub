"""
Backend API tests for VetCare Pro TanStack Start migration.

Covers:
- FastAPI proxy at 8001 forwarding to TanStack Start at 3000
- Public endpoints (/api/health, /api/species)
- Auth-protected endpoints returning 401 (placeholder Clerk keys)
- Path-not-found behaviour
- External preview URL parity
- Landing page rendering (public HTML)
"""

import pytest
import requests

INTERNAL_BACKEND = "http://127.0.0.1:8001"
INTERNAL_FRONTEND = "http://127.0.0.1:3000"
PREVIEW_URL = "https://pnpm-to-bun.preview.emergentagent.com"


# ----------------- Service health -----------------

class TestServiceHealth:
    def test_backend_proxy_health_endpoint(self):
        r = requests.get(f"{INTERNAL_BACKEND}/healthz", timeout=10)
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_tanstack_direct_health(self):
        r = requests.get(f"{INTERNAL_FRONTEND}/api/health", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert data["service"] == "vetcare-frontend"

    def test_backend_proxy_api_health(self):
        r = requests.get(f"{INTERNAL_BACKEND}/api/health", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert data["service"] == "vetcare-frontend"
        assert "time" in data


# ----------------- Public Prisma read -----------------

class TestSpeciesEndpoint:
    def test_species_via_proxy_returns_8_species(self):
        r = requests.get(f"{INTERNAL_BACKEND}/api/species", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 8
        names = {s.get("name") for s in data}
        expected = {"Dog", "Cat", "Rabbit", "Bird", "Hamster", "Fish", "Reptile", "Other"}
        assert expected.issubset(names), f"missing species: {expected - names}"

    def test_species_direct_tanstack(self):
        r = requests.get(f"{INTERNAL_FRONTEND}/api/species", timeout=15)
        assert r.status_code == 200
        assert len(r.json()) == 8


# ----------------- Auth-required endpoints -----------------

AUTH_ENDPOINTS_GET = [
    "/api/users/me",
    "/api/pets",
    "/api/pets/1",
    "/api/visits",
]


class TestAuthProtectedEndpoints:
    @pytest.mark.parametrize("endpoint", AUTH_ENDPOINTS_GET)
    def test_get_without_auth_returns_401(self, endpoint):
        r = requests.get(f"{INTERNAL_BACKEND}{endpoint}", timeout=10)
        assert r.status_code == 401, f"{endpoint} returned {r.status_code}: {r.text[:200]}"
        body = r.json()
        assert body.get("error") == "unauthorized", f"{endpoint} body: {body}"

    def test_post_register_pet_owner_without_auth_returns_401(self):
        r = requests.post(
            f"{INTERNAL_BACKEND}/api/users/me/register-pet-owner",
            json={"firstName": "T", "lastName": "U"},
            timeout=10,
        )
        assert r.status_code == 401
        assert r.json().get("error") == "unauthorized"

    @pytest.mark.parametrize("endpoint", AUTH_ENDPOINTS_GET)
    def test_get_with_fake_bearer_returns_401(self, endpoint):
        r = requests.get(
            f"{INTERNAL_BACKEND}{endpoint}",
            headers={"Authorization": "Bearer fakeToken_invalid_123"},
            timeout=10,
        )
        # Must be 401, NOT 500. Verifies Authorization header is forwarded
        # and Clerk verifier rejects cleanly.
        assert r.status_code == 401, f"{endpoint} returned {r.status_code}: {r.text[:200]}"
        assert r.json().get("error") == "unauthorized"

    def test_pet_detail_invalid_id_without_auth_is_401(self):
        # Without auth, 401 takes precedence over 400 (invalid id).
        r = requests.get(f"{INTERNAL_BACKEND}/api/pets/abc", timeout=10)
        assert r.status_code == 401
        assert r.json().get("error") == "unauthorized"


# ----------------- Path not found -----------------

class TestNotFound:
    def test_unknown_api_path_returns_404(self):
        r = requests.get(f"{INTERNAL_BACKEND}/api/does-not-exist", timeout=10)
        # Must be 404, not 502/500
        assert r.status_code == 404, f"got {r.status_code}: {r.text[:200]}"


# ----------------- External preview URL parity -----------------

class TestPreviewParity:
    def test_preview_health(self):
        r = requests.get(f"{PREVIEW_URL}/api/health", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert data["service"] == "vetcare-frontend"

    def test_preview_species(self):
        r = requests.get(f"{PREVIEW_URL}/api/species", timeout=20)
        assert r.status_code == 200
        assert len(r.json()) == 8

    def test_preview_auth_protected_401(self):
        r = requests.get(f"{PREVIEW_URL}/api/users/me", timeout=20)
        assert r.status_code == 401
        assert r.json().get("error") == "unauthorized"


# ----------------- Landing page (public HTML) -----------------

class TestLandingPage:
    def test_landing_page_via_preview(self):
        r = requests.get(f"{PREVIEW_URL}/", timeout=20)
        assert r.status_code == 200
        html = r.text
        assert "VetCare Pro" in html, "title missing in landing HTML"
        # data-testid='landing-page' may render client-side; check at least the
        # root marker or title. Accept either testid presence or the title text.
        assert ("landing-page" in html) or ("VetCare Pro" in html)
