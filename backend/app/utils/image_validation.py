from fastapi import UploadFile, HTTPException, status

ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

async def validate_image_file(file: UploadFile) -> bytes:
    """
    Validates uploaded crop image for format and size.
    Returns the file content bytes if valid.
    """
    if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image format '{file.content_type}'. Allowed formats: JPG, PNG, WEBP."
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds 10MB limit. Uploaded file size: {round(len(contents)/(1024*1024), 2)}MB"
        )

    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    return contents
