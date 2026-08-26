import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import PageLoader from "../components/PageLoader";

import "../styles/ExamAnalyticsPage.css";


function ExamAnalyticsPage() {

    const [analytics, setAnalytics] = useState(null);
    const [schedules, setSchedules] = useState([]);

    const [batches, setBatches] = useState([]);
    const [candidates, setCandidates] = useState([]);


    const [showScheduleModal, setShowScheduleModal] =
        useState(false);

    const [selectedExamId, setSelectedExamId] =
        useState("");

    const [assignmentType, setAssignmentType] =
        useState("Batch");

    const [selectedBatchId, setSelectedBatchId] =
        useState("");

    const [selectedCandidateId, setSelectedCandidateId] =
        useState("");

    const [scheduledStart, setScheduledStart] =
        useState("");

    const [scheduledEnd, setScheduledEnd] =
        useState("");

    const [scheduling, setScheduling] =
        useState(false);


    const [showEditModal, setShowEditModal] =
        useState(false);

    const [editingScheduleId, setEditingScheduleId] =
        useState(null);

    const [editExamTitle, setEditExamTitle] =
        useState("");

    const [editAssignmentType, setEditAssignmentType] =
        useState("Batch");

    const [editBatchId, setEditBatchId] =
        useState("");

    const [editCandidateId, setEditCandidateId] =
        useState("");

    const [editScheduledStart, setEditScheduledStart] =
        useState("");

    const [editScheduledEnd, setEditScheduledEnd] =
        useState("");

    const [updatingSchedule, setUpdatingSchedule] =
        useState(false);

    const [cancellingScheduleId, setCancellingScheduleId] =
        useState(null);

    const [removingScheduleId, setRemovingScheduleId] =
        useState(null);


    const [deletingExamId, setDeletingExamId] =
        useState(null);


    useEffect(() => {
        fetchAnalytics();
        fetchSchedules();
        fetchBatches();
        fetchCandidates();
    }, []);


    const fetchAnalytics = async () => {

        try {

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/exam-analytics`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {

                console.error(
                    data.message ||
                        "Unable to load exam analytics."
                );

                return;
            }

            setAnalytics(data);

        } catch (error) {

            console.error(error);
        }
    };


    const fetchSchedules = async () => {

        try {

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/assessment-schedules`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {

                console.error(
                    data.message ||
                        "Unable to load assessment schedules."
                );

                return;
            }

            setSchedules(
                data.schedules || []
            );

        } catch (error) {

            console.error(error);
        }
    };


    const fetchBatches = async () => {

        try {

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/batches`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {

                console.error(
                    data.message ||
                        "Unable to load batches."
                );

                return;
            }

            setBatches(data || []);

        } catch (error) {

            console.error(error);
        }
    };


    const fetchCandidates = async () => {

        try {

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/assessment-candidates`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {

                console.error(
                    data.message ||
                        "Unable to load candidates."
                );

                return;
            }

            setCandidates(data || []);

        } catch (error) {

            console.error(error);
        }
    };


    const handleDeleteExam = async (exam) => {

        const confirmed = window.confirm(
            `Are you sure you want to delete "${exam.title}"?\n\nThis action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        try {

            setDeletingExamId(
                exam.exam_id
            );

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/delete-exam/${exam.exam_id}`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {

                alert(
                    data.message ||
                        "Unable to delete exam."
                );

                return;
            }

            alert(
                data.message ||
                    "Exam deleted successfully."
            );

            await fetchAnalytics();

        } catch (error) {

            console.error(error);

            alert(
                "Unable to delete exam."
            );

        } finally {

            setDeletingExamId(null);
        }
    };


    const openScheduleModal = () => {

        setSelectedExamId("");
        setAssignmentType("Batch");
        setSelectedBatchId("");
        setSelectedCandidateId("");
        setScheduledStart("");
        setScheduledEnd("");

        setShowScheduleModal(true);
    };


    const closeScheduleModal = () => {

        if (scheduling) {
            return;
        }

        setShowScheduleModal(false);

        setSelectedExamId("");
        setAssignmentType("Batch");
        setSelectedBatchId("");
        setSelectedCandidateId("");
        setScheduledStart("");
        setScheduledEnd("");
    };


    const handleAssignmentTypeChange = (type) => {

        setAssignmentType(type);

        setSelectedBatchId("");
        setSelectedCandidateId("");
    };


    const handleScheduleAssessment = async (
        event
    ) => {

        event.preventDefault();

        if (!selectedExamId) {

            alert(
                "Please select an assessment."
            );

            return;
        }

        if (
            assignmentType === "Batch" &&
            !selectedBatchId
        ) {

            alert(
                "Please select a batch."
            );

            return;
        }

        if (
            assignmentType === "Candidate" &&
            !selectedCandidateId
        ) {

            alert(
                "Please select a candidate."
            );

            return;
        }

        if (
            !scheduledStart ||
            !scheduledEnd
        ) {

            alert(
                "Please select the scheduled start and end time."
            );

            return;
        }

        const startDate =
            new Date(scheduledStart);

        const endDate =
            new Date(scheduledEnd);

        if (endDate <= startDate) {

            alert(
                "Scheduled end must be after the scheduled start."
            );

            return;
        }

        try {

            setScheduling(true);

            const token =
                localStorage.getItem("token");

            const requestBody = {

                exam_id:
                    Number(selectedExamId),

                batch_id:
                    assignmentType === "Batch"
                        ? Number(selectedBatchId)
                        : null,

                candidate_id:
                    assignmentType === "Candidate"
                        ? Number(selectedCandidateId)
                        : null,

                scheduled_start:
                    scheduledStart,

                scheduled_end:
                    scheduledEnd,
            };

            const response = await fetch(
                `${API_BASE_URL}/schedule-assessment`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body:
                        JSON.stringify(
                            requestBody
                        ),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.message ||
                        "Unable to schedule assessment."
                );

                return;
            }

            alert(
                data.message ||
                    "Assessment scheduled successfully."
            );

            closeScheduleModal();

            await fetchSchedules();
            await fetchAnalytics();

        } catch (error) {

            console.error(error);

            alert(
                "Unable to schedule assessment."
            );

        } finally {

            setScheduling(false);
        }
    };


    const formatDateTimeLocal = (value) => {

        if (!value) {
            return "";
        }

        return value
            .replace(" ", "T")
            .slice(0, 16);
    };


    const openEditScheduleModal = (
        schedule
    ) => {

        setEditingScheduleId(
            schedule.schedule_id
        );

        setEditExamTitle(
            schedule.exam_title || ""
        );

        setEditAssignmentType(
            schedule.assignment_type
        );

        setEditBatchId(
            schedule.batch_id
                ? String(schedule.batch_id)
                : ""
        );

        setEditCandidateId(
            schedule.candidate_id
                ? String(schedule.candidate_id)
                : ""
        );

        setEditScheduledStart(
            formatDateTimeLocal(
                schedule.scheduled_start
            )
        );

        setEditScheduledEnd(
            formatDateTimeLocal(
                schedule.scheduled_end
            )
        );

        setShowEditModal(true);
    };


    const closeEditScheduleModal = () => {

        if (updatingSchedule) {
            return;
        }

        setShowEditModal(false);
        setEditingScheduleId(null);
        setEditExamTitle("");
        setEditAssignmentType("Batch");
        setEditBatchId("");
        setEditCandidateId("");
        setEditScheduledStart("");
        setEditScheduledEnd("");
    };


    const handleEditAssignmentTypeChange = (
        type
    ) => {

        setEditAssignmentType(type);

        setEditBatchId("");
        setEditCandidateId("");
    };


    const handleUpdateSchedule = async (
        event
    ) => {

        event.preventDefault();

        if (!editingScheduleId) {
            return;
        }

        if (
            editAssignmentType === "Batch" &&
            !editBatchId
        ) {

            alert(
                "Please select a batch."
            );

            return;
        }

        if (
            editAssignmentType === "Candidate" &&
            !editCandidateId
        ) {

            alert(
                "Please select a candidate."
            );

            return;
        }

        if (
            !editScheduledStart ||
            !editScheduledEnd
        ) {

            alert(
                "Please select the scheduled start and end time."
            );

            return;
        }

        const startDate =
            new Date(editScheduledStart);

        const endDate =
            new Date(editScheduledEnd);

        if (endDate <= startDate) {

            alert(
                "Scheduled end must be after the scheduled start."
            );

            return;
        }

        try {

            setUpdatingSchedule(true);

            const token =
                localStorage.getItem("token");

            const requestBody = {

                batch_id:
                    editAssignmentType === "Batch"
                        ? Number(editBatchId)
                        : null,

                candidate_id:
                    editAssignmentType === "Candidate"
                        ? Number(editCandidateId)
                        : null,

                scheduled_start:
                    editScheduledStart,

                scheduled_end:
                    editScheduledEnd,
            };

            const response = await fetch(
                `${API_BASE_URL}/update-assessment-schedule/${editingScheduleId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body:
                        JSON.stringify(
                            requestBody
                        ),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {

                alert(
                    data.message ||
                        "Unable to update assessment schedule."
                );

                return;
            }

            alert(
                data.message ||
                    "Assessment schedule updated successfully."
            );

            setShowEditModal(false);
            setEditingScheduleId(null);

            await fetchSchedules();

        } catch (error) {

            console.error(error);

            alert(
                "Unable to update assessment schedule."
            );

        } finally {

            setUpdatingSchedule(false);
        }
    };


    const handleCancelSchedule = async (
        schedule
    ) => {

        const confirmed = window.confirm(
            `Are you sure you want to cancel the schedule for "${schedule.exam_title}"?`
        );

        if (!confirmed) {
            return;
        }

        try {

            setCancellingScheduleId(
                schedule.schedule_id
            );

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/cancel-assessment-schedule/${schedule.schedule_id}`,
                {
                    method: "DELETE",

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
                        "Unable to cancel assessment schedule."
                );

                return;
            }

            alert(
                data.message ||
                    "Assessment schedule cancelled successfully."
            );

            await fetchSchedules();
            await fetchAnalytics();

        } catch (error) {

            console.error(error);

            alert(
                "Unable to cancel assessment schedule."
            );

        } finally {

            setCancellingScheduleId(null);
        }
    };


    const handleRemoveSchedule = async (
        schedule
    ) => {

        const confirmed = window.confirm(
            `Remove the ended schedule for "${schedule.exam_title}"?\n\nThis will only remove the scheduling record. Exam submissions and results will not be deleted.`
        );

        if (!confirmed) {
            return;
        }

        try {

            setRemovingScheduleId(
                schedule.schedule_id
            );

            const token =
                localStorage.getItem("token");

            const response = await fetch(
                `${API_BASE_URL}/remove-assessment-schedule/${schedule.schedule_id}`,
                {
                    method: "DELETE",

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
                        "Unable to remove ended assessment schedule."
                );

                return;
            }

            alert(
                data.message ||
                    "Ended assessment schedule removed successfully."
            );

            await fetchSchedules();
            await fetchAnalytics();

        } catch (error) {

            console.error(error);

            alert(
                "Unable to remove ended assessment schedule."
            );

        } finally {

            setRemovingScheduleId(null);
        }
    };


    const actualExams =
        analytics?.exam_wise?.filter(
            (exam) =>
                exam.exam_type === "Actual"
        ) || [];


    if (!analytics) {

        return (
            <div className="eap-page">

                <Navbar />

                <PageLoader
                    message="Loading Exam Analytics..."
                />

            </div>
        );
    }


    return (
        <div className="eap-page">

            <Navbar />

            <main className="eap-page-container">

                <header className="eap-page-header">

                    <div>

                        <span className="eap-page-eyebrow">
                            ASSESSMENT MANAGEMENT
                        </span>

                        <h1 className="eap-page-title">
                            Exam Analytics
                        </h1>

                        <p className="eap-page-description">
                            Monitor exam configuration,
                            assessment scheduling and
                            examination readiness from
                            one place.
                        </p>

                    </div>

                </header>


                <section className="eap-summary-card">

                    <div className="eap-summary-header">

                        <div className="eap-summary-icon">

                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <rect
                                    x="5"
                                    y="4"
                                    width="14"
                                    height="17"
                                    rx="2"
                                />

                                <path d="M9 4V3h6v1" />

                                <path d="M9 9h6" />

                                <path d="M9 13h6" />

                                <path d="M9 17h4" />
                            </svg>

                        </div>


                        <div className="eap-summary-total">

                            <strong className="eap-summary-total-number">
                                {analytics.total_exams}
                            </strong>

                            <span className="eap-summary-total-label">
                                TOTAL ASSESSMENTS &amp; EXAMS
                            </span>

                        </div>

                    </div>


                    <div className="eap-summary-breakdown">

                        <div className="eap-summary-metric eap-summary-actual">

                            <strong className="eap-summary-metric-value">
                                {
                                    analytics.exam_wise.filter(
                                        (exam) =>
                                            exam.exam_type === "Actual"
                                    ).length
                                }
                            </strong>

                            <span className="eap-summary-metric-label">
                                {
                                    analytics.exam_wise.filter(
                                        (exam) =>
                                            exam.exam_type === "Actual"
                                    ).length === 1
                                        ? "Actual Assessment"
                                        : "Actual Assessments"
                                }
                            </span>

                        </div>


                        <div className="eap-summary-divider"></div>


                        <div className="eap-summary-metric eap-summary-practice">

                            <strong className="eap-summary-metric-value">
                                {
                                    analytics.exam_wise.filter(
                                        (exam) =>
                                            exam.exam_type === "Practice"
                                    ).length
                                }
                            </strong>

                            <span className="eap-summary-metric-label">
                                {
                                    analytics.exam_wise.filter(
                                        (exam) =>
                                            exam.exam_type === "Practice"
                                    ).length === 1
                                        ? "Practice Exam"
                                        : "Practice Exams"
                                }
                            </span>

                        </div>

                    </div>

                </section>


                <section className="eap-section">

                    <div className="eap-section-header">

                        <div>

                            <span className="eap-section-kicker">
                                SCHEDULING
                            </span>

                            <h2 className="eap-section-title">
                                Assessment Scheduling
                            </h2>

                            <p className="eap-section-description">
                                Manage scheduled Actual
                                assessments and their
                                assignments.
                            </p>

                        </div>

                        <button
                            type="button"
                            className="eap-primary-btn"
                            onClick={openScheduleModal}
                        >
                            <span className="eap-btn-icon">
                                +
                            </span>

                            Schedule Assessment
                        </button>

                    </div>


                    {schedules.length === 0 ? (

                        <div className="eap-empty-state">

                            <div className="eap-empty-icon">
                                —
                            </div>

                            <strong>
                                No assessments scheduled
                            </strong>

                            <p>
                                Create a schedule to
                                assign an Actual
                                assessment to a batch
                                or individual candidate.
                            </p>

                        </div>

                    ) : (

                        <div className="eap-schedule-list">

                            {schedules.map(
                                (schedule) => (

                                    <article
                                        key={schedule.schedule_id}
                                        className="eap-schedule-card"
                                    >

                                        <div className="eap-schedule-header">

                                            <div className="eap-schedule-heading">

                                                <span className="eap-schedule-category">
                                                    ACTUAL ASSESSMENT
                                                </span>

                                                <h3 className="eap-schedule-title">
                                                    {schedule.exam_title}
                                                </h3>

                                            </div>

                                            <span
                                                className={`eap-status-badge ${String(
                                                    schedule.status || ""
                                                )
                                                    .toLowerCase()
                                                    .replace(
                                                        /\s+/g,
                                                        "-"
                                                    )}`}
                                            >
                                                <span className="eap-status-dot"></span>

                                                {schedule.status}

                                            </span>

                                        </div>


                                        <div className="eap-schedule-details">

                                            <div className="eap-detail-item">

                                                <span className="eap-detail-label">
                                                    Assigned To
                                                </span>

                                                <strong>
                                                    {schedule.assigned_to}
                                                </strong>

                                            </div>


                                            <div className="eap-detail-item">

                                                <span className="eap-detail-label">
                                                    Assignment Type
                                                </span>

                                                <strong>
                                                    {schedule.assignment_type}
                                                </strong>

                                            </div>


                                            <div className="eap-detail-item">

                                                <span className="eap-detail-label">
                                                    Scheduled Start
                                                </span>

                                                <strong>
                                                    {schedule.scheduled_start}
                                                </strong>

                                            </div>


                                            <div className="eap-detail-item">

                                                <span className="eap-detail-label">
                                                    Scheduled End
                                                </span>

                                                <strong>
                                                    {schedule.scheduled_end}
                                                </strong>

                                            </div>


                                            <div className="eap-detail-item">

                                                <span className="eap-detail-label">
                                                    Scheduled By
                                                </span>

                                                <strong
                                                    className={
                                                        schedule.scheduled_by_name
                                                            ? ""
                                                            : "eap-deleted-user"
                                                    }
                                                >
                                                    {schedule.scheduled_by_name
                                                        ? schedule.scheduled_by_name
                                                        : "*Examiner account has been deleted*"}
                                                </strong>

                                            </div>

                                        </div>


                                        <div className="eap-schedule-footer">

                                            <span className="eap-schedule-id">
                                                Schedule ID:{" "}
                                                {schedule.schedule_id}
                                            </span>


                                            <div className="eap-schedule-actions">

                                                {schedule.status === "Upcoming" && (
                                                    <>

                                                        <button
                                                            type="button"
                                                            className="eap-secondary-btn eap-edit-btn"
                                                            onClick={() =>
                                                                openEditScheduleModal(
                                                                    schedule
                                                                )
                                                            }
                                                        >
                                                            Edit Schedule
                                                        </button>


                                                        <button
                                                            type="button"
                                                            className="eap-danger-btn"
                                                            onClick={() =>
                                                                handleCancelSchedule(
                                                                    schedule
                                                                )
                                                            }
                                                            disabled={
                                                                cancellingScheduleId ===
                                                                schedule.schedule_id
                                                            }
                                                        >
                                                            {cancellingScheduleId ===
                                                            schedule.schedule_id
                                                                ? "Cancelling..."
                                                                : "Cancel Schedule"}
                                                        </button>

                                                    </>
                                                )}


                                                {schedule.status === "Ended" && (

                                                    <button
                                                        type="button"
                                                        className="eap-secondary-btn"
                                                        onClick={() =>
                                                            handleRemoveSchedule(
                                                                schedule
                                                            )
                                                        }
                                                        disabled={
                                                            removingScheduleId ===
                                                            schedule.schedule_id
                                                        }
                                                    >
                                                        {removingScheduleId ===
                                                        schedule.schedule_id
                                                            ? "Removing..."
                                                            : "Remove Schedule"}
                                                    </button>

                                                )}

                                            </div>

                                        </div>

                                    </article>

                                )
                            )}

                        </div>

                    )}

                </section>


                <section className="eap-section eap-library-section">

                    <div className="eap-section-header">

                        <div>

                            <span className="eap-section-kicker">
                                EXAMINATION MANAGEMENT
                            </span>

                            <h2 className="eap-section-title">
                                Exam Library
                            </h2>

                            <p className="eap-section-description">
                                View exam configuration,
                                question coverage and
                                assessment scheduling
                                status.
                            </p>

                        </div>

                        <span className="eap-count-badge">
                            {analytics.total_exams}{" "}
                            {analytics.total_exams === 1
                                ? "Exam"
                                : "Exams"}
                        </span>

                    </div>


                    {analytics.exam_wise.length === 0 ? (

                        <div className="eap-empty-state">

                            <div className="eap-empty-icon">
                                —
                            </div>

                            <strong>
                                No exams created yet
                            </strong>

                            <p>
                                Exams will appear here
                                once they are created.
                            </p>

                        </div>

                    ) : (

                        <div className="eap-exam-grid">

                            {analytics.exam_wise.map(
                                (exam) => (

                                    <article
                                        key={exam.exam_id}
                                        className={`eap-exam-card ${
                                            exam.exam_type === "Actual"
                                                ? "eap-actual"
                                                : "eap-practice"
                                        }`}
                                    >

                                        <div className="eap-exam-header">

                                            <div className="eap-exam-heading">

                                                <span className="eap-exam-id">
                                                    EXAM #{exam.exam_id}
                                                </span>

                                                <h3 className="eap-exam-title">
                                                    {exam.title}
                                                </h3>

                                            </div>


                                            <span
                                                className={`eap-type-badge ${
                                                    exam.exam_type === "Actual"
                                                        ? "eap-type-actual"
                                                        : "eap-type-practice"
                                                }`}
                                            >
                                                {exam.exam_type}
                                            </span>

                                        </div>


                                        <div className="eap-config-grid">

                                            <div className="eap-config-item">

                                                <span>
                                                    Duration
                                                </span>

                                                <strong>
                                                    {exam.duration} mins
                                                </strong>

                                            </div>


                                            <div className="eap-config-item">

                                                <span>
                                                    Total Marks
                                                </span>

                                                <strong>
                                                    {exam.total_marks}
                                                </strong>

                                            </div>


                                            <div className="eap-config-item">

                                                <span>
                                                    Passing Marks
                                                </span>

                                                <strong>
                                                    {exam.passing_marks}
                                                </strong>

                                            </div>


                                            <div className="eap-config-item">

                                                <span>
                                                    Questions
                                                </span>

                                                <strong>
                                                    {exam.questions}
                                                </strong>

                                            </div>

                                        </div>


                                        <div className="eap-exam-status">

                                            {exam.exam_type === "Actual" ? (

                                                <>

                                                    <div className="eap-status-heading">

                                                        <span>
                                                            Assessment Scheduling
                                                        </span>

                                                        <span
                                                            className={`eap-library-status ${
                                                                exam.schedule_status ===
                                                                "Scheduled"
                                                                    ? "eap-status-scheduled"
                                                                    : "eap-status-not-scheduled"
                                                            }`}
                                                        >
                                                            <span className="eap-status-dot"></span>

                                                            {exam.schedule_status}

                                                        </span>

                                                    </div>


                                                    <p>
                                                        {exam.schedule_status ===
                                                        "Scheduled"
                                                            ? `${exam.schedule_count} schedule${
                                                                  exam.schedule_count !==
                                                                  1
                                                                      ? "s"
                                                                      : ""
                                                              } created for this assessment.`
                                                            : "This assessment has not been scheduled yet."}
                                                    </p>

                                                </>

                                            ) : (

                                                <>

                                                    <div className="eap-status-heading">

                                                        <span>
                                                            Practice Availability
                                                        </span>

                                                        <span className="eap-library-status eap-status-practice">

                                                            <span className="eap-status-dot"></span>

                                                            Available

                                                        </span>

                                                    </div>


                                                    <p>
                                                        Available to
                                                        candidates for
                                                        practice attempts.
                                                    </p>

                                                </>

                                            )}

                                        </div>


                                        <div className="eap-exam-footer">

                                            <span className="eap-created-by">
                                                Created by:{" "}

                                                <strong>
                                                    {exam.created_by_name || "-"}
                                                </strong>
                                            </span>


                                            <div className="eap-exam-actions">

                                                <Link
                                                    className="eap-edit-link"
                                                    to={`/edit-exam/${exam.exam_id}`}
                                                    onClick={(event) =>
                                                        event.stopPropagation()
                                                    }
                                                >
                                                    Edit Exam
                                                </Link>


                                                <button
                                                    type="button"
                                                    className="eap-delete-link"
                                                    onClick={(event) => {

                                                        event.stopPropagation();

                                                        handleDeleteExam(exam);

                                                    }}
                                                    disabled={
                                                        deletingExamId ===
                                                        exam.exam_id
                                                    }
                                                >
                                                    {deletingExamId ===
                                                    exam.exam_id
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </button>

                                            </div>

                                        </div>

                                    </article>

                                )
                            )}

                        </div>

                    )}

                </section>


                {showScheduleModal && (

                    <div className="eap-modal-overlay">

                        <div className="eap-modal">

                            <div className="eap-modal-header">

                                <div>

                                    <span className="eap-modal-kicker">
                                        SCHEDULING
                                    </span>

                                    <h2>
                                        Schedule Assessment
                                    </h2>

                                    <p>
                                        Assign an Actual
                                        assessment to a
                                        batch or individual
                                        candidate.
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="eap-modal-close"
                                    onClick={closeScheduleModal}
                                    aria-label="Close modal"
                                >
                                    ×
                                </button>

                            </div>


                            <form
                                onSubmit={handleScheduleAssessment}
                            >

                                <div className="eap-form-group">

                                    <label>
                                        Assessment
                                    </label>

                                    <select
                                        value={selectedExamId}
                                        onChange={(event) =>
                                            setSelectedExamId(
                                                event.target.value
                                            )
                                        }
                                        required
                                    >

                                        <option value="">
                                            Select Actual Assessment
                                        </option>

                                        {actualExams.map(
                                            (exam) => (

                                                <option
                                                    key={exam.exam_id}
                                                    value={exam.exam_id}
                                                >
                                                    {exam.title}
                                                </option>

                                            )
                                        )}

                                    </select>


                                    {actualExams.length === 0 && (

                                        <p className="eap-form-hint eap-warning">
                                            No Actual assessments
                                            are currently
                                            available in the
                                            Exam Library.
                                        </p>

                                    )}

                                </div>


                                <div className="eap-form-group">

                                    <label>
                                        Assign To
                                    </label>

                                    <div className="eap-assignment-options">

                                        <label
                                            className={`eap-assignment-option ${
                                                assignmentType === "Batch"
                                                    ? "eap-selected"
                                                    : ""
                                            }`}
                                        >

                                            <input
                                                type="radio"
                                                name="assignmentType"
                                                value="Batch"
                                                checked={
                                                    assignmentType ===
                                                    "Batch"
                                                }
                                                onChange={() =>
                                                    handleAssignmentTypeChange(
                                                        "Batch"
                                                    )
                                                }
                                            />

                                            <span>
                                                Batch
                                            </span>

                                        </label>


                                        <label
                                            className={`eap-assignment-option ${
                                                assignmentType ===
                                                "Candidate"
                                                    ? "eap-selected"
                                                    : ""
                                            }`}
                                        >

                                            <input
                                                type="radio"
                                                name="assignmentType"
                                                value="Candidate"
                                                checked={
                                                    assignmentType ===
                                                    "Candidate"
                                                }
                                                onChange={() =>
                                                    handleAssignmentTypeChange(
                                                        "Candidate"
                                                    )
                                                }
                                            />

                                            <span>
                                                Individual Candidate
                                            </span>

                                        </label>

                                    </div>

                                </div>


                                {assignmentType === "Batch" ? (

                                    <div className="eap-form-group">

                                        <label>
                                            Batch
                                        </label>

                                        <select
                                            value={selectedBatchId}
                                            onChange={(event) =>
                                                setSelectedBatchId(
                                                    event.target.value
                                                )
                                            }
                                            required
                                        >

                                            <option value="">
                                                Select Batch
                                            </option>

                                            {batches.map(
                                                (batch) => (

                                                    <option
                                                        key={
                                                            batch.batch_id
                                                        }
                                                        value={
                                                            batch.batch_id
                                                        }
                                                    >
                                                        {batch.batch_name}
                                                        {" "}
                                                        —
                                                        {" "}
                                                        {batch.candidate_count}
                                                        {" "}
                                                        candidate(s)
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                ) : (

                                    <div className="eap-form-group">

                                        <label>
                                            Candidate
                                        </label>

                                        <select
                                            value={
                                                selectedCandidateId
                                            }
                                            onChange={(event) =>
                                                setSelectedCandidateId(
                                                    event.target.value
                                                )
                                            }
                                            required
                                        >

                                            <option value="">
                                                Select Candidate
                                            </option>

                                            {candidates.map(
                                                (candidate) => (

                                                    <option
                                                        key={
                                                            candidate.user_id
                                                        }
                                                        value={
                                                            candidate.user_id
                                                        }
                                                    >
                                                        {candidate.name}
                                                        {" "}
                                                        —
                                                        {" "}
                                                        {candidate.email}
                                                        {candidate.batch_name
                                                            ? ` (${candidate.batch_name})`
                                                            : " (No Batch)"}
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                )}


                                <div className="eap-time-grid">

                                    <div className="eap-form-group">

                                        <label>
                                            Scheduled Start
                                        </label>

                                        <input
                                            type="datetime-local"
                                            value={
                                                scheduledStart
                                            }
                                            onChange={(event) =>
                                                setScheduledStart(
                                                    event.target.value
                                                )
                                            }
                                            required
                                        />

                                    </div>


                                    <div className="eap-form-group">

                                        <label>
                                            Scheduled End
                                        </label>

                                        <input
                                            type="datetime-local"
                                            value={
                                                scheduledEnd
                                            }
                                            onChange={(event) =>
                                                setScheduledEnd(
                                                    event.target.value
                                                )
                                            }
                                            required
                                        />

                                    </div>

                                </div>


                                <div className="eap-form-note">
                                    The assessment will only
                                    be accessible to the
                                    selected candidate or
                                    batch during the
                                    scheduled time window.
                                </div>


                                <div className="eap-modal-actions">

                                    <button
                                        type="button"
                                        className="eap-modal-cancel"
                                        onClick={closeScheduleModal}
                                        disabled={scheduling}
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="submit"
                                        className="eap-modal-submit"
                                        disabled={
                                            scheduling ||
                                            actualExams.length === 0
                                        }
                                    >
                                        {scheduling
                                            ? "Scheduling..."
                                            : "Schedule Assessment"}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                )}


                {showEditModal && (

                    <div className="eap-modal-overlay">

                        <div className="eap-modal">

                            <div className="eap-modal-header">

                                <div>

                                    <span className="eap-modal-kicker">
                                        SCHEDULE MANAGEMENT
                                    </span>

                                    <h2>
                                        Edit Schedule
                                    </h2>

                                    <p>
                                        Update the assignment
                                        or scheduled time for
                                        this upcoming
                                        assessment.
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="eap-modal-close"
                                    onClick={closeEditScheduleModal}
                                    aria-label="Close modal"
                                >
                                    ×
                                </button>

                            </div>


                            <form
                                onSubmit={handleUpdateSchedule}
                            >

                                <div className="eap-form-group">

                                    <label>
                                        Assessment
                                    </label>

                                    <input
                                        type="text"
                                        value={editExamTitle}
                                        disabled
                                    />

                                </div>


                                <div className="eap-form-group">

                                    <label>
                                        Assign To
                                    </label>

                                    <div className="eap-assignment-options">

                                        <label
                                            className={`eap-assignment-option ${
                                                editAssignmentType ===
                                                "Batch"
                                                    ? "eap-selected"
                                                    : ""
                                            }`}
                                        >

                                            <input
                                                type="radio"
                                                name="editAssignmentType"
                                                checked={
                                                    editAssignmentType ===
                                                    "Batch"
                                                }
                                                onChange={() =>
                                                    handleEditAssignmentTypeChange(
                                                        "Batch"
                                                    )
                                                }
                                            />

                                            <span>
                                                Batch
                                            </span>

                                        </label>


                                        <label
                                            className={`eap-assignment-option ${
                                                editAssignmentType ===
                                                "Candidate"
                                                    ? "eap-selected"
                                                    : ""
                                            }`}
                                        >

                                            <input
                                                type="radio"
                                                name="editAssignmentType"
                                                checked={
                                                    editAssignmentType ===
                                                    "Candidate"
                                                }
                                                onChange={() =>
                                                    handleEditAssignmentTypeChange(
                                                        "Candidate"
                                                    )
                                                }
                                            />

                                            <span>
                                                Individual Candidate
                                            </span>

                                        </label>

                                    </div>

                                </div>


                                {editAssignmentType === "Batch" ? (

                                    <div className="eap-form-group">

                                        <label>
                                            Batch
                                        </label>

                                        <select
                                            value={editBatchId}
                                            onChange={(event) =>
                                                setEditBatchId(
                                                    event.target.value
                                                )
                                            }
                                            required
                                        >

                                            <option value="">
                                                Select Batch
                                            </option>

                                            {batches.map(
                                                (batch) => (

                                                    <option
                                                        key={
                                                            batch.batch_id
                                                        }
                                                        value={
                                                            batch.batch_id
                                                        }
                                                    >
                                                        {batch.batch_name}
                                                        {" "}
                                                        —
                                                        {" "}
                                                        {batch.candidate_count}
                                                        {" "}
                                                        candidate(s)
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                ) : (

                                    <div className="eap-form-group">

                                        <label>
                                            Candidate
                                        </label>

                                        <select
                                            value={
                                                editCandidateId
                                            }
                                            onChange={(event) =>
                                                setEditCandidateId(
                                                    event.target.value
                                                )
                                            }
                                            required
                                        >

                                            <option value="">
                                                Select Candidate
                                            </option>

                                            {candidates.map(
                                                (candidate) => (

                                                    <option
                                                        key={
                                                            candidate.user_id
                                                        }
                                                        value={
                                                            candidate.user_id
                                                        }
                                                    >
                                                        {candidate.name}
                                                        {" "}
                                                        —
                                                        {" "}
                                                        {candidate.email}
                                                        {candidate.batch_name
                                                            ? ` (${candidate.batch_name})`
                                                            : " (No Batch)"}
                                                    </option>

                                                )
                                            )}

                                        </select>

                                    </div>

                                )}


                                <div className="eap-time-grid">

                                    <div className="eap-form-group">

                                        <label>
                                            Scheduled Start
                                        </label>

                                        <input
                                            type="datetime-local"
                                            value={
                                                editScheduledStart
                                            }
                                            onChange={(event) =>
                                                setEditScheduledStart(
                                                    event.target.value
                                                )
                                            }
                                            required
                                        />

                                    </div>


                                    <div className="eap-form-group">

                                        <label>
                                            Scheduled End
                                        </label>

                                        <input
                                            type="datetime-local"
                                            value={
                                                editScheduledEnd
                                            }
                                            onChange={(event) =>
                                                setEditScheduledEnd(
                                                    event.target.value
                                                )
                                            }
                                            required
                                        />

                                    </div>

                                </div>


                                <div className="eap-form-note">
                                    Only Upcoming assessment
                                    schedules can be
                                    modified.
                                </div>


                                <div className="eap-modal-actions">

                                    <button
                                        type="button"
                                        className="eap-modal-cancel"
                                        onClick={closeEditScheduleModal}
                                        disabled={
                                            updatingSchedule
                                        }
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="submit"
                                        className="eap-modal-submit"
                                        disabled={
                                            updatingSchedule
                                        }
                                    >
                                        {updatingSchedule
                                            ? "Updating..."
                                            : "Update Schedule"}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                )}

            </main>

        </div>
    );
}


export default ExamAnalyticsPage;