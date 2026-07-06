import { JobRequirement, Candidate, EvaluationRun } from '../types';

export const MOCK_JOBS: JobRequirement[] = [
  {
    id: 'job-1',
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    minAge: 21,
    maxAge: 35,
    minExperienceYears: 3,
    qualification: 'B.Tech',
    minPercentage: 60,
    mandatoryDocuments: ['Aadhaar', 'Degree', 'Experience Certificate'],
    rawTextExcerpt: `Official Recruitment Notification (Ref: ADVT/2026/FE-02)
Position: Senior Frontend Developer (Contract & Full-Time)
Eligibility Criteria:
1. Age Limit: Candidate must have completed 21 years of age and must not have exceeded 35 years as of 01-01-2026.
2. Educational Qualification: Must possess a Bachelor of Technology (B.Tech) or equivalent degree in CSE/IT/ECE from a recognized University.
3. Minimum Marks: Candidates must have obtained at least 60% marks in their qualifying degree.
4. Experience: Minimum of 3 (three) years of post-qualification experience in frontend development (specifically React, TypeScript).
5. Mandatory Supporting Documents:
   - Aadhaar Card (For Identity and Age Proof)
   - Degree Certificate / Final Transcripts (For Academic Proof)
   - Experience Certificates from previous employers (For Professional Proof)`
  },
  {
    id: 'job-2',
    title: 'Backend Engineer',
    department: 'Engineering',
    minAge: 24,
    maxAge: 38,
    minExperienceYears: 5,
    qualification: 'B.Tech',
    minPercentage: 65,
    mandatoryDocuments: ['Aadhaar', 'Degree', 'Experience Certificate'],
    rawTextExcerpt: `Official Recruitment Notification (Ref: ADVT/2026/BE-05)
Position: Senior Backend Software Engineer
Eligibility Criteria:
1. Age Limit: 24 to 38 years as of 01-01-2026.
2. Education: B.Tech/B.E in Computer Science, Software Engineering or related discipline.
3. Marks: Minimum 65% aggregate in Bachelor's Degree.
4. Experience: At least 5 years of experience in backend development using Node.js, Go or Java.
5. Mandatory Documents: Aadhaar Card, B.Tech Certificate, Experience Certificates.`
  }
];

