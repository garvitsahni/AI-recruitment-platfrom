'use strict';

const { prisma } = require('../lib/prisma');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { logger } = require('../utils/logger');
const { logAuditEvent } = require('../middleware/auditLogger');
const { parseExcelBuffer } = require('../services/excelImport');
const storage = require('../services/storage');

/**
 * Application Controller — handles application listing, import, and individual access.
 *
 * Per SKILL.md §4: Recruiter uploads an Excel workbook → system creates Application rows.
 * Per SKILL.md §5: Reference number validated before any record is created.
 */

/**
 * List applications for a job with pagination and filtering.
 */
async function listApplications(req, res, next) {
  try {
    const { jobId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const verdict = req.query.verdict;

    // Verify job exists
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundError('Job', jobId);
    }

    const where = { jobId };
    if (status) {
      where.status = status;
    }

    // Build include clause
    const include = {
      matchResults: verdict
        ? {
            where: { verdict },
            orderBy: { createdAt: 'desc' },
            take: 1,
          }
        : {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
    };

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include,
      }),
      prisma.application.count({ where }),
    ]);

    // If filtering by verdict, only return applications that have a match result with that verdict
    let filteredApps = applications;
    if (verdict) {
      filteredApps = applications.filter((app) => app.matchResults.length > 0);
    }

    res.json({
      applications: filteredApps,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single application by ID.
 */
async function getApplication(req, res, next) {
  try {
    const { applicationId } = req.params;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: { id: true, title: true, postingCode: true },
        },
        matchResults: {
          orderBy: { createdAt: 'desc' },
        },
        documents: true,
      },
    });

    if (!application) {
      throw new NotFoundError('Application', applicationId);
    }

    res.json({ application });
  } catch (error) {
    next(error);
  }
}

/**
 * Import applications from an Excel file.
 *
 * Per SKILL.md §4: "Recruiter uploads an Excel workbook that lists all candidates
 * for a posting."
 *
 * Flow:
 * 1. Parse Excel buffer
 * 2. Validate reference numbers
 * 3. Create ImportBatch + Application rows (skipping duplicates)
 * 4. Return summary
 */
