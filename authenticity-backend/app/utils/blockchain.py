from web3 import Web3
from eth_account import Account
from app.core.config import settings

w3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL))

def push_to_blockchain(cert_id: str, ocr_hash: str) -> str:
    """Push certificate record to blockchain and return tx hash"""
    account = Account.from_key(settings.BLOCKCHAIN_PRIVATE_KEY)

    tx = {
        "from": account.address,
        "to": account.address,  # sending to self, just to record
        "value": 0,
        "gas": 21000,
        "gasPrice": w3.to_wei("1", "gwei"),
        "nonce": w3.eth.get_transaction_count(account.address),
        "data": cert_id.encode("utf-8")[:32],  # store cert_id in data field
        "chainId": settings.BLOCKCHAIN_CHAIN_ID,
    }

    signed_tx = account.sign_transaction(tx)

    # ✅ correct for web3 6.x
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)

    return tx_hash.hex()
