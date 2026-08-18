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
            localStorage.getItem(
                chatHistoryKey
            );

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
    }, [
        messages,
        chatHistoryKey,
    ]);

    const sendMessage = async () => {
        if (
            message.trim() === "" ||
            loading
        ) {
            return;
        }

        const userMessage = {
            sender: "user",
            text: message,
        };

        setMessages((prevMessages) => [
            ...prevMessages,
            userMessage,
        ]);

        const currentMessage =
            message;

        setMessage("");

        setLoading(true);

        try {
            const token =
                localStorage.getItem(
                    "token"
                );

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
                            currentMessage,
                    }),
                }
            );

            const data =
                await response.json();

            const aiMessage = {
                sender: "ai",
                text: data.response,
            };

            setMessages((prevMessages) => [
                ...prevMessages,
                aiMessage,
            ]);
        } catch (error) {
            console.error(error);

            setMessages((prevMessages) => [
                ...prevMessages,
                {
                    sender: "ai",
                    text:
                        "Something went wrong while contacting the AI Assistant.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        const confirmClear =
            window.confirm(
                "Are you sure you want to clear this conversation?"
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
        if (event.key === "Enter") {
            event.preventDefault();

            sendMessage();
        }
    };

    return (
        <div className="cp-page">

            <Navbar />

            <main className="cp-container">

                {/* ==========================================
                    Page Header
                ========================================== */}

                <header className="cp-page-header">

                    <span className="cp-page-eyebrow">
                        AI ASSISTANT
                    </span>

                    <h1 className="cp-page-title">
                        AI Examination Assistant
                    </h1>

                    <p className="cp-page-description">
                        Your intelligent learning
                        companion for examinations,
                        programming, aptitude, and
                        interview preparation.
                    </p>

                </header>


                {/* ==========================================
                    Welcome State
                ========================================== */}

                {messages.length === 0 ? (

                    <section className="cp-welcome">

                        <div className="cp-welcome-card">

                            <div className="cp-welcome-icon">
                                AI
                            </div>

                            <span className="cp-welcome-kicker">
                                SMART LEARNING
                            </span>

                            <h2 className="cp-welcome-title">
                                Welcome!
                            </h2>

                            <p className="cp-welcome-text">
                                I'm your AI
                                Examination
                                Assistant.
                            </p>

                            <p className="cp-welcome-description">
                                I can help you
                                understand
                                programming,
                                explain difficult
                                concepts, prepare
                                for interviews,
                                solve aptitude
                                questions, and
                                assist with your
                                examinations.
                            </p>

                        </div>


                        <div className="cp-input-container">

                            <input
                                className="cp-chat-input"
                                type="text"
                                placeholder="Ask your question..."
                                value={message}
                                onChange={(event) =>
                                    setMessage(
                                        event.target
                                            .value
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
                                disabled={loading}
                                aria-label="Send message"
                            >
                                <IoSend />
                            </button>

                        </div>

                    </section>

                ) : (

                    /* ==========================================
                       Conversation
                    ========================================== */

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

                                        {msg.sender ===
                                        "ai" ? (

                                            <div className="cp-message-label">
                                                AI Assistant
                                            </div>

                                        ) : (

                                            <div className="cp-message-label">
                                                You
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
                                        thinking...
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
                                placeholder="Ask your question..."
                                value={message}
                                onChange={(event) =>
                                    setMessage(
                                        event.target
                                            .value
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
                                disabled={loading}
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