export const MOCK_CANDIDATES_DATA: { [jobId: string]: Candidate[] } = {
  'job-1': [
    {
      id: 'cand-1',
      name: 'Rahul Sharma',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      matchScore: 94,
      status: 'ELIGIBLE',
      documents: [
        {
          id: 'doc-1-1',
          fileName: 'Aadhaar.pdf',
          category: 'Identity',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'GOVERNMENT OF INDIA - UNIQUE IDENTIFICATION AUTHORITY OF INDIA\n\nName: Rahul Sharma\nDate of Birth: 12/03/1998\nGender: Male\nAadhaar Number: XXXX-XXXX-4921\nAddress: Flat 204, Heights Apartment, Sector 62, Noida, UP - 201301.'
          }
        },
        {
          id: 'doc-1-2',
          fileName: 'Degree.pdf',
          category: 'Academic',
          exists: true,
          pagesCount: 2,
          rawTextByPage: {
            1: 'DELHI TECHNOLOGICAL UNIVERSITY\n\nThis is to certify that RAHUL SHARMA having completed the prescribed course of study in 2021 has been admitted to the degree of BACHELOR OF TECHNOLOGY IN COMPUTER SCIENCE & ENGINEERING with all the rights and privileges thereto appertaining.\n\nCumulative Grade Point Average (CGPA): 7.84 / 10.00\nEquivalent Aggregate Marks: 78.4%',
            2: 'TRANSCRIPT OF RECORD\nYear 1: 7.2 CGPA | Year 2: 7.5 CGPA\nYear 3: 7.9 CGPA | Year 4: 8.7 CGPA\nOverall Cumulative Grade Point Average: 7.84 (Equivalent to 78.4% marks)'
          }
        },
        {
          id: 'doc-1-3',
          fileName: 'Experience.pdf',
          category: 'Professional',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'INNOVATECH SOLUTIONS PRIVATE LIMITED\n\nDate: June 15, 2026\n\nTO WHOMSOEVER IT MAY CONCERN\n\nThis is to certify that Mr. Rahul Sharma was employed with Innovatech Solutions from July 5, 2021 to June 10, 2026 as a Software Engineer and later promoted to Senior Frontend Developer.\nDuring his tenure of 5 years (4 years, 11 months, and 5 days), his work on React.js, TypeScript, and Tailwind CSS was exemplary. We wish him the best in his future endeavors.\n\nSigned,\nHR Director, Innovatech Solutions'
          }
        },
        {
          id: 'doc-1-4',
          fileName: 'Resume.pdf',
          category: 'Supporting',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'RAHUL SHARMA - FRONTEND DEVELOPER\nEmail: rahul.sharma@example.com | Mob: +91 9876543210\n\nSUMMARY\n5 years of experience in building scalable web applications using React, TS, and CSS.\n\nEDUCATION\n- B.Tech in CSE, Delhi Technological University (2017 - 2021) | CGPA: 7.84\n\nEXPERIENCE\n- Senior Frontend Developer, Innovatech Solutions (July 2021 - Present)\n  * Led a team of 3 developers to migrate legacy application to React.\n  * Optimized bundle size by 40%.\n\nPERSONAL DETAILS\n- Date of Birth: 12-03-1998\n- Languages: English, Hindi'
          }
        }
      ],
      extractedData: {
        name: { value: 'Rahul Sharma', fileName: 'Aadhaar.pdf', page: 1, snippet: 'Name: Rahul Sharma' },
        dob: { value: '12/03/1998', fileName: 'Aadhaar.pdf', page: 1, snippet: 'Date of Birth: 12/03/1998' },
        qualification: { value: 'B.Tech', fileName: 'Degree.pdf', page: 1, snippet: 'BACHELOR OF TECHNOLOGY IN COMPUTER SCIENCE & ENGINEERING' },
        branch: { value: 'Computer Science & Engineering', fileName: 'Degree.pdf', page: 1, snippet: 'COMPUTER SCIENCE & ENGINEERING' },
        university: { value: 'Delhi Technological University', fileName: 'Degree.pdf', page: 1, snippet: 'DELHI TECHNOLOGICAL UNIVERSITY' },
        passingYear: { value: 2021, fileName: 'Degree.pdf', page: 1, snippet: 'prescribed course of study in 2021' },
        percentage: { value: 78.4, fileName: 'Degree.pdf', page: 1, snippet: 'Equivalent Aggregate Marks: 78.4%' },
        experienceYears: { value: 4.9, fileName: 'Experience.pdf', page: 1, snippet: 'tenure of 5 years (4 years, 11 months, and 5 days)' },
        employer: { value: 'Innovatech Solutions Private Limited', fileName: 'Experience.pdf', page: 1, snippet: 'INNOVATECH SOLUTIONS PRIVATE LIMITED' },
        employmentPeriod: { value: 'July 5, 2021 to June 10, 2026', fileName: 'Experience.pdf', page: 1, snippet: 'July 5, 2021 to June 10, 2026' },
        skills: { value: ['React.js', 'TypeScript', 'Tailwind CSS'], fileName: 'Experience.pdf', page: 1, snippet: 'work on React.js, TypeScript, and Tailwind CSS' }
      },
      evidenceValidation: {
        overallStatus: 'PASS',
        validations: {
          name: { fieldName: 'Name', documentExists: true, pageExists: true, textMatches: true, citedText: 'Name: Rahul Sharma', actualTextOnPage: 'Name: Rahul Sharma', status: 'PASS' },
          dob: { fieldName: 'Date of Birth', documentExists: true, pageExists: true, textMatches: true, citedText: 'Date of Birth: 12/03/1998', actualTextOnPage: 'Date of Birth: 12/03/1998', status: 'PASS' },
          qualification: { fieldName: 'Qualification', documentExists: true, pageExists: true, textMatches: true, citedText: 'BACHELOR OF TECHNOLOGY IN COMPUTER SCIENCE & ENGINEERING', actualTextOnPage: 'BACHELOR OF TECHNOLOGY IN COMPUTER SCIENCE & ENGINEERING', status: 'PASS' },
          percentage: { fieldName: 'Marks Percentage', documentExists: true, pageExists: true, textMatches: true, citedText: 'Equivalent Aggregate Marks: 78.4%', actualTextOnPage: 'Equivalent Aggregate Marks: 78.4%', status: 'PASS' },
          experienceYears: { fieldName: 'Experience Years', documentExists: true, pageExists: true, textMatches: true, citedText: 'tenure of 5 years (4 years, 11 months, and 5 days)', actualTextOnPage: 'tenure of 5 years (4 years, 11 months, and 5 days)', status: 'PASS' }
        }
      },
      ruleCompliance: {
        overallStatus: 'PASS',
        checks: {
          age: { status: 'PASS', required: '21 - 35 Years (Born 1991 - 2005)', actual: '28 Years (DOB: 12-03-1998)', message: 'Candidate age is 28, which is within the 21 - 35 range.' },
          qualification: { status: 'PASS', required: 'B.Tech or equivalent', actual: 'B.Tech (Computer Science & Engineering)', message: 'Qualification matches the required threshold.' },
          experience: { status: 'PASS', required: 'Minimum 3 Years', actual: '4.9 Years (59 Months)', message: 'Experience satisfies the minimum requirement of 3 years.' },
          marks: { status: 'PASS', required: 'Minimum 60.0%', actual: '78.4%', message: 'Aggregate marks of 78.4% is above the 60.0% cutoff.' },
          documents: { status: 'PASS', required: 'Aadhaar, Degree, Experience Certificate', actual: 'All 3 submitted', message: 'All mandatory documents are present and classified.' }
        }
      },
      crossDocumentVerification: [],
      missingDocuments: []
    },
    {
      id: 'cand-2',
      name: 'Aman Gupta',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      matchScore: 89,
      status: 'NEEDS_REVIEW',
      documents: [
        {
          id: 'doc-2-1',
          fileName: 'Aadhaar.pdf',
          category: 'Identity',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'GOVERNMENT OF INDIA\n\nName: Aman Gupta\nDate of Birth: 24/05/1994\nAadhaar Number: XXXX-XXXX-9831'
          }
        },
        {
          id: 'doc-2-2',
          fileName: 'Degree.pdf',
          category: 'Academic',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'VELLORE INSTITUTE OF TECHNOLOGY (VIT)\n\nThis is to certify that AMAN GUPTA has completed the program of BACHELOR OF TECHNOLOGY IN SOFTWARE ENGINEERING in the year 2022.\nGrade Point Average: 8.2 / 10.0 (Equivalent to 82% Marks).'
          }
        },
        {
          id: 'doc-2-3',
          fileName: 'Experience.pdf',
          category: 'Professional',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'COGNIZANT SOLUTIONS CORP\n\nExperience Certificate\nDate: June 01, 2026\nThis is to certify that Mr. Aman Gupta worked as a Frontend UI Engineer from July 10, 2022 to May 30, 2026. Total duration: 3 years, 10 months.'
          }
        },
        {
          id: 'doc-2-4',
          fileName: 'Resume.pdf',
          category: 'Supporting',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'AMAN GUPTA\nEmail: aman.gupta@example.com\nDOB: 24-05-1995\n\nEducation:\n- B.Tech in Software Engineering, VIT University (Passing: 2022)\n\nExperience:\n- UI Developer at Cognizant (July 2022 - May 2026)'
          }
        }
      ],
      extractedData: {
        name: { value: 'Aman Gupta', fileName: 'Aadhaar.pdf', page: 1, snippet: 'Name: Aman Gupta' },
        dob: { value: '24/05/1994', fileName: 'Aadhaar.pdf', page: 1, snippet: 'Date of Birth: 24/05/1994' },
        qualification: { value: 'B.Tech', fileName: 'Degree.pdf', page: 1, snippet: 'BACHELOR OF TECHNOLOGY IN SOFTWARE ENGINEERING' },
        branch: { value: 'Software Engineering', fileName: 'Degree.pdf', page: 1, snippet: 'SOFTWARE ENGINEERING' },
        university: { value: 'Vellore Institute of Technology', fileName: 'Degree.pdf', page: 1, snippet: 'VELLORE INSTITUTE OF TECHNOLOGY (VIT)' },
        passingYear: { value: 2022, fileName: 'Degree.pdf', page: 1, snippet: 'in the year 2022' },
        percentage: { value: 82.0, fileName: 'Degree.pdf', page: 1, snippet: 'Equivalent to 82% Marks' },
        experienceYears: { value: 3.8, fileName: 'Experience.pdf', page: 1, snippet: 'Total duration: 3 years, 10 months' },
        employer: { value: 'Cognizant Solutions Corp', fileName: 'Experience.pdf', page: 1, snippet: 'COGNIZANT SOLUTIONS CORP' },
        employmentPeriod: { value: 'July 10, 2022 to May 30, 2026', fileName: 'Experience.pdf', page: 1, snippet: 'July 10, 2022 to May 30, 2026' },
        skills: { value: ['React', 'UI Design'], fileName: 'Experience.pdf', page: 1, snippet: 'Frontend UI Engineer' }
      },
      evidenceValidation: {
        overallStatus: 'PASS',
        validations: {
          name: { fieldName: 'Name', documentExists: true, pageExists: true, textMatches: true, citedText: 'Name: Aman Gupta', actualTextOnPage: 'Name: Aman Gupta', status: 'PASS' },
          dob: { fieldName: 'Date of Birth', documentExists: true, pageExists: true, textMatches: true, citedText: 'Date of Birth: 24/05/1994', actualTextOnPage: 'Date of Birth: 24/05/1994', status: 'PASS' },
          qualification: { fieldName: 'Qualification', documentExists: true, pageExists: true, textMatches: true, citedText: 'BACHELOR OF TECHNOLOGY IN SOFTWARE ENGINEERING', actualTextOnPage: 'BACHELOR OF TECHNOLOGY IN SOFTWARE ENGINEERING', status: 'PASS' },
          percentage: { fieldName: 'Marks Percentage', documentExists: true, pageExists: true, textMatches: true, citedText: 'Equivalent to 82% Marks', actualTextOnPage: 'Equivalent to 82% Marks', status: 'PASS' },
          experienceYears: { fieldName: 'Experience Years', documentExists: true, pageExists: true, textMatches: true, citedText: 'Total duration: 3 years, 10 months', actualTextOnPage: 'Total duration: 3 years, 10 months', status: 'PASS' }
        }
      },
      ruleCompliance: {
        overallStatus: 'PASS',
        checks: {
          age: { status: 'PASS', required: '21 - 35 Years (Born 1991 - 2005)', actual: '32 Years (DOB: 24-05-1994)', message: 'Candidate age is 32, within the range.' },
          qualification: { status: 'PASS', required: 'B.Tech or equivalent', actual: 'B.Tech (Software Engineering)', message: 'Qualification complies.' },
          experience: { status: 'PASS', required: 'Minimum 3 Years', actual: '3.8 Years (46 Months)', message: 'Experience satisfies requirements.' },
          marks: { status: 'PASS', required: 'Minimum 60.0%', actual: '82.0%', message: 'Aggregate marks of 82.0% exceeds 60.0% cutoff.' },
          documents: { status: 'PASS', required: 'Aadhaar, Degree, Experience Certificate', actual: 'All 3 submitted', message: 'All mandatory documents present.' }
        }
      },
      crossDocumentVerification: [
        {
          id: 'inc-2-1',
          field: 'Date of Birth',
          sourceA: 'Aadhaar.pdf (Page 1)',
          valueA: '24/05/1994',
          sourceB: 'Resume.pdf (Page 1)',
          valueB: '24-05-1995',
          severity: 'HIGH',
          message: 'Date of birth contradicts between Aadhaar Card (1994) and Resume (1995). Requires official verification.'
        }
      ],
      missingDocuments: []
    },
    {
      id: 'cand-3',
      name: 'Neha Verma',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
      matchScore: 82,
      status: 'NOT_ELIGIBLE',
      documents: [
        {
          id: 'doc-3-1',
          fileName: 'Aadhaar.pdf',
          category: 'Identity',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'GOVERNMENT OF INDIA\nName: Neha Verma\nDOB: 11/11/2000'
          }
        },
        {
          id: 'doc-3-2',
          fileName: 'Degree.pdf',
          category: 'Academic',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'PUNJAB TECHNICAL UNIVERSITY\nB.Tech in Computer Science & Engineering\nNeha Verma passed in 2022 with overall marks percentage of 58.2%'
          }
        },
        {
          id: 'doc-3-3',
          fileName: 'Experience.pdf',
          category: 'Professional',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'WIPRO TECHNOLOGIES LTD\n\nExperience Statement\nNeha Verma worked as Project Engineer from July 2022 to June 2026. Experience: 4.0 Years.'
          }
        },
        {
          id: 'doc-3-4',
          fileName: 'Resume.pdf',
          category: 'Supporting',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'NEHA VERMA\nExperience: 4 Years at Wipro\nEducation: B.Tech CSE (58.2%)'
          }
        }
      ],
      extractedData: {
        name: { value: 'Neha Verma', fileName: 'Aadhaar.pdf', page: 1, snippet: 'Name: Neha Verma' },
        dob: { value: '11/11/2000', fileName: 'Aadhaar.pdf', page: 1, snippet: 'DOB: 11/11/2000' },
        qualification: { value: 'B.Tech', fileName: 'Degree.pdf', page: 1, snippet: 'B.Tech in Computer Science & Engineering' },
        branch: { value: 'Computer Science & Engineering', fileName: 'Degree.pdf', page: 1, snippet: 'Computer Science & Engineering' },
        university: { value: 'Punjab Technical University', fileName: 'Degree.pdf', page: 1, snippet: 'PUNJAB TECHNICAL UNIVERSITY' },
        passingYear: { value: 2022, fileName: 'Degree.pdf', page: 1, snippet: 'passed in 2022' },
        percentage: { value: 58.2, fileName: 'Degree.pdf', page: 1, snippet: 'overall marks percentage of 58.2%' },
        experienceYears: { value: 4.0, fileName: 'Experience.pdf', page: 1, snippet: 'Experience: 4.0 Years' },
        employer: { value: 'Wipro Technologies Ltd', fileName: 'Experience.pdf', page: 1, snippet: 'WIPRO TECHNOLOGIES LTD' },
        employmentPeriod: { value: 'July 2022 to June 2026', fileName: 'Experience.pdf', page: 1, snippet: 'July 2022 to June 2026' },
        skills: { value: ['React', 'JavaScript'], fileName: 'Resume.pdf', page: 1, snippet: 'Neha Verma' }
      },
      evidenceValidation: {
        overallStatus: 'PASS',
        validations: {
          name: { fieldName: 'Name', documentExists: true, pageExists: true, textMatches: true, citedText: 'Name: Neha Verma', actualTextOnPage: 'Name: Neha Verma', status: 'PASS' },
          dob: { fieldName: 'Date of Birth', documentExists: true, pageExists: true, textMatches: true, citedText: 'DOB: 11/11/2000', actualTextOnPage: 'DOB: 11/11/2000', status: 'PASS' },
          qualification: { fieldName: 'Qualification', documentExists: true, pageExists: true, textMatches: true, citedText: 'B.Tech in Computer Science & Engineering', actualTextOnPage: 'B.Tech in Computer Science & Engineering', status: 'PASS' },
          percentage: { fieldName: 'Marks Percentage', documentExists: true, pageExists: true, textMatches: true, citedText: 'overall marks percentage of 58.2%', actualTextOnPage: 'overall marks percentage of 58.2%', status: 'PASS' },
          experienceYears: { fieldName: 'Experience Years', documentExists: true, pageExists: true, textMatches: true, citedText: 'Experience: 4.0 Years', actualTextOnPage: 'Experience: 4.0 Years', status: 'PASS' }
        }
      },
      ruleCompliance: {
        overallStatus: 'FAIL',
        checks: {
          age: { status: 'PASS', required: '21 - 35 Years (Born 1991 - 2005)', actual: '25 Years (DOB: 11-11-2000)', message: 'Candidate age is 25, within the range.' },
          qualification: { status: 'PASS', required: 'B.Tech or equivalent', actual: 'B.Tech (Computer Science & Engineering)', message: 'Qualification complies.' },
          experience: { status: 'PASS', required: 'Minimum 3 Years', actual: '4.0 Years', message: 'Experience satisfies requirements.' },
          marks: { status: 'FAIL', required: 'Minimum 60.0%', actual: '58.2%', message: 'Aggregate marks of 58.2% is below the required 60.0% cutoff.' },
          documents: { status: 'PASS', required: 'Aadhaar, Degree, Experience Certificate', actual: 'All 3 submitted', message: 'All mandatory documents present.' }
        }
      },
      crossDocumentVerification: [],
      missingDocuments: []
    },
    {
      id: 'cand-4',
      name: 'Priya Singh',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      matchScore: 76,
      status: 'NEEDS_REVIEW',
      documents: [
        {
          id: 'doc-4-1',
          fileName: 'Aadhaar.pdf',
          category: 'Identity',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'GOVERNMENT OF INDIA\nName: Priya Singh\nDOB: 05/09/1999'
          }
        },
        {
          id: 'doc-4-2',
          fileName: 'Degree.pdf',
          category: 'Academic',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'INDRA PRASTHA UNIVERSITY\nDegree of Master of Computer Applications (MCA)\nAwarded to Priya Singh in 2021 | Aggregate: 76.5%'
          }
        },
        {
          id: 'doc-4-3',
          fileName: 'Experience.pdf',
          category: 'Professional',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'TECH MAHINDRA LTD\n\nExperience Letter\nThis is to certify Priya Singh worked from March 1, 2023 to Present (June 2026).\nRole: Frontend Developer.'
          }
        },
        {
          id: 'doc-4-4',
          fileName: 'Resume.pdf',
          category: 'Supporting',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'PRIYA SINGH\nEducation: MCA, Indraprastha University (76.5%)\nExperience:\n- Software Developer, Tech Mahindra (December 2022 - Present)\nKey Skills: React, Node, Redux'
          }
        }
      ],
      extractedData: {
        name: { value: 'Priya Singh', fileName: 'Aadhaar.pdf', page: 1, snippet: 'Name: Priya Singh' },
        dob: { value: '05/09/1999', fileName: 'Aadhaar.pdf', page: 1, snippet: 'DOB: 05/09/1999' },
        qualification: { value: 'MCA', fileName: 'Degree.pdf', page: 1, snippet: 'Master of Computer Applications (MCA)' },
        branch: { value: 'Computer Applications', fileName: 'Degree.pdf', page: 1, snippet: 'Computer Applications (MCA)' },
        university: { value: 'Indra Prastha University', fileName: 'Degree.pdf', page: 1, snippet: 'INDRA PRASTHA UNIVERSITY' },
        passingYear: { value: 2021, fileName: 'Degree.pdf', page: 1, snippet: 'Awarded to Priya Singh in 2021' },
        percentage: { value: 76.5, fileName: 'Degree.pdf', page: 1, snippet: 'Aggregate: 76.5%' },
        experienceYears: { value: 3.3, fileName: 'Experience.pdf', page: 1, snippet: 'March 1, 2023 to Present (June 2026)' },
        employer: { value: 'Tech Mahindra Ltd', fileName: 'Experience.pdf', page: 1, snippet: 'TECH MAHINDRA LTD' },
        employmentPeriod: { value: 'March 1, 2023 to Present', fileName: 'Experience.pdf', page: 1, snippet: 'March 1, 2023 to Present (June 2026)' },
        skills: { value: ['React', 'Node', 'Redux'], fileName: 'Resume.pdf', page: 1, snippet: 'Key Skills: React, Node, Redux' }
      },
      evidenceValidation: {
        overallStatus: 'PASS',
        validations: {
          name: { fieldName: 'Name', documentExists: true, pageExists: true, textMatches: true, citedText: 'Name: Priya Singh', actualTextOnPage: 'Name: Priya Singh', status: 'PASS' },
          dob: { fieldName: 'Date of Birth', documentExists: true, pageExists: true, textMatches: true, citedText: 'DOB: 05/09/1999', actualTextOnPage: 'DOB: 05/09/1999', status: 'PASS' },
          qualification: { fieldName: 'Qualification', documentExists: true, pageExists: true, textMatches: true, citedText: 'Master of Computer Applications (MCA)', actualTextOnPage: 'Master of Computer Applications (MCA)', status: 'PASS' },
          percentage: { fieldName: 'Marks Percentage', documentExists: true, pageExists: true, textMatches: true, citedText: 'Aggregate: 76.5%', actualTextOnPage: 'Aggregate: 76.5%', status: 'PASS' },
          experienceYears: { fieldName: 'Experience Years', documentExists: true, pageExists: true, textMatches: true, citedText: 'March 1, 2023 to Present (June 2026)', actualTextOnPage: 'March 1, 2023 to Present (June 2026)', status: 'PASS' }
        }
      },
      ruleCompliance: {
        overallStatus: 'FAIL',
        checks: {
          age: { status: 'PASS', required: '21 - 35 Years (Born 1991 - 2005)', actual: '26 Years (DOB: 05-09-1999)', message: 'Age is 26.' },
          qualification: { status: 'FAIL', required: 'B.Tech or equivalent', actual: 'MCA (Master of Computer Applications)', message: 'MCA is a Master degree, which is not strictly a Bachelor of Technology. Fails educational baseline unless manual approval is given.' },
          experience: { status: 'PASS', required: 'Minimum 3 Years', actual: '3.3 Years (39 Months)', message: 'Experience satisfies requirements.' },
          marks: { status: 'PASS', required: 'Minimum 60.0%', actual: '76.5%', message: 'Aggregate marks of 76.5% exceeds 60.0% cutoff.' },
          documents: { status: 'PASS', required: 'Aadhaar, Degree, Experience Certificate', actual: 'All 3 submitted', message: 'All mandatory documents present.' }
        }
      },
      crossDocumentVerification: [
        {
          id: 'inc-4-1',
          field: 'Experience Dates Mismatch',
          sourceA: 'Experience.pdf (Page 1)',
          valueA: 'March 1, 2023 to Present',
          sourceB: 'Resume.pdf (Page 1)',
          valueB: 'December 2022 - Present',
          severity: 'MEDIUM',
          message: 'Employment start date for Tech Mahindra differs. Experience Letter indicates March 2023, while Resume claims December 2022.'
        }
      ],
      missingDocuments: []
    },
    {
      id: 'cand-5',
      name: 'Karan Mehta',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
      matchScore: 68,
      status: 'NOT_ELIGIBLE',
      documents: [
        {
          id: 'doc-5-1',
          fileName: 'Aadhaar.pdf',
          category: 'Identity',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'GOVERNMENT OF INDIA\nName: Karan Mehta\nDOB: 14/02/2002'
          }
        },
        {
          id: 'doc-5-2',
          fileName: 'Degree.pdf',
          category: 'Academic',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'RAJASTHAN TECHNICAL UNIVERSITY\nB.Tech in Information Technology | Passing: 2024\nGrade Aggregate: 68.2%'
          }
        },
        {
          id: 'doc-5-3',
          fileName: 'Resume.pdf',
          category: 'Supporting',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'KARAN MEHTA\nEducation: B.Tech IT, 2024 (68.2%)\nExperience:\n- UI Developer, freelance (June 2024 - June 2026) | 2 Years\nTech: HTML, CSS, JS'
          }
        }
      ],
      extractedData: {
        name: { value: 'Karan Mehta', fileName: 'Aadhaar.pdf', page: 1, snippet: 'Name: Karan Mehta' },
        dob: { value: '14/02/2002', fileName: 'Aadhaar.pdf', page: 1, snippet: 'DOB: 14/02/2002' },
        qualification: { value: 'B.Tech', fileName: 'Degree.pdf', page: 1, snippet: 'B.Tech in Information Technology' },
        branch: { value: 'Information Technology', fileName: 'Degree.pdf', page: 1, snippet: 'Information Technology' },
        university: { value: 'Rajasthan Technical University', fileName: 'Degree.pdf', page: 1, snippet: 'RAJASTHAN TECHNICAL UNIVERSITY' },
        passingYear: { value: 2024, fileName: 'Degree.pdf', page: 1, snippet: 'Passing: 2024' },
        percentage: { value: 68.2, fileName: 'Degree.pdf', page: 1, snippet: 'Grade Aggregate: 68.2%' },
        experienceYears: { value: 2.0, fileName: 'Resume.pdf', page: 1, snippet: 'freelance (June 2024 - June 2026) | 2 Years' },
        employer: { value: 'Freelance UI Developer', fileName: 'Resume.pdf', page: 1, snippet: 'freelance (June 2024 - June 2026)' },
        employmentPeriod: { value: 'June 2024 - June 2026', fileName: 'Resume.pdf', page: 1, snippet: 'June 2024 - June 2026' },
        skills: { value: ['HTML', 'CSS', 'JavaScript'], fileName: 'Resume.pdf', page: 1, snippet: 'Tech: HTML, CSS, JS' }
      },
      evidenceValidation: {
        overallStatus: 'FAIL',
        validations: {
          name: { fieldName: 'Name', documentExists: true, pageExists: true, textMatches: true, citedText: 'Name: Karan Mehta', actualTextOnPage: 'Name: Karan Mehta', status: 'PASS' },
          dob: { fieldName: 'Date of Birth', documentExists: true, pageExists: true, textMatches: true, citedText: 'DOB: 14/02/2002', actualTextOnPage: 'DOB: 14/02/2002', status: 'PASS' },
          qualification: { fieldName: 'Qualification', documentExists: true, pageExists: true, textMatches: true, citedText: 'B.Tech in Information Technology', actualTextOnPage: 'B.Tech in Information Technology', status: 'PASS' },
          percentage: { fieldName: 'Marks Percentage', documentExists: true, pageExists: true, textMatches: true, citedText: 'Grade Aggregate: 68.2%', actualTextOnPage: 'Grade Aggregate: 68.2%', status: 'PASS' },
          experienceYears: { fieldName: 'Experience Years', documentExists: true, pageExists: true, textMatches: true, citedText: 'freelance (June 2024 - June 2026) | 2 Years', actualTextOnPage: 'freelance (June 2024 - June 2026) | 2 Years', status: 'PASS' }
        }
      },
      ruleCompliance: {
        overallStatus: 'FAIL',
        checks: {
          age: { status: 'PASS', required: '21 - 35 Years (Born 1991 - 2005)', actual: '24 Years (DOB: 14-02-2002)', message: 'Age is 24.' },
          qualification: { status: 'PASS', required: 'B.Tech or equivalent', actual: 'B.Tech (Information Technology)', message: 'Qualification complies.' },
          experience: { status: 'FAIL', required: 'Minimum 3 Years', actual: '2.0 Years (24 Months)', message: 'Experience (2.0 Years) is below the minimum 3.0 Years requirement.' },
          marks: { status: 'PASS', required: 'Minimum 60.0%', actual: '68.2%', message: 'Aggregate marks of 68.2% is above the 60.0% cutoff.' },
          documents: { status: 'FAIL', required: 'Aadhaar, Degree, Experience Certificate', actual: 'Aadhaar, Degree present. Experience Certificate missing.', message: 'Experience certificate is missing.' }
        }
      },
      crossDocumentVerification: [],
      missingDocuments: ['Experience Certificate']
    }
  ],
  'job-2': [
    {
      id: 'cand-10',
      name: 'Priya Verma', // In job-2 she is evaluated
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
      matchScore: 55,
      status: 'NOT_ELIGIBLE',
      documents: [
        {
          id: 'doc-10-1',
          fileName: 'Aadhaar.pdf',
          category: 'Identity',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'GOVERNMENT OF INDIA\nName: Priya Verma\nDOB: 15/08/2005'
          }
        },
        {
          id: 'doc-10-2',
          fileName: 'Degree.pdf',
          category: 'Academic',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'UNIVERSITY OF MUMBAI\nB.Tech in Information Technology\nGraduated: June 2024\nScore: 7.2 CGPA (72% aggregate)'
          }
        },
        {
          id: 'doc-10-3',
          fileName: 'Resume.pdf',
          category: 'Supporting',
          exists: true,
          pagesCount: 1,
          rawTextByPage: {
            1: 'PRIYA VERMA\nDOB: 15-08-2005\nEducation: B.Tech IT, Mumbai University (72%)\nExperience: React UI Developer (Jan 2024 - Present) | 2.5 Years'
          }
        }
      ],
      extractedData: {
        name: { value: 'Priya Verma', fileName: 'Aadhaar.pdf', page: 1, snippet: 'Name: Priya Verma' },
        dob: { value: '15/08/2005', fileName: 'Aadhaar.pdf', page: 1, snippet: 'DOB: 15/08/2005' },
        qualification: { value: 'B.Tech', fileName: 'Degree.pdf', page: 1, snippet: 'B.Tech in Information Technology' },
        branch: { value: 'Information Technology', fileName: 'Degree.pdf', page: 1, snippet: 'Information Technology' },
        university: { value: 'University of Mumbai', fileName: 'Degree.pdf', page: 1, snippet: 'UNIVERSITY OF MUMBAI' },
        passingYear: { value: 2024, fileName: 'Degree.pdf', page: 1, snippet: 'Graduated: June 2024' },
        percentage: { value: 72.0, fileName: 'Degree.pdf', page: 1, snippet: '7.2 CGPA (72% aggregate)' },
        experienceYears: { value: 2.5, fileName: 'Resume.pdf', page: 1, snippet: 'Experience: React UI Developer (Jan 2024 - Present) | 2.5 Years' },
        employer: { value: 'Freelance & Contract', fileName: 'Resume.pdf', page: 1, snippet: 'React UI Developer' },
        employmentPeriod: { value: 'Jan 2024 - Present', fileName: 'Resume.pdf', page: 1, snippet: 'Jan 2024 - Present' },
        skills: { value: ['React', 'JavaScript'], fileName: 'Resume.pdf', page: 1, snippet: 'React UI Developer' }
      },
      evidenceValidation: {
        overallStatus: 'PASS',
        validations: {
          name: { fieldName: 'Name', documentExists: true, pageExists: true, textMatches: true, citedText: 'Name: Priya Verma', actualTextOnPage: 'Name: Priya Verma', status: 'PASS' },
          dob: { fieldName: 'Date of Birth', documentExists: true, pageExists: true, textMatches: true, citedText: 'DOB: 15/08/2005', actualTextOnPage: 'DOB: 15/08/2005', status: 'PASS' },
          qualification: { fieldName: 'Qualification', documentExists: true, pageExists: true, textMatches: true, citedText: 'B.Tech in Information Technology', actualTextOnPage: 'B.Tech in Information Technology', status: 'PASS' },
          percentage: { fieldName: 'Marks Percentage', documentExists: true, pageExists: true, textMatches: true, citedText: '7.2 CGPA (72% aggregate)', actualTextOnPage: '7.2 CGPA (72% aggregate)', status: 'PASS' },
          experienceYears: { fieldName: 'Experience Years', documentExists: true, pageExists: true, textMatches: true, citedText: 'Experience: React UI Developer (Jan 2024 - Present) | 2.5 Years', actualTextOnPage: 'Experience: React UI Developer (Jan 2024 - Present) | 2.5 Years', status: 'PASS' }
        }
      },
      ruleCompliance: {
        overallStatus: 'FAIL',
        checks: {
          age: { status: 'FAIL', required: '24 - 38 Years (Born 1987 - 2001)', actual: '20 Years (DOB: 15-08-2005)', message: 'Candidate age is 20, which is below the minimum age of 24 required.' },
          qualification: { status: 'PASS', required: 'B.Tech or equivalent', actual: 'B.Tech (Information Technology)', message: 'Qualification complies.' },
          experience: { status: 'FAIL', required: 'Minimum 5 Years', actual: '2.5 Years (30 Months)', message: 'Experience (2.5 Years) is below the minimum requirement of 5 years.' },
          marks: { status: 'PASS', required: 'Minimum 65.0%', actual: '72.0%', message: 'Aggregate marks of 72.0% is above the 65.0% cutoff.' },
          documents: { status: 'FAIL', required: 'Aadhaar, Degree, Experience Certificate', actual: 'Experience Certificate Missing', message: 'Mandatory Experience Certificate document is missing.' }
        }
      },
      crossDocumentVerification: [
        {
          id: 'inc-10-1',
          field: 'Experience Duration Start Date Contradiction',
          sourceA: 'Resume.pdf (Page 1)',
          valueA: 'React UI Developer since Jan 2024',
          sourceB: 'Aadhaar.pdf (Page 1)',
          valueB: 'Born 15-08-2005 (Age 18 in 2024)',
          severity: 'HIGH',
          message: 'Professional experience claims starting before completing secondary education. Experience Letter is missing, preventing verification.'
        }
      ],
      missingDocuments: ['Experience Certificate']
    }
  ]
};

export const MOCK_RUNS: EvaluationRun[] = [
  {
    id: 'run-1',
    jobId: 'job-1',
    date: '2026-07-01 10:25 AM',
    totalCandidates: 5,
    eligibleCount: 1,
    reviewCount: 2,
    notEligibleCount: 2,
    status: 'Completed',
    currentStep: 4
  },
  {
    id: 'run-2',
    jobId: 'job-2',
    date: '2026-07-01 10:35 AM',
    totalCandidates: 1,
    eligibleCount: 0,
    reviewCount: 0,
    notEligibleCount: 1,
    status: 'Completed',
    currentStep: 4
  }
];
