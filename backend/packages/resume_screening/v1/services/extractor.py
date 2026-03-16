"""
Resume extraction services.

This module provides services for parsing document files (PDF, DOCX pending) and
extracting structured information from resume text using LLMs.
"""

import os

import docx2txt
import pymupdf
from langextract import extract
from langextract.core.data import AnnotatedDocument
from langextract.providers.ollama import OllamaLanguageModel
from tenacity import retry, stop_after_attempt, wait_fixed

from app.core.config import settings
from packages.resume_screening.v1.services.prompts import (
    RESUME_EXTRACTION_EXAMPLES,
    RESUME_EXTRACTION_PROMPT,
)


class DocumentParser:
    """Handles text extraction from various document formats.

    Supports PDF and DOCX (pending) text extraction.
    """

    @staticmethod
    def extract_text(file_path: str) -> str:
        """Extract text from a given file path based on its extension.

        Args:
            file_path: Absolute or relative path to the document file.

        Returns:
            The extracted text as a single string.

        Raises:
            FileNotFoundError: If the file does not exist.
            ValueError: If the file format is unsupported.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        ext = os.path.splitext(file_path)[1].lower()

        if ext == ".pdf":
            return DocumentParser._extract_from_pdf(file_path)
        elif ext in [".docx", ".doc"]:
            return DocumentParser._extract_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    @staticmethod
    def _extract_from_pdf(file_path: str) -> str:
        """Extract text from a PDF document using PyMuPDF.

        Args:
            file_path: Path to the PDF file.

        Returns:
            Extracted text content.

        Raises:
            RuntimeError: If there is an error during PDF parsing.
        """
        pages_text = []
        try:
            with pymupdf.open(file_path) as doc:
                for page in doc:
                    pages_text.append(page.get_text())
        except Exception as e:
            raise RuntimeError(f"Error parsing PDF: {str(e)}")

        return "".join(pages_text)

    @staticmethod
    def _extract_from_docx(file_path: str) -> str:
        """Extract text from a DOCX document.

        Args:
            file_path: Path to the DOCX file.

        Returns:
            Extracted text content.

        Raises:
            RuntimeError: If there is an error during DOCX parsing.
        """

        try:
            # doc = docx.Document(file_path)
            # doc = docx.Document(file_path)
            # full_text = []
            # for para in doc.paragraphs:
            #     if para.text:
            #         full_text.append(para.text)
            # return "\n".join(full_text)
            return docx2txt.process(file_path)
        except Exception as e:
            raise RuntimeError(f"Error parsing DOCX: {str(e)}")


class ResumeLLMExtractor:
    """Handles structured extraction of resume information using LLMs.

    Uses Google LangExtract with Ollama and few-shot examples to map resume text
    into structured data objects.
    """

    def __init__(self):
        """Initialize the extractor with the configured Ollama model.

        Model settings are retrieved from the application settings.
        """

        self.model = OllamaLanguageModel(
            model_id=settings.OLLAMA_MODEL,
            model_url=settings.OLLAMA_URL,
            api_key=settings.OLLAMA_API_KEY,
            timeout=300,
        )

    @retry(
        stop=stop_after_attempt(settings.LANGEXTRACT_RETRY_ATTEMPTS),
        wait=wait_fixed(settings.LANGEXTRACT_RETRY_DELAY),
        reraise=True,
    )
    def extract_resume_info(
        self, text: str
    ) -> AnnotatedDocument | list[AnnotatedDocument]:
        """Extract structured information from resume text using LangExtract.

        Uses LLM with few-shot examples to identify and extract sections like
        skills, experience, and education from the provided text.

        Args:
            text: Raw text content from a resume.

        Returns:
            An AnnotatedDocument or list of AnnotatedDocuments containing
            extracted information.

        Raises:
            ValueError: If the input text is empty or missing.
            Exception: Propagates any exception from the LLM or extraction process.
        """
        if not text or not text.strip():
            # Return empty structure if text is missing
            raise ValueError("No text provided for extraction.")

        try:
            # langextract.extract automatically uses the schema from the Pydantic model
            # and returns an instance of that model populated with extracted data.
            raw_extractions = extract(
                text_or_documents=text,
                model=self.model,
                prompt_description=RESUME_EXTRACTION_PROMPT,
                examples=RESUME_EXTRACTION_EXAMPLES,
                # debug=settings.DEBUG,
                debug=False,
                # timeout=300,
            )
            print(raw_extractions)

            # Map LangExtract Output to ResumeData
            # Langextract returns a collection of Extraction objects, e.g.,
            # [Extraction(class='skill', text='Python', ...), ...]
            return raw_extractions

        except Exception as e:
            print(f"Error during LLM extraction: {e}")
            raise e
