"""
Core transcript processing logic.

Extracts, cleans, and parses .docx interview transcripts.
Shrey's original logic refactored into a class following the
ResumeProcessor pattern in services/resume_upload/processor.py.
"""

from __future__ import annotations

import os
import re
import tempfile

import docx2txt

from app.v1.core.logging import get_logger

logger = get_logger(__name__)

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

ALLOWED_CONTENT_TYPES = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/docx",
    "application/msword",
}

# Only non-semantic filler sounds — real words like "right", "fine",
# "sure", "okay" are intentionally excluded to preserve transcript meaning.
FILLER_SOUNDS: list[str] = [
    "you know", "i mean", "kind of", "sort of",
    "uh", "um", "umm", "uhh",
    "hmm", "hm", "mhm", "mm",
    "aha", "ahh", "ohh", "ooh",
]


class TranscriptProcessor:
    """Processes .docx interview transcripts into structured dialogue data."""

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def process(self, file_bytes: bytes) -> dict:
        """
        Full processing pipeline for a .docx transcript.

        Writes to a temp file, extracts text, cleans it, and parses
        dialogue turns and metadata.

        Args:
            file_bytes: Raw bytes of the uploaded .docx file.

        Returns:
            Dict with keys: metadata, dialogues, dialogue_count, clean_text.
        """
        tmp_path: str | None = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name

            raw = self._extract_raw(tmp_path)
            cleaned = self._remove_markdown_artifacts(raw)
            cleaned = self._clean_whitespace(cleaned)
            cleaned = self._remove_filler_sounds(cleaned)
            cleaned = self._clean_whitespace(cleaned)

            metadata = self._extract_metadata(cleaned)
            dialogues = self._extract_dialogue(cleaned)

            return {
                "metadata": metadata,
                "dialogues": dialogues,
                "dialogue_count": len(dialogues),
                "clean_text": cleaned,
            }

        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)

    # ------------------------------------------------------------------
    # Extraction
    # ------------------------------------------------------------------

    def _extract_raw(self, file_path: str) -> str:
        text = docx2txt.process(file_path)
        return text

    # ------------------------------------------------------------------
    # Cleaning
    # ------------------------------------------------------------------

    def _remove_markdown_artifacts(self, text: str) -> str:
        text = re.sub(r"!\[.*?\]\(data:image/[^)]*\)", "", text)
        text = re.sub(r"!\[.*?\]\(.*?\)", "", text)
        text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
        text = re.sub(r"\*(.+?)\*", r"\1", text)
        text = text.replace("\\_", "_").replace("\\-", "-").replace("\\*", "*")
        text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)
        return text

    def _clean_whitespace(self, text: str) -> str:
        text = re.sub(r"^[,.\s]+", "", text, flags=re.MULTILINE)
        text = re.sub(r"^\s*[.,\s]+\s*$", "", text, flags=re.MULTILINE)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\.{2,}", ".", text)
        text = re.sub(r"\?{2,}", "?", text)
        text = re.sub(r"!{2,}", "!", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = "\n".join(line.strip() for line in text.split("\n"))
        return text.strip()

    def _remove_filler_sounds(self, text: str) -> str:
        multi_word = [f for f in FILLER_SOUNDS if " " in f]
        single_word = [f for f in FILLER_SOUNDS if " " not in f]

        for phrase in multi_word:
            text = re.sub(rf"\b{re.escape(phrase)}\b", "", text, flags=re.IGNORECASE)

        for word in sorted(single_word, key=len, reverse=True):
            text = re.sub(rf"\b{re.escape(word)}\b", "", text, flags=re.IGNORECASE)

        return text

    # ------------------------------------------------------------------
    # Metadata
    # ------------------------------------------------------------------

    def _extract_metadata(self, text: str) -> dict:
        meta = {
            "candidate_name": "",
            "interviewer_name": "",
            "interview_date": "",
            "duration": "",
            "position": "",
        }

        date_match = re.search(
            r"(January|February|March|April|May|June|July|August|"
            r"September|October|November|December)\s+\d{1,2},?\s+\d{4}",
            text, re.IGNORECASE,
        )
        if date_match:
            meta["interview_date"] = date_match.group().strip()

        dur_match = re.search(r"\d+h?\s*\d+m\s*\d*s?", text)
        if dur_match:
            meta["duration"] = dur_match.group().strip()

        pos_match = re.search(
            r"(AIML|AI|ML|Python|Data Science|Software)\s+(Engineer|Developer|Analyst)",
            text, re.IGNORECASE,
        )
        if pos_match:
            meta["position"] = pos_match.group().strip()

        # Search first 5 non-empty lines for participant names
        non_empty_lines = [l.strip() for l in text.split("\n") if l.strip()]
        header_text = " ".join(non_empty_lines[:5])
        names = re.findall(r"[A-Z][a-z]+\s+[A-Z][a-z]+", header_text)

        if len(names) >= 1:
            meta["interviewer_name"] = names[0]
        if len(names) >= 2:
            meta["candidate_name"] = names[1]

        return meta

    # ------------------------------------------------------------------
    # Dialogue Parser
    # ------------------------------------------------------------------

    def _extract_dialogue(self, text: str) -> list[dict]:
        """
        Parse transcript into dialogue turns.

        Expected format:
            Heer Patel 0:03
            Sir, I recently worked at...

            August Infotech 0:19
            Just a second.
        """
        dialogues: list[dict] = []
        speaker_pattern = re.compile(
            r"^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)\s+(\d{1,2}:\d{2})\s*$"
        )

        current_speaker: str | None = None
        current_ts: str | None = None
        current_lines: list[str] = []

        def flush() -> None:
            if current_speaker and current_lines:
                txt = " ".join(current_lines).strip()
                if txt:
                    dialogues.append({
                        "speaker": current_speaker,
                        "timestamp": current_ts,
                        "text": txt,
                    })

        for line in text.split("\n"):
            line = line.strip()
            if not line:
                continue

            match = speaker_pattern.match(line)
            if match:
                flush()
                current_speaker = match.group(1).strip()
                current_ts = match.group(2).strip()
                current_lines = []
            elif current_speaker and not re.match(r"^[.,\s]+$", line):
                current_lines.append(line)

        flush()
        return dialogues