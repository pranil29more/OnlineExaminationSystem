import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import PageLoader from "../components/PageLoader";
import { useAuth } from "../context/AuthContext";

import "../styles/ExamsPage.css";


function ExamsPage() {

    const [exams, setExams] = useState([]);

    const [practiceExams, setPracticeExams] =
        useState([]);

    const [actualAssessments, setActualAssessments] =
        useState([]);

    const [search, setSearch] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [selectedExam, setSelectedExam] =
        useState(null);

    const [showModal, setShowModal] =
        useState(false);

    const [modalMode, setModalMode] =
        useState("start");

    const [actionLoading, setActionLoading] =
        useState(false);

    const [loadingExamId, setLoadingExamId] =
        useState(null);

    const { role } = useAuth();

    const navigate = useNavigate();


    // ==========================================
    // Fetch Exams
    // ==========================================

    useEffect(() => {
        fetchExams();
    }, [role]);


    const fetchExams = async () => {

        try {

            setLoading(true);

            const token =
                localStorage.getItem("token");

            const endpoint =
                role === "Candidate"
                    ? `${API_BASE_URL}/candidate-exams`
                    : `${API_BASE_URL}/exams`;

            const response = await fetch(
                endpoint,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.message ||
                        "Unable to load exams."
                );

                return;
            }


            // ==========================================
            // Candidate Exams
            // ==========================================

            if (role === "Candidate") {

                setPracticeExams(
                    data.practice_exams || []
                );

                setActualAssessments(
                    data.actual_assessments || []
                );

                return;
            }


            // ==========================================
            // Admin / Examiner Exams
            // ==========================================

            setExams(data);

            const practice =
                data.filter(
                    (exam) =>
                        exam.exam_type ===
                        "Practice"
                );

            const actual =
                data.filter(
                    (exam) =>
                        exam.exam_type ===
                        "Actual"
                );

            setPracticeExams(practice);

            setActualAssessments(actual);

        } catch (error) {

            console.error(error);

            alert(
                "Unable to load exams."
            );

        } finally {

            setLoading(false);
        }
    };


    // ==========================================
    // Filter Exams
    // ==========================================

    const searchText =
        search.trim().toLowerCase();

    const filteredActualAssessments =
        actualAssessments.filter(
            (exam) =>
                String(exam.exam_id)
                    .toLowerCase()
                    .includes(searchText) ||
                (exam.title || "")
                    .toLowerCase()
                    .includes(searchText)
        );


    const filteredPracticeExams =
        practiceExams.filter(
            (exam) =>
                String(exam.exam_id)
                    .toLowerCase()
                    .includes(searchText) ||
                (exam.title || "")
                    .toLowerCase()
                    .includes(searchText)
        );


    // ==========================================
    // Handle Exam Click
    // ==========================================

    const handleExamClick = async (exam) => {

        if (loadingExamId !== null) {
            return;
        }


        // ==========================================
        // Admin / Examiner
        // ==========================================

        if (
            role === "Admin" ||
            role === "Examiner"
        ) {

            setLoadingExamId(
                exam.exam_id
            );

            navigate(
                `/exam/${exam.exam_id}`
            );

            return;
        }


        // ==========================================
        // Candidate - Actual Assessment Status
        // ==========================================

        if (
            exam.exam_type === "Actual" &&
            exam.availability_status ===
                "Upcoming"
        ) {

            alert(
                `This assessment has not started yet.\n\nScheduled Start: ${exam.scheduled_start}`
            );

            return;
        }


        if (
            exam.exam_type === "Actual" &&
            exam.availability_status ===
                "Ended"
        ) {

            alert(
                `This assessment has ended.\n\nScheduled End: ${exam.scheduled_end}`
            );

            return;
        }


        // ==========================================
        // Candidate - Exam Session
        // ==========================================

        try {

            setLoadingExamId(
                exam.exam_id
            );

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/exam-session/${exam.exam_id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const session =
                await response.json();

            if (!response.ok) {

                alert(
                    session.message ||
                        "Unable to load exam session."
                );

                return;
            }

            setSelectedExam(exam);


            // ==========================================
            // Not Started
            // ==========================================

            if (
                session.status ===
                "Not Started"
            ) {

                setModalMode("start");

                setShowModal(true);

                return;
            }


            // ==========================================
            // In Progress
            // ==========================================

            if (
                session.status ===
                "In Progress"
            ) {

                setModalMode("resume");

                setShowModal(true);

                return;
            }


            // ==========================================
            // Practice Completed
            // ==========================================

            if (
                session.status ===
                "Practice Completed"
            ) {

                setModalMode(
                    "practice-completed"
                );

                setShowModal(true);

                return;
            }


            // ==========================================
            // Actual Assessment Completed
            // ==========================================

            if (
                session.status ===
                    "Completed" ||
                session.status ===
                    "Auto Submitted"
            ) {

                setModalMode("completed");

                setShowModal(true);

                return;
            }

        } catch (error) {

            console.error(error);

            alert(
                "Unable to load exam session."
            );

        } finally {

            setLoadingExamId(null);
        }
    };


    // ==========================================
    // Start Exam
    // ==========================================

    const handleStartExam = async () => {

        if (
            actionLoading ||
            !selectedExam
        ) {
            return;
        }

        try {

            setActionLoading(true);

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/start-exam`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        exam_id:
                            selectedExam.exam_id,
                    }),
                }
            );

            const data =
                await response.json();

            if (response.ok) {

                setShowModal(false);

                navigate(
                    `/exam/${selectedExam.exam_id}`
                );

                return;
            }

            alert(
                data.message ||
                    "Unable to start exam."
            );

            setActionLoading(false);

        } catch (error) {

            console.error(error);

            alert(
                "Unable to start exam."
            );

            setActionLoading(false);
        }
    };


    // ==========================================
    // Resume Exam
    // ==========================================

    const handleResumeExam = () => {

        if (
            actionLoading ||
            !selectedExam
        ) {
            return;
        }

        setActionLoading(true);

        setTimeout(() => {

            setShowModal(false);

            navigate(
                `/exam/${selectedExam.exam_id}`
            );

        }, 250);
    };


    // ==========================================
    // Close Modal
    // ==========================================

    const closeModal = () => {

        if (actionLoading) {
            return;
        }

        setShowModal(false);

        setSelectedExam(null);

        setActionLoading(false);
    };


    // ==========================================
    // Candidate Exam Card
    // ==========================================

    const renderCandidateExamCard = (
        exam
    ) => {

        const isActual =
            exam.exam_type === "Actual";

        const isDisabled =
            isActual &&
            exam.availability_status !==
                "Available";

        const isCardLoading =
            loadingExamId ===
            exam.exam_id;

        return (

            <div
                key={exam.exam_id}
                className={`ep-exam-card ${
                    isDisabled
                        ? "ep-exam-card-disabled"
                        : ""
                } ${
                    isCardLoading
                        ? "ep-exam-card-loading"
                        : ""
                }`}
                onClick={() =>
                    handleExamClick(exam)
                }
                aria-busy={
                    isCardLoading
                }
            >

                <div className="ep-exam-card-header">

                    <div className="ep-exam-heading">

                        <span className="ep-exam-number">
                            EXAM #
                            {exam.exam_id}
                        </span>

                        <h3 className="ep-exam-title">
                            {exam.title}
                        </h3>

                    </div>


                    {isActual && (

                        <span
                            className={`ep-availability-badge ${exam.availability_status
                                .toLowerCase()
                                .replace(
                                    " ",
                                    "-"
                                )}`}
                        >
                            {
                                exam.availability_status
                            }
                        </span>

                    )}

                </div>


                <div className="ep-exam-details">

                    <div className="ep-exam-detail">

                        <span className="ep-detail-label">
                            Type
                        </span>

                        <strong>
                            {exam.exam_type}
                        </strong>

                    </div>


                    <div className="ep-exam-detail">

                        <span className="ep-detail-label">
                            Duration
                        </span>

                        <strong>
                            {exam.duration} mins
                        </strong>

                    </div>


                    <div className="ep-exam-detail">

                        <span className="ep-detail-label">
                            Total Marks
                        </span>

                        <strong>
                            {exam.total_marks}
                        </strong>

                    </div>


                    <div className="ep-exam-detail">

                        <span className="ep-detail-label">
                            Passing Marks
                        </span>

                        <strong>
                            {exam.passing_marks}
                        </strong>

                    </div>

                </div>


                {isActual && (

                    <div className="ep-schedule-area">

                        <div className="ep-schedule-heading">
                            Assessment Schedule
                        </div>


                        <div className="ep-schedule-details">

                            <div>

                                <span>
                                    Starts
                                </span>

                                <strong>
                                    {
                                        exam.scheduled_start
                                    }
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Ends
                                </span>

                                <strong>
                                    {
                                        exam.scheduled_end
                                    }
                                </strong>

                            </div>

                        </div>

                    </div>

                )}

            </div>
        );
    };


    // ==========================================
    // Management Exam Card
    // ==========================================

    const renderManagementExamCard = (
        exam
    ) => {

        const isActual =
            exam.exam_type === "Actual";

        const isScheduled =
            isActual &&
            exam.is_scheduled;

        const isCardLoading =
            loadingExamId ===
            exam.exam_id;

        return (

            <div
                key={exam.exam_id}
                className={`ep-exam-card ${
                    isCardLoading
                        ? "ep-exam-card-loading"
                        : ""
                }`}
                onClick={() =>
                    handleExamClick(exam)
                }
                aria-busy={
                    isCardLoading
                }
            >

                <div className="ep-exam-card-header">

                    <div className="ep-exam-heading">

                        <span className="ep-exam-number">
                            EXAM #
                            {exam.exam_id}
                        </span>

                        <h3 className="ep-exam-title">
                            {exam.title}
                        </h3>

                    </div>


                    {isActual && (

                        <span
                            className={`ep-availability-badge ${
                                isScheduled
                                    ? "scheduled"
                                    : "not-scheduled"
                            }`}
                        >
                            {isScheduled
                                ? "Scheduled"
                                : "Not Scheduled"}
                        </span>

                    )}

                </div>


                <div className="ep-exam-details">

                    <div className="ep-exam-detail">

                        <span className="ep-detail-label">
                            Type
                        </span>

                        <strong>
                            {exam.exam_type}
                        </strong>

                    </div>


                    <div className="ep-exam-detail">

                        <span className="ep-detail-label">
                            Duration
                        </span>

                        <strong>
                            {exam.duration} mins
                        </strong>

                    </div>


                    <div className="ep-exam-detail">

                        <span className="ep-detail-label">
                            Total Marks
                        </span>

                        <strong>
                            {exam.total_marks}
                        </strong>

                    </div>


                    <div className="ep-exam-detail">

                        <span className="ep-detail-label">
                            Passing Marks
                        </span>

                        <strong>
                            {exam.passing_marks}
                        </strong>

                    </div>

                </div>


                {isActual && (

                    <div className="ep-schedule-area">

                        <div className="ep-schedule-heading">
                            Assessment Schedule
                        </div>


                        {isScheduled ? (

                            <div className="ep-schedule-details">

                                <div>

                                    <span>
                                        Starts
                                    </span>

                                    <strong>
                                        {
                                            exam.scheduled_start
                                        }
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Ends
                                    </span>

                                    <strong>
                                        {
                                            exam.scheduled_end
                                        }
                                    </strong>

                                </div>

                            </div>

                        ) : (

                            <p className="ep-schedule-empty">
                                This assessment has
                                not been scheduled yet.
                            </p>

                        )}

                    </div>

                )}

            </div>
        );
    };


    // ==========================================
    // Loading
    // ==========================================

    if (loading) {

        return (

            <div className="ep-page">

                <Navbar />

                <PageLoader
                    message="Loading Exams..."
                />

            </div>
        );
    }


    // ==========================================
    // Render
    // ==========================================

    return (

        <div className="ep-page">

            <Navbar />


            <main className="ep-page-container">


                {/* ==========================================
                    Page Header
                ========================================== */}

                <header className="ep-page-header">

                    <div>

                        <span className="ep-page-eyebrow">
                            {role === "Candidate"
                                ? "ASSESSMENTS"
                                : "EXAMINATION MANAGEMENT"}
                        </span>

                        <h1 className="ep-page-title">
                            Assessments & Exams
                        </h1>

                        <p className="ep-page-description">
                            {role === "Candidate"
                                ? "View your available assessments and practice examinations."
                                : "Review examination details and assessment schedules."}
                        </p>

                    </div>

                </header>


                {/* ==========================================
                    Search
                ========================================== */}

                <section className="ep-search-section">

                    <div className="ep-search-wrapper">

                        <input
                            id="exam-search"
                            type="text"
                            className="ep-search-input"
                            placeholder="🔍 Search by exam title or exam ID..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    {search.trim() && (

                        <p className="ep-search-summary">

                            Showing{" "}

                            <strong>
                                {filteredActualAssessments.length +
                                    filteredPracticeExams.length}
                            </strong>{" "}

                            matching{" "}

                            {filteredActualAssessments.length +
                                filteredPracticeExams.length ===
                            1
                                ? "exam"
                                : "exams"}

                        </p>

                    )}

                </section>


                {/* ==========================================
                    Actual Assessments
                ========================================== */}

                <section className="ep-section">

                    <div className="ep-section-header">

                        <div>

                            <span className="ep-section-kicker">
                                ACTUAL
                            </span>

                            <h2 className="ep-section-title">
                                Actual Assessments
                            </h2>

                            <p className="ep-section-description">
                                {role ===
                                "Candidate"
                                    ? "Assessments assigned to you with their current availability."
                                    : "Formal assessments created for candidate evaluation."}
                            </p>

                        </div>


                        <span className="ep-count-badge">

                            {
                                filteredActualAssessments.length
                            }{" "}

                            {filteredActualAssessments.length ===
                            1
                                ? "Assessment"
                                : "Assessments"}

                        </span>

                    </div>


                    {filteredActualAssessments.length ===
                    0 ? (

                        <div
                            key="actual-empty"
                            className="ep-empty-state"
                        >

                            <div className="ep-empty-icon">
                                —
                            </div>

                            <strong>
                                {search.trim()
                                    ? "No actual assessments match your search."
                                    : role ===
                                        "Candidate"
                                      ? "No actual assessments have been scheduled for you."
                                      : "No actual assessments have been created."}
                            </strong>

                        </div>

                    ) : (

                        <div
                            key="actual-results"
                            className="ep-exam-grid"
                        >

                            {filteredActualAssessments.map(
                                (exam) =>
                                    role ===
                                    "Candidate"
                                        ? renderCandidateExamCard(
                                              exam
                                          )
                                        : renderManagementExamCard(
                                              exam
                                          )
                            )}

                        </div>

                    )}

                </section>


                {/* ==========================================
                    Practice Exams
                ========================================== */}

                <section className="ep-section">

                    <div className="ep-section-header">

                        <div>

                            <span className="ep-section-kicker">
                                PRACTICE
                            </span>

                            <h2 className="ep-section-title">
                                Practice Exams
                            </h2>

                            <p className="ep-section-description">
                                {role ===
                                "Candidate"
                                    ? "Practice examinations available for preparation and revision."
                                    : "Practice examinations available for training and evaluation."}
                            </p>

                        </div>


                        <span className="ep-count-badge">

                            {
                                filteredPracticeExams.length
                            }{" "}

                            {filteredPracticeExams.length ===
                            1
                                ? "Exam"
                                : "Exams"}

                        </span>

                    </div>


                    {filteredPracticeExams.length ===
                    0 ? (

                        <div
                            key="practice-empty"
                            className="ep-empty-state"
                        >

                            <div className="ep-empty-icon">
                                —
                            </div>

                            <strong>
                                {search.trim()
                                    ? "No practice exams match your search."
                                    : role ===
                                        "Candidate"
                                      ? "No practice exams are currently available."
                                      : "No practice exams have been created."}
                            </strong>

                        </div>

                    ) : (

                        <div
                            key="practice-results"
                            className="ep-exam-grid"
                        >

                            {filteredPracticeExams.map(
                                (exam) =>
                                    role ===
                                    "Candidate"
                                        ? renderCandidateExamCard(
                                              exam
                                          )
                                        : renderManagementExamCard(
                                              exam
                                          )
                            )}

                        </div>

                    )}

                </section>


                {/* ==========================================
                    Candidate Exam Modal
                ========================================== */}

                {showModal &&
                    selectedExam && (

                        <div
                            className="ep-modal-overlay"
                            onClick={closeModal}
                        >

                            <div
                                className="ep-exam-modal"
                                onClick={(event) =>
                                    event.stopPropagation()
                                }
                            >

                                <div className="ep-modal-header">

                                    <span className="ep-modal-label">

                                        {modalMode ===
                                        "start"
                                            ? "Ready to Begin"
                                            : modalMode ===
                                                "resume"
                                              ? "Exam In Progress"
                                              : modalMode ===
                                                  "practice-completed"
                                                ? "Practice Completed"
                                                : "Already Attempted"}

                                    </span>


                                    <h2>

                                        {modalMode ===
                                        "start"
                                            ? "Start Exam"
                                            : modalMode ===
                                                "resume"
                                              ? "Resume Exam"
                                              : modalMode ===
                                                  "practice-completed"
                                                ? "Practice Exam Completed"
                                                : "Exam Already Attempted"}

                                    </h2>


                                    <p>
                                        {
                                            selectedExam.title
                                        }
                                    </p>

                                </div>


                                <div className="ep-modal-details">

                                    <div className="ep-modal-detail">

                                        <span>
                                            Duration
                                        </span>

                                        <strong>
                                            {
                                                selectedExam.duration
                                            }{" "}
                                            mins
                                        </strong>

                                    </div>


                                    <div className="ep-modal-detail">

                                        <span>
                                            Total Marks
                                        </span>

                                        <strong>
                                            {
                                                selectedExam.total_marks
                                            }
                                        </strong>

                                    </div>


                                    <div className="ep-modal-detail">

                                        <span>
                                            Passing Marks
                                        </span>

                                        <strong>
                                            {
                                                selectedExam.passing_marks
                                            }
                                        </strong>

                                    </div>

                                </div>


                                <div
                                    className={`ep-modal-warning ${
                                        modalMode ===
                                            "completed"
                                            ? "ep-modal-warning-danger"
                                            : modalMode ===
                                                "practice-completed"
                                              ? "ep-modal-warning-info"
                                              : ""
                                    }`}
                                >

                                    {modalMode ===
                                        "start" && (

                                        <>

                                            <strong>
                                                Before
                                                you begin
                                            </strong>

                                            <p>
                                                Once you
                                                click{" "}
                                                <strong>
                                                    Start
                                                    Exam
                                                </strong>
                                                , the timer
                                                will begin
                                                immediately.
                                            </p>

                                            <p>
                                                You cannot
                                                pause the
                                                examination
                                                once it has
                                                started.
                                            </p>

                                        </>

                                    )}


                                    {modalMode ===
                                        "resume" && (

                                        <>

                                            <strong>
                                                Your exam
                                                is already
                                                in progress.
                                            </strong>

                                            <p>
                                                The timer
                                                has
                                                continued
                                                running.
                                            </p>

                                            <p>
                                                Click{" "}
                                                <strong>
                                                    Resume
                                                    Exam
                                                </strong>{" "}
                                                to continue.
                                            </p>

                                        </>

                                    )}


                                    {modalMode ===
                                        "practice-completed" && (

                                        <>

                                            <strong>
                                                Practice
                                                attempt
                                                completed.
                                            </strong>

                                            <p>
                                                You have
                                                already
                                                completed
                                                this
                                                practice
                                                exam.
                                            </p>

                                            <p>
                                                You can
                                                attempt it
                                                again for
                                                further
                                                practice.
                                            </p>

                                        </>

                                    )}


                                    {modalMode ===
                                        "completed" && (

                                        <>

                                            <strong>
                                                This
                                                assessment
                                                has already
                                                been
                                                attempted.
                                            </strong>

                                            <p>
                                                Multiple
                                                attempts are
                                                not allowed
                                                for actual
                                                assessments.
                                            </p>

                                        </>

                                    )}

                                </div>


                                <div className="ep-modal-actions">

                                    <button
                                        type="button"
                                        className="ep-modal-cancel"
                                        onClick={
                                            closeModal
                                        }
                                        disabled={
                                            actionLoading
                                        }
                                    >
                                        Close
                                    </button>


                                    {modalMode ===
                                        "start" && (

                                        <button
                                            type="button"
                                            className={`ep-modal-start ${
                                                actionLoading
                                                    ? "ep-modal-start-loading"
                                                    : ""
                                            }`}
                                            onClick={
                                                handleStartExam
                                            }
                                            disabled={
                                                actionLoading
                                            }
                                        >
                                            {actionLoading
                                                ? "Starting..."
                                                : "Start Exam"}
                                        </button>

                                    )}


                                    {modalMode ===
                                        "resume" && (

                                        <button
                                            type="button"
                                            className={`ep-modal-start ${
                                                actionLoading
                                                    ? "ep-modal-start-loading"
                                                    : ""
                                            }`}
                                            onClick={
                                                handleResumeExam
                                            }
                                            disabled={
                                                actionLoading
                                            }
                                        >
                                            {actionLoading
                                                ? "Resuming..."
                                                : "Resume Exam"}
                                        </button>

                                    )}


                                    {modalMode ===
                                        "practice-completed" && (

                                        <button
                                            type="button"
                                            className={`ep-modal-start ${
                                                actionLoading
                                                    ? "ep-modal-start-loading"
                                                    : ""
                                            }`}
                                            onClick={
                                                handleStartExam
                                            }
                                            disabled={
                                                actionLoading
                                            }
                                        >
                                            {actionLoading
                                                ? "Starting..."
                                                : "Attempt Again"}
                                        </button>

                                    )}

                                </div>

                            </div>

                        </div>

                    )}

            </main>

        </div>
    );
}


export default ExamsPage;