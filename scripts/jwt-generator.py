import jwt
import datetime
import time
from datetime import timezone
import os
import binascii

# --- SETUP PENTING ---

# PENTING: Untuk menghasilkan token yang valid, Anda memerlukan SECRET KEY.
# Kunci ini HARUS RAHASIA dan panjang (biasanya 32 karakter atau lebih).
# Jika Anda menggunakan Supabase, ini adalah kunci rahasia yang ada di pengaturan project Anda.
# Kami menggunakan kunci dummy yang panjang di sini.
SECRET_KEY = "3LcQpxvoLW2I4OqPMgDFosKN+wtpWXsODyeuPkSKSJ2XA4y4kST4KEaiRlkNK9YMeuJw0LXNkDAlV43ekoPi/g=="

# --------------------

def generate_jwt_token(role: str) -> str:
    """
    Membuat token JWT dengan struktur standar Supabase (HS256).

    Args:
        role (str): Peran pengguna, misal 'anon' atau 'service_role'.

    Returns:
        str: Token JWT yang sudah dienkode.
    """
    # 1. Tentukan Waktu (Klaim Standar JWT)
    now = datetime.datetime.now(timezone.utc)
    # Tetapkan waktu kadaluarsa (misal, 5 tahun dari sekarang)
    expiration_time = now + datetime.timedelta(days=365 * 5)

    # 2. Susun Payload
    payload = {
        "role": role,
        "iss": "supabase-demo",             # Issuer (Penerbit)
        "iat": int(now.timestamp()),        # Issued At (Waktu Dibuat)
        "exp": int(expiration_time.timestamp()) # Expiration (Waktu Kedaluwarsa)
    }

    # 3. Encoding (Pembuatan Token)
    # Gunakan algoritma HS256, sama seperti contoh Anda
    encoded_jwt = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm="HS256"
    )

    # JWT di Python 3+ dikembalikan sebagai bytes, perlu di-decode ke string
    return encoded_jwt

# --- EKSEKUSI ---

print("=" * 50)
print("JWT GENERATOR DEMO")
print(f"Secret Key (Harus Dirahasiakan!): {SECRET_KEY[:10]}...")
print("=" * 50)

# 1. Buat Token untuk Peran 'anon'
anon_key = generate_jwt_token("anon")
print(f"ANON_KEY (Role: anon):\n{anon_key}\n")

# 2. Buat Token untuk Peran 'service_role'
service_role_key = generate_jwt_token("service_role")
print(f"SERVICE_ROLE_KEY (Role: service_role):\n{service_role_key}\n")

token_hmac_secret_key = generate_jwt_token("token_hmac_secret_key")
print(f"TOKEN_HMAC_SECRET_KEY (Role: token_hmac_secret_key):\n{token_hmac_secret_key}\n")

docker_centrifugo_api_key = generate_jwt_token("CENTRIFUGO_API_KEY")
print(f"DOCKER_CENTRIFUGO_API_KEY (Role: CENTRIFUGO_API_KEY):\n{docker_centrifugo_api_key}\n")

docker_centrifugo_admin_secret = generate_jwt_token("CENTRIFUGO_ADMIN_SECRET")
print(f"DOCKER_CENTRIFUGO_ADMIN_SECRET (Role: CENTRIFUGO_ADMIN_SECRET):\n{docker_centrifugo_admin_secret}\n")

CENTRIFUGO_TOKEN_SECRET = generate_jwt_token("CENTRIFUGO_TOKEN_SECRET")
print(f"CENTRIFUGO_TOKEN_SECRET (Role: CENTRIFUGO_TOKEN_SECRET):\n{CENTRIFUGO_TOKEN_SECRET}\n")

META_WEBHOOK_VERIFY_TOKEN = generate_jwt_token("META_WEBHOOK_VERIFY_TOKEN")
print(f"META_WEBHOOK_VERIFY_TOKEN (Role: META_WEBHOOK_VERIFY_TOKEN):\n{META_WEBHOOK_VERIFY_TOKEN}\n")

ENCRYPTION_KEY = generate_jwt_token("ENCRYPTION_KEY")
print(f"ENCRYPTION_KEY (Role: ENCRYPTION_KEY):\n{ENCRYPTION_KEY}\n")
# Catatan: Panjang token akan bervariasi tergantung pada SECRET_KEY dan waktu pembuatan.
