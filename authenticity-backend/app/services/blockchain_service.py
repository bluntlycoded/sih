from datetime import datetime
import hashlib, json

class BlockchainService:
    @staticmethod
    def anchor_certificate(cert: dict) -> str:
        # Mock anchor using deterministic hash
        data = json.dumps(cert, sort_keys=True).encode("utf-8")
        txid = hashlib.sha256(data).hexdigest()
        return f"mock-tx-{txid[:16]}-{int(datetime.utcnow().timestamp())}"

    @staticmethod
    def verify_anchor(txid: str) -> bool:
        # In real impl: query Fabric/Polygon
        return txid.startswith("mock-tx-")
