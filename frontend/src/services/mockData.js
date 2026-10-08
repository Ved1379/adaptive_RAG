/**
 * Mock Data for Adaptive RAG College Assistant
 * Strictly separated from API communication layer.
 * Used for development preview and graceful offline demonstration.
 */

export const MOCK_DOCUMENTS = [
  {
    id: "doc-001",
    filename: "academic_regulations_2024_25.pdf",
    department: "Academic Affairs",
    academicYear: "2024-2025",
    uploadedDate: "2024-08-15",
    lastUpdated: "2024-08-15",
    status: "Indexed",
    chunkCount: 42,
    fileSize: "1.8 MB",
    description: "Institutional regulations governing attendance, grading, credits, and promotion policies."
  },
  {
    id: "doc-002",
    filename: "examination_ordinance_v3.pdf",
    department: "Examination Cell",
    academicYear: "2024-2025",
    uploadedDate: "2024-09-02",
    lastUpdated: "2024-09-02",
    status: "Indexed",
    chunkCount: 28,
    fileSize: "940 KB",
    description: "Guidelines on internal assessments, end-semester examinations, re-evaluations, and ATKT."
  },
  {
    id: "doc-003",
    filename: "departments_curriculum_guide.pdf",
    department: "Computer & IT Engineering",
    academicYear: "2024-2025",
    uploadedDate: "2024-09-10",
    lastUpdated: "2024-09-10",
    status: "Available",
    chunkCount: 65,
    fileSize: "3.2 MB",
    description: "Syllabus, departmental vision, faculty directory, and lab course specifications."
  },
  {
    id: "doc-004",
    filename: "campus_facilities_manual.pdf",
    department: "Student Affairs",
    academicYear: "2024-2025",
    uploadedDate: "2024-07-28",
    lastUpdated: "2024-07-28",
    status: "Available",
    chunkCount: 19,
    fileSize: "1.1 MB",
    description: "Overview of Central Library, computing labs, auditorium, sports complex, and hostel amenities."
  },
  {
    id: "doc-005",
    filename: "sample.pdf",
    department: "Research & Capstone (Group 32)",
    academicYear: "2024-2025",
    uploadedDate: "2024-10-01",
    lastUpdated: "2024-10-01",
    status: "Indexed",
    chunkCount: 12,
    fileSize: "128 KB",
    description: "Adaptive Hallucination Detection & Reduction Framework survey and research papers."
  }
];

export const MOCK_CHUNKS = {
  "doc-001": [
    {
      chunkIndex: 0,
      content: "Section 4.1 - Minimum Attendance: Every registered student is mandated to maintain a minimum of 75% aggregate attendance in theory classes and practical sessions conducted during each semester.",
      page: 14
    },
    {
      chunkIndex: 1,
      content: "Section 4.2 - Condonation: In cases of severe medical emergencies or approved institutional representations, condonation of up to 15% (minimum 60% attendance) may be granted by the Academic Council upon submission of verified medical documentation within 7 working days.",
      page: 15
    },
    {
      chunkIndex: 2,
      content: "Section 4.3 - Debarment: Students having less than 60% aggregate attendance shall be summarily debarred from appearing in the End-Semester Examination (ESE) for that academic term.",
      page: 15
    }
  ],
  "doc-002": [
    {
      chunkIndex: 0,
      content: "Rule 5.1 - Evaluation Scheme: Total evaluation per course consists of Continuous Internal Evaluation (CIE: 40% weightage) and End-Semester Examination (ESE: 60% weightage).",
      page: 7
    },
    {
      chunkIndex: 1,
      content: "Rule 5.2 - Passing Threshold: A candidate must secure a minimum of 40% marks in both CIE and ESE independently, with an overall aggregate score of 40% to be declared qualified in a credit course.",
      page: 8
    }
  ],
  "doc-003": [
    {
      chunkIndex: 0,
      content: "The institution hosts accredited undergraduate programs in Computer Engineering, Information Technology, Artificial Intelligence & Data Science, Electronics & Telecommunication, Mechanical, and Civil Engineering.",
      page: 3
    }
  ],
  "doc-004": [
    {
      chunkIndex: 0,
      content: "Central Library features a 24/7 reading hall with 45,000+ volumes, IEEE/ACM digital repository access, High-Performance Computing lab with dual A100 GPU nodes, gymnasium, and indoor badminton arena.",
      page: 8
    }
  ],
  "doc-005": [
    {
      chunkIndex: 0,
      content: "Adaptive Hallucination Detection and Reduction Framework for Retrieval-Augmented Large Language Model Chatbots Using AI-Based Response Evaluation. Guide: Ms. Pooja B, Div/Batch: BE/B, Group No: 32.",
      page: 1
    }
  ]
};

