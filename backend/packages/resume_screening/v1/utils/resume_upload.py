"""
Resume processing utility functions.

This module contains helper functions for splitting names,
normalizing LLM-extracted data, and extracting skill names.
"""


def split_name(full_name: str | None) -> tuple[str | None, str | None]:
    """Split a full name into first and last name components.

    Args:
        full_name: The complete name string to split.

    Returns:
        A tuple of (first_name, last_name). Returns (None, None) if input is empty.
    """
    if not full_name:
        return None, None
    parts = full_name.strip().split(maxsplit=1)
    if not parts:
        return None, None
    first_name = parts[0]
    last_name = parts[1] if len(parts) > 1 else None
    return first_name, last_name


def normalize_extractions(
    extracted: object,
) -> dict[str, list[dict[str, object]]]:
    """Normalize raw extraction results into a consistent dictionary format.

    Handles different input types, including objects with direct attributes
    or objects containing a list of extraction records.

    Args:
        extracted: The raw extraction data from the LLM extractor.

    Returns:
        A dictionary containing lists of extractions for fields like
        'name', 'skills', 'experience', 'education', 'certifications', and 'links'.
    """
    normalized: dict[str, list[dict[str, object]]] = {
        "name": [],
        "skills": [],
        "experience": [],
        "education": [],
        "certifications": [],
        "links": [],
    }

    if hasattr(extracted, "skills") and hasattr(extracted, "experience"):
        normalized["skills"] = [
            {"text": skill, "attributes": {}}
            for skill in getattr(extracted, "skills", [])
        ]
        normalized["experience"] = [
            {"text": item, "attributes": {}}
            for item in getattr(extracted, "experience", [])
        ]
        normalized["education"] = [
            {"text": item, "attributes": {}}
            for item in getattr(extracted, "education", [])
        ]
        normalized["certifications"] = [
            {"text": item, "attributes": {}}
            for item in getattr(extracted, "certifications", [])
        ]
        return normalized

    documents = extracted if isinstance(extracted, list) else [extracted]
    for document in documents:
        for extraction in getattr(document, "extractions", []):
            item = {
                "text": getattr(extraction, "extraction_text", ""),
                "attributes": getattr(extraction, "attributes", {}) or {},
            }
            extraction_class = getattr(extraction, "extraction_class", "")
            if extraction_class == "name":
                normalized["name"].append(item)
            elif extraction_class == "skill":
                normalized["skills"].append(item)
            elif extraction_class == "experience":
                normalized["experience"].append(item)
            elif extraction_class == "education":
                normalized["education"].append(item)
            elif extraction_class == "certification":
                normalized["certifications"].append(item)
            elif extraction_class == "link":
                normalized["links"].append(item)

    return normalized


def extract_skill_names(
    normalized: dict[str, list[dict[str, object]]],
) -> list[str]:
    """Extract and deduplicate unique skill names from normalized extractions.

    Splits comma-separated skill strings and normalizes them for deduplication.

    Args:
        normalized: The dictionary of normalized extractions.

    Returns:
        A list of unique, non-empty skill names.
    """
    skill_names: list[str] = []
    seen: set[str] = set()
    for item in normalized["skills"]:
        text = str(item["text"]).strip()
        if not text:
            continue
        for part in (piece.strip() for piece in text.split(",")):
            key = part.lower()
            if part and key not in seen:
                seen.add(key)
                skill_names.append(part)
    return skill_names
