# Hiring Platform

## Introduction

The Hiring Platform is designed to build an AI-powered interview evaluation system where HR can automatically screen resumes, conduct structured multi-round interviews, generate transcripts from interview recordings, receive standardized evaluation scores, and make data-driven hiring decisions. The system aims to automate and standardize candidate evaluation while maintaining a centralized candidate database.

### Problem Statement

* Manual resume screening is time-consuming.
* Interview analysis depends heavily on human judgment.
* No standardized scoring system exists for candidate-job fit.
* It is difficult to compare multiple candidates objectively.
* HR spends excessive time shortlisting candidates.

### Goals

* Eliminate resume screening bias.
* Save 60–70% of HR effort.
* Implement a structured up to 4-stage evaluation process (Resume Pre-Filter, HR Screening, Technical Practical, and Panel/CTO Evaluation).
* Enable round-wise decision gating.
* Provide robust Behavioral and Technical AI scoring.
* Serve as a centralized candidate intelligence database.
* Facilitate data-driven final hiring decisions.

### Proposed Solution

A comprehensive web-based application built to streamline the hiring process with AI-driven insights. It leverages the following technologies:

**Backend**
* Python 3.11+
* FastAPI (Web Framework)
* DSPy (Prompt Optimization & Evaluation)
* PostgreSQL (Relational Database)
* SQLAlchemy ORM

**AI Components**
* AI Resume Parser
* Audio/Video Transcription Engine
* Embedding Model for semantic similarity
* RRF (Reciprocal Rank Fusion) Scoring Engine
* Attribute Evaluation Models (LLM-as-a-Judge)

**Frontend**
* React.js
