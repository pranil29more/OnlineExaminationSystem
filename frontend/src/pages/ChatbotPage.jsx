import { useEffect, useRef, useState } from "react";
import { IoSend, IoTrashOutline } from "react-icons/io5";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "../components/Navbar";
import API_BASE_URL from "../services/api";
import "../styles/ChatbotPage.css";

function ChatbotPage() {
    const [message, setMessage] = useState("");

    const userEmail =
        localStorage.getItem("userEmail");

    const chatHistoryKey =
        `chatHistory_${userEmail}`;

    const [messages, setMessages] = useState(() => {
        const savedMessages =
            localStorage.getItem(chatHistoryKey);

        return savedMessages
            ? JSON.parse(savedMessages)
            : [];
    });

    const [loading, setLoading] =
        useState(false);

    const messagesEndRef =
        useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages, loading]);

    useEffect(() => {
        localStorage.setItem(
            chatHistoryKey,
            JSON.stringify(messages)
        );
    }, [messages, chatHistoryKey]);

    const sendMessage = async () => {
        const trimmedMessage =
            message.trim();

        if (
            trimmedMessage === "" ||
            loading
        ) {
            return;
        }

        const userMessage = {
            sender: "user",
            text: trimmedMessage,
        };

        setMessages((prevMessages) => [
            ...prevMessages,
            userMessage,
        ]);

        setMessage("");

        setLoading(true);

        try {
            const token =
                localStorage.getItem("token");

            if (!token) {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    {
                        sender: "ai",
                        text:
                            "Your administrator session has expired. Please log in again.",
                        source: "system",
                    },
                ]);

                return;
            }

            const response = await fetch(
                `${API_BASE_URL}/chat`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        message:
                            trimmedMessage,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                const errorMessage =
                    data?.error ||
                    data?.message ||
                    "The AI Examination Assistant could not process your request.";

                setMessages((prevMessages) => [
                    ...prevMessages,
                    {
                        sender: "ai",
                        text: errorMessage,
                        source: "system",
                    },
                ]);

                return;
            }

            const aiMessage = {
                sender: "ai",
                text:
                    data?.response ||
                    "The AI Examination Assistant returned an empty response.",
                source:
                    data?.source ||
                    "ai",
            };

            setMessages((prevMessages) => [
                ...prevMessages,
                aiMessage,
            ]);
        } catch (error) {
            console.error(
                "Chat request error:",
                error
            );

            setMessages((prevMessages) => [
                ...prevMessages,
                {
                    sender: "ai",
                    text:
                        "Something went wrong while contacting the AI Examination Assistant. Please try again.",
                    source: "system",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        const confirmClear =
            window.confirm(
                "Are you sure you want to clear this administrator conversation?"
            );

        if (!confirmClear) {
            return;
        }

        localStorage.removeItem(
            chatHistoryKey
        );

        setMessages([]);
    };

    const handleKeyDown = (event) => {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();

            sendMessage();
        }
    };

    const getSourceLabel = (source) => {
        if (source === "database") {
            return "Database";
        }

        if (source === "ai") {
            return "AI Assistant";
        }

        return "System";
    };

    return (
        <div className="cp-page">

            <Navbar />

            <main className="cp-container">

                <header className="cp-page-header">

                    <span className="cp-page-eyebrow">
                        AI ASSISTANT
                    </span>

                    <h1 className="cp-page-title">
                        AI Examination Assistant
                    </h1>

                    <p className="cp-page-description">
                        Your intelligent administrative
                        assistant for reviewing examinations,
                        candidates, batches, schedules,
                        results, and system analytics.
                    </p>

                </header>

                {messages.length === 0 ? (

                    <section className="cp-welcome">

                        <div className="cp-welcome-card">

                            <div className="cp-welcome-icon">
                                AI
                            </div>

                            <span className="cp-welcome-kicker">
                                ADMINISTRATION ASSISTANT
                            </span>

                            <h2 className="cp-welcome-title">
                                Welcome, Administrator!
                            </h2>

                            <p className="cp-welcome-text">
                                I'm your AI Examination
                                Assistant.
                            </p>

                            <p className="cp-welcome-description">
                                I can help you access
                                examination data, review
                                candidate performance,
                                analyze submissions,
                                monitor batches and
                                assessment schedules,
                                and provide system-level
                                examination statistics.
                                You can also ask me general
                                technical and educational
                                questions.
                            </p>

                        </div>

                        <div className="cp-input-container">

                            <input
                                className="cp-chat-input"
                                type="text"
                                placeholder="Ask about exams, candidates, results, batches, or system statistics..."
                                value={message}
                                onChange={(event) =>
                                    setMessage(
                                        event.target.value
                                    )
                                }
                                onKeyDown={
                                    handleKeyDown
                                }
                                disabled={loading}
                            />

                            <button
                                type="button"
                                className="cp-send-button"
                                onClick={
                                    sendMessage
                                }
                                disabled={
                                    loading ||
                                    message.trim() === ""
                                }
                                aria-label="Send message"
                            >
                                <IoSend />
                            </button>

                        </div>

                    </section>

                ) : (

                    <section className="cp-chat-card">

                        <header className="cp-conversation-header">

                            <div>

                                <span className="cp-conversation-kicker">
                                    AI ASSISTANT
                                </span>

                                <strong>
                                    Conversation
                                </strong>

                            </div>

                            <button
                                type="button"
                                className="cp-clear-chat-btn"
                                onClick={
                                    clearChat
                                }
                                aria-label="Clear conversation"
                            >
                                <IoTrashOutline />
                            </button>

                        </header>

                        <div className="cp-chat-container">

                            {messages.map(
                                (msg, index) => (

                                    <div
                                        key={
                                            index
                                        }
                                        className={
                                            msg.sender ===
                                            "user"
                                                ? "cp-user-message"
                                                : "cp-ai-message"
                                        }
                                    >

                                        <div className="cp-message-label">

                                            {msg.sender ===
                                            "user"
                                                ? "Administrator"
                                                : "AI Assistant"}

                                        </div>

                                        {msg.sender ===
                                            "ai" &&
                                            msg.source && (
                                                <div
                                                    className={
                                                        msg.source ===
                                                        "database"
                                                            ? "cp-message-source cp-database-source"
                                                            : "cp-message-source"
                                                    }
                                                >
                                                    {getSourceLabel(
                                                        msg.source
                                                    )}
                                                </div>
                                            )}

                                        <ReactMarkdown
                                            remarkPlugins={[
                                                remarkGfm,
                                            ]}
                                        >
                                            {
                                                msg.text
                                            }
                                        </ReactMarkdown>

                                    </div>
                                )
                            )}

                            {loading && (

                                <div className="cp-typing-indicator">

                                    <span className="cp-typing-dot"></span>

                                    <span className="cp-typing-dot"></span>

                                    <span className="cp-typing-dot"></span>

                                    <span>
                                        AI Assistant is
                                        analyzing your
                                        request...
                                    </span>

                                </div>

                            )}

                            <div
                                ref={
                                    messagesEndRef
                                }
                            />

                        </div>

                        <div className="cp-input-container">

                            <input
                                className="cp-chat-input"
                                type="text"
                                placeholder="Ask about exams, candidates, results, batches, or system statistics..."
                                value={message}
                                onChange={(event) =>
                                    setMessage(
                                        event.target.value
                                    )
                                }
                                onKeyDown={
                                    handleKeyDown
                                }
                                disabled={loading}
                            />

                            <button
                                type="button"
                                className="cp-send-button"
                                onClick={
                                    sendMessage
                                }
                                disabled={
                                    loading ||
                                    message.trim() === ""
                                }
                                aria-label="Send message"
                            >
                                <IoSend />
                            </button>

                        </div>

                    </section>

                )}

            </main>

        </div>
    );
}

export default ChatbotPage;