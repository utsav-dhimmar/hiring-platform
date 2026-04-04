"""
Utility functions for text construction from models.
"""

from __future__ import annotations

import json
from typing import Any


def build_job_text(job: Any) -> str:
    """Construct a searchable/embeddable text representation of a job.

    Args:
        job: The job model object.

    Returns:
        A concatenated string of job title, department, and description.
    """
    parts: list[str] = []

    title = getattr(job, "title", None)
    # Support both FK-based relationship (department.name) and plain string fallback
    dept_obj = getattr(job, "department", None)
    if dept_obj is not None and hasattr(dept_obj, "name"):
        department = dept_obj.name
    else:
        department = dept_obj  # may be None or already a string (legacy)
    jd_text = getattr(job, "jd_text", None)
    jd_json = getattr(job, "jd_json", None)

    if title:
        parts.append(f"Title: {title}")
    if department:
        parts.append(f"Department: {department}")
    if jd_text:
        parts.append(f"Description:\n{jd_text}")
    if jd_json:
        parts.append(
            "Structured JD:\n"
            + json.dumps(jd_json, ensure_ascii=True, sort_keys=True, default=str)
        )

    return "\n\n".join(parts).strip()


def build_skill_text(skill: Any) -> str:
    """Construct a text representation of a skill for embedding.

    Args:
        skill: The skill model object.

    Returns:
        String containing skill name and description.
    """
    name = getattr(skill, "name", "") or ""
    description = getattr(skill, "description", None)
    if description:
        return f"{name}\n{description}".strip()
    return name.strip()


def build_candidate_text(
    parsed_summary: dict[str, Any],
    raw_text: str,
) -> str:
    """Construct a comprehensive text representation of a candidate's resume.

    Aggregates structured fields and raw text for embedding and analysis.

    Args:
        parsed_summary: Dictionary of extracted resume fields.
        raw_text: The full raw text of the resume.

    Returns:
        Concatenated candidate information string.
    """
    parts: list[str] = []

    name = parsed_summary.get("name")
    if name:
        parts.append(f"Candidate: {name}")

    email = parsed_summary.get("email")
    if email:
        parts.append(f"Email: {email}")

    phone = parsed_summary.get("phone")
    if phone:
        parts.append(f"Phone: {phone}")

    for key in (
        "location",
        "skills",
        "experience",
        "education",
        "certifications",
        "links",
    ):
        values = parsed_summary.get(key, [])
        if isinstance(values, list) and values:
            formatted = []
            for value in values:
                if isinstance(value, dict):
                    text = str(value.get("text", "")).strip()
                    if text:
                        formatted.append(text)
                else:
                    text = str(value).strip()
                    if text:
                        formatted.append(text)
            if formatted:
                parts.append(f"{key.title()}: " + "; ".join(formatted))

    # We intentionally exclude raw_text here to make the embedding dense
    # and to fit perfectly within the SentenceTransformer 512 token limit.

    return "\n\n".join(parts).strip()
def split_into_chunks(text: str, max_words: int = 150) -> list[str]:
    """Split a long text into smaller chunks for granular embedding.

    Chunks are split roughly by paragraph/newlines first, then by word count.

    Args:
        text: The text to split.
        max_words: Approximately the maximum number of words per chunk.

    Returns:
        List of text chunks.
    """
    if not text:
        return []

    # Split by double newlines first (sections/paragraphs)
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    
    chunks = []
    current_chunk = []
    current_word_count = 0
    
    for p in paragraphs:
        words = p.split()
        if not words:
            continue
            
        # If a single paragraph is too long, we might need to split it further, 
        # but for JD/Resumes, paragraphs are usually reasonable.
        p_word_count = len(words)
        
        if current_word_count + p_word_count > max_words and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = []
            current_word_count = 0
            
        current_chunk.append(p)
        current_word_count += p_word_count
        
    if current_chunk:
        chunks.append(" ".join(current_chunk))
        
    return chunks


def extract_heuristic_info(text: str) -> dict[str, Any]:
    """Extract Email, Phone, and Social links from raw text using regex as a fallback.
    
    Args:
        text: Raw text to scan.
        
    Returns:
        Dictionary with 'email', 'phone', and 'links'.
    """
    import re
    
    # Patterns
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    # Basic phone pattern (supports + country code, parentheses, dashes, spaces)
    phone_pattern = r'(?:\+\d{1,3}[\s-]?)?\(?\d{3,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}'
    social_patterns = [
        r'(?:https?://)?(?:www\.)?linkedin\.com/(?:in|company)/[\w\d\-._~:/?#[\]@!$&\'()*+,;=]+',
        r'(?:https?://)?(?:www\.)?github\.com/[\w\d\-._~:/?#[\]@!$&\'()*+,;=]+'
    ]
    
    emails = re.findall(email_pattern, text)
    phones = re.findall(phone_pattern, text)
    
    links = []
    for pattern in social_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            link = match.strip().rstrip('.,;)]')
            if link not in links:
                links.append(link)
                
    return {
        "email": emails[0] if emails else None,
        "phone": phones[0] if phones else None,
        "links": links
    }
