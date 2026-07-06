'use strict';

const { prisma } = require('../lib/prisma');
const aiService = require('./aiService');
const { logger } = require('../utils/logger');
const { logAuditEvent } = require('../middleware/auditLogger');

/**
 * AI Candidate Evaluation Pipeline Processor.
 *
 * Orchestrates Phase 4, 5, and 6:
 * 1. Parse structured form (Phase 4)
 * 2. Check rules and verify citations (Phase 5)
 * 3. Compute deterministic verdict (Phase 6)
 */

async function processApplication(applicationId) {
  logger.info({ applicationId }, 'Starting AI candidate evaluation pipeline');

  try {
    // 1. Fetch Application and Job details
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        documents: true,
      },
    });

    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    if (application.status === 'EVALUATED') {
      logger.info({ applicationId }, 'Application already evaluated, skipping');
      return;
    }

    // Update status to PROCESSING
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'PARSING' },
    });

    // 2. Find the application form PDF document
    // In a real scenario, this relies on document mapping. We assume one of the documents is the form.
    const formDocument = application.documents.find(
      (doc) => doc.documentType === 'APPLICATION_FORM' || doc.mimeType === 'application/pdf'
    );

    let parsedFormData = null;
    let attachmentManifest = null;
    let templateVersion = null;

    if (formDocument) {
      // Phase 4: Structured Form Parsing
      const parseResult = await aiService.parseFormPdf(
        formDocument.storageKey,
        application.referenceNumber
      );
      parsedFormData = parseResult.parsed_form_data;
      attachmentManifest = parseResult.attachment_manifest;
      templateVersion = parseResult.template_version;

      await prisma.application.update({
        where: { id: applicationId },
        data: {
          parsedFormData,
          attachmentManifest,
          status: 'PARSED',
        },
      });
    } else {
      logger.warn({ applicationId }, 'No application form PDF found for candidate');
    }

    // Phase 5: Rule Checking
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'EVALUATING' },
    });

    // We need the checklist rules for the job.
    // Ensure the checklist is locked before evaluation.
    if (!application.job.checklistLocked) {
      throw new Error(`Cannot evaluate application ${applicationId}: Job checklist is not locked`);
    }

    // In a real implementation, we would fetch the rules from the DB.
    // Assuming the AI service extracted rules and we stored them as JSON in job.checklistRules
    const rules = application.job.checklistRules || [];

    const checkResult = await aiService.checkRules({
      parsedFormData: parsedFormData || {},
      checklistRules: rules,
      attachmentManifest: attachmentManifest || { attachments: [] },
      applicationId,
    });

    // Phase 6: Deterministic Verdict
    const verdictResult = await aiService.computeVerdict(checkResult.rule_results);

    // Save results
    await prisma.aiMatchResult.create({
      data: {
        applicationId,
        jobId: application.jobId,
        verdict: verdictResult.verdict,
        ruleResults: verdictResult.rule_results,
        confidenceScore: 1.0, // Verdict is deterministic
        summary: verdictResult.summary,
      },
    });

    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'EVALUATED' },
    });

    logAuditEvent('APPLICATION_EVALUATED', {
      applicationId,
      jobId: application.jobId,
      verdict: verdictResult.verdict,
    });

    logger.info(
      { applicationId, verdict: verdictResult.verdict },
      'AI Candidate Evaluation completed successfully'
    );
  } catch (error) {
    logger.error({ applicationId, error: error.message }, 'Pipeline processing failed');
    
    // Mark as failed
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'FAILED_EVALUATION' },
    });
    
    throw error;
  }
}

module.exports = {
  processApplication,
};
