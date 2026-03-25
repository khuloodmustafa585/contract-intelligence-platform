from app.core.security import hash_password, verify_password, create_access_token

pwd = hash_password("123456")
print("HASH:", pwd)
print("VERIFY:", verify_password("123456", pwd))
print("TOKEN:", create_access_token({"sub": "test@example.com"}))