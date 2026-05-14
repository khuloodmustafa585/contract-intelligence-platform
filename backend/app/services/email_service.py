from email.message import EmailMessage
import smtplib

from app.core.config import settings
from app.core.logging import app_logger


def send_verification_email(to_email: str, code: str) -> None:
    subject = "Verify your AI Contract Intelligence account"
    body = (
        "Welcome to AI Contract Intelligence.\n\n"
        f"Your verification code is: {code}\n"
        "This code expires in 10 minutes.\n\n"
        "If you did not request this account, you can ignore this email."
    )

    if not settings.SMTP_HOST:
        app_logger.info("Verification code for %s: %s", to_email, code)
        return

    from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    if not from_email:
        raise RuntimeError("SMTP_FROM_EMAIL or SMTP_USERNAME must be configured")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = from_email
    message["To"] = to_email
    message.set_content(body)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
        if settings.SMTP_USE_TLS:
            smtp.starttls()
        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        smtp.send_message(message)
