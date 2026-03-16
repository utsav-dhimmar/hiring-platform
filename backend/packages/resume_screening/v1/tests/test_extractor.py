"""
Unit tests for the resume extraction service.

This module contains tests for DocumentParser and ResumeLLMExtractor,
using mocked PyMuPDF and LLM responses.
"""

from unittest.mock import MagicMock, patch

import pytest

from packages.resume_screening.v1.schemas.schemas import ResumeData
from packages.resume_screening.v1.services.extractor import (
    DocumentParser,
    ResumeLLMExtractor,
)

# MOCK DATA
MOCK_RESUME_TEXT_COMPLETE = """
John Doe
Software Engineer
Skills: Python, React, SQL
Experience:
- Software Developer at ABC Corp (2020-2023)
- Junior Developer at XYZ Inc (2018-2020)
Education:
B.S. in Computer Science, State University, 2018
Certifications:
AWS Certified Developer
"""

MOCK_RESUME_TEXT_MISSING = """
Jane Smith
Data Analyst
Experience:
- Data Analyst at DataCo (2021-Present)
Education:
M.S. in Data Science, Tech University, 2021
"""


@pytest.fixture
def mock_extractor():
    """Fixture to provide a ResumeLLMExtractor with a mocked LLM.

    Yields:
        An instance of ResumeLLMExtractor with the internal OllamaLanguageModel
        mocked.
    """

    with patch(
        "packages.resume_screening.v1.services.extractor.OllamaLanguageModel"
    ) as mock_model:
        yield ResumeLLMExtractor()


def test_extract_pdf_FileNotFound():
    """Test that extract_text raises FileNotFoundError for non-existent files."""
    with pytest.raises(FileNotFoundError):
        DocumentParser.extract_text("nonexistent.pdf")


def test_extract_docx_NotImplemented():
    """Test that extract_text raises NotImplementedError for DOCX files."""
    with pytest.raises(NotImplementedError):
        # Even if file doesn't exist, our parser checks existence first.
        # So we mock os.path.exists
        with patch("os.path.exists", return_value=True):
            DocumentParser.extract_text("dummy.docx")


@patch("packages.resume_screening.v1.services.extractor.pymupdf.open")
def test_extract_from_pdf(mock_fitz_open):
    """Test text extraction from a PDF file using mocked PyMuPDF."""
    # Mock PyMuPDF behavior
    mock_doc = MagicMock()
    mock_page = MagicMock()
    mock_page.get_text.return_value = "Mocked PDF text content"

    # Doc is an iterator of pages
    mock_doc.__iter__.return_value = [mock_page]

    # Setup context manager
    mock_fitz_open.return_value.__enter__.return_value = mock_doc

    # Mock os.path.exists so it doesn't fail early
    with patch("os.path.exists", return_value=True):
        text = DocumentParser.extract_text("mocked.pdf")
        assert text == "Mocked PDF text content"


@patch("packages.resume_screening.v1.services.extractor.extract")
def test_llm_extraction_complete(mock_extract, mock_extractor):
    """Test successful structured extraction from a complete resume text."""
    # Setup mock return from langextract
    expected_data = ResumeData(
        skills=["Python", "React", "SQL"],
        experience=[
            "Software Developer at ABC Corp",
            "Junior Developer at XYZ Inc",
        ],
        education=["B.S. in Computer Science"],
        certifications=["AWS Certified Developer"],
    )
    mock_extract.return_value = expected_data

    result = mock_extractor.extract_resume_info(MOCK_RESUME_TEXT_COMPLETE)

    assert result.skills == expected_data.skills
    assert result.experience == expected_data.experience
    assert result.education == expected_data.education
    assert result.certifications == expected_data.certifications


@patch("packages.resume_screening.v1.services.extractor.extract")
def test_llm_extraction_missing_sections(mock_extract, mock_extractor):
    """Test extraction from a resume with missing sections."""
    # Setup mock return from langextract where skills and certs were missing
    expected_data = ResumeData(
        skills=[],
        experience=["Data Analyst at DataCo (2021-Present)"],
        education=["M.S. in Data Science, Tech University, 2021"],
        certifications=[],
    )
    mock_extract.return_value = expected_data

    result = mock_extractor.extract_resume_info(MOCK_RESUME_TEXT_MISSING)

    assert result.skills == []
    assert len(result.experience) == 1
    assert len(result.education) == 1
    assert result.certifications == []


def test_llm_extraction_empty_text(mock_extractor):
    """Test that extract_resume_info raises ValueError for empty input text."""
    # Should raise ValueError immediately without calling LLM
    with pytest.raises(ValueError, match="No text provided for extraction."):
        mock_extractor.extract_resume_info("")
