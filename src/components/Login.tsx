import "./Login.css";

export default function Login() {
    return (
        <div className="login">
            <a
                className="login-button"
                href={`${
                    import.meta.env.VITE_APP_SERVER_URL
                }/auth/spotify/login`}
            >
                Login
            </a>
            <button
                onClick={() => {
                    fetch(
                        `${import.meta.env.VITE_APP_SERVER_URL}/test-session`,
                        {
                            credentials: "include",
                        }
                    )
                        .then((res) => res.json())
                        .then(console.log);
                }}
            >
                SessionID
            </button>
        </div>
    );
}