async function importFromExcel(req, res, next) {
  try {
    const { jobId } = req.params;

    if (!req.file) {
      throw new ValidationError('Excel file is required');
    }

    // Verify job exists
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundError('Job', jobId);
    }

    const buffer = req.file.buffer;
    const fileName = req.file.originalname;

    // Parse Excel
    const { rows, failedRows, warnings, totalRows } = await parseExcelBuffer(
      buffer,
      job.postingCode
    );

    if (totalRows === 0) {
      throw new ValidationError('Excel file contains no data rows');
    }

    // Upload the Excel file to storage for audit
    const excelKey = storage.generateKey('application', job.postingCode, `imports/${fileName}`);
    await storage.upload(excelKey, buffer, req.file.mimetype);

    // Create import batch
    const importBatch = await prisma.importBatch.create({
      data: {
        jobId,
        fileName,
        totalRows,
        processedRows: 0,
        failedRows: failedRows.length,
        status: 'PROCESSING',
        createdBy: req.user.id,
      },
    });

    // Process valid rows — create Application records (skip duplicates)
    let processedCount = 0;
    const duplicates = [];
    const created = [];

    for (const row of rows) {
      // Check for existing application with same reference number
      const existing = await prisma.application.findUnique({
        where: { referenceNumber: row.referenceNumber },
      });

      if (existing) {
        duplicates.push({
          rowNumber: row.rowNumber,
          referenceNumber: row.referenceNumber,
          errorType: 'DUPLICATE',
          errorMessage: `Application with reference '${row.referenceNumber}' already exists`,
          rawRowData: row.rawRowData,
        });
        continue;
      }

      const application = await prisma.application.create({
        data: {
          jobId,
          referenceNumber: row.referenceNumber,
          referenceValidated: true,
          candidateName: row.candidateName,
          candidateEmail: row.candidateEmail,
          status: 'PENDING',
          importBatchId: importBatch.id,
        },
      });

      created.push(application);
      processedCount++;
    }

    // Record failed imports (validation failures + duplicates)
    const allFailures = [...failedRows, ...duplicates];
    if (allFailures.length > 0) {
      await prisma.failedImport.createMany({
        data: allFailures.map((f) => ({
          importBatchId: importBatch.id,
          rowNumber: f.rowNumber,
          referenceNumber: f.referenceNumber,
          errorType: f.errorType,
          errorMessage: f.errorMessage,
          rawRowData: f.rawRowData || null,
        })),
      });
    }

    // Update batch status
    const batchStatus =
      allFailures.length === 0
        ? 'COMPLETED'
        : processedCount === 0
          ? 'FAILED'
          : 'COMPLETED_WITH_ERRORS';

    await prisma.importBatch.update({
      where: { id: importBatch.id },
      data: {
        processedRows: processedCount,
        failedRows: allFailures.length,
        status: batchStatus,
        completedAt: new Date(),
      },
    });

    logAuditEvent('EXCEL_IMPORT', {
      jobId,
      importBatchId: importBatch.id,
      totalRows,
      processedRows: processedCount,
      failedRows: allFailures.length,
      duplicates: duplicates.length,
      importedBy: req.user.id,
    });

    logger.info(
      {
        jobId,
        importBatchId: importBatch.id,
        totalRows,
        processed: processedCount,
        failed: allFailures.length,
      },
      'Excel import completed'
    );

    res.status(201).json({
      importBatch: {
        id: importBatch.id,
        status: batchStatus,
        totalRows,
        processedRows: processedCount,
        failedRows: allFailures.length,
        duplicates: duplicates.length,
      },
      warnings,
      created: created.map((a) => ({
        id: a.id,
        referenceNumber: a.referenceNumber,
      })),
      failures: allFailures.map((f) => ({
        rowNumber: f.rowNumber,
        referenceNumber: f.referenceNumber,
        errorType: f.errorType,
        errorMessage: f.errorMessage,
      })),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get import batch details.
 */
async function getImportBatch(req, res, next) {
  try {
    const { batchId } = req.params;

    const batch = await prisma.importBatch.findUnique({
      where: { id: batchId },
      include: {
        failedImports: true,
        job: {
          select: { id: true, title: true, postingCode: true },
        },
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!batch) {
      throw new NotFoundError('Import batch', batchId);
    }

    res.json({ batch });
  } catch (error) {
    next(error);
  }
}

/**
 * Override the verdict on an application.
 *
 * Per SKILL.md §2: Only recruiters can submit overrides.
 * Per SKILL.md §6: Override history is append-only.
 */
async function overrideVerdict(req, res, next) {
  try {
    const { applicationId } = req.params;
    const { verdict, reason } = req.body;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        matchResults: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!application) {
      throw new NotFoundError('Application', applicationId);
    }

    const currentResult = application.matchResults[0];
    if (!currentResult) {
      throw new ValidationError('Application has no AI match result to override');
    }

    const previousVerdict = currentResult.verdict;

    // Update match result with override
    const updatedResult = await prisma.aiMatchResult.update({
      where: { id: currentResult.id },
      data: {
        verdict,
        overrideBy: req.user.id,
        overrideReason: reason,
        overrideAt: new Date(),
      },
    });

    // Append to override history (append-only per SKILL.md §6)
    await prisma.overrideHistory.create({
      data: {
        matchResultId: currentResult.id,
        overriddenBy: req.user.id,
        previousVerdict,
        newVerdict: verdict,
        reason,
      },
    });

    logAuditEvent('VERDICT_OVERRIDDEN', {
      applicationId,
      matchResultId: currentResult.id,
      previousVerdict,
      newVerdict: verdict,
      overriddenBy: req.user.id,
    });

    logger.info(
      {
        applicationId,
        previousVerdict,
        newVerdict: verdict,
        overriddenBy: req.user.id,
      },
      'Verdict overridden'
    );

    res.json({
      matchResult: updatedResult,
      previousVerdict,
    });
  } catch (error) {
    next(error);
  }
}

const { processZipImport } = require('../services/zipImport');
const stream = require('stream');

/**
 * Import and extract candidate documents from a ZIP file.
 */
async function importZip(req, res, next) {
  try {
    const { jobId } = req.params;

    if (!req.file) {
      throw new ValidationError('ZIP file is required');
    }

    // Verify job exists
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundError('Job', jobId);
    }

    // Convert multer buffer to readable stream for unzipper
    const zipStream = new stream.Readable();
    zipStream.push(req.file.buffer);
    zipStream.push(null);

    const result = await processZipImport(zipStream, jobId, job.postingCode);

    // Map extracted files to candidate applications based on zip_path matching or reference number inside folder structure
    // (A more advanced mapping logic would be here in Phase 3/4, but for now we just store them and return the manifest)

    logAuditEvent('ZIP_IMPORT', {
      jobId,
      totalExtracted: result.totalExtracted,
      uploadedCount: result.uploadedFiles.length,
      failedCount: result.failedFiles.length,
      importedBy: req.user.id,
    });

    res.status(201).json({
      message: 'ZIP processing complete',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

const { processApplication } = require('../services/pipelineProcessor');

/**
 * Trigger AI evaluation pipeline for an application.
 */
async function evaluateApplication(req, res, next) {
  try {
    const { applicationId } = req.params;

    // Verify application exists
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });

    if (!application) {
      throw new NotFoundError('Application', applicationId);
    }

    if (!application.job.checklistLocked) {
      throw new ValidationError('Cannot evaluate application: Job checklist is not locked');
    }

    // Process asynchronously (in a real app, this goes to a message queue)
    processApplication(applicationId).catch((err) => {
      logger.error({ applicationId, error: err.message }, 'Background pipeline processing failed');
    });

    res.status(202).json({
      message: 'Evaluation pipeline triggered successfully',
      applicationId,
      status: 'PROCESSING',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listApplications,
  getApplication,
  importFromExcel,
  getImportBatch,
  overrideVerdict,
  importZip,
  evaluateApplication,
};
