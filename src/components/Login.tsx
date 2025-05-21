import "./Login.css";

export default function Login() {
    return (
        <div className="login">
            <a className="login-button" href="/auth/spotify/login">
                Login with Spotify
            </a>
            <a className="login-button" href="/auth/google/login">
                Login with Google
            </a>
        </div>
    );
}
