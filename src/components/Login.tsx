import { GitHub } from "@mui/icons-material";
import "./Login.css";

export default function Login() {
    return (
        <div className="login">
            <h1>lyric translator</h1>
            <a className="login-button" href={`/api/auth/spotify/login`}>
                Login
            </a>
            <footer>
                <div className="github-button">
                    <a
                        href="https://github.com/clee422/lyric-translator"
                        target="blank"
                    >
                        <GitHub />
                    </a>
                </div>
                <span>By Chris Lee</span>
            </footer>
        </div>
    );
}
