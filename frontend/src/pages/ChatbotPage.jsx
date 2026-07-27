import "../styles/ChatbotPage.css";
import Navbar from "../components/Navbar";
import { IoSend, IoTrashOutline } from "react-icons/io5";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import API_BASE_URL from "../services/api";

import { useEffect, useRef, useState } from "react";

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

    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef(null);

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

        if (message.trim() === "" || loading) {

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

        const currentMessage = message;

        setMessage("");

        setLoading(true);

        try {

            const response = await fetch(
    `${API_BASE_URL}/chat`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type": "application/json",

                    },

                    body: JSON.stringify({

                        message: currentMessage,

                    }),

                }

            );

            const data = await response.json();

            const aiMessage = {

                sender: "ai",

                text: data.response,

            };

            setMessages((prevMessages) => [

                ...prevMessages,

                aiMessage,

            ]);

            }

        catch (error) {

            console.error(error);

            setMessages((prevMessages) => [

                ...prevMessages,

                {

                    sender: "ai",

                    text: "Something went wrong while contacting the AI Assistant.",

                },

            ]);

        }

        finally {

            setLoading(false);

        }

    };

    const clearChat = () => {

    const confirmClear = window.confirm(

        "Are you sure you want to clear this conversation?"

    );

    if (!confirmClear) {

        return;

    }

    localStorage.removeItem(chatHistoryKey);

    setMessages([]);

};

    const handleKeyDown = (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();

        }

    };

    return (

        <div>

            <Navbar />

            <div className="chat-page">

                <div className="chat-header">

    <h1 className="chat-title">
        🤖 AI Examination Assistant
    </h1>

    <p className="chat-subtitle">
        Your Smart Learning Companion
    </p>

</div>

                {

                    messages.length === 0 ? (

                        <div className="welcome-screen">

                            <div className="welcome-card">

                                <h2>

                                    Welcome!

                                </h2>

                                <p>

                                    I'm your AI Examination Assistant.

                                </p>

                                <p>

                                    I can help you understand programming,
                                    explain difficult concepts,
                                    prepare for interviews,
                                    solve aptitude questions
                                    and assist with your examinations.

                                </p>

                            </div>

                            <div className="input-container">

                                <input

                                    className="chat-input"

                                    type="text"

                                    placeholder="Ask your question..."

                                    value={message}

                                    onChange={(e) =>
                                        setMessage(e.target.value)
                                    }

                                    onKeyDown={handleKeyDown}

                                    disabled={loading}

                                />

                                <button

                                    className="send-button"

                                    onClick={sendMessage}

                                    disabled={loading}

                                >

                                    <IoSend />

                                </button>

                            </div>

                        </div>

                    ) : (

                        <div className="chat-card">

                            <div className="conversation-header">

    <span>
        Conversation
    </span>

    <button
    className="clear-chat-btn"
    onClick={clearChat}
>
    <IoTrashOutline />
</button>

</div>

                            <div className="chat-container">

                                {messages.map((msg, index) => (

                                    <div

                                        key={index}

                                        className={
                                            msg.sender === "user"
                                                ? "user-message"
                                                : "ai-message"
                                        }

                                    >

                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                        >

                                            {msg.text}

                                        </ReactMarkdown>

                                    </div>

                                ))}

                                {loading && (

                                    <div className="typing-indicator">

                                        🤖 AI Assistant is thinking...

                                    </div>

                                )}

                                <div ref={messagesEndRef}></div>

                            </div>

                            <div className="input-container">

                                <input

                                    className="chat-input"

                                    type="text"

                                    placeholder="Ask your question..."

                                    value={message}

                                    onChange={(e) =>
                                        setMessage(e.target.value)
                                    }

                                    onKeyDown={handleKeyDown}

                                    disabled={loading}

                                />

                                <button

                                    className="send-button"

                                    onClick={sendMessage}

                                    disabled={loading}

                                >

                                    <IoSend />

                                </button>

                            </div>

                        </div>

                    )

                }

            </div>

        </div>

    );

}

export default ChatbotPage;