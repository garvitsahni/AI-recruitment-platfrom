import base64
import structlog
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional
from app.models.verdict import RuleResult
from app.models.checklist import ChecklistRule
from app.models.form_data import ParsedFormData, AttachmentManifest
from app.rule_checker import check_rules_against_candidate
from app.form_parser import _extract_text_from_pdf

logger = structlog.get_logger(__name__)
router = APIRouter()

class EvidenceDocument(BaseModel):
    """Document evidence available for citation verification."""
    document_type: str = Field(description="Document type from backend classification")
    file_name: str = Field(description="Original uploaded file name")
    document_id: str = Field(description="Backend document ID")
    mime_type: Optional[str] = Field(default=None, description="Document MIME type")
    text: Optional[str] = Field(default=None, description="Extracted document text, if already available")
    pdf_base64: Optional[str] = Field(default=None, description="Base64-encoded PDF bytes")

class RuleCheckRequest(BaseModel):
    """Request to check rules against candidate data."""
    parsed_form_data: ParsedFormData = Field(description="Parsed application form data")
    checklist_rules: List[ChecklistRule] = Field(description="Locked checklist rules")
    attachment_manifest: AttachmentManifest = Field(description="Parsed attachment manifest")
    application_id: str = Field(description="Application ID for correlation")
    evidence_documents: List[EvidenceDocument] = Field(default_factory=list, description="Uploaded documents to verify against")

class RuleCheckResponse(BaseModel):
    """Response containing rule check results."""
    rule_results: List[RuleResult] = Field(description="Results of rule checks")

def _normalize(value: Optional[str]) -> str:
    return "".join(ch for ch in (value or "").lower() if ch.isalnum())

def _document_matches(expected_type: Optional[str], document: EvidenceDocument) -> bool:
    expected = _normalize(expected_type)
    doc_type = _normalize(document.document_type)
    file_name = _normalize(document.file_name)

    if not expected:
        return True
    if expected in doc_type or doc_type in expected:
        return True
    aliases = {
        "academicdocument": ["degree", "marksheet", "certificate", "academic"],
        "experiencecertificate": ["experience", "employment", "relieving", "service"],
        "identityproof": ["aadhaar", "aadhar", "passport", "pan", "identity"],
        "applicationform": ["application", "form"],
    }
    return any(token in file_name or token in doc_type for token in aliases.get(expected, []))

async def _document_text(document: EvidenceDocument) -> str:
    if document.text:
        return document.text
    is_pdf = (document.mime_type or "").lower() == "application/pdf" or document.file_name.lower().endswith(".pdf")
    if document.pdf_base64 and is_pdf:
        return _extract_text_from_pdf(base64.b64decode(document.pdf_base64))
    return ""

@router.post("/check-rules", response_model=RuleCheckResponse)
async def check_rules_route(request: RuleCheckRequest):
    """
    Run rule checking against a candidate's declared values and evidence.
    """
    async def fetch_document_text(doc_type: str):
        for document in request.evidence_documents:
            if _document_matches(doc_type, document):
                text = await _document_text(document)
                if text:
                    return text, document.document_id
        return "", None

    results = await check_rules_against_candidate(
        request.parsed_form_data,
        request.checklist_rules,
        request.attachment_manifest,
        request.application_id,
        fetch_document_text_fn=fetch_document_text,
    )

    return RuleCheckResponse(rule_results=results)
