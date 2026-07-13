import logging
import os
import tempfile
import urllib.request
import urllib.error

from sqlalchemy.orm import Session

from app import models
from app.config import settings
from app.pipeline import stage2_resume_parsing, stage3_rule_matching, stage4_verdict
from app.pipeline.extract_text import pdf_text_with_page_markers

logger = logging.getLogger("pipeline.orchestrator")


def _is_url(path: str) -> bool:
    return path.startswith("http://") or path.startswith("https://")


def _download_cv(url: str, application_id: str) -> str | None:
    """
    Downloads a CV PDF from a URL to local storage and returns the local path.
    Returns None if the download fails.
    """
    try:
        dest_dir = os.path.join(settings.RESUME_DIR, "downloads")
        os.makedirs(dest_dir, exist_ok=True)

        # Use the last segment of the URL as filename, fall back to app ID
        url_basename = url.rstrip("/").split("/")[-1]
        if not url_basename.lower().endswith(".pdf"):
            url_basename = f"{application_id}.pdf"
        local_path = os.path.join(dest_dir, f"{application_id}_{url_basename}")

        if os.path.exists(local_path) and os.path.getsize(local_path) > 100:
            return local_path  # already downloaded

        logger.info("Downloading CV from %s for application %s", url, application_id)
        req = urllib.request.Request(url, headers={"User-Agent": "IHMCL-Recruit/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()

        if len(data) < 100:
            logger.warning("Downloaded CV is too small (%d bytes), likely not a real PDF", len(data))
            return None

        with open(local_path, "wb") as f:
            f.write(data)

        return local_path
    except Exception as exc:
        logger.warning("Could not download CV from %s: %s", url, exc)
        return None


def evaluate_application(db: Session, application: models.Application) -> models.MatchResult:
    """
    Runs the full Stage 2 -> Stage 3 -> Stage 4 pipeline for one candidate
    application and persists a new MatchResult row.
    """
    job = application.job

    # Load document text (cached on the row after first parse to avoid re-reading the PDF every time)
    document_text = application.resume_text or ""
    if not document_text and application.resume_path:
        resume_path = application.resume_path

        # If resume_path is a URL (IHMCL portal CV link), download it first
        if _is_url(resume_path):
            local_path = _download_cv(resume_path, application.id)
            if local_path:
                resume_path = local_path
                # Update the application to use the local path for future runs
                application.resume_path = local_path
            else:
                resume_path = None

        if resume_path:
            try:
                document_text = pdf_text_with_page_markers(resume_path)
                application.resume_text = document_text
            except Exception as exc:
                logger.warning("Could not extract text for application %s: %s", application.id, exc)
                document_text = ""

    try:
        # Stage 2: structured candidate data extraction (skip if already parsed)
        parsed = application.parsed_form_data
        if not parsed:
            parsed = stage2_resume_parsing.run(
                application.reference_number, application.candidate_name, document_text
            )
            application.parsed_form_data = parsed

        rules = job.requirements or []

        # Stage 3: rule-by-rule verification with citations
        rule_results = stage3_rule_matching.run(rules, parsed, document_text)

        # Stage 4: deterministic verdict aggregation
        verdict_info = stage4_verdict.run(rules, rule_results)

        match = models.MatchResult(
            application_id=application.id,
            verdict=verdict_info["verdict"],
            confidence=verdict_info["confidence"],
            rule_results=rule_results,
            stage="stage4_verdict",
        )
        db.add(match)
        application.status = "EVALUATED"
        db.commit()
        db.refresh(application)
        return match

    except Exception as exc:
        logger.exception("Evaluation failed for application %s", application.id)
        application.status = "FAILED_EVALUATION"
        db.commit()
        raise
