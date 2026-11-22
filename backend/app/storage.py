
import os
from functools import lru_cache

from supabase import Client, create_client


BUCKET_NAME = os.getenv(
    "SUPABASE_BUCKET",
    "complaint-photos"
)


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Create and reuse the server-side Supabase client."""

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        raise RuntimeError(
            "Supabase environment configuration is missing."
        )

    return create_client(supabase_url, supabase_key)


def upload_complaint_photo(
    object_path: str,
    file_bytes: bytes,
    content_type: str
):
    """Upload a complaint photo into the private bucket."""

    if not object_path.startswith("complaints/"):
        raise ValueError("Invalid complaint photo path.")

    if ".." in object_path or object_path.startswith("/"):
        raise ValueError("Invalid complaint photo path.")

    return (
        get_supabase_client()
        .storage
        .from_(BUCKET_NAME)
        .upload(
            path=object_path,
            file=file_bytes,
            file_options={
                "content-type": content_type,
                "cache-control": "3600",
                "upsert": "false"
            }
        )
    )


def download_complaint_photo(object_path: str) -> bytes:
    """Download a complaint photo from the private bucket."""

    if not object_path.startswith("complaints/"):
        raise ValueError("Invalid complaint photo path.")

    if ".." in object_path or object_path.startswith("/"):
        raise ValueError("Invalid complaint photo path.")

    return (
        get_supabase_client()
        .storage
        .from_(BUCKET_NAME)
        .download(object_path)
    )


def delete_complaint_photo(object_path: str):
    """Delete a complaint photo from the private bucket."""

    if not object_path.startswith("complaints/"):
        raise ValueError("Invalid complaint photo path.")

    if ".." in object_path or object_path.startswith("/"):
        raise ValueError("Invalid complaint photo path.")

    return (
        get_supabase_client()
        .storage
        .from_(BUCKET_NAME)
        .remove([object_path])
    )
