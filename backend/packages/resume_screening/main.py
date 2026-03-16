"""
Main entry point for testing the resume screening package.

This module provides a command-line interface for testing the resume extraction
capabilities using sample PDF files.
"""

import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(backend_path))

# Add the backend directory to the Python path to allow running directly # TEMP
from packages.resume_screening.v1.services.extractor import (
    DocumentParser,
    ResumeLLMExtractor,
)


def main():
    """Execute a test run of the resume extraction service.

    This function iterates through a list of sample PDF files, extracts text using
    the DocumentParser, and then uses ResumeLLMExtractor to get structured
    information which is then printed to the console.
    """
    print("=== Resume Screening Module Test ===")

    extractor = ResumeLLMExtractor()
    #  For running locally you have to change the path of the pdf files    
    test_pdf_path = [r"D:\codes\projects\resume-test\r_r_3.pdf",r"D:\codes\projects\resume-test\r_k_2.pdf",r"D:\codes\projects\resume-test\r_my_1.pdf"]
    try:
        for pdf_path in test_pdf_path:
            print("\n" + "=" * 50)
            print(f"Processing: {pdf_path}")
            pdf_text = DocumentParser.extract_text(pdf_path)
            print(f"PDF Text Extracted ({len(pdf_text)} chars).")
            print("Passing to LLM...")
            pdf_extracted_data = extractor.extract_resume_info(pdf_text)
            print("Result:", pdf_extracted_data)
            for ext in pdf_extracted_data.extractions:
                if ext.extraction_class == "skill":
                    print("skills" * 5)
                    print(ext.extraction_text)
                
                if ext.extraction_class == "experience":
                    print("experience" * 5)
                    print(ext.extraction_text)
                
                if ext.extraction_class == "education":
                    print("education" * 5)
                    print(ext.extraction_text)
                
                if ext.extraction_class == "certification":
                    print("certification" * 5)
                    print(ext.extraction_text)


    except Exception as e:
        print(f"PDF Extraction failed: {e}")


if __name__ == "__main__":
    main()
