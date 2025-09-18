import firebase_admin
from firebase_admin import credentials, firestore
import os
from app.config import settings

# Initialize Firebase App (singleton)
if not firebase_admin._apps:
    cred_path = os.getenv("FIREBASE_CREDENTIALS", settings.FIREBASE_CREDENTIALS)
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

def get_collection(name: str):
    """Get a Firestore collection reference by name."""
    return db.collection(name)

def get_document(collection: str, doc_id: str):
    """Get a document snapshot by collection and ID."""
    return db.collection(collection).document(doc_id).get()

def set_document(collection: str, doc_id: str, data: dict):
    """Create or overwrite a document."""
    db.collection(collection).document(doc_id).set(data)

def update_document(collection: str, doc_id: str, data: dict):
    """Update an existing document."""
    db.collection(collection).document(doc_id).update(data)

def delete_document(collection: str, doc_id: str):
    """Delete a document."""
    db.collection(collection).document(doc_id).delete()
