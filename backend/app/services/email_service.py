def send_verification_email(email: str, token: str):
    verify_url = f"http://127.0.0.1:8000/api/v1/auth/verify-email?token={token}"

    print("========== EMAIL SENT ==========")
    print(f"To: {email}")
    print(f"Verification link: {verify_url}")
    print("================================")