import { Candidate, JobRequirement, RuleComplianceResults, ComplianceCheck } from '../types';

/**
 * Parses date string in common Indian / Standard formats (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD)
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const cleanStr = dateStr.trim();
  
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    return new Date(cleanStr);
  }
  
  // Try DD/MM/YYYY or DD-MM-YYYY
  const parts = cleanStr.split(/[/-]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed month
    const year = parseInt(parts[2], 10);
    
    // Check if parts are valid
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      if (year > 1000) {
        return new Date(year, month, day);
      } else if (day > 1000) {
        // In case it was parsed YYYY-MM-DD but split differently
        return new Date(day, month, year);
      }
    }
  }
  
  const parsed = new Date(cleanStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Calculates candidate age relative to reference date (01-01-2026 as per official JD)
 */
export function calculateAge(dobStr: string, refDateStr: string = '2026-01-01'): number {
  const dob = parseDate(dobStr);
  const ref = parseDate(refDateStr) || new Date('2026-01-01');
  
  if (!dob) return 0;
  
  let age = ref.getFullYear() - dob.getFullYear();
  const m = ref.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Evaluates a single candidate against a specific Job Requirement dynamically
 */
export function evaluateCandidate(candidate: Candidate, job: JobRequirement): Candidate {
  const refDate = '2026-01-01';
  
  // 1. Calculate Age Compliance
  const ageVal = calculateAge(candidate.extractedData.dob.value, refDate);
  const ageStatus = (ageVal >= job.minAge && ageVal <= job.maxAge) ? 'PASS' : 'FAIL';
  const ageCheck: ComplianceCheck = {
    status: ageStatus,
    required: `${job.minAge} - ${job.maxAge} Years (Born 1991 - 2005)`,
    actual: `${ageVal} Years (DOB: ${candidate.extractedData.dob.value})`,
    message: ageStatus === 'PASS' 
      ? `Candidate is ${ageVal} years old, which is within the ${job.minAge}-${job.maxAge} range.` 
      : `Candidate is ${ageVal} years old, which does not fall within the required ${job.minAge}-${job.maxAge} range.`
  };

  // 2. Educational Qualification Compliance
  const candDegree = candidate.extractedData.qualification.value.toUpperCase();
  const reqDegree = job.qualification.toUpperCase();
  // Check if requirement string is part of candidate degree, or vice versa
  const qualStatus = (candDegree.includes(reqDegree) || reqDegree.includes(candDegree)) ? 'PASS' : 'FAIL';
  const qualificationCheck: ComplianceCheck = {
    status: qualStatus,
    required: `${job.qualification} or equivalent`,
    actual: `${candidate.extractedData.qualification.value} (${candidate.extractedData.branch.value})`,
    message: qualStatus === 'PASS'
      ? `Qualification matches the required threshold (${job.qualification}).`
      : `Candidate possesses an ${candidate.extractedData.qualification.value} which does not satisfy the ${job.qualification} requirement.`
  };

  // 3. Experience Compliance
  const expVal = candidate.extractedData.experienceYears.value;
  const expStatus = expVal >= job.minExperienceYears ? 'PASS' : 'FAIL';
  const experienceCheck: ComplianceCheck = {
    status: expStatus,
    required: `Minimum ${job.minExperienceYears} Years`,
    actual: `${expVal} Years`,
    message: expStatus === 'PASS'
      ? `Candidate experience of ${expVal} years satisfies the minimum requirement of ${job.minExperienceYears} years.`
      : `Candidate experience of ${expVal} years is below the minimum requirement of ${job.minExperienceYears} years.`
  };

  // 4. Marks / Percentage Compliance
  const marksVal = candidate.extractedData.percentage.value;
  const marksStatus = marksVal >= job.minPercentage ? 'PASS' : 'FAIL';
  const marksCheck: ComplianceCheck = {
    status: marksStatus,
    required: `Minimum ${job.minPercentage}%`,
    actual: `${marksVal}%`,
    message: marksStatus === 'PASS'
      ? `Candidate aggregate of ${marksVal}% is above the ${job.minPercentage}% required cutoff.`
      : `Candidate aggregate of ${marksVal}% is below the required ${job.minPercentage}% cutoff.`
  };

  // 5. Mandatory Documents Compliance
  // Check which mandatory documents are present in candidate documents
  const missingDocs: string[] = [];
  job.mandatoryDocuments.forEach(reqDocName => {
    // Check if there is a document matching this category
    let found = false;
    if (reqDocName.toLowerCase().includes('aadhaar')) {
      found = candidate.documents.some(d => d.fileName.toLowerCase().includes('aadhaar') && d.exists);
    } else if (reqDocName.toLowerCase().includes('degree') || reqDocName.toLowerCase().includes('transcript')) {
      found = candidate.documents.some(d => d.fileName.toLowerCase().includes('degree') && d.exists);
    } else if (reqDocName.toLowerCase().includes('experience') || reqDocName.toLowerCase().includes('work')) {
      found = candidate.documents.some(d => d.fileName.toLowerCase().includes('experience') && d.exists);
    }
    
    if (!found) {
      missingDocs.push(reqDocName === 'Aadhaar' ? 'Aadhaar Card' : reqDocName === 'Degree' ? 'Degree Certificate' : 'Experience Certificate');
    }
  });

  const docsStatus = missingDocs.length === 0 ? 'PASS' : 'FAIL';
  const documentsCheck: ComplianceCheck = {
    status: docsStatus,
    required: job.mandatoryDocuments.join(', '),
    actual: missingDocs.length === 0 ? 'All submitted' : `Missing: ${missingDocs.join(', ')}`,
    message: docsStatus === 'PASS'
      ? 'All mandatory documentation has been submitted and verified.'
      : `Mandatory documents are missing: ${missingDocs.join(', ')}.`
  };

  // Compile Rule Compliance Results
  const ruleCompliance: RuleComplianceResults = {
    overallStatus: (ageStatus === 'PASS' && qualStatus === 'PASS' && expStatus === 'PASS' && marksStatus === 'PASS' && docsStatus === 'PASS') ? 'PASS' : 'FAIL',
    checks: {
      age: ageCheck,
      qualification: qualificationCheck,
      experience: experienceCheck,
      marks: marksCheck,
      documents: documentsCheck
    }
  };

  // 6. Cross Document Inconsistencies Check (Dynamic based on data details)
  const crossDocumentVerification = [...candidate.crossDocumentVerification];
  // (In dynamic mode we rely on the pre-filled inconsistencies, but we can verify severity)
  
  // 7. Calculate Status and Match Score
  let status = candidate.status;
  if (ruleCompliance.overallStatus === 'FAIL') {
    status = 'NOT_ELIGIBLE';
  } else if (crossDocumentVerification.some(i => i.severity === 'HIGH')) {
    status = 'NEEDS_REVIEW';
  } else if (crossDocumentVerification.length > 0) {
    status = 'NEEDS_REVIEW';
  } else {
    status = 'ELIGIBLE';
  }

  // Score Math
  let matchScore = 0;
  let passedCount = 0;
  if (ageStatus === 'PASS') passedCount++;
  if (qualStatus === 'PASS') passedCount++;
  if (expStatus === 'PASS') passedCount++;
  if (marksStatus === 'PASS') passedCount++;
  if (docsStatus === 'PASS') passedCount++;

  if (passedCount === 5) {
    // Eligible range: 85% to 98%
    const marksBonus = Math.min(10, ((marksVal - job.minPercentage) / (100 - job.minPercentage)) * 10);
    const expBonus = Math.min(5, ((expVal - job.minExperienceYears) / 10) * 5);
    matchScore = Math.round(83 + marksBonus + expBonus);
  } else {
    // Failing checks lowers score
    matchScore = Math.round((passedCount / 5) * 75);
    if (crossDocumentVerification.length > 0) {
      matchScore = Math.max(20, matchScore - (crossDocumentVerification.length * 10));
    }
  }

  return {
    ...candidate,
    status,
    matchScore,
    ruleCompliance,
    missingDocuments: missingDocs
  };
}
