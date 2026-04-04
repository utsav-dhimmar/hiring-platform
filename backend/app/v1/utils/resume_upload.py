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
        return "", ""
    parts = full_name.strip().split(maxsplit=1)
    if not parts:
        return "", ""
    first_name = parts[0]
    last_name = parts[1] if len(parts) > 1 else ""
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
        'name', 'email', 'phone', 'location', 'skills', 'experience', 'education', 'certifications', and 'links'.
    """
    normalized: dict[str, list[dict[str, object]]] = {
        "name": [],
        "email": [],
        "phone": [],
        "location": [],
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
            elif extraction_class == "email":
                normalized["email"].append(item)
            elif extraction_class == "phone":
                normalized["phone"].append(item)
            elif extraction_class == "location":
                normalized["location"].append(item)
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


def extract_social_links(data: dict) -> tuple[str | None, str | None]:
    """Extract LinkedIn and GitHub URLs from a data dictionary.

    Args:
        data: Dictionary that may contain 'links' or 'social_links'.

    Returns:
        A tuple of (linkedin_url, github_url).
    """
    import re

    linkedin_url = None
    github_url = None

    links = data.get("links") or data.get("social_links")
    if not links:
        return None, None

    if isinstance(links, str):
        # Split by comma or semicolon
        link_list = [l.strip() for l in re.split(r"[;,]", links) if l.strip()]
    elif isinstance(links, list):
        link_list = []
        for item in links:
            if isinstance(item, dict):
                link_list.append(item.get("url") or item.get("text") or "")
            else:
                link_list.append(str(item))
    else:
        link_list = []

    for link in link_list:
        if not link or not isinstance(link, str):
            continue
        link_lower = link.lower()
        if "linkedin.com" in link_lower and not linkedin_url:
            linkedin_url = link
        elif "github.com" in link_lower and not github_url:
            github_url = link

    return linkedin_url, github_url
