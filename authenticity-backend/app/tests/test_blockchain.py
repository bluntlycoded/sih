from app.services.blockchain_service import BlockchainService

def test_anchor_and_verify():
    cert = {"id": "123", "student_id": "abc"}
    txid = BlockchainService.anchor_certificate(cert)
    assert txid.startswith("mock-tx-")
    assert BlockchainService.verify_anchor(txid)
    assert not BlockchainService.verify_anchor("bad-txid")
