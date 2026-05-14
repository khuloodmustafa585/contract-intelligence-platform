import logging


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

security_logger = logging.getLogger("contract_intelligence.security")
app_logger = logging.getLogger("contract_intelligence.app")