// All 5 evaluation criteria matching the enhanced backend evaluator:
// 1. Faithfulness
// 2. Relevance
// 3. Groundedness
// 4. Completeness
// 5. Factual Consistency
export const MOCK_RESPONSES = {
  "attendance": {
    answer: "Based on the official college academic regulations, students are required to maintain a **minimum of 75% aggregate attendance** across all lectures, tutorials, and practical sessions each semester.\n\nKey attendance rules include:\n- **Standard Requirement**: Minimum 75% attendance to be eligible for End-Semester Examinations (ESE).\n- **Medical Condonation**: In cases of documented medical illness, a condonation of up to 15% (minimum 60% overall attendance) may be approved by the Academic Council upon timely submission of certified medical records.\n- **Debarment**: Students whose attendance falls below 60% cannot be condoned and will be debarred from sitting for the end-semester examinations.",
    category: "COLLEGE",
    evaluation: {
      faithfulness: "PASS",
      relevance: "PASS",
      groundedness: "PASS",
      completeness: "PASS",
      factual_consistency: "PASS"
    },
    sources: [
      {
        document: "academic_regulations_2024_25.pdf",
        page: 14,
        chunk_index: 0,
        text: "Section 4.1 & 4.2: Every student is mandated to maintain a minimum of 75% aggregate attendance in theory classes and practical sessions. Condonation up to 15% is permitted only under certified medical emergencies."
      }
    ],
    regenerated: false
  },
  "examination": {
    answer: "According to the **Examination Ordinance (v3)**, the college assessment framework is structured as follows:\n\n1. **Evaluation Breakdown**:\n   - **Continuous Internal Evaluation (CIE)**: 40% total weightage (class tests, quizzes, and lab continuous assessments).\n   - **End-Semester Examination (ESE)**: 60% total weightage.\n\n2. **Passing Criteria**:\n   - Students must secure at least **40% marks independently** in both the CIE and the ESE components.\n   - An overall composite score of 40% is mandatory to earn credits for the course.\n\n3. **ATKT (Allowed to Keep Term)**:\n   - Students are permitted to carry forward a maximum of 2 failed subjects to the subsequent semester before being required to clear them.",
    category: "COLLEGE",
    evaluation: {
      faithfulness: "PASS",
      relevance: "PASS",
      groundedness: "PASS",
      completeness: "PASS",
      factual_consistency: "PASS"
    },
    sources: [
      {
        document: "examination_ordinance_v3.pdf",
        page: 7,
        chunk_index: 0,
        text: "Rule 5.1 & 5.2: Total evaluation per course consists of CIE (40%) and ESE (60%). A candidate must secure a minimum of 40% marks in both CIE and ESE independently."
      }
    ],
    regenerated: true
  },
  "departments": {
    answer: "The college offers undergraduate and postgraduate academic programs across the following accredited engineering departments:\n\n- **Computer Engineering**: Focuses on Algorithms, Distributed Systems, Cloud Architecture, and Software Engineering.\n- **Information Technology**: Focuses on Information Systems, Full-Stack Development, Cyber Security, and DevOps.\n- **Artificial Intelligence & Data Science**: Specializes in Deep Learning, Natural Language Processing, and Big Data Analytics.\n- **Electronics & Telecommunication Engineering**: VLSI design, Embedded IoT Systems, and Signal Processing.\n- **Mechanical Engineering**: Robotics, Thermal Sciences, CAD/CAM, and Mechatronics.\n- **Civil Engineering**: Structural Design, Environmental Engineering, and Geomatics.",
    category: "COLLEGE",
    evaluation: {
      faithfulness: "PASS",
      relevance: "PASS",
      groundedness: "PASS",
      completeness: "PASS",
      factual_consistency: "PASS"
    },
    sources: [
      {
        document: "departments_curriculum_guide.pdf",
        page: 3,
        chunk_index: 0,
        text: "The institution hosts accredited undergraduate programs in Computer Engineering, Information Technology, Artificial Intelligence & Data Science, Electronics & Telecommunication, Mechanical, and Civil Engineering."
      }
    ],
    regenerated: false
  },
  "facilities": {
    answer: "The campus provides a comprehensive range of academic, research, and recreation facilities:\n\n- **Central Library**: Air-conditioned 24/7 reading hall with 45,000+ volumes and full access to IEEE, ACM, and Springer digital research repositories.\n- **High-Performance Computing (HPC) Lab**: Dual NVIDIA A100 GPU workstations configured for AI/ML deep learning workloads.\n- **Sports & Recreation Complex**: Indoor badminton courts, gymnasium, table tennis, and full-size outdoor football/cricket turf.\n- **Innovation & Incubation Center**: Dedicated workspace offering 3D printers, IoT hardware testbeds, and mentorship for student startups.\n- **Central Cafeteria & Dining**: Multi-cuisine dining options with hygienic meal certification.",
    category: "COLLEGE",
    evaluation: {
      faithfulness: "PASS",
      relevance: "PASS",
      groundedness: "PASS",
      completeness: "PASS",
      factual_consistency: "PASS"
    },
    sources: [
      {
        document: "campus_facilities_manual.pdf",
        page: 8,
        chunk_index: 0,
        text: "Central Library features a 24/7 reading hall with 45,000+ volumes, IEEE/ACM digital repository access, High-Performance Computing lab with dual A100 GPU nodes, gymnasium, and indoor badminton arena."
      }
    ],
    regenerated: false
  },
  "project": {
    answer: "According to `sample.pdf`, this project is:\n\n**Adaptive Hallucination Detection and Reduction Framework for Retrieval-Augmented Large Language Model Chatbots Using AI-Based Response Evaluation**\n\n- **Guide**: Ms. Pooja B\n- **Division / Batch**: BE/B (Group No: 32)\n- **Project Team**: Rahul Vishe, Sujan Salaskar, Ved Redij, Prathamesh Shinde\n\n**Key Focus**: Combining RAG similarity search in ChromaDB with automated LLM evaluation across 5 strict criteria with adaptive multi-attempt regeneration.",
    category: "COLLEGE",
    evaluation: {
      faithfulness: "PASS",
      relevance: "PASS",
      groundedness: "PASS",
      completeness: "PASS",
      factual_consistency: "PASS"
    },
    sources: [
      {
        document: "sample.pdf",
        page: 1,
        chunk_index: 0,
        text: "Adaptive Hallucination Detection and Reduction Framework for Retrieval-Augmented Large Language Model Chatbots Using AI-Based Response Evaluation. Guide: Ms. Pooja B, Group No: 32."
      }
    ],
    regenerated: false
  },
  "insufficient": {
    answer: "I don't have enough information in the provided documents.",
    category: "COLLEGE",
    evaluation: {
      faithfulness: "FAIL",
      relevance: "FAIL",
      groundedness: "FAIL",
      completeness: "FAIL",
      factual_consistency: "FAIL"
    },
    sources: [],
    regenerated: true,
    insufficient: true
  }
};

