import "../styles/PageLoader.css";

function PageLoader({
    message = "Loading..."
}) {
    return (
        <div className="page-loader">
            <div className="loader-spinner"></div>

            <h2>
                {message}
            </h2>
        </div>
    );
}

export default PageLoader;