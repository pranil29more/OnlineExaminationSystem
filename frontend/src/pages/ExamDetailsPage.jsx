import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import API_BASE_URL from "../services/api";
import Navbar from "../components/Navbar";
import PageLoader from "../components/PageLoader";

import "../styles/ExamDetailsPage.css";


function ExamDetailsPage() {
    const { examId } = useParams();

    const navigate = useNavigate();

    // =====================================================
    // EXAM STATE
    // =====================================================

    const [exam, setExam] = useState(null);

    const [answers, setAnswers] = useState({});

    const [role, setRole] = useState("");

    const [timeLeft, setTimeLeft] = useState("");

    const [timerState, setTimerState] =
        useState("normal");

    const [submissionId, setSubmissionId] =
        useState(null);

    const [endTime, setEndTime] =
        useState(null);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [loadingExam, setLoadingExam] =
        useState(true);


    // =====================================================
    // TAB SWITCH STATE
    // =====================================================

    const [tabSwitchCount, setTabSwitchCount] =
        useState(0);

    const [tabWarning, setTabWarning] =
        useState(null);

    const [tabWarningVisible, setTabWarningVisible] =
        useState(false);


    // =====================================================
    // CODING STATE
    // =====================================================

    /*
     * codingDetails:
     *
     * {
     *     [codingQuestionId]: {
     *         coding_question_id,
     *         exam_id,
     *         question_text,
     *         difficulty,
     *         marks,
     *         starter_code,
     *         language,
     *         time_limit,
     *         submission_id
     *     }
     * }
     */

    const [codingDetails, setCodingDetails] =
        useState({});


    /*
     * codingCode:
     *
     * {
     *     [codingQuestionId]: "source code"
     * }
     */

    const [codingCode, setCodingCode] =
        useState({});


    /*
     * codingTouched:
     *
     * Tracks whether the candidate has actually interacted
     * with a coding question. Starter code loaded into the
     * editor does NOT count as an attempted answer.
     *
     * {
     *     [codingQuestionId]: true
     * }
     */

    const [codingTouched, setCodingTouched] =
        useState({});


    /* Latest coding state for timer-driven auto-submit. */
    const codingCodeRef =
        useRef({});

    const codingTouchedRef =
        useRef({});

    /*
     * Keep the active submission ID in a ref as well as state.
     * This is important during refresh/auto-submit because React
     * state updates are asynchronous.
     */
    const activeSubmissionIdRef =
        useRef(null);


    /*
     * Coding drafts are persisted locally while the candidate is
     * actively taking the exam. The submission ID is part of the
     * key, so a draft can never be mixed with another exam attempt.
     */
    const getCodingDraftStorageKey =
        (activeId) =>
            activeId
                ? `oes_exam_coding_draft_${activeId}`
                : null;

    const readCodingDraft =
        (activeId) => {
            const key =
                getCodingDraftStorageKey(
                    activeId
                );

            if (!key) {
                return null;
            }

            try {
                const raw =
                    localStorage.getItem(
                        key
                    );

                if (!raw) {
                    return null;
                }

                const parsed =
                    JSON.parse(raw);

                return parsed &&
                    typeof parsed ===
                        "object"
                    ? parsed
                    : null;
            } catch (error) {
                console.warn(
                    "Unable to restore coding draft:",
                    error
                );

                return null;
            }
        };

    const persistCodingDraft =
        (
            activeId,
            codeMap,
            touchedMap
        ) => {
            const key =
                getCodingDraftStorageKey(
                    activeId
                );

            if (!key) {
                return;
            }

            try {
                localStorage.setItem(
                    key,
                    JSON.stringify({
                        code: codeMap,
                        touched: touchedMap,
                        updated_at: Date.now(),
                    })
                );
            } catch (error) {
                console.warn(
                    "Unable to persist coding draft:",
                    error
                );
            }
        };

    const clearCodingDraft =
        (activeId) => {
            const key =
                getCodingDraftStorageKey(
                    activeId
                );

            if (!key) {
                return;
            }

            try {
                localStorage.removeItem(
                    key
                );
            } catch (error) {
                console.warn(
                    "Unable to clear coding draft:",
                    error
                );
            }
        };


    /*
     * codingRunResults:
     *
     * {
     *     [codingQuestionId]: {
     *         status,
     *         passed_tests,
     *         total_tests,
     *         results
     *     }
     * }
     */

    const [codingRunResults, setCodingRunResults] =
        useState({});


    /*
     * codingRunning:
     *
     * {
     *     [codingQuestionId]: true / false
     * }
     */

    const [codingRunning, setCodingRunning] =
        useState({});


    /*
     * codingLoading:
     *
     * {
     *     [codingQuestionId]: true / false
     * }
     */

    const [codingLoading, setCodingLoading] =
        useState({});


    /*
     * codingErrors:
     *
     * {
     *     [codingQuestionId]: "error message"
     * }
     */

    const [codingErrors, setCodingErrors] =
        useState({});


    // =====================================================
    // REFS
    // =====================================================

    const hasAutoSubmitted =
        useRef(false);

    const pendingSaves =
        useRef(new Set());

    const answerRequestVersions =
        useRef({});

    const tabSwitchCountRef =
        useRef(0);

    const wasHidden =
        useRef(false);

    const tabSwitchRequestInProgress =
        useRef(false);

    const warningTimeout =
        useRef(null);


    // =====================================================
    // HELPER
    // Determine whether a question is a coding question.
    // =====================================================

    const isCodingQuestion = (
        question
    ) => {
        if (!question) {
            return false;
        }

        const type =
            String(
                question.type ??
                question.question_type ??
                ""
            ).toUpperCase();

        return (
            type === "CODING" ||
            question.coding_question_id != null ||
            question.codingQuestionId != null
        );
    };


    // =====================================================
    // HELPER
    // Get coding_question_id safely.
    // =====================================================

    const getCodingQuestionId = (
        question
    ) => {
        if (!question) {
            return null;
        }

        return (
            question.coding_question_id ??
            question.codingQuestionId ??
            null
        );
    };


    // =====================================================
    // Parse Backend IST Time Safely
    // =====================================================

    const parseISTTime = (
        value
    ) => {
        if (!value) {
            return NaN;
        }

        const normalized =
            String(value)
                .trim()
                .replace(" ", "T");

        if (
            normalized.endsWith("Z") ||
            /[+-]\d{2}:\d{2}$/.test(
                normalized
            )
        ) {
            return new Date(
                normalized
            ).getTime();
        }

        return new Date(
            `${normalized}+05:30`
        ).getTime();
    };


    // =====================================================
    // Show Tab Warning
    // =====================================================

    const showTabWarning = (
        count,
        isViolation = false
    ) => {
        if (warningTimeout.current) {
            clearTimeout(
                warningTimeout.current
            );

            warningTimeout.current =
                null;
        }

        if (isViolation) {
            setTabWarning({
                type: "violation",

                title:
                    "Examination Terminated",

                message:
                    "You have reached the maximum of 3 tab switches. Your examination has been automatically submitted due to violation.",
            });

            setTabWarningVisible(
                true
            );

            return;
        }

        setTabWarning({
            type: "warning",

            title:
                `Warning ${count}/3`,

            message:
                `You switched away from the examination. This is tab switch ${count} of 3. After 3 tab switches, your examination will be automatically submitted.`,
        });

        setTabWarningVisible(
            true
        );

        warningTimeout.current =
            setTimeout(
                () => {
                    setTabWarningVisible(
                        false
                    );

                    setTabWarning(
                        null
                    );

                    warningTimeout.current =
                        null;
                },
                6000
            );
    };


    // =====================================================
    // Record Tab Switch With Backend
    // =====================================================

    const recordTabSwitch =
        async () => {
            if (
                !submissionId ||
                hasAutoSubmitted.current ||
                isSubmitting ||
                tabSwitchRequestInProgress.current
            ) {
                return;
            }

            tabSwitchRequestInProgress.current =
                true;

            try {
                /*
                 * IMPORTANT ORDER OF OPERATIONS
                 *
                 * The backend /tab-switch endpoint automatically
                 * finalizes the examination when the count reaches 3.
                 * Therefore, on the third switch we MUST save the latest
                 * coding answers BEFORE calling /tab-switch.
                 *
                 * Otherwise /tab-switch changes the submission status
                 * to "Auto Submitted" first, and a later /coding/submit
                 * request is rejected because the submission is no longer
                 * In Progress. That is the reason for the
                 * "Invalid submission or coding question" error.
                 */
                const isFinalTabSwitch =
                    tabSwitchCountRef.current >= 2;

                /*
                 * IMPORTANT UX FIX:
                 *
                 * On the third tab switch, do NOT wait for coding
                 * execution before showing the termination warning.
                 * /coding/submit can execute visible + hidden tests
                 * through Modal and may take several seconds.
                 *
                 * We show the final warning immediately, while still
                 * preserving the required backend order:
                 *
                 *     1. Save coding answers
                 *     2. Call /tab-switch
                 *     3. Backend finalizes the exam
                 *
                 * This removes the 5-6 second visual delay without
                 * allowing /tab-switch to finalize the submission before
                 * the coding submission exists.
                 */
                const violationWarningStartedAt =
                    isFinalTabSwitch
                        ? Date.now()
                        : null;

                if (isFinalTabSwitch) {
                    showTabWarning(3, true);
                }

                if (isFinalTabSwitch) {
                    try {
                        await submitAllCodingAnswers();
                    } catch (codingSaveError) {
                        /*
                         * Do not prevent the tab-switch violation from
                         * being recorded. The local draft is already
                         * persisted on every editor change, and the
                         * backend will finalize the examination even if
                         * a coding submission cannot be created.
                         */
                        console.error(
                            "Unable to save coding answers before tab-switch auto-submit:",
                            codingSaveError
                        );
                    }
                }

                const token =
                    localStorage.getItem(
                        "token"
                    );

                const response =
                    await fetch(
                        `${API_BASE_URL}/tab-switch`,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`,
                            },

                            body:
                                JSON.stringify({
                                    submission_id:
                                        activeSubmissionIdRef.current ||
                                        submissionId,
                                }),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    console.error(
                        "Tab switch recording failed:",
                        data
                    );

                    return;
                }

                const serverCount =
                    Number(
                        data.tab_switch_count
                    );

                if (
                    Number.isFinite(
                        serverCount
                    )
                ) {
                    tabSwitchCountRef.current =
                        serverCount;

                    setTabSwitchCount(
                        serverCount
                    );
                }

                // =================================================
                // Violation / Auto Submission
                // =================================================

                if (
                    data.violation ===
                        true ||
                    data.auto_submitted ===
                        true ||
                    serverCount >= 3
                ) {
                    hasAutoSubmitted.current =
                        true;

                    setTabSwitchCount(
                        3
                    );

                    tabSwitchCountRef.current =
                        3;

                    setIsSubmitting(
                        true
                    );

                    /*
                     * The final warning was already displayed immediately
                     * when the third tab switch was detected. Do not reset
                     * it here, otherwise the user would get another delay
                     * after the coding save completes.
                     *
                     * Keep the warning visible for approximately 6 seconds
                     * total from the moment it first appeared.
                     */
                    const warningElapsed =
                        violationWarningStartedAt
                            ? Date.now() -
                              violationWarningStartedAt
                            : 0;

                    const warningRemaining =
                        Math.max(
                            0,
                            6000 - warningElapsed
                        );

                    /*
                     * The backend has already finalized the submission.
                     * Do NOT call handleSubmitExam() here because it would
                     * try to submit coding answers again against a completed
                     * submission. Simply navigate after the remaining
                     * warning duration.
                     */
                    setTimeout(
                        () => {
                            clearCodingDraft(
                                activeSubmissionIdRef.current ||
                                    submissionId
                            );

                            navigate(
                                "/results"
                            );
                        },
                        warningRemaining
                    );

                    return;
                }

                // =================================================
                // Normal Warning
                // =================================================

                showTabWarning(
                    serverCount
                );
            } catch (error) {
                console.error(
                    "Unable to record tab switch:",
                    error
                );
            } finally {
                tabSwitchRequestInProgress.current =
                    false;
            }
        };


    // =====================================================
    // Fetch Coding Question Details
    // =====================================================

    const loadCodingQuestion = async (
        codingQuestionId
    ) => {
        if (!codingQuestionId) {
            return;
        }

        setCodingLoading(
            (previous) => ({
                ...previous,

                [codingQuestionId]:
                    true,
            })
        );

        setCodingErrors(
            (previous) => ({
                ...previous,

                [codingQuestionId]:
                    null,
            })
        );

        try {
            const token =
                localStorage.getItem(
                    "token"
                );

            const response =
                await fetch(
                    `${API_BASE_URL}/coding/question/${codingQuestionId}`,
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
                throw new Error(
                    data.message ||
                        "Unable to load coding question."
                );
            }

            setCodingDetails(
                (previous) => ({
                    ...previous,

                    [codingQuestionId]:
                        data,
                })
            );

            /*
             * Restore the candidate's locally persisted draft when
             * this page is refreshed. If no draft exists, fall back
             * to the backend-provided starter code.
             */
            const activeId =
                activeSubmissionIdRef.current;

            const draft =
                readCodingDraft(
                    activeId
                );

            const savedCode =
                draft?.code?.[
                    codingQuestionId
                ];

            const savedTouched =
                Boolean(
                    draft?.touched?.[
                        codingQuestionId
                    ]
                );

            const backendCode =
                codingCodeRef.current[
                    codingQuestionId
                ];

            const initialCode =
                typeof savedCode ===
                    "string"
                    ? savedCode
                    : typeof backendCode ===
                        "string"
                        ? backendCode
                        : (
                            data.starter_code ||
                            ""
                        );

            const backendTouched =
                Boolean(
                    codingTouchedRef.current[
                        codingQuestionId
                    ]
                );

            const initialTouched =
                savedTouched ||
                backendTouched;

            codingCodeRef.current = {
                ...codingCodeRef.current,
                [codingQuestionId]:
                    initialCode,
            };

            if (
                initialTouched
            ) {
                codingTouchedRef.current = {
                    ...codingTouchedRef.current,
                    [codingQuestionId]:
                        true,
                };
            }

            setCodingCode(
                (previous) => ({
                    ...previous,

                    [codingQuestionId]:
                        initialCode,
                })
            );

            if (
                initialTouched
            ) {
                setCodingTouched(
                    (previous) => ({
                        ...previous,

                        [codingQuestionId]:
                            true,
                    })
                );
            }
        } catch (error) {
            console.error(
                "Unable to load coding question:",
                error
            );

            setCodingErrors(
                (previous) => ({
                    ...previous,

                    [codingQuestionId]:
                        error.message ||
                        "Unable to load coding question.",
                })
            );
        } finally {
            setCodingLoading(
                (previous) => ({
                    ...previous,

                    [codingQuestionId]:
                        false,
                })
            );
        }
    };


    // =====================================================
    // Load All Coding Questions For Active Session
    // =====================================================

    const loadCodingQuestions =
        async (
            questions
        ) => {
            if (
                !Array.isArray(
                    questions
                )
            ) {
                return;
            }

            const codingQuestions =
                questions.filter(
                    (question) =>
                        isCodingQuestion(
                            question
                        )
                );

            if (
                codingQuestions.length ===
                0
            ) {
                return;
            }

            const questionIds =
                codingQuestions
                    .map(
                        (
                            question
                        ) =>
                            getCodingQuestionId(
                                question
                            )
                    )
                    .filter(
                        Boolean
                    );

            /*
             * If a coding question has no
             * coding_question_id, we cannot call
             * /coding/question/<id>.
             *
             * We deliberately do not guess the ID.
             */

            codingQuestions.forEach(
                (question) => {
                    const id =
                        getCodingQuestionId(
                            question
                        );

                    if (!id) {
                        setCodingErrors(
                            (previous) => ({
                                ...previous,

                                [
                                    `question-${question.question_id}`
                                ]:
                                    "Coding question mapping is missing. The exam API must provide coding_question_id.",
                            })
                        );
                    }
                }
            );

            if (
                questionIds.length ===
                0
            ) {
                return;
            }

            await Promise.all(
                questionIds.map(
                    (id) =>
                        loadCodingQuestion(
                            id
                        )
                )
            );
        };


    // =====================================================
    // Fetch Exam
    // =====================================================

    useEffect(() => {
        fetchExam();
    }, [examId]);


    // =====================================================
    // Tab Switch Detection
    // =====================================================

    useEffect(() => {
        if (
            role !==
                "Candidate" ||
            !submissionId
        ) {
            return;
        }

        const handleVisibilityChange =
            () => {
                if (
                    document.visibilityState ===
                    "hidden"
                ) {
                    wasHidden.current =
                        true;

                    return;
                }

                if (
                    document.visibilityState ===
                        "visible" &&
                    wasHidden.current
                ) {
                    wasHidden.current =
                        false;

                    recordTabSwitch();
                }
            };

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, [
        role,
        submissionId,
    ]);


    // =====================================================
    // Cleanup Warning Timer
    // =====================================================

    useEffect(() => {
        return () => {
            if (
                warningTimeout.current
            ) {
                clearTimeout(
                    warningTimeout.current
                );
            }
        };
    }, []);


    // =====================================================
    // Exam Timer
    // =====================================================

    useEffect(() => {
        if (!endTime) {
            return;
        }

        const updateTimer = () => {
            const remaining =
                endTime -
                Date.now();

            if (
                remaining <= 0
            ) {
                setTimeLeft(
                    "00:00"
                );

                setTimerState(
                    "critical"
                );

                if (
                    !hasAutoSubmitted.current
                ) {
                    hasAutoSubmitted.current =
                        true;

                    setIsSubmitting(
                        true
                    );

                    handleSubmitExam(
                        true
                    );
                }

                return;
            }

            const totalSeconds =
                Math.floor(
                    remaining /
                        1000
                );

            const minutes =
                Math.floor(
                    remaining /
                        60000
                );

            const seconds =
                Math.floor(
                    (
                        remaining %
                        60000
                    ) / 1000
                );

            if (
                totalSeconds <=
                300
            ) {
                setTimerState(
                    "critical"
                );
            } else if (
                totalSeconds <=
                600
            ) {
                setTimerState(
                    "warning"
                );
            } else {
                setTimerState(
                    "normal"
                );
            }

            setTimeLeft(
                `${String(
                    minutes
                ).padStart(
                    2,
                    "0"
                )}:${String(
                    seconds
                ).padStart(
                    2,
                    "0")}`
            );
        };

        updateTimer();

        const timer =
            setInterval(
                updateTimer,
                1000
            );

        return () => {
            clearInterval(
                timer
            );
        };
    }, [endTime]);


    // =====================================================
    // Fetch Exam + Candidate Session
    // =====================================================

    const fetchExam =
        async () => {
            try {
                setLoadingExam(
                    true
                );

                const token =
                    localStorage.getItem(
                        "token"
                    );

                // =================================================
                // Fetch Exam
                // =================================================

                const examResponse =
                    await fetch(
                        `${API_BASE_URL}/exam/${examId}`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    );

                const examData =
                    await examResponse.json();

                if (
                    !examResponse.ok
                ) {
                    alert(
                        examData.message ||
                            "Unable to access this assessment."
                    );

                    navigate(
                        "/exams"
                    );

                    return;
                }

                if (
                    !examData.exam ||
                    !Array.isArray(
                        examData.questions
                    )
                ) {
                    alert(
                        "Unable to load assessment details."
                    );

                    navigate(
                        "/exams"
                    );

                    return;
                }

                // =================================================
                // Fetch Profile
                // =================================================

                const profileResponse =
                    await fetch(
                        `${API_BASE_URL}/profile`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    );

                const profileData =
                    await profileResponse.json();

                if (
                    !profileResponse.ok
                ) {
                    alert(
                        profileData.message ||
                            "Unable to load user profile."
                    );

                    navigate(
                        "/exams"
                    );

                    return;
                }

                const currentRole =
                    profileData.role ||
                    "";

                setRole(
                    currentRole
                );

                // =================================================
                // Admin / Examiner
                // =================================================

                if (
                    currentRole !==
                    "Candidate"
                ) {
                    setExam(
                        examData
                    );

                    return;
                }

                // =================================================
                // Candidate Session
                // =================================================

                const sessionResponse =
                    await fetch(
                        `${API_BASE_URL}/exam-session/${examId}`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    );

                const sessionData =
                    await sessionResponse.json();

                if (
                    !sessionResponse.ok
                ) {
                    alert(
                        sessionData.message ||
                            "Unable to load exam session."
                    );

                    navigate(
                        "/exams"
                    );

                    return;
                }

                // =================================================
                // Restore Tab Switch Count
                // =================================================

                const restoredTabSwitchCount =
                    Number(
                        sessionData.tab_switch_count
                    );

                if (
                    Number.isFinite(
                        restoredTabSwitchCount
                    ) &&
                    restoredTabSwitchCount >=
                        0
                ) {
                    tabSwitchCountRef.current =
                        restoredTabSwitchCount;

                    setTabSwitchCount(
                        restoredTabSwitchCount
                    );
                } else {
                    tabSwitchCountRef.current =
                        0;

                    setTabSwitchCount(
                        0
                    );
                }

                // =================================================
                // Not Started
                // =================================================

                if (
                    sessionData.status ===
                    "Not Started"
                ) {
                    setExam(
                        examData
                    );

                    return;
                }

                // =================================================
                // Practice Completed
                // =================================================

                if (
                    sessionData.status ===
                    "Practice Completed"
                ) {
                    setExam(
                        examData
                    );

                    return;
                }

                // =================================================
                // Completed / Auto Submitted / Violation
                // =================================================

                if (
                    sessionData.status ===
                        "Completed" ||
                    sessionData.status ===
                        "Auto Submitted" ||
                    sessionData.status ===
                        "Violation"
                ) {
                    setExam(
                        examData
                    );

                    return;
                }

                // =================================================
                // Unknown Session State
                // =================================================

                if (
                    sessionData.status !==
                    "In Progress"
                ) {
                    setExam(
                        examData
                    );

                    return;
                }

                // =================================================
                // Validate Active Session Data
                // =================================================

                if (
                    !sessionData.submission_id ||
                    !sessionData.start_time ||
                    !sessionData.duration
                ) {
                    alert(
                        "Unable to restore your active examination session."
                    );

                    navigate(
                        "/exams"
                    );

                    return;
                }

                // =================================================
                // Restore Submission ID
                // =================================================

                activeSubmissionIdRef.current =
                    sessionData.submission_id;

                setSubmissionId(
                    sessionData.submission_id
                );

                // =================================================
                // Restore Saved MCQ Answers
                // =================================================

                const restoredAnswers =
                    {};

                if (
                    Array.isArray(
                        sessionData.answers
                    )
                ) {
                    sessionData.answers.forEach(
                        (
                            answer
                        ) => {
                            if (
                                answer.question_id !==
                                    null &&
                                answer.answer_text !==
                                    null
                            ) {
                                restoredAnswers[
                                    answer.question_id
                                ] =
                                    answer.answer_text;
                            }
                        }
                    );
                }

                setAnswers(
                    restoredAnswers
                );

                // =================================================
                // Restore Saved Coding Submissions
                //
                // The backend returns the latest code submission for
                // every coding question. Seed the refs before
                // loadCodingQuestions() runs. LocalStorage is still
                // allowed to override this value when it contains a
                // newer unsent draft.
                // =================================================

                if (
                    Array.isArray(
                        sessionData.coding_submissions
                    )
                ) {
                    const restoredCodingCode =
                        {};

                    const restoredCodingTouched =
                        {};

                    sessionData.coding_submissions.forEach(
                        (
                            codingSubmission
                        ) => {
                            const codingQuestionId =
                                codingSubmission.coding_question_id;

                            if (
                                codingQuestionId != null &&
                                typeof codingSubmission.source_code ===
                                    "string"
                            ) {
                                restoredCodingCode[
                                    codingQuestionId
                                ] =
                                    codingSubmission.source_code;

                                restoredCodingTouched[
                                    codingQuestionId
                                ] =
                                    true;
                            }
                        }
                    );

                    codingCodeRef.current = {
                        ...codingCodeRef.current,
                        ...restoredCodingCode,
                    };

                    codingTouchedRef.current = {
                        ...codingTouchedRef.current,
                        ...restoredCodingTouched,
                    };

                    setCodingCode(
                        (previous) => ({
                            ...restoredCodingCode,
                            ...previous,
                        })
                    );

                    setCodingTouched(
                        (previous) => ({
                            ...restoredCodingTouched,
                            ...previous,
                        })
                    );
                }

                // =================================================
                // Calculate Actual Attempt Deadline
                // =================================================

                const start =
                    parseISTTime(
                        sessionData.start_time
                    );

                const duration =
                    Number(
                        sessionData.duration
                    );

                if (
                    Number.isNaN(
                        start
                    ) ||
                    !Number.isFinite(
                        duration
                    ) ||
                    duration <= 0
                ) {
                    alert(
                        "Unable to restore the examination timer."
                    );

                    navigate(
                        "/exams"
                    );

                    return;
                }

                const end =
                    start +
                    duration *
                        60 *
                        1000;

                // =================================================
                // Render Active Exam
                // =================================================

                setExam(
                    examData
                );

                // =================================================
                // Load Coding Questions + restore any coding draft
                // BEFORE starting the timer effect.
                // =================================================

                await loadCodingQuestions(
                    examData.questions
                );

                setEndTime(
                    end
                );
            } catch (error) {
                console.error(
                    error
                );

                alert(
                    "Unable to load assessment."
                );

                navigate(
                    "/exams"
                );
            } finally {
                setLoadingExam(
                    false
                );
            }
        };


    // =====================================================
    // Wait For Pending MCQ Saves
    // =====================================================

    const waitForPendingSaves =
        async () => {
            const requests =
                Array.from(
                    pendingSaves.current
                );

            if (
                requests.length ===
                0
            ) {
                return;
            }

            await Promise.allSettled(
                requests
            );
        };


    // =====================================================
    // Handle MCQ Answer Change
    // =====================================================

    const handleAnswerChange =
        async (
            questionId,
            optionText
        ) => {
            if (
                isSubmitting ||
                hasAutoSubmitted.current
            ) {
                return;
            }

            if (
                !submissionId
            ) {
                alert(
                    "Your exam session is not ready. Please refresh the page."
                );

                return;
            }

            const previousAnswer =
                answers[
                    questionId
                ];

            const currentVersion =
                (
                    answerRequestVersions
                        .current[
                        questionId
                    ] || 0
                ) + 1;

            answerRequestVersions
                .current[
                    questionId
                ] =
                currentVersion;

            setAnswers(
                (previous) => ({
                    ...previous,

                    [questionId]:
                        optionText,
                })
            );

            const token =
                localStorage.getItem(
                    "token"
                );

            const saveRequest =
                fetch(
                    `${API_BASE_URL}/save-answer`,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`,
                        },

                        body:
                            JSON.stringify({
                                submission_id:
                                    submissionId,

                                question_id:
                                    questionId,

                                answer_text:
                                    optionText,
                            }),
                    }
                );

            pendingSaves.current.add(
                saveRequest
            );

            try {
                const response =
                    await saveRequest;

                const data =
                    await response.json();

                if (
                    !response.ok
                ) {
                    if (
                        answerRequestVersions
                            .current[
                            questionId
                        ] ===
                        currentVersion
                    ) {
                        setAnswers(
                            (
                                previous
                            ) => {
                                const restored =
                                    {
                                        ...previous,
                                    };

                                if (
                                    previousAnswer ===
                                    undefined
                                ) {
                                    delete restored[
                                        questionId
                                    ];
                                } else {
                                    restored[
                                        questionId
                                    ] =
                                        previousAnswer;
                                }

                                return restored;
                            }
                        );
                    }

                    alert(
                        data.message ||
                            "Unable to save your answer."
                    );

                    return;
                }
            } catch (error) {
                console.error(
                    error
                );

                if (
                    answerRequestVersions
                        .current[
                        questionId
                    ] ===
                    currentVersion
                ) {
                    setAnswers(
                        (
                            previous
                        ) => {
                            const restored =
                                {
                                    ...previous,
                                };

                            if (
                                previousAnswer ===
                                undefined
                            ) {
                                delete restored[
                                    questionId
                                ];
                            } else {
                                restored[
                                    questionId
                                ] =
                                    previousAnswer;
                            }

                            return restored;
                        }
                    );
                }

                alert(
                    "Unable to save your answer. Please check your connection."
                );
            } finally {
                pendingSaves.current.delete(
                    saveRequest
                );
            }
        };


    // =====================================================
    // Handle Coding Source Code Change
    // =====================================================

    const handleCodingChange =
        (
            codingQuestionId,
            value
        ) => {
            if (
                isSubmitting ||
                hasAutoSubmitted.current
            ) {
                return;
            }

            const nextCodeMap = {
                ...codingCodeRef.current,
                [codingQuestionId]:
                    value,
            };

            const nextTouchedMap = {
                ...codingTouchedRef.current,
                [codingQuestionId]:
                    true,
            };

            codingCodeRef.current =
                nextCodeMap;

            codingTouchedRef.current =
                nextTouchedMap;

            setCodingCode(
                nextCodeMap
            );

            // Starter code is not an attempt. An actual
            // editor change marks this coding question as
            // attempted and is persisted immediately so a
            // browser refresh cannot wipe the candidate's work.
            setCodingTouched(
                nextTouchedMap
            );

            persistCodingDraft(
                activeSubmissionIdRef.current ||
                    submissionId,
                nextCodeMap,
                nextTouchedMap
            );
        };


    // =====================================================
    // RUN CODING QUESTION
    // =====================================================

    const handleRunCode =
        async (
            codingQuestionId
        ) => {
            if (
                isSubmitting ||
                hasAutoSubmitted.current
            ) {
                return;
            }

            if (
                !submissionId
            ) {
                alert(
                    "Your exam session is not ready."
                );

                return;
            }

            const sourceCode =
                codingCodeRef.current[
                    codingQuestionId
                ] ??
                codingCode[
                    codingQuestionId
                ];

            // Running code is also an explicit attempt, even
            // if the candidate runs the unchanged starter code.
            const nextTouchedMap = {
                ...codingTouchedRef.current,
                [codingQuestionId]:
                    true,
            };

            codingTouchedRef.current =
                nextTouchedMap;

            setCodingTouched(
                nextTouchedMap
            );

            persistCodingDraft(
                activeSubmissionIdRef.current ||
                    submissionId,
                codingCodeRef.current,
                nextTouchedMap
            );

            if (
                typeof sourceCode !==
                    "string" ||
                !sourceCode.trim()
            ) {
                alert(
                    "Please enter some Python code before running it."
                );

                return;
            }

            setCodingRunning(
                (previous) => ({
                    ...previous,

                    [codingQuestionId]:
                        true,
                })
            );

            setCodingErrors(
                (previous) => ({
                    ...previous,

                    [codingQuestionId]:
                        null,
                })
            );

            setCodingRunResults(
                (previous) => ({
                    ...previous,

                    [codingQuestionId]:
                        null,
                })
            );

            try {
                const token =
                    localStorage.getItem(
                        "token"
                    );

                const response =
                    await fetch(
                        `${API_BASE_URL}/coding/run`,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`,
                            },

                            body:
                                JSON.stringify({
                                    submission_id:
                                        submissionId,

                                    coding_question_id:
                                        codingQuestionId,

                                    source_code:
                                        sourceCode,
                                }),
                        }
                    );

                const data =
                    await response.json();

                if (
                    !response.ok
                ) {
                    throw new Error(
                        data.message ||
                            "Unable to execute code."
                    );
                }

                setCodingRunResults(
                    (previous) => ({
                        ...previous,

                        [codingQuestionId]:
                            data,
                    })
                );
            } catch (error) {
                console.error(
                    "Code execution failed:",
                    error
                );

                setCodingErrors(
                    (previous) => ({
                        ...previous,

                        [codingQuestionId]:
                            error.message ||
                            "Unable to execute code.",
                    })
                );
            } finally {
                setCodingRunning(
                    (previous) => ({
                        ...previous,

                        [codingQuestionId]:
                            false,
                    })
                );
            }
        };


    // =====================================================
    // SUBMIT ALL CODING ANSWERS
    //
    // This is called BEFORE /submit-exam.
    //
    // /coding/submit executes visible + hidden tests.
    // Backend handles full-marks-or-zero scoring.
    // =====================================================

    const submitAllCodingAnswers =
        async () => {
            if (
                !exam ||
                !Array.isArray(
                    exam.questions
                )
            ) {
                return;
            }

            const codingQuestions =
                exam.questions.filter(
                    (question) =>
                        isCodingQuestion(
                            question
                        )
                );

            if (
                codingQuestions.length ===
                0
            ) {
                return;
            }

            const token =
                localStorage.getItem(
                    "token"
                );

            for (
                const question of
                codingQuestions
            ) {
                const codingQuestionId =
                    getCodingQuestionId(
                        question
                    );

                if (
                    !codingQuestionId
                ) {
                    throw new Error(
                        `Coding question mapping is missing for Question #${question.question_id}.`
                    );
                }

                // --------------------------------------------------
                // IMPORTANT:
                //
                // Starter code is automatically loaded into every
                // coding editor, but that does NOT mean the candidate
                // attempted the question. Only coding questions that
                // were actually edited or explicitly run are submitted.
                //
                // Untouched coding questions therefore remain without
                // a code_submissions row and are correctly reported by
                // the backend as NOT_SUBMITTED / unanswered.
                // --------------------------------------------------

                let sourceCode =
                    codingCodeRef.current[
                        codingQuestionId
                    ];

                let isTouched =
                    Boolean(
                        codingTouchedRef.current[
                            codingQuestionId
                        ]
                    );

                // Final safety net for timer/refresh scenarios:
                // if the latest editor value exists in local storage,
                // restore it before deciding whether the question was attempted.
                if (
                    !isTouched
                ) {
                    const draft =
                        readCodingDraft(
                            activeSubmissionIdRef.current ||
                                submissionId
                        );

                    const draftCode =
                        draft?.code?.[
                            codingQuestionId
                        ];

                    const draftTouched =
                        Boolean(
                            draft?.touched?.[
                                codingQuestionId
                            ]
                        );

                    if (
                        draftTouched &&
                        typeof draftCode ===
                            "string"
                    ) {
                        sourceCode =
                            draftCode;

                        isTouched =
                            true;

                        codingCodeRef.current = {
                            ...codingCodeRef.current,
                            [codingQuestionId]:
                                draftCode,
                        };

                        codingTouchedRef.current = {
                            ...codingTouchedRef.current,
                            [codingQuestionId]:
                                true,
                        };
                    }
                }

                if (
                    !isTouched
                ) {
                    continue;
                }

                if (
                    typeof sourceCode !==
                        "string" ||
                    !sourceCode.trim()
                ) {
                    throw new Error(
                        `Coding answer is empty for Question #${question.question_id}.`
                    );
                }

                const response =
                    await fetch(
                        `${API_BASE_URL}/coding/submit`,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`,
                            },

                            body:
                                JSON.stringify({
                                    submission_id:
                                        activeSubmissionIdRef.current ||
                                        submissionId,

                                    coding_question_id:
                                        codingQuestionId,

                                    source_code:
                                        sourceCode,
                                }),
                        }
                    );

                const data =
                    await response.json();

                if (
                    !response.ok
                ) {
                    throw new Error(
                        data.message ||
                            `Unable to submit coding question ${question.question_id}.`
                    );
                }
            }
        };


    // =====================================================
    // SUBMIT EXAM
    // =====================================================

    const handleSubmitExam =
        async (
            isTimerAutoSubmit = false
        ) => {
            /*
             * Prevent duplicate manual submissions.
             *
             * Timer auto-submit is allowed through even
             * when isSubmitting has already been set.
             */

            if (
                isSubmitting &&
                !isTimerAutoSubmit &&
                !hasAutoSubmitted.current
            ) {
                return;
            }

            if (
                !submissionId
            ) {
                return;
            }

            /*
             * Lock the complete examination immediately.
             *
             * This means:
             *
             * - MCQs cannot be changed
             * - coding code cannot be edited
             * - Run Code cannot be pressed
             */

            setIsSubmitting(
                true
            );

            try {
                // =================================================
                // First wait for pending MCQ saves.
                // =================================================

                await waitForPendingSaves();

                // =================================================
                // Submit coding answers first.
                // =================================================

                await submitAllCodingAnswers();

                // =================================================
                // Now submit the complete examination.
                // =================================================

                const token =
                    localStorage.getItem(
                        "token"
                    );

                const response =
                    await fetch(
                        `${API_BASE_URL}/submit-exam`,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`,
                            },

                            body:
                                JSON.stringify({
                                    exam_id:
                                        Number(
                                            examId
                                        ),
                                }),
                        }
                    );

                const data =
                    await response.json();

                if (
                    response.ok
                ) {
                    clearCodingDraft(
                        activeSubmissionIdRef.current ||
                            submissionId
                    );

                    alert(
                        isTimerAutoSubmit
                            ? "Time is up. Exam submitted automatically."
                            : "Exam Submitted Successfully!"
                    );

                    navigate(
                        "/results"
                    );

                    return;
                }

                setIsSubmitting(
                    false
                );

                alert(
                    data.message ||
                        "Unable to submit exam."
                );
            } catch (error) {
                console.error(
                    "Exam submission failed:",
                    error
                );

                setIsSubmitting(
                    false
                );

                alert(
                    error.message ||
                        "Unable to submit exam."
                );
            }
        };


    // =====================================================
    // Loading
    // =====================================================

    if (
        loadingExam ||
        !exam
    ) {
        return (
            <div>
                <Navbar />

                <PageLoader
                    message="Loading Exam..."
                />
            </div>
        );
    }


    // =====================================================
    // CODING ENVIRONMENT ACCESS
    //
    // The coding sandbox/editor is available ONLY while a
    // Candidate has an active In Progress examination.
    //
    // Admins / Examiners can review the coding question text
    // and metadata, but they must never see or use the:
    // - starter code
    // - code editor / sandbox
    // - Run Code button
    // - coding execution results
    //
    // submissionId is set only after the backend confirms an
    // active In Progress candidate session.
    // =====================================================

    const canUseCodingEnvironment =
        role === "Candidate" &&
        Boolean(submissionId) &&
        !isSubmitting &&
        !hasAutoSubmitted.current;


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div>
            <Navbar />

            <main
                className={`edp-page ${
                    isSubmitting
                        ? "edp-exam-locked"
                        : ""
                }`}
            >
                <div className="edp-page-container">

                    {/* =================================================
                        TAB SWITCH WARNING
                    ================================================= */}

                    {role ===
                        "Candidate" &&
                        tabWarningVisible &&
                        tabWarning && (
                            <div
                                className={`edp-tab-warning-overlay ${
                                    tabWarning.type ===
                                    "violation"
                                        ? "edp-tab-warning-overlay-violation"
                                        : "edp-tab-warning-overlay-normal"
                                }`}
                            >
                                <div
                                    className={`edp-tab-warning-popup ${
                                        tabWarning.type ===
                                        "violation"
                                            ? "edp-tab-warning-popup-violation"
                                            : "edp-tab-warning-popup-warning"
                                    }`}
                                >
                                    <div className="edp-tab-warning-icon">
                                        ⚠
                                    </div>

                                    <div className="edp-tab-warning-content">
                                        <strong>
                                            {
                                                tabWarning.title
                                            }
                                        </strong>

                                        <span>
                                            {
                                                tabWarning.message
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}


                    {/* =================================================
                        EXAM HEADER
                    ================================================= */}

                    <section className="edp-exam-header">

                        <div className="edp-exam-header-top">

                            <div className="edp-exam-heading">

                                <span className="edp-exam-eyebrow">
                                    Examination
                                </span>

                                <h1 className="edp-exam-title">
                                    {
                                        exam.exam.title
                                    }
                                </h1>

                                <span className="edp-exam-id">
                                    Exam #
                                    {examId}
                                </span>

                            </div>


                            {role ===
                                "Candidate" && (
                                <div
                                    className={`edp-timer-card edp-timer-${timerState}`}
                                >
                                    <span className="edp-timer-label">
                                        Time Remaining
                                    </span>

                                    <strong className="edp-timer">
                                        {
                                            timeLeft
                                        }
                                    </strong>
                                </div>
                            )}

                        </div>


                        <div className="edp-exam-details">

                            <div className="edp-exam-detail">

                                <span>
                                    Duration
                                </span>

                                <strong>
                                    {
                                        exam.exam
                                            .duration
                                    }{" "}
                                    mins
                                </strong>

                            </div>


                            <div className="edp-exam-detail">

                                <span>
                                    Total Marks
                                </span>

                                <strong>
                                    {
                                        exam.exam
                                            .total_marks
                                    }
                                </strong>

                            </div>


                            <div className="edp-exam-detail">

                                <span>
                                    Passing Marks
                                </span>

                                <strong>
                                    {
                                        exam.exam
                                            .passing_marks
                                    }
                                </strong>

                            </div>


                            <div className="edp-exam-detail">

                                <span>
                                    Questions
                                </span>

                                <strong>
                                    {
                                        exam.questions
                                            .length
                                    }
                                </strong>

                            </div>

                        </div>

                    </section>


                    {/* =================================================
                        QUESTIONS
                    ================================================= */}

                    <section className="edp-questions-section">

                        <div className="edp-section-header">

                            <div>

                                <span className="edp-section-kicker">
                                    EXAMINATION CONTENT
                                </span>

                                <h2 className="edp-section-title">
                                    Questions
                                </h2>

                                <p className="edp-section-description">
                                    {
                                        role ===
                                        "Candidate"
                                            ? "Answer each question carefully before submitting the examination."
                                            : "Review the questions configured for this examination."
                                    }
                                </p>

                            </div>


                            <span className="edp-question-count">
                                {
                                    exam.questions
                                        .length
                                }{" "}
                                {
                                    exam.questions
                                        .length ===
                                    1
                                        ? "Question"
                                        : "Questions"
                                }
                            </span>

                        </div>


                        {/* =================================================
                            EMPTY QUESTIONS
                        ================================================= */}

                        {
                            exam.questions
                                .length ===
                            0 ? (
                                <div className="edp-empty-state">

                                    <div className="edp-empty-icon">
                                        !
                                    </div>

                                    <strong>
                                        No Questions Available
                                    </strong>

                                    <p>
                                        No questions have
                                        been added to this
                                        examination yet.
                                    </p>

                                </div>
                            ) : (

                                <div className="edp-questions-grid">

                                    {
                                        exam.questions.map(
                                            (
                                                question,
                                                index
                                            ) => {

                                                const coding =
                                                    isCodingQuestion(
                                                        question
                                                    );

                                                const codingQuestionId =
                                                    getCodingQuestionId(
                                                        question
                                                    );

                                                const details =
                                                    codingQuestionId
                                                        ? codingDetails[
                                                            codingQuestionId
                                                        ]
                                                        : null;

                                                const code =
                                                    codingQuestionId
                                                        ? (
                                                            codingCode[
                                                                codingQuestionId
                                                            ] ??
                                                            details?.starter_code ??
                                                            ""
                                                        )
                                                        : "";

                                                const runResult =
                                                    codingQuestionId
                                                        ? codingRunResults[
                                                            codingQuestionId
                                                        ]
                                                        : null;

                                                const isRunning =
                                                    codingQuestionId
                                                        ? Boolean(
                                                            codingRunning[
                                                                codingQuestionId
                                                            ]
                                                        )
                                                        : false;

                                                const codingLoadingState =
                                                    codingQuestionId
                                                        ? Boolean(
                                                            codingLoading[
                                                                codingQuestionId
                                                            ]
                                                        )
                                                        : false;

                                                const codingError =
                                                    codingQuestionId
                                                        ? codingErrors[
                                                            codingQuestionId
                                                        ]
                                                        : coding
                                                            ? codingErrors[
                                                                `question-${question.question_id}`
                                                            ]
                                                            : null;


                                                return (
                                                    <article
                                                        key={
                                                            question.question_id
                                                        }
                                                        className={`edp-question-card ${
                                                            coding
                                                                ? "edp-coding-question-card"
                                                                : ""
                                                        }`}
                                                    >

                                                        {/* =================================================
                                                            QUESTION HEADER
                                                        ================================================= */}

                                                        <div className="edp-question-header">

                                                            <div className="edp-question-heading">

                                                                <span className="edp-question-number">

                                                                    Question #
                                                                    {
                                                                        index +
                                                                        1
                                                                    }

                                                                    {coding && (
                                                                        <span className="edp-question-type">
                                                                            Coding
                                                                        </span>
                                                                    )}

                                                                </span>


                                                                <h3 className="edp-question-title">
                                                                    {
                                                                        details?.question_text ||
                                                                        question.question_text
                                                                    }
                                                                </h3>

                                                            </div>


                                                            <span className="edp-question-marks">
                                                                {
                                                                    details?.marks ??
                                                                    question.marks
                                                                }{" "}
                                                                Marks
                                                            </span>

                                                        </div>


                                                        {/* =================================================
                                                            QUESTION DETAILS
                                                        ================================================= */}

                                                        <div className="edp-question-details">

                                                            <div className="edp-question-detail">

                                                                <span>
                                                                    Difficulty
                                                                </span>

                                                                <strong
                                                                    className={`edp-difficulty ${
                                                                        String(
                                                                            details?.difficulty ??
                                                                            question.difficulty ??
                                                                            ""
                                                                        ).toLowerCase()
                                                                    }`}
                                                                >
                                                                    {
                                                                        details?.difficulty ??
                                                                        question.difficulty
                                                                    }
                                                                </strong>

                                                            </div>


                                                            <div className="edp-question-detail">

                                                                <span>
                                                                    Marks
                                                                </span>

                                                                <strong>
                                                                    {
                                                                        details?.marks ??
                                                                        question.marks
                                                                    }
                                                                </strong>

                                                            </div>


                                                            {coding && (
                                                                <div className="edp-question-detail">

                                                                    <span>
                                                                        Language
                                                                    </span>

                                                                    <strong>
                                                                        {
                                                                            details?.language ||
                                                                            "Python"
                                                                        }
                                                                    </strong>

                                                                </div>
                                                            )}

                                                        </div>


                                                        {/* =================================================
                                                            CODING QUESTION
                                                        ================================================= */}

                                                        {coding ? (

                                                            <div className="edp-coding-section">

                                                                {/* =================================================
                                                                    CODING ENVIRONMENT

                                                                    Starter code, editor, sandbox/run controls and
                                                                    execution results are rendered only while a
                                                                    Candidate is actively performing the exam.
                                                                ================================================= */}

                                                                {canUseCodingEnvironment && codingLoadingState && (
                                                                    <div className="edp-coding-loading">
                                                                        Loading coding environment...
                                                                    </div>
                                                                )}


                                                                {/* =================================================
                                                                    CODING ERROR
                                                                ================================================= */}

                                                                {canUseCodingEnvironment && codingError && (
                                                                    <div className="edp-coding-error">
                                                                        <strong>
                                                                            Unable to load coding question
                                                                        </strong>

                                                                        <span>
                                                                            {
                                                                                codingError
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                )}


                                                                {/* =================================================
                                                                    CODING EDITOR
                                                                ================================================= */}

                                                                {canUseCodingEnvironment &&
                                                                    !codingLoadingState &&
                                                                    !codingError &&
                                                                    codingQuestionId && (
                                                                    <>

                                                                        <div className="edp-coding-editor-header">

                                                                            <div>

                                                                                <span className="edp-options-label">
                                                                                    Python Code
                                                                                </span>

                                                                                <span className="edp-coding-language">
                                                                                    {
                                                                                        details?.language ||
                                                                                        "python"
                                                                                    }
                                                                                </span>

                                                                            </div>


                                                                        </div>


                                                                        <textarea
                                                                            className="edp-code-editor"
                                                                            value={
                                                                                code
                                                                            }
                                                                            onChange={(
                                                                                event
                                                                            ) =>
                                                                                handleCodingChange(
                                                                                    codingQuestionId,
                                                                                    event.target.value
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                isSubmitting
                                                                            }
                                                                            spellCheck={
                                                                                false
                                                                            }
                                                                            placeholder={
                                                                                "Write your Python code here..."
                                                                            }
                                                                        />


                                                                        {/* =================================================
                                                                            RUN BUTTON
                                                                        ================================================= */}

                                                                        <div className="edp-coding-actions">

                                                                            <button
                                                                                type="button"
                                                                                className="edp-run-code-btn"
                                                                                onClick={() =>
                                                                                    handleRunCode(
                                                                                        codingQuestionId
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    isSubmitting ||
                                                                                    isRunning
                                                                                }
                                                                            >
                                                                                {
                                                                                    isRunning
                                                                                        ? "Running..."
                                                                                        : "▶ Run Code"
                                                                                }
                                                                            </button>


                                                                            <span className="edp-coding-run-note">
                                                                                Run executes visible test cases only.
                                                                            </span>

                                                                        </div>


                                                                        {/* =================================================
                                                                            RUN RESULT
                                                                        ================================================= */}

                                                                        {runResult && (
                                                                            <div className="edp-coding-results">

                                                                                <div className="edp-coding-results-header">

                                                                                    <strong>
                                                                                        Run Result
                                                                                    </strong>

                                                                                    <span
                                                                                        className={`edp-coding-status ${
                                                                                            runResult.status ===
                                                                                            "SUCCESS"
                                                                                                ? "success"
                                                                                                : "failed"
                                                                                        }`}
                                                                                    >
                                                                                        {
                                                                                            runResult.status
                                                                                        }
                                                                                    </span>

                                                                                </div>


                                                                                <div className="edp-coding-test-summary">

                                                                                    <span>
                                                                                        Passed:
                                                                                        {" "}
                                                                                        <strong>
                                                                                            {
                                                                                                runResult.passed_tests
                                                                                            }
                                                                                        </strong>
                                                                                    </span>

                                                                                    <span>
                                                                                        Total:
                                                                                        {" "}
                                                                                        <strong>
                                                                                            {
                                                                                                runResult.total_tests
                                                                                            }
                                                                                        </strong>
                                                                                    </span>

                                                                                </div>


                                                                                {
                                                                                    Array.isArray(
                                                                                        runResult.results
                                                                                    ) &&
                                                                                    runResult.results.length >
                                                                                        0 && (
                                                                                        <div className="edp-coding-test-results">

                                                                                            {
                                                                                                runResult.results.map(
                                                                                                    (
                                                                                                        result,
                                                                                                        resultIndex
                                                                                                    ) => (
                                                                                                        <div
                                                                                                            key={
                                                                                                                result.test_case_id ??
                                                                                                                resultIndex
                                                                                                            }
                                                                                                            className={`edp-coding-test-result ${
                                                                                                                result.passed
                                                                                                                    ? "passed"
                                                                                                                    : "failed"
                                                                                                            }`}
                                                                                                        >

                                                                                                            <div className="edp-coding-test-result-header">

                                                                                                                <strong>
                                                                                                                    Test Case{" "}
                                                                                                                    {
                                                                                                                        resultIndex +
                                                                                                                        1
                                                                                                                    }
                                                                                                                </strong>

                                                                                                                <span>
                                                                                                                    {
                                                                                                                        result.passed
                                                                                                                            ? "Passed"
                                                                                                                            : "Failed"
                                                                                                                    }
                                                                                                                </span>

                                                                                                            </div>


                                                                                                            <div className="edp-coding-output-block">

                                                                                                                <span>
                                                                                                                    Output
                                                                                                                </span>

                                                                                                                <pre>
                                                                                                                    {
                                                                                                                        result.stdout ||
                                                                                                                        result.stderr ||
                                                                                                                        "No output"
                                                                                                                    }
                                                                                                                </pre>

                                                                                                            </div>

                                                                                                        </div>
                                                                                                    )
                                                                                                )
                                                                                            }

                                                                                        </div>
                                                                                    )
                                                                                }

                                                                            </div>
                                                                        )}

                                                                    </>
                                                                )}

                                                            </div>

                                                        ) : (

                                                            /* =================================================
                                                                MCQ QUESTION
                                                            ================================================= */

                                                            <div className="edp-options-section">

                                                                <span className="edp-options-label">
                                                                    Answer Options
                                                                </span>


                                                                <div className="edp-options-container">

                                                                    {
                                                                        Array.isArray(
                                                                            question.options
                                                                        ) &&
                                                                        question.options.map(
                                                                            (
                                                                                option,
                                                                                optionIndex
                                                                            ) => (
                                                                                <label
                                                                                    key={
                                                                                        option.option_id
                                                                                    }
                                                                                    className={`edp-option-row ${
                                                                                        role ===
                                                                                        "Candidate"
                                                                                            ? "edp-candidate-option"
                                                                                            : ""
                                                                                    } ${
                                                                                        answers[
                                                                                            question.question_id
                                                                                        ] ===
                                                                                        option.option_text
                                                                                            ? "edp-selected"
                                                                                            : ""
                                                                                    }`}
                                                                                >

                                                                                    {
                                                                                        role ===
                                                                                            "Candidate" && (
                                                                                            <input
                                                                                                type="radio"
                                                                                                name={`question-${question.question_id}`}
                                                                                                value={
                                                                                                    option.option_text
                                                                                                }
                                                                                                checked={
                                                                                                    answers[
                                                                                                        question.question_id
                                                                                                    ] ===
                                                                                                    option.option_text
                                                                                                }
                                                                                                onChange={() =>
                                                                                                    handleAnswerChange(
                                                                                                        question.question_id,
                                                                                                        option.option_text
                                                                                                    )
                                                                                                }
                                                                                                disabled={
                                                                                                    isSubmitting
                                                                                                }
                                                                                            />
                                                                                        )
                                                                                    }


                                                                                    <span className="edp-option-letter">
                                                                                        {
                                                                                            String.fromCharCode(
                                                                                                65 +
                                                                                                optionIndex
                                                                                            )
                                                                                        }
                                                                                    </span>


                                                                                    <span className="edp-option-text">
                                                                                        {
                                                                                            option.option_text
                                                                                        }
                                                                                    </span>

                                                                                </label>
                                                                            )
                                                                        )
                                                                    }

                                                                </div>

                                                            </div>

                                                        )}

                                                    </article>
                                                );
                                            }
                                        )
                                    }

                                </div>
                            )
                        }

                    </section>


                    {/* =================================================
                        FINAL SUBMIT
                    ================================================= */}

                    {
                        role ===
                            "Candidate" && (
                            <div className="edp-submit-section">

                                <button
                                    type="button"
                                    className="edp-submit-btn"
                                    onClick={() =>
                                        handleSubmitExam(
                                            false
                                        )
                                    }
                                    disabled={
                                        isSubmitting
                                    }
                                >
                                    {
                                        isSubmitting
                                            ? hasAutoSubmitted.current
                                                ? "Auto Submitting..."
                                                : "Submitting..."
                                            : "Submit Exam"
                                    }
                                </button>

                            </div>
                        )
                    }

                </div>
            </main>
        </div>
    );
}


export default ExamDetailsPage;