// Mock Users for Admin Users Page (RBAC preparation)
export const MOCK_USERS_LIST = [
  {
    id: "usr-01",
    name: "Ved Redij",
    email: "ved.redij@college.edu",
    role: "ADMIN",
    department: "Computer Engineering",
    status: "Active",
    createdAt: "2024-07-01",
  },
  {
    id: "usr-02",
    name: "Pooja B",
    email: "pooja.b@college.edu",
    role: "ADMIN",
    department: "Faculty / Academic Guide",
    status: "Active",
    createdAt: "2024-06-15",
  },
  {
    id: "usr-03",
    name: "Rahul Vishe",
    email: "rahul.v@college.edu",
    role: "STUDENT",
    department: "BE / Computer Engg",
    status: "Active",
    createdAt: "2024-08-10",
  },
  {
    id: "usr-04",
    name: "Sujan Salaskar",
    email: "sujan.s@college.edu",
    role: "STUDENT",
    department: "BE / Computer Engg",
    status: "Active",
    createdAt: "2024-08-10",
  },
  {
    id: "usr-05",
    name: "Prathamesh Shinde",
    email: "prathamesh.s@college.edu",
    role: "STUDENT",
    department: "BE / Computer Engg",
    status: "Active",
    createdAt: "2024-08-10",
  },
  {
    id: "usr-06",
    name: "Ananya Deshmukh",
    email: "ananya.d@college.edu",
    role: "STUDENT",
    department: "Information Technology",
    status: "Active",
    createdAt: "2024-09-01",
  },
];

// Mock Analytics for Admin Analytics Page
export const MOCK_ANALYTICS_DATA = {
  overview: {
    totalQuestions: 1482,
    acceptedAnswers: 1418,
    acceptanceRate: "95.7%",
    hallucinationsMitigated: 162,
    adaptiveRegenerations: 176,
    insufficientInfoFallback: 64,
  },
  evaluatorBreakdown: [
    { criterion: "Faithfulness", passRate: "97.4%", status: "OPTIMAL" },
    { criterion: "Relevance", passRate: "98.9%", status: "OPTIMAL" },
    { criterion: "Groundedness", passRate: "96.1%", status: "OPTIMAL" },
    { criterion: "Completeness", passRate: "94.8%", status: "GOOD" },
    { criterion: "Factual Consistency", passRate: "98.2%", status: "OPTIMAL" },
  ],
  recentEvents: [
    {
      id: "ev-1",
      query: "What is the passing criteria for end-semester exams?",
      status: "REGENERATED_PASS",
      attempt: 2,
      time: "10 mins ago",
    },
    {
      id: "ev-2",
      query: "Show me the minimum attendance requirement",
      status: "ACCEPTED_ATTEMPT_1",
      attempt: 1,
      time: "25 mins ago",
    },
    {
      id: "ev-3",
      query: "Tell me the 25th reference paper",
      status: "INSUFFICIENT_INFO",
      attempt: 3,
      time: "1 hour ago",
    },
  ],
};
